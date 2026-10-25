/* RICO DEMOSCENE C64 TIMING LAB — TEST299
 * Reusable raster-safe VIC-II window emitter, independent of Bitmap engine.
 * Inspired by Trident/Fairlight's raster-aware, overlapping-handler discipline.
 * This is a POLLING scheduler for a non-IRQ renderer; not Trident's IRQ
 * macro itself. Future tests can add compatible IRQ event scheduling.
 * 
 * PAL: 312 lines × 63 cycles; visible starts near raster $30 (48).
 * Safe chosen window: raster 251–311 OR raster 0–34. The caller must
 * have completed all writes to the hidden bitmap before invoking.
 * Register flip must finish by raster ~35, before visible display begins.
 */
(function(w){
'use strict';
function emitSafeWindow(asm,opt){
 var L=asm.label,I=asm.imm,A=asm.abs,B=asm.branch,J=asm.ref;
 var prefix=(opt&&opt.prefix)||'ricoSafeVBlank';
 // Screen reads high raster bit from $D011, current low 8 from $D012.
 // High bit 1 means lines 256–311 on PAL, safely after visible display.
 L(prefix+'_wait');
 A(0xAD,0xD011);
 B(0x30,prefix+'_ready'); // BMI, raster >=256
 A(0xAD,0xD012);
 I(0xC9,251);
 B(0xB0,prefix+'_ready'); // BCS, raster 251..255
 I(0xC9,35);
 B(0x90,prefix+'_ready'); // BCC, raster 0..34
 J(0x4C,prefix+'_wait');
 L(prefix+'_ready');
}
function rawTimings(){
 return {palLines:312,cyclesPerLine:63,cyclesPerFrame:19656,
   flipBottomStart:251,flipTopEndExclusive:35,visibleStartApprox:48,
   compatibility:['Bitmap MC double buffer','future SID/IRQ scheduler'],
   irqModel:'no IRQ installed; non-IRQ mainloop + vblank guarded flip'};
}
w.RICO_C64_RASTER_LAB_299={version:'TEST299',emitSafeWindow:emitSafeWindow,timings:rawTimings()};
})(window);
