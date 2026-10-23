(function(){
'use strict';
/* TEST257: do not rewrite VIC fine scroll registers at the bottom of every
 * 8px raster-chase update. Both fine_x and fine_y remain fixed for every
 * movement (0 for positive direction, 7 for negative direction).
 * One-time initialization still programs $D011/$D016 normally.
 * Remove exactly one redundant JSR inside t250_last. Preserve byte-for-byte
 * all CHAR/COLOR copies, 3-band IRQ schedule and CPU profiler of TEST254.
 */
var E=window.RICO_TEST196_DIAGONAL;
if(!E||!E.build)return;
var old=E.build,NL='\n';
E.build=function(d){
 var asm=old(d),prev=window.RICO_TEST254_LAST_BUILD||{};
 var stat={version:257,selected:false,reason:'TEST254 fast diagonal not selected'};
 if(!d||!prev.selected||prev.mode!=='6502-unrolled-direct-edge-preparation'||d.pixels!==8){
   window.RICO_TEST257_LAST_BUILD=stat;return asm;
 }
 if(!d.dir||![1,-1].includes(d.dir.x)||![1,-1].includes(d.dir.y)){
   throw Error('TEST257 requires a well-defined diagonal direction');
 }
 // A 6502 8px plan step always restores initial low-three-bit fine
 // coordinates: Up/Left dir=-1 -> 7, Down/Right dir=+1 -> 0.
 // Keep logical state assignments, remove only the redundant I/O write.
 var l=NL+'t250_last'+NL, i=asm.indexOf(l);
 var e=i<0?-1:asm.indexOf(NL+'irq_tick'+NL,i);
 if(i<0||e<0||asm.split(l).length!==2)
   throw Error('TEST257 could not uniquely identify the last raster phase');
 var phase=asm.slice(i,e),target=' sta fine_y'+NL+' jsr apply_fine'+NL+' lda #$00';
 if(phase.split(target).length!==2)
   throw Error('TEST257 unexpected last-phase fine-scroll pattern');
 if(phase.indexOf(' jsr char_color_bottom250')<0||
    phase.indexOf(' jsr apply_edges_bottom250')<0)
   throw Error('TEST257 last-phase rendering not intact');
 phase=phase.replace(target,' sta fine_y'+NL+' lda #$00');
 asm=asm.slice(0,i)+phase+asm.slice(e);
 // Confirm the one-time initialization and fine routine remain present.
 if(asm.indexOf(' jsr update_d018'+NL+' jsr apply_fine')<0||
    asm.indexOf(NL+'apply_fine'+NL)<0)
   throw Error('TEST257 initial fine scroll setup missing');
 stat={
   version:257,selected:true,mode:'vic-ii-stable-fine-scroll-registers',
   from:'MASTER 23 OCT / VICE-PASS TEST254',
   initialFineX:d.dir.x===-1?7:0,initialFineY:d.dir.y===-1?7:0,
   oneTimeVICWrite:'startup jsr apply_fine unchanged',
   removed:'one repeated jsr apply_fine in t250_last, no repetitive $d011/$d016 writes',
   rasterSlots:[86,132,218],
   renderAndColor:'unchanged',
   ciaProfiler:'TEST253 maintained identically',
   info:'pure visual-register stability; no 50 FPS claim',
   validation:'6502 cycle invariants tested; VICE verification needed',
   monitor:'m a020 a028 and m a030 a049'
 };
 window.RICO_TEST257_LAST_BUILD=stat;
 console.log('[TEST257 VIC-II FINE REGISTER STABILITY]',stat);
 return asm;
};
})();