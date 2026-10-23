(function(){
'use strict';
/* TEST248 — One raster IRQ per PAL frame, one atomic Color RAM commit.
 * TEST247 fast chars + TEST244 existing color routines UNMODIFIED.
 * Test whether waiting between raster $A0/$FA costs a full visual step.
 * Single IRQ at $68: top colors are safely shifted AFTER beam,
 * lower colors are shifted after the top phase, also behind beam.
 * Save color copy + swap; request next char preparation in same IRQ.
 * Counts / raster end stamp at $A020–$A027 (VICE m a020 a027).
 * No native SID. Mono and down directions keep original fallback.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var old=E.build,NL='\n';
function one(s,a,b){
 if(s.split(a).length!==2)throw Error('TEST248: ASM anchor mismatch ('+a.slice(0,64)+')');
 return s.replace(a,b);
}
function irqs(){
 return [
 'irq',
 ' pha',' txa',' pha',' tya',' pha',
 ' lda #$01',' sta $d019',
 ' inc t248_irq_count',
 ' lda main_busy',' bne t248_busy',
 ' lda prep_request',' beq irq_tick',
 ' lda prep_ready',' bne t248_commit',
 ' inc t248_unready',
 ' jmp irq_group',
 't248_busy',
 ' inc t248_busy_count',
 ' jmp irq_group',
 't248_commit',
 '; Both TEST244 Color RAM halves in one raster IRQ; no $FA wait',
 ' jsr color_upper244',
 ' jsr color_edges_upper244',
 ' jsr color_lower244',
 ' jsr color_edges_lower244',
 ' jsr swap_screens',
 ' lda pending_x',' sta camera_x',
 ' lda pending_y',' sta camera_y',
 ' lda next_fx',' sta fine_x',
 ' lda next_fy',' sta fine_y',
 ' jsr apply_fine',
 ' lda #$00',
 ' sta prep_request',' sta prep_ready',' sta color_stage244',
 ' inc t248_commit_count',
 ' lda $d012',' sta t248_commit_scan_lo',
 ' lda $d011',' and #$80',' sta t248_commit_scan_hi',
 ' jmp irq_tick'
 ].join(NL);
}
function metrics(){
 return [
 '*=$a020',
't248_irq_count','!byte $00',
't248_commit_count','!byte $00',
't248_busy_count','!byte $00',
't248_unready','!byte $00',
't248_commit_scan_lo','!byte $00',
't248_commit_scan_hi','!byte $00',
't248_magic','!byte $48',
't248_version','!byte $01'
 ].join(NL)+NL;
}
E.build=function(d){
 var s=old(d),v=window.RICO_TEST247_LAST_BUILD||{};
 var stats={version:248,selected:false,reason:'TEST247 char unroll not active'};
 if(!d||!v.selected||v.mode!=='safe-loader-unrolled-double-screen'||
    !d.fastRows||d.uniformColor||d.group||!d.dir||d.dir.y!==-1){
  window.RICO_TEST248_LAST_BUILD=stats;return s;
 }
 var start=NL+'irq'+NL,end=NL+'irq_tick'+NL,
     i=s.indexOf(start),j=i<0?-1:s.indexOf(end,i+start.length);
 if(i<0||j<0||s.indexOf(start,i+1)!==-1||
    s.split(end).length!==2)throw Error('TEST248 cannot isolate raster handler safely');
 s=s.slice(0,i)+NL+irqs()+s.slice(j);
 var originalRaster=' lda #$01'+NL+' sta $d01a'+NL+' lda #$fa'+NL+' sta $d012';
 s=one(s,originalRaster,
   ' lda #$01'+NL+' sta $d01a'+NL+' lda #$68'+NL+' sta $d012');
 var mem='*=$a100'+NL+'color_upper244';
 s=one(s,mem,metrics()+mem);
 stats={version:248,selected:true,mode:'one-irq-raster-chained-color',
  raster:0x68,irqPerPALFrame:1,
  color:'unaltered TEST244 upper/lower absolute copy + incoming edges',
  characters:'unaltered TEST247 high-RAM generated fast double-screen copy',
  hardwareSafety:'increasing color address order, copying behind PAL raster',
  monitor:'m a020 a027',memory:{
   IRQ:'$A020',commits:'$A021',busy:'$A022',notReady:'$A023',
   lastCommitLow:'$A024',lastCommitHigh:'$A025',
   signature:'$A026 = $48',version:'$A027 = $01'},
  status:'experimental, requires VICE before any PASS'};
 window.RICO_TEST248_LAST_BUILD=stats;
 console.log('[TEST248 ONE-IRQ DIAGONAL]',stats);
 return s;
};
window.RICO_TEST248_SINGLE_RASTER={version:248,previous:old};
})();