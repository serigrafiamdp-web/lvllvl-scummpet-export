(function(){
'use strict';
/* TEST255 50HZ FAST PATH.
 * Derived from the VICE-measured 47.22/s TEST254, and preserves every
 * graphics/Color RAM copy instruction, 3-band raster, camera and map.
 * Reclaim CPU time by removing the TEST253 CIA profiler from hot paths.
 * Optimize 40-row color fetches: input colors are already sanitized to
 * 0..15 by TEST196.collect(), so 40 AND #$0F instructions are redundant.
 * Keep TEST250 phase counters; publish TEST255 signature at $A030.
 */
var engine=window.RICO_TEST196_DIAGONAL;if(!engine||!engine.build)return;
var before=engine.build,LF='\n';
function one(s,a,b){
 if(s.split(a).length!==2)throw Error('TEST255 cannot find unique anchor: '+a.slice(0,80));
 return s.replace(a,b);
}
engine.build=function(d){
 var asm=before(d),base=window.RICO_TEST254_LAST_BUILD||{};
 var state={version:255,selected:false,reason:'TEST254 hot path unavailable'};
 if(!base.selected||base.mode!=='6502-unrolled-direct-edge-preparation'){
  window.RICO_TEST255_LAST_BUILD=state;return asm;
 }
 // Keep the exact color buffers unchanged, even for synthetic callers
 // that bypass the editor's existing &15 color normalization.
 if(!d||!d.colors||!Array.prototype.every.call(d.colors,function(c){
  return typeof c==='number' && Number.isInteger(c) && c>=0 && c<=15;
 })){
  state.reason='non-normalized colors; use exact TEST254 fallback';
  window.RICO_TEST255_LAST_BUILD=state;return asm;
 }
 // CIA snapshots are TEST253 diagnostic-only. They cost CPU on the
 // production main-loop and at the first raster IRQ each frame.
 asm=one(asm,' jsr build_tail249'+LF+' jsr t253_init'+LF+' lda #$7f',
              ' jsr build_tail249'+LF+' lda #$7f');
 asm=one(asm,' jsr t253_begin'+LF+' jsr prep_edges249'+LF+' jsr t253_end',
              ' jsr prep_edges249');
 asm=one(asm,' jsr plan_step'+LF+' jsr t253_queue'+LF+'irq_group',
              ' jsr plan_step'+LF+'irq_group');
 asm=one(asm,'t250_first'+LF+' jsr t253_first'+LF+' lda main_busy',
              't250_first'+LF+' lda main_busy');

 // Remove now-unreferenced CIA profiler helper routines: avoid dead code.
 var helpBegin=asm.indexOf('; TEST253 CIA1 Timer A:');
 var helpEnd=helpBegin<0?-1:asm.indexOf('*=$3000'+LF+'charset_bank1',helpBegin);
 if(helpBegin<0||helpEnd<0)throw Error('TEST255 profiler helper region changed');
 asm=asm.slice(0,helpBegin)+asm.slice(helpEnd);

 // No stale profiler memory: reserve a new proof-of-mode signature.
 var oldTelemetry='*=$a030'+LF+'t253_magic';
 var t=asm.indexOf(oldTelemetry),end=t<0?-1:asm.indexOf('*=$a100'+LF+'color_upper244',t);
 if(t<0||end<0)throw Error('TEST255 telemetry region not found');
 asm=asm.slice(0,t)+[
  '*=$a030','t255_signature','!byte $55','t255_version','!byte $01',
  't255_flags','!byte $03',
  '; 1=No CIA profiler in hot loop, 2=Pre-normalized color source'
 ].join(LF)+LF+asm.slice(end);

 // TEST196 source generator already clips each fc with &15.
 // Verify and eliminate exactly the 40 redundant AND operations in
 // the unrolled bottom-row preparation, not elsewhere.
 var rowStart=asm.indexOf(LF+'t249_prep_last'+LF);
 var rowEnd=rowStart<0?-1:asm.indexOf(LF+' rts'+LF,rowStart);
 if(rowStart<0||rowEnd<0)throw Error('TEST255 bottom-row boundary absent');
 var row=asm.slice(rowStart,rowEnd),masks=row.split(' and #$0f').length-1;
 if(masks!==40)throw Error('TEST255 expected exactly 40 masks, found '+masks);
 asm=asm.slice(0,rowStart)+row.replace(/ and #\$0f/g,'')+asm.slice(rowEnd);
 state={
  version:255,selected:true,mode:'50hz-fast-6502-no-profiler',
  base:'TEST254 VICE 47.22 changes/s',
  removed:'TEST253 CIA timer sampling in init/main IRQ; 40 redundant row color AND #$0F',
  savedCyclesEstimate:'~320 6510 cycles/move (approximately, not VICE measured)',
  graphics:'unchanged: all 936 character/color in-place copy pairs and edge writes',
  rasters:[86,132,218],
  all16Colors:true,
  retainedCounters:'m a020 a028',
  signature:'m a030 a032 should read 55 01 03',
  timerRemoved:'TEST253 A030..A049 invalid for TEST255; use TEST254 for CIA samples',
  status:'experimental; 50/s requires VICE recording'
 };
 window.RICO_TEST255_LAST_BUILD=state;
 console.log('[TEST255 50Hz FAST]',state);
 return asm;
};
})();