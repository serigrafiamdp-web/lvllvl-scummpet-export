(function(){
'use strict';
// TEST221: TEST220 RLE-color extension for already-fast Up/Down engine.
// Dense palettes, multi-frame and animations keep existing export paths.
var E=window.RICO_TEST168_PRG_LARGE_MAP;if(!E)return;
var original=E.buildSource, NL=String.fromCharCode(10);
function h(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function w(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function encode(a){var s=[];for(var k=0;k<a.length;k+=16)s.push('!byte '+a.slice(k,k+16).map(h).join(','));return s.join(NL);}
function plan(d){
 if(d.anim175&&(d.anim175.group||d.anim175.switchTicks||(d.anim175.records||[]).length))return null;
 if(d.area.width!==40||d.area.height<25||d.area.height>255)return null;
 var H=d.area.height,colors=d.colors,streams=[];
 for(var cam=0;cam<H;cam++){
  var prev=(cam+(d.type==='up'?H-1:1))%H,seq=[];
  for(var x=0;x<40;x++)for(var y=0;y<25;){
   var prevColor=colors[(d.area.y+(prev+y)%H)*40+x]&15;
   var nextColor=colors[(d.area.y+(cam+y)%H)*40+x]&15;
   if(prevColor===nextColor){y++;continue;}
   var start=y++,count=1;
   while(y<25){
    var a=colors[(d.area.y+(prev+y)%H)*40+x]&15,
        b=colors[(d.area.y+(cam+y)%H)*40+x]&15;
    if(a===b||b!==nextColor)break;
    y++;count++;
   }
   var addr=0xd800+start*40+x;
   seq.push(count,addr&255,addr>>8,nextColor);
  }
  seq.push(0);streams.push(seq);
 }
 var base=0xa100,low=base+2*H,high=0xb800,usingHigh=false,pointers=[];
 for(var i=0;i<H;i++){
  var n=streams[i].length;
  if(!usingHigh&&low+n<=0xb000){pointers.push(low);low+=n;}
  else if(high+n<=0xd000){usingHigh=true;pointers.push(high);high+=n;}
  else return null;
 }
 return{streams:streams,pointers:pointers,base:base,height:H};
}
function runtime(){
 return [
 'apply_vertical_color221',' ldx camera_row',
 ' lda vcolor221_lo,x',' sta color_tbl_lo',
 ' lda vcolor221_hi,x',' sta color_tbl_hi',
 'vcolor221_next',' ldy #$00',' lda (color_tbl_lo),y',
 ' bne vcolor221_open',' rts',
 'vcolor221_open',' sta color_updates',
 ' iny',' lda (color_tbl_lo),y',' sta dst_lo',
 ' iny',' lda (color_tbl_lo),y',' sta dst_hi',
 ' iny',' lda (color_tbl_lo),y',' sta color_row',
 ' clc',' lda color_tbl_lo',' adc #$04',' sta color_tbl_lo',
 ' bcc vcolor221_no_carry',' inc color_tbl_hi',
 'vcolor221_no_carry','vcolor221_write',
 ' ldy #$00',' lda color_row',' sta (dst_lo),y',
 ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
 ' lda dst_hi',' adc #$00',' sta dst_hi',
 ' dec color_updates',' bne vcolor221_write',
 ' jmp vcolor221_next'
 ].join(NL)+NL;
}
function data(p){
 var rows=['*='+w(p.base),'vcolor221_lo',encode(p.pointers.map(function(x){return x&255;})),
 'vcolor221_hi',encode(p.pointers.map(function(x){return x>>8;}))];
 for(var i=0;i<p.height;i++)rows.push('*='+w(p.pointers[i]),'vcolor221_data_'+i,encode(p.streams[i]));
 return rows.join(NL)+NL;
}
E.buildSource=function(d){
 var src=original(d);
 // Uniform and precalculated-color fast paths already work: do not touch.
 // Dynamic Color RAM scanning benefits from offline RLE delta preparation.
 if(src.indexOf('dynamic_color_row_loop'+NL)<0)return src;
 var p=plan(d);if(!p)return src;
 var a=['commit_prepared',' jsr apply_sparse_colors',' jsr swap_screens'].join(NL);
 var b=['commit_fast8',' jsr apply_sparse_colors',' jsr swap_screens'].join(NL);
 if(src.split(a).length!==2||src.split(b).length!==2)throw Error('TEST221 vertical source changed');
 src=src.replace(a,['commit_prepared',' jsr apply_vertical_color221',' jsr swap_screens'].join(NL))
  .replace(b,['commit_fast8',' jsr apply_vertical_color221',' jsr swap_screens'].join(NL));
 var charset='*=$3000'+NL;
 if(src.split(charset).length!==2)throw Error('TEST221 vertical charset changed');
 src=src.replace(charset,runtime()+charset);
 return src+NL+data(p);
};
window.RICO_TEST221_VERTICAL_COLOR={plan:plan,original:original,version:221};
})();