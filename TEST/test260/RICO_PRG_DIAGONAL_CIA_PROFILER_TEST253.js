(function(){
'use strict';
/* TEST253 — CIA1 Timer A 16-bit downcount cycle profiler.
 * Pure diagnostics for TEST252 (no changes to raster, screen,
 * Color RAM, map, cache, or main scroll logic).
 * $A030-$A049 telemetry; read m a030 a049 in VICE.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var prior=E.build,N='\n';
function replaceOne(s,a,b){
 if(s.split(a).length!==2)throw Error('TEST253 anchor missing/duplicate: '+a.slice(0,75));
 return s.replace(a,b);
}
function telemetry(){
 var list=[
  ['t253_magic',0x53],       // A030
  ['t253_version',0x01],     // A031
  ['t253_preps',0],          // A032
  ['t253_queues',0],         // A033
  ['t253_begin_lo',0],       // A034 CIA timer low
  ['t253_begin_hi',0],       // A035 CIA timer high
  ['t253_end_lo',0],         // A036
  ['t253_end_hi',0],         // A037
  ['t253_begin_irq',0],      // A038 counter snapshot at entry
  ['t253_end_irq',0],        // A039
  ['t253_begin_raster',0],   // A03A
  ['t253_begin_rhi',0],      // A03B 0x80/0x00
  ['t253_end_raster',0],     // A03C
  ['t253_end_rhi',0],        // A03D
  ['t253_queue_raster',0],   // A03E
  ['t253_queue_rhi',0],      // A03F
  ['t253_queue_lo',0],      // A040 CIA timer
  ['t253_queue_hi',0],      // A041
  ['t253_first_count',0],   // A042
  ['t253_first_request',0], // A043
  ['t253_first_busy',0],    // A044
  ['t253_first_ready',0],   // A045
  ['t253_first_raster',0],  // A046
  ['t253_first_rhi',0],     // A047
  ['t253_first_lo',0],      // A048 CIA timer
  ['t253_first_hi',0]       // A049
 ];
 var out=['; TEST253 live telemetry — $A030..$A049','*=$a030'];
 for(var i=0;i<list.length;i++)out.push(list[i][0],'!byte $'+('0'+list[i][1].toString(16)).slice(-2));
 return out.join(N)+N;
}
function functions(){
 return [
  '; TEST253 CIA1 Timer A: PAL clocks (continuous 16-bit downcounter)',
  't253_init',
  ' lda #$00',' sta $dc0e',
  ' lda #$ff',' sta $dc04',' sta $dc05',
  ' lda #$11',' sta $dc0e',' rts',
  't253_begin',
  ' lda $dc04',' sta t253_begin_lo',
  ' lda $dc05',' sta t253_begin_hi',
  ' lda t250_irq_count',' sta t253_begin_irq',
  ' lda $d012',' sta t253_begin_raster',
  ' lda $d011',' and #$80',' sta t253_begin_rhi',
  ' rts',
  't253_end',
  ' lda $dc04',' sta t253_end_lo',
  ' lda $dc05',' sta t253_end_hi',
  ' lda t250_irq_count',' sta t253_end_irq',
  ' lda $d012',' sta t253_end_raster',
  ' lda $d011',' and #$80',' sta t253_end_rhi',
  ' inc t253_preps',
  ' rts',
  't253_queue',
  ' lda prep_request',' beq t253_q_done',
  ' lda $dc04',' sta t253_queue_lo',
  ' lda $dc05',' sta t253_queue_hi',
  ' lda $d012',' sta t253_queue_raster',
  ' lda $d011',' and #$80',' sta t253_queue_rhi',
  ' inc t253_queues',
  't253_q_done',' rts',
  't253_first',
  ' inc t253_first_count',
  ' lda prep_request',' sta t253_first_request',
  ' lda main_busy',' sta t253_first_busy',
  ' lda prep_ready',' sta t253_first_ready',
  ' lda $d012',' sta t253_first_raster',
  ' lda $d011',' and #$80',' sta t253_first_rhi',
  ' lda $dc04',' sta t253_first_lo',
  ' lda $dc05',' sta t253_first_hi',
  ' rts'
 ].join(N)+N;
}
E.build=function(d){
 var s=prior(d),prev=window.RICO_TEST252_LAST_BUILD||{};
 var result={version:253,selected:false,reason:'TEST252 optimized mode inactive'};
 if(!prev.selected||prev.mode!=='column-major-6502-edge-cache'){
  window.RICO_TEST253_LAST_BUILD=result;
  return s;
 }
 // Timer starts once, after the high-memory ASM builder completes.
 s=replaceOne(s,
  ' jsr build_tail249'+N+' lda #$7f',
  ' jsr build_tail249'+N+' jsr t253_init'+N+' lda #$7f');
 // Timestamp precisely around the preparation routine only.
 s=replaceOne(s,
  ' jsr prep_edges249'+N+N+' lda #$01'+N+' sta prep_ready',
  ' jsr t253_begin'+N+' jsr prep_edges249'+N+' jsr t253_end'+N+N+' lda #$01'+N+' sta prep_ready');
 // Timestamp request enqueued after plan_step (only when there is a request).
 s=replaceOne(s,' jsr plan_step'+N+'irq_group',
  ' jsr plan_step'+N+' jsr t253_queue'+N+'irq_group');
 // First raster IRQ probe is before TEST250 readiness logic, after IRQ preamble.
 s=replaceOne(s,'t250_first'+N+' lda main_busy',
  't250_first'+N+' jsr t253_first'+N+' lda main_busy');
 // Add helper ASM below kernel code, before charset, and diagnostics
 // in the unmapped $A030 region (between 250's counters and $A100).
 s=replaceOne(s,'*=$3000'+N+'charset_bank1',
  functions()+'*=$3000'+N+'charset_bank1');
 s=replaceOne(s,'*=$a100'+N+'color_upper244',
  telemetry()+'*=$a100'+N+'color_upper244');
 result={version:253,selected:true,mode:'cia1-16-bit-cycle-profiler',
  base:'TEST252 bit-for-bit screen and color copies, same raster 86/132/218',
  timer:'CIA1 Timer A continuous phi2 downcount from $FFFF',
  prepCycles:'(unsigned16(beginTimer - endTimer))',
  prepClean:'t253_begin_irq==t253_end_irq: no IRQ during prep',
  bytes:'A030..A049',read:'m a030 a049',oldRead:'m a020 a028',
  overhead:'additional JSr and CIA reads only; diagnostic may slow scroll slightly',
  status:'awaiting real 6510+VICE test'};
 window.RICO_TEST253_LAST_BUILD=result;
 console.log('[TEST253 CIA TIMER DIAGNOSTIC]',result);
 return s;
};
})();