(function(){
'use strict';
// TEST244 — Direct Color RAM diagonal shift split behind VIC-II beam.
// Phase 1: at raster $A0, shift top 12 rows (already scanned).
// Phase 2: at raster $FA, shift remaining 12 rows + entering edges,
//          then flip completed character screen before next text scan.
// Eligible only for positive diagonal source stride (UP LEFT / UP RIGHT),
// when TEST236 has no faster RLE plan, no group, and not uniform.
// DOWN directions and all other engines use untouched TEST239 fallback.
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var previous=E.build,NL='\n';
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function unrolled244(d){
 var stride=40+(d.dir.x===-1?1:-1);
 var lines=['; TEST244 generated direct absolute LDA/STA copies (8 cycles per cell)',
  '; $A100-$AFFF and $B800-$CFFF used, never SID $B000-$B7FF',
  '*=$a100','color_upper244'];
 for(var i=0;i<480;i++)
  lines.push(' lda '+w(0xd800+i+stride),' sta '+w(0xd800+i));
 lines.push(' rts','*=$b800','color_lower244');
 for(var i=480;i<960;i++)
  lines.push(' lda '+w(0xd800+i+stride),' sta '+w(0xd800+i));
 lines.push(' rts');
 return lines.join(NL)+NL;
}
function routine(d){
 var sx=d.dir.x===-1?1:-1,edgeX=sx===1?39:0;
 var a=['; TEST244 65 edge colors (no 1000-cell scan)',
  'color_edges244',
  ' lda pending_y',' sta row_id',
  ' lda #$19',' sta rows_left',
  ' lda #'+h((0xd800+edgeX)&255),' sta color_dst_lo',
  ' lda #'+h((0xd800+edgeX)>>8),' sta color_dst_hi',
  'c244_edge_column',
  ' ldx row_id',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi'];
 if(edgeX)a.push(
  ' clc',' lda color_src_lo',' adc #'+h(edgeX),' sta color_src_lo',
  ' lda color_src_hi',' adc #$00',' sta color_src_hi');
 a.push(' ldy #$00',
  ' lda (color_src_lo),y',
  ' and #$0f',' sta (color_dst_lo),y',
  ' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
  ' lda color_dst_hi',' adc #$00',' sta color_dst_hi',
  ' inc row_id',' lda row_id',' cmp #'+h(d.areaHeight),
  ' bne c244_next_row',
  ' lda #$00',' sta row_id',
  'c244_next_row',
  ' dec rows_left',' bne c244_edge_column',
  '; copy full incoming last color row (row 24)',
  ' lda pending_y',' clc',' adc #$18',
  ' cmp #'+h(d.areaHeight),
  ' bcc c244_lastrow_ready',
  ' sec',' sbc #'+h(d.areaHeight),
  'c244_lastrow_ready',' tax',
  ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
  ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
  ' ldy #$00','c244_lastrow',
  ' lda (color_src_lo),y',' and #$0f',' sta $dbc0,y',
  ' iny',' cpy #$28',' bne c244_lastrow',
  ' rts');
 return a.join(NL)+NL;
}
function irq244(){
 return [
 'irq',
 ' pha',' txa',' pha',' tya',' pha',
 ' lda #$01',' sta $d019',
 ' lda $d012',' cmp #$a0',' beq irq_mid244',
 '; BOTTOM ($FA): next IRQ mid-screen, finish color before next top draw',
 ' lda #$a0',' sta $d012',
 ' lda color_stage244',' beq irq_tick',
 ' jsr color_lower244',
 ' jsr color_edges244',
 ' jsr swap_screens',
 ' lda pending_x',' sta camera_x',' lda pending_y',' sta camera_y',
 ' lda next_fx',' sta fine_x',' lda next_fy',' sta fine_y',
 ' jsr apply_fine',
 ' lda #$00',' sta prep_request',' sta prep_ready',' sta color_stage244',
 ' jmp irq_tick',
 'irq_mid244',
 '; MID ($A0): draw finished top half, shift its Color RAM behind beam',
 ' lda #$fa',' sta $d012',
 ' lda main_busy',' bne irq_group',
 ' lda prep_request',' beq irq_group',
 ' lda prep_ready',' beq irq_group',
 ' lda color_stage244',' bne irq_group',
 ' jsr color_upper244',
 ' lda #$01',' sta color_stage244',
 ' jmp irq_group'
 ].join(NL);
}
E.build=function(d){
 var s=previous(d),base=window.RICO_TEST236_LAST_BUILD||{};
 var stat={version:244,selected:false,reason:'not eligible; stable TEST239 fallback'};
 if(!d||!d.fastRows||d.uniformColor||d.group||!d.dir||d.dir.y!==-1||
    (base.selected&&base.mode!=='original fallback')){
  window.RICO_TEST244_LAST_BUILD=stat;return s;
 }
 // No original RLE/Color RAM alternative may be active.
 if(base.selected){window.RICO_TEST244_LAST_BUILD=stat;return s;}
 var stage=' jsr diag_colors221'+NL+' jsr prepare_sparse_colors203';
 var irqStart=NL+'irq'+NL,irqEnd=NL+'irq_tick'+NL;
 var charset='*=$3000'+NL+'charset_bank1';
 if(s.split(stage).length!==2||s.split(irqStart).length!==2||
    s.split(irqEnd).length!==2||s.split(charset).length!==2||
    s.split(' jsr diag_shift221').length!==2)
    throw Error('TEST244: known TEST239 anchors changed; refuse export');
 s=s.replace(stage,'');
 var i=s.indexOf(irqStart),j=s.indexOf(irqEnd,i+irqStart.length);
 if(j<0)throw Error('TEST244: IRQ end missing');
 s=s.slice(0,i)+NL+irq244()+s.slice(j);
 s=s.replace(charset,routine(d)+charset);
 s+=NL+'*=$a008'+NL+'color_stage244'+NL+'!byte $00'+NL+unrolled244(d);
 stat={version:244,selected:true,mode:'two-stage-raster-direct-color',
   direction:d.direction,sourceStep:40+(d.dir.x===-1?1:-1),
   colorWrites:1025,unrolledCyclesPerHalf:3846,scanColorPages:false,extraSparsePlanner:false,
   rasterMid:160,rasterBottom:250,
   irq:'upper half behind beam; lower + edges then screen swap',
   unchanged:'charset banks, character diagonal copy, SID, group, other scroll directions'};
 window.RICO_TEST244_LAST_BUILD=stat;
 console.log('[TEST244 TWO-PHASE COLOR RAM]',stat);
 return s;
};
window.RICO_TEST244_DIAGONAL={version:244,routine:routine,unrolled:unrolled244,irq:irq244,previous:previous};
})();