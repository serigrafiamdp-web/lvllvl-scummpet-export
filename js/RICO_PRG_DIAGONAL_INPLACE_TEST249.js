(function(){
'use strict';
/* TEST249 — Oscar64-inspired raster-chasing in-place diagonal + Color RAM.
 * A single VIC $0400 screen and $D800 Color RAM are shifted together.
 * Column and row edges precomputed as 130 bytes in $1F00..$1F81.
 * Top 8 screen rows use static generated code $1000..$1EA2.
 * Lower 16 screen rows generated ONCE in $E000..$FD40 when $01=$35.
 * The static $1000 block is ordered before original $2000 code; PRG stops
 * below $D000 and does not load through VIC-II/IO.
 * Only upward full-cell diagonal, no Group Animate or SID selected.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var original=E.build,NL='\n';
function b(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function w(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function one(s,a,c){if(s.split(a).length!==2)throw Error('TEST249 anchor: '+a.slice(0,64));return s.replace(a,c);}
function screenTop(d){
 var sx=d.dir.x===-1?1:-1,step=40+sx,edgeX=sx===1?39:0;
 var a=['; TEST249 direct in-place screen and Color RAM top 8 rows',
 '*=$1000','char_color_top249'];
 for(var y=0;y<8;y++)for(var x=0;x<40;x++){
  if(x===edgeX)continue;
  var dst=40*y+x,src=dst+step;
  a.push(' lda '+w(0x0400+src),' sta '+w(0x0400+dst),
         ' lda '+w(0xd800+src),' sta '+w(0xd800+dst));
 }
 a.push(' jmp char_color_tail249');
 return a.join(NL)+NL;
}
function bootTail(d){
 var sx=d.dir.x===-1?1:-1,step=40+sx,edgeX=sx===1?39:0,
     base=0x0400+8*40;
 var a=[
 '; Generate 16 rows of absolute screen + Color RAM copies in hidden RAM',
 'char_color_tail249=$e000',
 'build_tail249',
 ' lda #$00',' sta color_src_lo',
 ' lda #$e0',' sta color_src_hi',
 ' lda #'+b((base+step)&255),' sta src_lo',
 ' lda #'+b((base+step)>>8),' sta src_hi',
 ' lda #'+b(base&255),' sta dst_lo',
 ' lda #'+b(base>>8),' sta dst_hi',
 ' lda #$10',' sta rows_left',
 't249_build_row',
 ' lda #$28',' sta src_col',
 't249_build_cell',
 ' lda src_col',' cmp #'+b(edgeX===0?40:1),
 ' bne t249_build_write',
 ' jmp t249_build_skip',
 't249_build_write',
 ' ldy #$00',
 ' lda #$ad',' sta (color_src_lo),y',' iny', // LDA char
 ' lda src_lo',' sta (color_src_lo),y',' iny',
 ' lda src_hi',' sta (color_src_lo),y',' iny',
 ' lda #$8d',' sta (color_src_lo),y',' iny', // STA char
 ' lda dst_lo',' sta (color_src_lo),y',' iny',
 ' lda dst_hi',' sta (color_src_lo),y',' iny',
 ' lda #$ad',' sta (color_src_lo),y',' iny', // LDA Color RAM
 ' lda src_lo',' sta (color_src_lo),y',' iny',
 ' lda src_hi',' clc',' adc #$d4',' sta (color_src_lo),y',' iny',
 ' lda #$8d',' sta (color_src_lo),y',' iny', // STA Color RAM
 ' lda dst_lo',' sta (color_src_lo),y',' iny',
 ' lda dst_hi',' clc',' adc #$d4',' sta (color_src_lo),y',
 ' clc',' lda color_src_lo',' adc #$0c',' sta color_src_lo',
 ' bcc t249_write_no_carry',
 ' inc color_src_hi',
 't249_write_no_carry',
 't249_build_skip',
 ' inc src_lo',' bne t249_src_no_carry',' inc src_hi',
 't249_src_no_carry',
 ' inc dst_lo',' bne t249_dst_no_carry',' inc dst_hi',
 't249_dst_no_carry',
 ' dec src_col',' beq t249_end_row',
 ' jmp t249_build_cell',
 't249_end_row',
 ' dec rows_left',' beq t249_builder_done',
 ' jmp t249_build_row',
 't249_builder_done',
 ' ldy #$00',' lda #$60',' sta (color_src_lo),y',' rts'
 ];
 return a.join(NL)+NL;
}
function prep(d){
 var edgeX=d.dir.x===-1?39:0;
 return [
 'buf_colchar249=$1f00',
 'buf_colcolor249=$1f19',
 'buf_rowchar249=$1f32',
 'buf_rowcolor249=$1f5a',
 'prep_edges249',
 ' lda #$00',' sta tmp_x',
 ' lda pending_y',' sta row_id',
 't249_prep_column',
 ' ldx row_id',
 ' lda world_rows_lo,x',' clc',' adc pending_x',' sta src_lo',
 ' lda world_rows_hi,x',' adc #$00',' sta src_hi',
 ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
 ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
 ' ldy #'+b(edgeX),
 ' lda (src_lo),y',' ldx tmp_x',' sta buf_colchar249,x',
 ' lda (color_src_lo),y',' and #$0f',' sta buf_colcolor249,x',
 ' inc row_id',' lda row_id',' cmp #'+b(d.areaHeight),
 ' bne t249_col_next',' lda #$00',' sta row_id',
 't249_col_next',
 ' inc tmp_x',' lda tmp_x',' cmp #$19',
 ' bne t249_prep_column',
 '; Precompute the full incoming last row, shadowing last column cell',
 ' lda pending_y',' clc',' adc #$18',
 ' cmp #'+b(d.areaHeight),' bcc t249_last_ready',
 ' sec',' sbc #'+b(d.areaHeight),
 't249_last_ready',' tax',
 ' lda world_rows_lo,x',' clc',' adc pending_x',' sta src_lo',
 ' lda world_rows_hi,x',' adc #$00',' sta src_hi',
 ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
 ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
 ' ldy #$00','t249_prep_last',
 ' lda (src_lo),y',' sta buf_rowchar249,y',
 ' lda (color_src_lo),y',' and #$0f',' sta buf_rowcolor249,y',
 ' iny',' cpy #$28',' bne t249_prep_last',' rts'
 ].join(NL)+NL;
}
function edges(d){
 var edgeX=d.dir.x===-1?39:0;
 var a=['; 25 incoming column cells + 40 incoming last row',
        '; all source lookup already done in main thread',
        'apply_edges249'];
 for(var r=0;r<25;r++){
  var index=40*r+edgeX;
  a.push(' lda buf_colchar249+'+r,' sta '+w(0x0400+index),
         ' lda buf_colcolor249+'+r,' sta '+w(0xd800+index));
 }
 for(var x=0;x<40;x++){
  var idx=960+x;
  a.push(' lda buf_rowchar249+'+x,' sta '+w(0x0400+idx),
         ' lda buf_rowcolor249+'+x,' sta '+w(0xd800+idx));
 }
 a.push(' rts');
 return a.join(NL)+NL;
}
function irq(){
 return [
 'irq',
 ' pha',' txa',' pha',' tya',' pha',
 ' lda #$01',' sta $d019',
 ' lda main_busy',' bne irq_group',
 ' lda prep_request',' beq irq_tick',
 ' lda prep_ready',' beq irq_group',
 '; In place, always ascending, screen and colors together behind beam',
 ' jsr char_color_top249',
 ' jsr apply_edges249',
 ' lda pending_x',' sta camera_x',
 ' lda pending_y',' sta camera_y',
 ' lda next_fx',' sta fine_x',
 ' lda next_fy',' sta fine_y',
 ' jsr apply_fine',
 ' lda #$00',' sta prep_request',' sta prep_ready',
 ' jmp irq_tick'
 ].join(NL);
}
E.build=function(d){
 var s=original(d),prev=window.RICO_TEST244_LAST_BUILD||{};
 var stat={version:249,selected:false,reason:'incompatible, leaving TEST244 unchanged'};
 var sid=window.RICO_TEST207_ORIGINAL_SID&&window.RICO_TEST207_ORIGINAL_SID.getState&&window.RICO_TEST207_ORIGINAL_SID.getState();
 if(!d||!prev.selected||prev.mode!=='two-stage-raster-direct-color'||
    !d.fastRows||d.uniformColor||d.group||!d.dir||d.dir.y!==-1||
    d.areaHeight>231||sid&&sid.enabled){
  window.RICO_TEST249_LAST_BUILD=stat;return s;
 }
 // Our screen copy assumes a full 8-pixel diagonal in both axes.
 if(d.pixels!==8){stat.reason='prototype only for 8 pixels/step';
   window.RICO_TEST249_LAST_BUILD=stat;return s;}
 var site=' jsr diag_shift221'+NL+NL+' lda #$01'+NL+' sta prep_ready';
 s=one(s,site,' jsr prep_edges249'+NL+NL+' lda #$01'+NL+' sta prep_ready');
 var start=NL+'irq'+NL,end=NL+'irq_tick'+NL,
     i=s.indexOf(start),j=i<0?-1:s.indexOf(end,i+start.length);
 if(i<0||j<0||s.split(start).length!==2||s.split(end).length!==2)
   throw Error('TEST249: unexpected raster loop layout');
 s=s.slice(0,i)+NL+irq()+s.slice(j);
 s=one(s,' lda #$01'+NL+' sta $d01a'+NL+' lda #$fa'+NL+' sta $d012',
    ' lda #$01'+NL+' sta $d01a'+NL+' lda #$60'+NL+' sta $d012');
 var startPatch='start'+NL+' sei'+NL+' lda #$35'+NL+' sta $01';
 s=one(s,startPatch,startPatch+NL+' jsr build_tail249');
 s=one(s,'*=$3000'+NL+'charset_bank1',
   bootTail(d)+prep(d)+edges(d)+'*=$3000'+NL+'charset_bank1');
 s=one(s,'*=$2000'+NL,screenTop(d)+'*=$2000'+NL);
 stat={version:249,selected:true,mode:'single-screen-in-place-char-color',
  rasterStart:96,source:'Oscar64 cgrid8way.c + colorram.c (adaptation)',
  copies:936,colorCopies:936,precomputedEdgeBytes:130,
  screen:'$0400',colorRAM:'$d800',shadow:$02,
  buffers:'$1f00-$1f81',staticCode:'$1000-$1ea2',
  generatedCode:'$e000-$fd40 runtime only',
  colorScroller:'NO double buffer or screen swap',
  selectedDirections:'up-left/up-right, 8px/step, no Group or native SID',
  status:'experiment only, VICE PASS not established'};
 window.RICO_TEST249_LAST_BUILD=stat;
 console.log('[TEST249 IN-PLACE RASTER CHASE]',stat);
 return s;
};
window.RICO_TEST249_INPLACE={version:249,emitTop:screenTop,emitBoot:bootTail,prepare:prep,edges:edges,previous:original};
})();