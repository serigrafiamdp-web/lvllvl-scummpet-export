(function(){
'use strict';
/*
 * TEST259: Use the actual TEST254/257 unrolled 3-band CHAR+COLOR
 * raster engine for fractional 1..7 px Up Left / Up Right diagonals,
 * any real ticksPerStep 1..65535.  The expensive cell copy is queued
 * ONLY on a wrap across the 8px fine phase.
 *
 * Source builder is invoked with virtual pixels=8 solely to select the
 * proven 6502 edge cache / raster engine.  Then three plan_step
 * constants are replaced by the user-selected pixel step (1..7),
 * and the required apply_fine call is restored on cell commit.
 *
 * IMPORTANT scheduler fix: after a late-third-band commit (~raster49)
 * that schedules its next step, the same PAL frame's first raster IRQ
 * (~86) must NOT tick the pixel planner a second time if no cell copy
 * is pending.  A one-byte flag in unallocated RAM $A06A prevents this.
 * All existing TEST258 paths and TEST257 8px are source-identical.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var old=E.build,N='\n';
function once(s,a,b,label){
 if(s.split(a).length!==2)throw Error('TEST259 '+label+': ambiguous/missing ASM anchor');
 return s.replace(a,b);
}
function imm(p){return '$'+p.toString(16).padStart(2,'0');}
E.build=function(d){
 var status={version:259,selected:false,
   reason:'fractional 1..7px Up diagonal requires a matching TEST257 engine'};
 if(!d||!d.dir||d.dir.y!==-1||Math.abs(d.dir.x)!==1||
    !Number.isInteger(d.pixels)||d.pixels<1||d.pixels>7||
    !Number.isInteger(d.ticks)||d.ticks<1||d.ticks>65535){
   var out=old(d);window.RICO_TEST259_LAST_BUILD=status;return out;
 }
 var proxy=Object.assign({},d,{pixels:8});
 var accelerated=old(proxy),previous=window.RICO_TEST257_LAST_BUILD||{};
 if(!previous.selected||previous.mode!=='vic-ii-stable-fine-scroll-registers'){
   status.reason='8px base unavailable due to RAM, SID, group, map, or colors; keep original compatible route';
   var fallback=old(d);
   window.RICO_TEST259_LAST_BUILD=status;return fallback;
 }
 var s=accelerated;
 // 6502 fine phase logic is identical to original TEST196 except the
 // immediate pixel amount.  NEVER change SBC/ADC #$08 for wrapping.
 var xFrom=d.dir.x===-1?
  ' lda fine_x'+N+' sec'+N+' sbc #$08'+N+' bcs x_fine':
  ' lda fine_x'+N+' clc'+N+' adc #$08'+N+' cmp #$08';
 var xTo=d.dir.x===-1?
  ' lda fine_x'+N+' sec'+N+' sbc #'+imm(d.pixels)+N+' bcs x_fine':
  ' lda fine_x'+N+' clc'+N+' adc #'+imm(d.pixels)+N+' cmp #$08';
 s=once(s,xFrom,xTo,'x pixel plan');
 s=once(s,' lda fine_y'+N+' sec'+N+' sbc #$08'+N+' bcs y_fine',
   ' lda fine_y'+N+' sec'+N+' sbc #'+imm(d.pixels)+N+' bcs y_fine','y pixel plan');
 // TEST257 correctly removed this write for full 8px, but fractional
 // crossing changes the VIC fine phase and MUST restore it on commit.
 s=once(s,' lda next_fy'+N+' sta fine_y'+N+' lda #$00'+N+' sta prep_request',
  ' lda next_fy'+N+' sta fine_y'+N+' jsr apply_fine'+N+' lda #$00'+N+' sta prep_request',
  'fractional cell commit fine phase');
 // Raster phase-2 (bottom copy finishing at next-frame raster ~49)
 // already calls irq_tick. Ensure phase-0 at raster ~86 doesn't
 // call irq_tick *again* for the same PAL frame if there was no cell
 // crossing triggered by the earlier tick.
 s=once(s,' lda prep_request'+N+' beq irq_tick'+N+' lda prep_ready',
  ' lda prep_request'+N+' beq t259_idle_first'+N+' lda prep_ready',
  'no-pending first IRQ');
 s=once(s,'t250_busy'+N+' inc t250_busy_count',
  't259_idle_first'+N+
  ' lda t259_skip_first'+N+
  ' beq irq_tick'+N+
  ' lda #$00'+N+' sta t259_skip_first'+N+
  ' jmp irq_group'+N+
  't250_busy'+N+' inc t250_busy_count',
  'once-per-frame idle first');
 s=once(s,' sta t250_end_hi'+N+' jmp irq_tick',
  ' sta t250_end_hi'+N+
  ' lda #$01'+N+' sta t259_skip_first'+N+
  ' jmp irq_tick','third raster one-tick guard');
 // $A06A is outside TEST250 counters A020..28, TEST253 profiler
 // A030..49, and the experimental (not present) TEST256 A050..61.
 s=once(s,'*=$a100'+N+'color_upper244',
  '*=$a06a'+N+'t259_skip_first'+N+'!byte $00'+N+
  '*=$a100'+N+'color_upper244','isolated timing flag');
 if(!s.includes(' jsr update_d018'+N+' jsr apply_fine'))
   throw Error('TEST259 mandatory startup VIC register setup missing');
 status={version:259,selected:true,mode:'up-diagonal-fractional-3band-raster',
   direction:d.direction,pixels:d.pixels,ticks:d.ticks,bank:d.bank,
   base:'TEST257/254 unrolled 6502 char + 16-color copy',
   raster:[86,132,218],
   phases:'VIC fine phase moves every requested tick; full cell copy only after 8px carry',
   phase2:'apply_fine restored only at 1..7px boundary',
   pacing:'A06A suppresses repeated planning in first raster after phase-2 tick',
   fallback:'all other directions/pixel sizes untouched',
   pass:'EXPERIMENTAL until PAL VICE visual tests'};
 window.RICO_TEST259_LAST_BUILD=status;
 console.log('[TEST259 UP DIAGONAL FRACTIONAL FAST ASM]',status);
 return s;
};
})();