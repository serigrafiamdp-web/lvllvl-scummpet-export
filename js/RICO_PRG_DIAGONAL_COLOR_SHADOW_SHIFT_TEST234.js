(function(){
'use strict';
// TEST234: diagonal speed experiment for dense multicolor maps.
// Instead of drawing 1000 world colors then scanning 1000 sparse
// differences / interpreting RLE inside IRQ, shift the PREVIOUS
// $0C00-$0FE7 shadow image in-place (overlap safe) and fill the
// newly exposed color row/column. IRQ copies it top-down using the
// existing tested commit_colors199 routine.
// TEST233 direct STA is preserved when it fits. No change to chars,
// VIC-II scroll, 25-row viewport, ticks, diagonal timing, or SID.
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.TEST233)return;
var old=E.build,NL=String.fromCharCode(10);
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function shift(d){
 var dx=d.dir.x===-1?1:-1,dy=d.dir.y===-1?1:-1;
 var stride=dx+dy*40,insertX=dx>0?39:0,insertY=dy>0?24:0;
 var a=['diag_shadow_shift234'];
 // There are 1000 visible Color RAM cells, 40*25, color shadow $0C00.
 // Positive stride => forward memcpy; negative => backward memcpy.
 // Crossing from the end of a row is corrected by edge-fill below.
 if(stride>0){
  var count=1000-stride;
  for(var start=0,index=0;start<count;start+=256,index++){
   var n=Math.min(256,count-start),name='diag_shiftdn234_'+index;
   a.push(' ldx #$00',name,
     ' lda '+w(0x0c00+start+stride)+',x',
     ' sta '+w(0x0c00+start)+',x',
     ' inx');
   if(n!==256)a.push(' cpx #'+h(n));
   a.push(' bne '+name);
  }
 }else{
  var min=-stride,idx=0;
  for(var page=3;page>=0;page--){
   var lo=Math.max(min,page*256)-page*256;
   var hi=Math.min(999,page*256+255)-page*256;
   if(lo>hi)continue;
   var tag='diag_shiftup234_'+idx++;
   a.push(' ldx #'+h(hi),tag,
     ' lda '+w(0x0c00+page*256+stride)+',x',
     ' sta '+w(0x0c00+page*256)+',x',
     ' dex',
     ' cpx #'+h(lo-1),
     ' bne '+tag);
  }
 }
 a.push(
  ' lda #'+h(0x0c00+insertX),' sta color_dst_lo',
  ' lda #'+h((0x0c00+insertX)>>8),' sta color_dst_hi',
  ' lda pending_y',' sta row_id',
  ' lda #$19',' sta rows_left',
  'diag_shadow_col_loop234',
  ' ldx row_id',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' ldy #'+h(insertX),' lda (color_src_lo),y',
  ' ldy #$00',' sta (color_dst_lo),y',
  ' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
  ' lda color_dst_hi',' adc #$00',' sta color_dst_hi',
  ' inc row_id',' lda row_id',' cmp #'+h(d.areaHeight),
  ' bne diag_shadow_nextrow234',
  ' lda #$00',' sta row_id',
  'diag_shadow_nextrow234',
  ' dec rows_left',' bne diag_shadow_col_loop234'
 );
 // The new horizontal edge row overrides a few values shifted across
 // old row boundaries. It must be written after the new column.
 a.push(' lda pending_y',' clc',' adc #'+h(insertY),
  ' bcc diag_shadow_y_nocarry234',
  ' sec',' sbc #'+h(d.areaHeight),
  ' jmp diag_shadow_yready234',
  'diag_shadow_y_nocarry234',
  ' cmp #'+h(d.areaHeight),' bcc diag_shadow_yready234',
  ' sec',' sbc #'+h(d.areaHeight),
  'diag_shadow_yready234',' tax',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' ldy #$00','diag_shadow_fullrow234',
  ' lda (color_src_lo),y',
  ' sta '+w(0x0c00+insertY*40)+',y',
  ' iny',' cpy #$28',' bne diag_shadow_fullrow234',
  ' rts');
 return a.join(NL)+NL;
}
E.build=function(d){
 var source=old(d);
 window.RICO_TEST234_LAST_BUILD={
  selected:false,direction:d&&d.direction,pixels:d&&d.pixels,
  mode:'previous',reason:'ineligible or TEST233 direct-STA'
 };
 if(!d||!d.fastRows||d.uniformColor||d.group||
    !d.dir||!d.colors||d.rowStride<d.areaWidth*2)return source;
 if(window.RICO_TEST233_LAST_BUILD&&window.RICO_TEST233_LAST_BUILD.selected){
  window.RICO_TEST234_LAST_BUILD.reason='TEST233 direct STA already selected';
  return source;
 }
 var rle=' jsr diag_rle_apply221'+NL+' jsr swap_screens';
 var sparse=' jsr commit_sparse_colors203'+NL+' jsr swap_screens';
 var isRLE=source.split(rle).length===2;
 var colorCall=isRLE?rle:sparse;
 if(source.split(colorCall).length!==2)throw Error('TEST234 diagonal color commit layout changed');
 source=source.replace(colorCall,' jsr commit_colors199'+NL+' jsr swap_screens');
 var full=' jsr diag_colors221'+NL+' jsr prepare_sparse_colors203';
 var increment=' jsr diag_shift221';
 if(isRLE){
  if(source.split(increment).length!==2)throw Error('TEST234 RLE stage changed');
  source=source.replace(increment,increment+NL+' jsr diag_shadow_shift234');
 }else{
  if(source.split(full).length!==2)throw Error('TEST234 shadow stage changed');
  source=source.replace(full,' jsr diag_shadow_shift234');
 }
 var charset='*=$3000'+NL+'charset_bank1';
 if(source.split(charset).length!==2)throw Error('TEST234 charset boundary changed');
 source=source.replace(charset,shift(d)+charset);
 window.RICO_TEST234_LAST_BUILD={selected:true,direction:d.direction,pixels:d.pixels,
  mode:'incremental-shadow',colorCommit:'1000 cells, top-down',rleReplaced:isRLE,
  byteStride:(d.dir.x===-1?1:-1)+40*(d.dir.y===-1?1:-1)};
 console.log('[RICO TEST234 DIAGONAL FAST COLOR]',window.RICO_TEST234_LAST_BUILD);
 return source;
};
E.TEST234={version:234,previous:old,shift:shift};
})();