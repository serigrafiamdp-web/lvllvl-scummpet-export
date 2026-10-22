(function(){
'use strict';
// TEST242: compact rectangular multicolor boundaries for diagonal Map Scroll.
// Only selects when colors are exactly solid rectangular macroblocks.
// Stage explicit changed-boundary cells into existing TEST203 sparse buffers;
// existing safe raster IRQ and swap remain completely unchanged.
var engine=window.RICO_TEST196_DIAGONAL;
if(!engine||typeof engine.build!=='function')return;
var previous=engine.build, NL='\n';
function hx(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function countGates(W,H,bw,bh,sx,sy){
 var xc=[],yc=[],maxX=0,maxY=0;
 for(var ox=0;ox<W;ox++){
  var xs=[];
  for(var x=0;x<40;x++){
   var old=Math.floor(((ox+x)%W)/bw);
   var now=Math.floor((((ox+x+sx)%W+W)%W)/bw);
   if(old!==now)xs.push(x);
  }
  maxX=Math.max(maxX,xs.length);xc.push(xs);
 }
 for(var oy=0;oy<H;oy++){
  var ys=[];
  for(var y=0;y<25;y++){
   var old=Math.floor(((oy+y)%H)/bh);
   var now=Math.floor((((oy+y+sy)%H+H)%H)/bh);
   if(old!==now)ys.push(y);
  }
  maxY=Math.max(maxY,ys.length);yc.push(ys);
 }
 return{x:xc,y:yc,maxX:maxX,maxY:maxY};
}
function plan(d){
 if(!d||!d.fastRows||d.uniformColor||d.group||!d.colors)return null;
 var W=d.areaWidth,H=d.areaHeight;
 if(W>63||H>84||W<40||H<25)return null;
 var sx=d.dir.x===-1?1:-1,sy=d.dir.y===-1?1:-1;
 var best=null;
 for(var bw=W;bw>=8;bw--)if(W%bw===0)
 for(var bh=H;bh>=8;bh--)if(H%bh===0){
  if(bw===W&&bh===H)continue;
  var good=true;
  for(var y=0;y<H&&good;y++)for(var x=0;x<W;x++){
   var pos=y*d.rowStride+x;
   var anchor=Math.floor(y/bh)*bh*d.rowStride+Math.floor(x/bw)*bw;
   if((d.colors[pos]&15)!==(d.colors[anchor]&15)){good=false;break;}
  }
  if(!good)continue;
  var bounds=countGates(W,H,bw,bh,sx,sy);
  var maxWrites=25*bounds.maxX+40*bounds.maxY;
  if(bounds.maxX>3||bounds.maxY>2||maxWrites>180||!bounds.maxX&&!bounds.maxY)continue;
  var score=bw*bh;
  if(!best||score>best.score)
   best={bw:bw,bh:bh,score:score,bounds:bounds,maxWrites:maxWrites};
 }
 return best;
}
function bytetable(a,name,items){
 a.push(name);
 for(var i=0;i<items.length;i+=16)
  a.push('!byte '+items.slice(i,i+16).map(hx).join(','));
}
function assembler(d,p){
 var a=['; TEST242 fast multicolor: only rectangle boundary cells',
 'm242_x=$29','m242_y=$2a','m242_left=$2b','m242_ptr=$2c',
 'm242_page=$2d','m242_pos=$2e','m242_val=$2f'];
 a.push('prepare_macro_colors242',
  ' lda #$00',
  ' sta $50',' sta $51',' sta $52',' sta $53',
  ' sta $54',' sta $55',' sta $56',' sta $57',
  ' lda camera_x',' asl',' asl',' tax',
  ' lda m242_xbound,x',' sta m242_left',
  ' inx',' stx m242_ptr',
  'm242_next_x',
  ' lda m242_left',' beq m242_start_y',
  ' ldx m242_ptr',' lda m242_xbound,x',' sta m242_x',
  ' inc m242_ptr',
  ' lda #$00',' sta m242_y',
  'm242_x_rows',' jsr m242_cell',
  ' inc m242_y',' lda m242_y',' cmp #$19',
  ' bne m242_x_rows',
  ' dec m242_left',
  ' jmp m242_next_x',
  'm242_start_y',
  ' lda camera_y',' asl',' clc',' adc camera_y',' tax',
  ' lda m242_ybound,x',' sta m242_left',
  ' inx',' stx m242_ptr',
  'm242_next_y',
  ' lda m242_left',' beq m242_done',
  ' ldx m242_ptr',' lda m242_ybound,x',' sta m242_y',
  ' inc m242_ptr',
  ' lda #$00',' sta m242_x',
  'm242_y_cols',' jsr m242_cell',
  ' inc m242_x',' lda m242_x',' cmp #$28',
  ' bne m242_y_cols',
  ' dec m242_left',
  ' jmp m242_next_y',
  'm242_done',' rts',
  'm242_cell',
  '; read exact next color from double-width world row',
  ' lda pending_y',' clc',' adc m242_y',
  ' cmp #'+hx(d.areaHeight),' bcc m242_world_y_ok',
  ' sbc #'+hx(d.areaHeight),
  'm242_world_y_ok',
  ' tax',
  ' lda color_rows_lo,x',' clc',' adc pending_x',
  ' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' ldy m242_x',
  ' lda (color_src_lo),y',' and #$0f',' sta m242_val',
  '; convert row/column to 0..999, page index, local byte index',
  ' ldx m242_y',
  ' lda m242_row_lo,x',' clc',' adc m242_x',
  ' sta m242_pos',
  ' lda m242_row_hi,x',' adc #$00',' sta m242_page',
  '; append into original TEST203 page-local position/color lists',
  ' tax',' lda $50,x',' tay',
  ' lda #$00',' sta src_lo',' sta dst_lo',
  ' txa',' clc',' adc #$10',' sta src_hi',
  ' txa',' clc',' adc #$14',' sta dst_hi',
  ' lda m242_pos',' sta (src_lo),y',
  ' lda m242_val',' sta (dst_lo),y',
  ' inc $50,x',
  ' rts');
 var xb=[],yb=[];
 for(var i=0;i<p.bounds.x.length;i++){
  var xs=p.bounds.x[i];
  xb.push(xs.length);for(var j=0;j<3;j++)xb.push(j<xs.length?xs[j]:255);
 }
 for(var i=0;i<p.bounds.y.length;i++){
  var ys=p.bounds.y[i];
  yb.push(ys.length);for(var j=0;j<2;j++)yb.push(j<ys.length?ys[j]:255);
 }
 bytetable(a,'m242_xbound',xb);bytetable(a,'m242_ybound',yb);
 var lo=[],hi=[];
 for(var row=0;row<25;row++){lo.push(row*40&255);hi.push(row*40>>8);}
 bytetable(a,'m242_row_lo',lo);bytetable(a,'m242_row_hi',hi);
 return a.join(NL)+NL;
}
engine.build=function(d){
 var src=previous(d);
 var base=window.RICO_TEST236_LAST_BUILD||{};
 var info={selected:false,version:242,reason:'not rectangular multicolor fallback'};
 if(!d||!d.fastRows||d.uniformColor||d.group||base.mode!=='original fallback'&&base.mode!=='visibility-sparse-fallback'){
  window.RICO_TEST242_LAST_BUILD=info;return src;
 }
 var p=plan(d);
 if(!p){window.RICO_TEST242_LAST_BUILD=info;return src;}
 var a=' jsr diag_colors221',b=' jsr prepare_sparse_colors203',
     marker='*=$3000'+NL+'charset_bank1';
 if(src.split(a).length!==2||src.split(b).length!==2||src.split(marker).length!==2)
  throw Error('TEST242: unsafe assembly anchors; cancelled');
 src=src.replace(a,'').replace(b,' jsr prepare_macro_colors242');
 src=src.replace(marker,assembler(d,p)+marker);
 info={selected:true,version:242,mode:'rectangular-color-boundary',
  blockWidth:p.bw,blockHeight:p.bh,maxCandidatesPerStep:p.maxWrites,
  colorPlan:'changed macro-boundary cells only',
  irq:'original TEST203 sparse IRQ',scroll:'unchanged diagonal char shift'};
 window.RICO_TEST242_LAST_BUILD=info;
 console.log('[TEST242 RECTANGULAR COLOR]',info);
 return src;
};
window.RICO_TEST242_DIAGONAL={version:242,plan:plan,assembler:assembler};
})();