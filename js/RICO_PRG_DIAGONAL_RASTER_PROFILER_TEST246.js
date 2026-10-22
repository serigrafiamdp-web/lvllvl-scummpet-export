(function(){
'use strict';
// TEST246: instrument TEST244. Do not change color scrolling algorithm.
// Border raster bars + counters in $A020..$A02D for VICE monitor.
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var prev=E.build,NL='\n';
function h(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function replaceOnce(s,a,b){
 if(s.split(a).length!==2)throw Error('TEST246: assembly anchor missing/duplicate: '+a.slice(0,60));
 return s.replace(a,b);
}
function profileMemory(){
 return ['*=$a020',
 'trace_start_lo246','!byte $00',
 'trace_start_hi246','!byte $00',
 'trace_end_lo246','!byte $00',
 'trace_end_hi246','!byte $00',
 'trace_mid_irqs246','!byte $00',
 'trace_mid_ready246','!byte $00',
 'trace_mid_missed246','!byte $00',
 'trace_bottom_commits246','!byte $00',
 'trace_pending_bottom246','!byte $00',
 'trace_mid_busy246','!byte $00',
 'trace_debug_magic246','!byte $46',
 'trace_version246','!byte $01'].join(NL)+NL;
}
E.build=function(d){
 var src=prev(d),original=window.RICO_TEST244_LAST_BUILD||{};
 var info={version:246,selected:false,reason:'TEST244 raster path not selected'};
 if(!d||!original.selected||original.mode!=='two-stage-raster-direct-color'){
  window.RICO_TEST246_LAST_BUILD=info;return src;
 }
 // Preserve original raster IRQ and all color/character copying ASM.
 // Capture start/end positions (RST8 bit in $D011 + low $D012),
 // and add 8-bit event counters. Border is a visual cycle profiler.
 const start=' sta main_busy'+NL+' lda back_hi'+NL+' sta dst_hi'+NL+' jsr diag_shift221';
 const startNew=[
 ' sta main_busy',
 ' lda #$02',' sta $d020', // RED = character frame preparation
 ' lda $d012',' sta trace_start_lo246',
 ' lda $d011',' and #$80',' sta trace_start_hi246',
 ' lda back_hi',' sta dst_hi',' jsr diag_shift221'
 ].join(NL);
 src=replaceOnce(src,start,startNew);
 const ready=' jsr diag_shift221'+NL+NL+' lda #$01'+NL+' sta prep_ready';
 const readyNew=[
 ' jsr diag_shift221','',
 ' lda $d012',' sta trace_end_lo246',
 ' lda $d011',' and #$80',' sta trace_end_hi246',
 ' lda #$05',' sta $d020', // GREEN = main preparation ready
 ' lda #$01',' sta prep_ready'
 ].join(NL);
 src=replaceOnce(src,ready,readyNew);
 // Mid IRQ: count every occurrence and distinguish waiting for prep.
 const mid='irq_mid244'+NL+'; MID ($A0): draw finished top half, shift its Color RAM behind beam'+NL+
   ' lda #$fa'+NL+' sta $d012'+NL+
   ' lda main_busy'+NL+' bne irq_group'+NL+
   ' lda prep_request'+NL+' beq irq_group'+NL+
   ' lda prep_ready'+NL+' beq irq_group'+NL+
   ' lda color_stage244'+NL+' bne irq_group'+NL+
   ' jsr color_upper244';
 const midNew=[
 'irq_mid244',
 '; TEST246 MID IRQ profiler: observe readiness before guarded commit',
 ' lda #$fa',' sta $d012',
 ' inc trace_mid_irqs246',
 ' lda prep_request',' beq t246_mid_nopending',
 ' lda main_busy',' bne t246_mid_busy',
 ' lda prep_ready',' bne t246_mid_ready',
 ' inc trace_mid_missed246',
 ' jmp t246_mid_nopending',
 't246_mid_busy',' inc trace_mid_busy246',
 ' inc trace_mid_missed246',
 ' jmp t246_mid_nopending',
 't246_mid_ready',' inc trace_mid_ready246',
 't246_mid_nopending',
 ' lda main_busy',' bne irq_group',
 ' lda prep_request',' beq irq_group',
 ' lda prep_ready',' beq irq_group',
 ' lda color_stage244',' bne irq_group',
 ' lda #$06',' sta $d020', // BLUE = upper color phase
 ' jsr color_upper244'
 ].join(NL);
 src=replaceOnce(src,mid,midNew);
 src=replaceOnce(src,
   ' jsr color_edges_upper244'+NL+' lda #$01',
   ' jsr color_edges_upper244'+NL+' lda #$03'+NL+' sta $d020'+NL+' lda #$01');
 // Bottom IRQ commit; visible YELLOW only while lower phase is active.
 src=replaceOnce(src,
   'irq_bottom_ready244'+NL+' jsr color_lower244',
   'irq_bottom_ready244'+NL+' inc trace_bottom_commits246'+NL+
    ' lda #$07'+NL+' sta $d020'+NL+' jsr color_lower244');
 src=replaceOnce(src,
   ' lda prep_request'+NL+' beq irq_tick'+NL+' jmp irq_group'+NL+'irq_bottom_ready244',
   ' lda prep_request'+NL+' beq irq_tick'+NL+
    ' inc trace_pending_bottom246'+NL+' jmp irq_group'+NL+'irq_bottom_ready244');
 // Restore original project's border color immediately after the swap.
 src=replaceOnce(src,
   ' jsr apply_fine'+NL+' lda #$00'+NL+' sta prep_request'+NL+' sta prep_ready'+NL+' sta color_stage244',
   ' jsr apply_fine'+NL+' lda #'+h(d.border)+NL+' sta $d020'+NL+
   ' lda #$00'+NL+' sta prep_request'+NL+' sta prep_ready'+NL+' sta color_stage244');
 // Reserve counters only in the already-empty gap between $A008 and $A100.
 src=replaceOnce(src,'*=$a100'+NL+'color_upper244',
   profileMemory()+'*=$a100'+NL+'color_upper244');
 info={version:246,selected:true,mode:'raster-profiler-only',
    underlying:'TEST244 unchanged byte-copy and scheduling',
    midRaster:160,bottomRaster:250,
    monitorRange:'$A020-$A02B',
    memory:{startLow:'$A020',startHigh:'$A021',
      finishLow:'$A022',finishHigh:'$A023',
      midIRQs:'$A024',midReady:'$A025',midMissed:'$A026',
      committed:'$A027',pendingBottom:'$A028',midBusy:'$A029',magic:'$A02A',version:'$A02B'},
    borderColors:'red=preparing green=ready blue=upper ColorRAM cyan=upper done yellow=lower',
    expectedNoSpeedup:true};
 window.RICO_TEST246_LAST_BUILD=info;
 console.log('[TEST246 RASTER PROFILER]',info);
 return src;
};
window.RICO_TEST246_DIAGNOSTIC={version:246,previous:prev};
})();