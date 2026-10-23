(function(){
'use strict';
/* TEST256: raster-seam telemetry. Based on frozen MASTER 23 OCT / TEST254.
 * Do NOT change renderer, row copies, color masks, CIATimer, raster slots,
 * or frame cadence. Diagnostic-only RAM: $A050..$A061.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var original=E.build,N='\n';
function only(s,a,b){
 if(s.split(a).length!==2)throw Error('TEST256 unexpected ASM anchor: '+a.slice(0,70));
 return s.replace(a,b);
}
function mark(label,start,end,max,late,threshold,inc){
 var a=[];
 if(start)a.push(' lda $d012',' sta '+start);
 if(inc)a.push(' inc '+inc);
 if(end){
  a.push(' lda $d012',' sta '+end,
   ' cmp '+max,' bcc '+label+'_nmax',' sta '+max,label+'_nmax',
   ' cmp #$'+threshold.toString(16).padStart(2,'0'),
   ' bcc '+label+'_ok',' inc '+late,label+'_ok');
 }
 return a.join(N);
}
function data(){
 const fields=[
  ['t256_signature',0x56],['t256_version',1],
  ['t256_first_begin',0],['t256_top_end',0],
  ['t256_middle_begin',0],['t256_middle_end',0],
  ['t256_last_begin',0],['t256_last_end',0],
  ['t256_first_count',0],['t256_middle_count',0],['t256_last_count',0],
  ['t256_top_max',0],['t256_middle_max',0],['t256_last_max',0],
  ['t256_top_late',0],['t256_middle_late',0],['t256_last_late',0],
  ['t256_no_request',0]
 ];
 let out=['; TEST256 raster slots and late-phase counters, independent of TEST253','*=$a050'];
 for(const [lab,v] of fields)out.push(lab,'!byte $'+v.toString(16).padStart(2,'0'));
 return out.join(N)+N;
}
E.build=function(d){
 let s=original(d),prev=window.RICO_TEST254_LAST_BUILD||{};
 let info={version:256,selected:false,reason:'TEST254 path not selected'};
 if(!prev.selected||prev.mode!=='6502-unrolled-direct-edge-preparation'){
  window.RICO_TEST256_LAST_BUILD=info;
  return s;
 }
 s=only(s,'t250_first'+N+' jsr t253_first',
   't250_first'+N+mark('topfirst256','t256_first_begin',null,null,null,null,'t256_first_count')+
   N+' jsr t253_first');
 s=only(s,' jsr char_color_top249'+N+' jsr apply_edges249'+N+' lda #$01',
   ' jsr char_color_top249'+N+' jsr apply_edges249'+N+
   mark('t256_top',null,'t256_top_end','t256_top_max','t256_top_late',132)+
   N+' lda #$01');
 s=only(s,'t250_middle'+N+' lda #$da',
   't250_middle'+N+mark('middlestart256','t256_middle_begin',null,null,null,null,'t256_middle_count')+
   N+' lda #$da');
 s=only(s,' jsr apply_edges_mid250'+N+' lda #$02',
   ' jsr apply_edges_mid250'+N+
   mark('t256_mid',null,'t256_middle_end','t256_middle_max','t256_middle_late',218)+
   N+' lda #$02');
 s=only(s,'t250_last'+N+' lda #$56',
   't250_last'+N+mark('laststart256','t256_last_begin',null,null,null,null,'t256_last_count')+
   N+' lda #$56');
 s=only(s,' jsr apply_edges_bottom250'+N+' lda pending_x',
   ' jsr apply_edges_bottom250'+N+
   mark('t256_bottom',null,'t256_last_end','t256_last_max','t256_last_late',86)+
   N+' lda pending_x');
 // Only the unusual first-IRQ idle path is intercepted; normal prepared path
 // is unchanged except its read-only diagnostic bookkeeping.
 s=only(s,' lda prep_request'+N+' beq irq_tick'+N+' lda prep_ready',
   ' lda prep_request'+N+' beq t256_no_req'+N+' lda prep_ready');
 s=only(s,'t250_not_ready'+N+' inc t250_wait_count'+N+' jmp irq_group'+N+'t250_middle',
   't250_not_ready'+N+' inc t250_wait_count'+N+' jmp irq_group'+N+
   't256_no_req'+N+' inc t256_no_request'+N+' jmp irq_tick'+N+'t250_middle');
 s=only(s,'*=$a100'+N+'color_upper244',data()+'*=$a100'+N+'color_upper244');
 info={version:256,selected:true,mode:'nonvisual-three-band-raster-probe',
  from:'MASTER VIERNES 23 OCT / TEST254',
  slots:[86,132,218],graphicalCode:'UNCHANGED (same char/color LDA/STA and buffers)',
  reading:'m a050 a061',
  existingReading:'m a020 a028',
  detailed:'last rasters A052..A057, attempts A058..A05A, maxima A05B..A05D, late counts A05E..A060',
  status:'DIAGNOSTIC ONLY, VICE required; no claimed improvement'};
 window.RICO_TEST256_LAST_BUILD=info;
 console.log('[TEST256 RASTER SEAM DIAGNOSTICS]',info);
 return s;
};
})();