(function(){
'use strict';
// TEST235: diagonal color-speed experiment, independently based on TEST232 PASS.
// Retain the original TEST203 SPARSE IRQ Color RAM committer. Improve only
// the off-IRQ preparation: shift the $0C00 color shadow and fill the new
// border row/column rather than drawing all 1000 colors from the map.
// No full 1000-cell Color RAM IRQ write (that caused TEST234 FAIL).
// No new Edge profile, no browser changes, no SID or cardinal scroll changes.
var E=window.RICO_TEST196_DIAGONAL;if(!E)return;
var previous=E.build,NL=String.fromCharCode(10);
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function shift(d){
 var dx=d.dir.x===-1?1:-1,dy=d.dir.y===-1?1:-1;
 var stride=dx+dy*40,insertX=dx>0?39:0,insertY=dy>0?24:0;
 var a=['diag_shadow_shift235'];
 // There are 1000 visible Color RAM cells, 40*25, color shadow $0C00.
 // Positive stride => forward memcpy; negative => backward memcpy.
 // Crossing from the end of a row is corrected by edge-fill below.
 if(stride>0){
  var count=1000-stride;
  for(var start=0,index=0;start<count;start+=256,index++){
   var n=Math.min(256,count-start),name='diag_shiftdn235_'+index;
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
   var tag='diag_shiftup235_'+idx++;
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
  'diag_shadow_col_loop235',
  ' ldx row_id',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' ldy #'+h(insertX),' lda (color_src_lo),y',
  ' ldy #$00',' sta (color_dst_lo),y',
  ' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
  ' lda color_dst_hi',' adc #$00',' sta color_dst_hi',
  ' inc row_id',' lda row_id',' cmp #'+h(d.areaHeight),
  ' bne diag_shadow_nextrow235',
  ' lda #$00',' sta row_id',
  'diag_shadow_nextrow235',
  ' dec rows_left',' bne diag_shadow_col_loop235'
 );
 // The new horizontal edge row overrides a few values shifted across
 // old row boundaries. It must be written after the new column.
 a.push(' lda pending_y',' clc',' adc #'+h(insertY),
  ' bcc diag_shadow_y_nocarry235',
  ' sec',' sbc #'+h(d.areaHeight),
  ' jmp diag_shadow_yready235',
  'diag_shadow_y_nocarry235',
  ' cmp #'+h(d.areaHeight),' bcc diag_shadow_yready235',
  ' sec',' sbc #'+h(d.areaHeight),
  'diag_shadow_yready235',' tax',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' ldy #$00','diag_shadow_fullrow235',
  ' lda (color_src_lo),y',
  ' sta '+w(0x0c00+insertY*40)+',y',
  ' iny',' cpy #$28',' bne diag_shadow_fullrow235',
  ' rts');
 return a.join(NL)+NL;
}

E.build=function(d){
 var s=previous(d);
 window.RICO_TEST235_LAST_BUILD={selected:false,direction:d&&d.direction,pixels:d&&d.pixels,reason:'original'};
 if(!d||!d.fastRows||d.uniformColor||d.group||!d.dir||
    !d.colors||d.rowStride<d.areaWidth*2)return s;
 var rle=' jsr diag_rle_apply221'+NL+' jsr swap_screens';
 var sparse=' jsr commit_sparse_colors203'+NL+' jsr swap_screens';
 var useRLE=s.split(rle).length===2;
 if(useRLE){
  var stage=' jsr diag_shift221'+NL;
  if(s.split(stage).length!==2)throw Error('TEST235: RLE stage changed');
  s=s.replace(stage,stage+' jsr diag_shadow_shift235'+NL+' jsr prepare_sparse_colors203'+NL);
  s=s.replace(rle,sparse);
 }else{
  var original=' jsr diag_colors221'+NL+' jsr prepare_sparse_colors203';
  if(s.split(original).length!==2||s.split(sparse).length!==2)
   throw Error('TEST235: sparse stage/commit changed');
  s=s.replace(original,' jsr diag_shadow_shift235'+NL+' jsr prepare_sparse_colors203');
 }
 var label='*=$3000'+NL+'charset_bank1';
 if(s.split(label).length!==2)throw Error('TEST235: charset anchor changed');
 s=s.replace(label,shift(d)+label);
 window.RICO_TEST235_LAST_BUILD={selected:true,direction:d.direction,pixels:d.pixels,
  colorPrepare:'incremental off-IRQ shadow shift + sparse scan',
  irqCommit:'unchanged TEST203 sparse',replacesRLE:useRLE,
  byteStride:(d.dir.x===-1?1:-1)+40*(d.dir.y===-1?1:-1)};
 console.log('[RICO TEST235 DIAGONAL SPARSE SAFE]',window.RICO_TEST235_LAST_BUILD);
 return s;
};
window.RICO_TEST235_DIAGONAL={version:235,previous:previous,generateShift:shift};
})();