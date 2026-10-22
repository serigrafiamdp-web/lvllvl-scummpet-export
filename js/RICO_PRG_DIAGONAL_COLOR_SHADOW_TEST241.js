(function(){
'use strict';
// TEST241: shift the 1000-byte color *shadow* at $0C00 in-place.
// The completed back screen already uses diag_shift221; this module
// replaces only diag_colors221 in the non-RLE multicolor fallback.
// Color RAM ($D800) is NOT shifted here. The existing sparse scan+IRQ
// writer remains responsible for comparing and committing visible colors.
var engine=window.RICO_TEST196_DIAGONAL;
if(!engine||typeof engine.build!=='function')return;
var previous=engine.build,NL='\n';
function hh(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function ww(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function make(d){
 var sx=d.dir.x===-1?1:-1,sy=d.dir.y===-1?1:-1;
 var stride=sx+sy*40,entryX=sx===1?39:0,entryY=sy===1?24:0;
 var a=['diag_colors221'];
 var page,base=0x0c00,copyName;
 if(stride>0){
  for(page=0;page<3;page++){
   copyName='diag_color_copy241_'+page;
   a.push(' ldx #$00',copyName,
    ' lda '+ww(base+page*256+stride)+',x',
    ' sta '+ww(base+page*256)+',x',
    ' inx',' bne '+copyName);
  }
  var tail=1000-stride-768;
  a.push(' ldx #$00','diag_color_tail241',
   ' lda '+ww(base+768+stride)+',x',
   ' sta '+ww(base+768)+',x',
   ' inx',' cpx #'+hh(tail),' bne diag_color_tail241');
 }else{
  a.push(' ldx #$e7','diag_color_last241',
   ' lda '+ww(base+768+stride)+',x',
   ' sta '+ww(base+768)+',x',
   ' dex',' cpx #$ff',' bne diag_color_last241');
  for(page=2;page>=1;page--){
   copyName='diag_color_copy241_'+page;
   a.push(' ldx #$ff',copyName,
    ' lda '+ww(base+page*256+stride)+',x',
    ' sta '+ww(base+page*256)+',x',
    ' dex',' cpx #$ff',' bne '+copyName);
  }
  a.push(' ldx #$ff','diag_color_first241',
   ' lda '+ww(base+stride)+',x',
   ' sta '+ww(base)+',x',
   ' dex',' cpx #'+hh((-stride)-1),' bne diag_color_first241');
 }
 // Entering column; use the actual world color table, including TEST240
 // invisibility marker bit 7 if that fallback is selected.
 a.push(' lda pending_y',' sta row_id',
  ' lda #$19',' sta rows_left',
  ' lda #'+hh(entryX),' sta color_dst_lo',
  ' lda #$0c',' sta color_dst_hi',
  'diag_color_column241',
  ' ldx row_id',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi');
 if(entryX){
  a.push(' clc',' lda color_src_lo',' adc #'+hh(entryX),
   ' sta color_src_lo',' lda color_src_hi',' adc #$00',' sta color_src_hi');
 }
 a.push(' ldy #$00',' lda (color_src_lo),y',' sta (color_dst_lo),y',
  ' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
  ' lda color_dst_hi',' adc #$00',' sta color_dst_hi',
  ' inc row_id',' lda row_id',' cmp #'+hh(d.areaHeight),
  ' bne diag_color_row_next241',' lda #$00',' sta row_id',
  'diag_color_row_next241',
  ' dec rows_left',' bne diag_color_column241');
 // Entering full row, overwrite the intersection once more.
 if(entryY){
  a.push(' lda pending_y',' clc',' adc #$18',
   ' cmp #'+hh(d.areaHeight),' bcc diag_color_yready241',
   ' sec',' sbc #'+hh(d.areaHeight),
   'diag_color_yready241',' tax');
 }else a.push(' ldx pending_y');
 a.push(' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' lda #'+hh(entryY?0xc0:0),' sta color_dst_lo',
  ' lda #'+hh(0x0c+(entryY?3:0)),' sta color_dst_hi',
  ' ldy #$00','diag_color_fullrow241',
  ' lda (color_src_lo),y',' sta (color_dst_lo),y',
  ' iny',' cpy #$28',' bne diag_color_fullrow241',' rts');
 return a.join(NL)+NL;
}
engine.build=function(d){
 var s=previous(d),prior=window.RICO_TEST236_LAST_BUILD||{};
 var info={version:241,selected:false,reason:'no multicolor fallback'};
 if(d&&d.fastRows&&!d.uniformColor&&!d.group&&
  (!prior.selected||prior.mode==='visibility-sparse-fallback')){
  var start=NL+'diag_colors221'+NL;
  var end=NL+'*=$3000'+NL+'charset_bank1';
  var si=s.indexOf(start),ei=s.indexOf(end,si);
  if(si<0||ei<0||s.indexOf(start,si+start.length)>=0||
    s.split(' jsr diag_colors221').length!==2)
    throw Error('TEST241: unsafe color shadow anchor; refused');
  var replacement=NL+make(d);
  s=s.slice(0,si)+replacement+s.slice(ei);
  info={version:241,selected:true,mode:'color-shadow-inplace',
    baseColorMode:prior.mode,stride:(d.dir.x===-1?1:-1)+40*(d.dir.y===-1?1:-1),
    changed:'only diag_colors221 (staging $0C00)',
    unchanged:'Color RAM sparse compare and IRQ, charset, screen and border'};
 }
 window.RICO_TEST241_LAST_BUILD=info;
 console.log('[TEST241 DIAGONAL COLOR SHADOW]',info);
 return s;
};
window.RICO_TEST241_DIAGONAL={version:241,buildColorRoutine:make,previous:previous};
})();