(function(){
'use strict';
// TEST243 — General diagonal Color RAM row-delta lists.
// Precompute exactly which world cells change foreground when camera
// advances one diagonal character. Runtime visits only those world cells,
// clips them to 40x25, and fills the existing TEST203 sparse IRQ buffers.
// No color-shape/rectangle/palette assumptions. No 8-bit phase counter.
var E=window.RICO_TEST196_DIAGONAL;if(!E)return;
var old=E.build,NL='\n';
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function bytes(a,v){for(var i=0;i<v.length;i+=16)
  a.push('!byte '+v.slice(i,i+16).map(h).join(','));}
function plan(d){
 if(!d||!d.fastRows||d.uniformColor||d.group||!d.colors||!d.dir)return null;
 var W=d.areaWidth,H=d.areaHeight,sx=d.dir.x===-1?1:-1,sy=d.dir.y===-1?1:-1;
 if(W<40||W>255||H<25||H>255||d.rowStride!==2*W)return null;
 var rows=[],total=0,maxRow=0;
 function col(x,y){return d.colors[y*d.rowStride+x]&15;}
 for(var y=0;y<H;y++){
  var cells=[],oldY=(y-sy+H)%H;
  for(var x=0;x<W;x++){
   var c=col(x,y),oldC=col((x-sx+W)%W,oldY);
   if(c!==oldC)cells.push(x,c);
  }
  var n=cells.length/2;
  if(n>96)return null;  // row stream addressed with 8-bit Y
  rows.push({count:n,entries:cells});
  total+=n;maxRow=Math.max(maxRow,n);
 }
 // Limit by per-frame list iterations (not by shape or colors). Very dense
 // arbitrary maps retain the already-approved TEST239 multicolor fallback.
 var worst=0;
 for(var cameraY=0;cameraY<H;cameraY++){
  var active=0;for(var r=0;r<25;r++)active+=rows[(cameraY+r)%H].count;
  worst=Math.max(worst,active);
 }
 if(total===0||worst>210)return null;
 var start=0xa100,pointers=2*H,storage=0;
 for(var r=0;r<H;r++)storage+=1+rows[r].entries.length;
 if(start+pointers+storage>0xb000)return null;
 var addrs=[],ptr=start+pointers;
 for(var r=0;r<H;r++){addrs.push(ptr);ptr+=1+rows[r].entries.length;}
 return{rows:rows,total:total,maxRow:maxRow,maxCandidates:worst,
  bytes:pointers+storage,start:start,W:W,H:H};
}
function tables(p){
 var a=['*=$a100','m243_row_lo'];bytes(a,p.rows.map(function(r,i){return p.start+2*p.H+p.rows.slice(0,i).reduce(function(n,v){return n+1+2*v.count;},0)&255;}));
 a.push('m243_row_hi');
 var ptr=p.start+2*p.H,hi=[];
 for(var k=0;k<p.H;k++){hi.push(ptr>>8);ptr+=1+2*p.rows[k].count;}
 bytes(a,hi);
 for(var j=0;j<p.rows.length;j++){
  a.push('m243_row_data_'+j);
  bytes(a,[p.rows[j].count].concat(p.rows[j].entries));
 }
 return a.join(NL)+NL;
}
function routine(p){
 var a=['prepare_row_deltas243',
  ' lda #$00',
  ' sta $50',' sta $51',' sta $52',' sta $53',
  ' sta $54',' sta $55',' sta $56',' sta $57',
  ' sta src_col',
  ' lda pending_y',' sta row_id',
  ' lda #$19',' sta rows_left',
  'm243_row',
  ' ldx row_id',
  ' lda m243_row_lo,x',' sta src_lo',
  ' lda m243_row_hi,x',' sta src_hi',
  ' ldy #$00',' lda (src_lo),y',' sta tmp_chr',
  ' bne m243_row_entries',
  ' jmp m243_endrow',
  'm243_row_entries',
  ' lda #$01',' sta color_src_hi',
  'm243_next_entry',
  ' ldy color_src_hi',' lda (src_lo),y',
  ' sec',' sbc pending_x',
  ' bcs m243_coord_ready',
  ' clc',' adc #'+h(p.W),
  'm243_coord_ready',
  ' cmp #$28',
  ' bcs m243_entry_done',
  ' sta tmp_x',
  ' iny',' lda (src_lo),y',' sta tmp_col',
  '; screen offset = 40*screenRow + screenX, split into pages',
  ' ldx src_col',
  ' lda m243_screen_lo,x',
  ' clc',' adc tmp_x',' sta color_src_lo',
  ' lda m243_screen_hi,x',
  ' adc #$00',' tax',
  '; append position+color to the original TEST203 sparse lists',
  ' lda $50,x',' tay',
  ' lda #$00',' sta color_dst_lo',
  ' txa',' clc',' adc #$10',' sta color_dst_hi',
  ' lda color_src_lo',' sta (color_dst_lo),y',
  ' txa',' clc',' adc #$14',' sta color_dst_hi',
  ' lda tmp_col',' sta (color_dst_lo),y',
  ' inc $50,x',
  ' bne m243_entry_done',
  ' inc $54,x',
  'm243_entry_done',
  ' inc color_src_hi',' inc color_src_hi',
  ' dec tmp_chr',
  ' beq m243_endrow',
  ' jmp m243_next_entry',
  'm243_endrow',
  ' inc src_col',
  ' inc row_id',
  ' lda row_id',' cmp #'+h(p.H),
  ' bne m243_row_yok',
  ' lda #$00',' sta row_id',
  'm243_row_yok',
  ' dec rows_left',
  ' beq m243_finish',
  ' jmp m243_row',
  'm243_finish',' rts'];
 var lo=[],hi=[];for(var row=0;row<25;row++){lo.push(row*40&255);hi.push(row*40>>8);}
 a.push('m243_screen_lo');bytes(a,lo);
 a.push('m243_screen_hi');bytes(a,hi);
 return a.join(NL)+NL;
}
E.build=function(d){
 var src=old(d),prior=window.RICO_TEST236_LAST_BUILD||{};
 var info={version:243,selected:false,reason:'ineligible or dense color delta'};
 if(!d||prior.selected||d.uniformColor||d.group||!d.fastRows){
  window.RICO_TEST243_LAST_BUILD=info;return src;
 }
 var p=plan(d);
 if(!p){window.RICO_TEST243_LAST_BUILD=info;return src;}
 var prep=' jsr diag_colors221'+NL+' jsr prepare_sparse_colors203',
     charset='*=$3000'+NL+'charset_bank1';
 if(src.split(prep).length!==2||src.split(charset).length!==2||
   src.split(' jsr commit_sparse_colors203').length!==2)
  throw Error('TEST243: known sparse-color hooks changed; refuse patch');
 src=src.replace(prep,' jsr prepare_row_deltas243');
 src=src.replace(charset,routine(p)+charset);
 src+=NL+tables(p);
 info={version:243,selected:true,mode:'general-world-row-deltas',
  worldDifferences:p.total,maximumPerWorldRow:p.maxRow,
  maximumRowCandidates:p.maxCandidates,deltaTableBytes:p.bytes,
  irq:'unchanged TEST203 sparse commit',renderer:'unchanged diag_shift221',
  independentOf:'color patterns, block shapes, charset indices, phase period'};
 window.RICO_TEST243_LAST_BUILD=info;
 console.log('[TEST243 GENERAL COLOR DELTA]',info);
 return src;
};
window.RICO_TEST243_DIAGONAL={version:243,plan:plan,tables:tables,routine:routine,previous:old};
})();