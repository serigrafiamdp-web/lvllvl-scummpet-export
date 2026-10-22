(function(){
'use strict';
// TEST222B: eliminate camera-position-dependent stalls in Up AND Down.
// Compute source-row address in constant time (row*40) instead of doing
// camera_row repeated 40-byte additions; Up also eliminates two 24x seeks.
// No change to VIC, screen copies, SID, tick values or Color RAM strategy.
var E=window.RICO_TEST168_PRG_LARGE_MAP;if(!E)return;
var previous=E.buildSource,NL=String.fromCharCode(10);
function hx(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function segment(src,start,end){
 var a=src.indexOf(NL+start+NL),b=src.indexOf(NL+end+NL,a+1);
 if(a<0||b<0||b<=a)throw Error('TEST222B missing exact labels: '+start+'/'+end);
 return{a:a+1,b:b+1};
}
function transform(d,src){
 if(!d.area||d.area.width!==40||d.area.height<25||d.area.height>255)return src;
 var size=d.area.height,map=0x4000+d.area.y*40,color=0x7000+d.area.y*40;
 var range=segment(src,'set_src_camera','init_sparse_colors');
 var asm=[
 'set_src_camera',' ldx camera_row',' jmp map_row_address222',
 'set_color_src_camera',' ldx camera_row',' jmp color_row_address222',
 'map_row_address222',' jsr mul40_222',
 ' clc',' lda src_lo',' adc #'+hx(map),' sta src_lo',
 ' lda src_hi',' adc #'+hx(map>>8),' sta src_hi',' rts',
 'color_row_address222',' jsr mul40_222',
 ' clc',' lda src_lo',' adc #'+hx(color),' sta src_lo',
 ' lda src_hi',' adc #'+hx(color>>8),' sta src_hi',' rts',
 'mul40_222',' stx source_row',' txa',' sta src_lo',
 ' lda #$00',' sta src_hi'];
 for(var i=0;i<3;i++)asm.push(' asl src_lo',' rol src_hi');
 asm.push(' lda src_lo',' sta color_updates',
          ' lda src_hi',' sta color_tbl_hi');
 for(var j=0;j<2;j++)asm.push(' asl src_lo',' rol src_hi');
 asm.push(' clc',' lda src_lo',' adc color_updates',' sta src_lo',
          ' lda src_hi',' adc color_tbl_hi',' sta src_hi',' rts');
 src=src.slice(0,range.a)+asm.join(NL)+NL+src.slice(range.b);
 var up=segment(src,'fast_up_newrow','prepare_fast_down');
 var replacement=[
  'fast_up_newrow',' lda camera_row',
  ' cmp #'+hx(size-24),' bcc fast_up_no_wrap222',
  ' sec',' sbc #'+hx(size-24),' jmp fast_up_row_ready222',
  'fast_up_no_wrap222',' clc',' adc #$18',
  'fast_up_row_ready222',' tax',' jsr map_row_address222',
  ' lda #$c0',' sta dst_lo',' lda back_hi',
  ' clc',' adc #$03',' sta dst_hi',
  ' jsr copy40',' rts'
 ].join(NL)+NL;
 return src.slice(0,up.a)+replacement+src.slice(up.b);
}
E.buildSource=function(d){return transform(d,previous(d));};
window.RICO_TEST222B_ROWS={version:222,transform:transform,previous:previous};
})();