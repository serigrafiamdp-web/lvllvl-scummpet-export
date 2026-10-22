(function(){
'use strict';
// TEST223 diagnostic only: preserve clock and rendering, measure stalls.
// VICE monitor: m 0028 002a = busy, wait, commits (8-bit wrap).
var E=window.RICO_TEST168_PRG_LARGE_MAP;if(!E)return;
var old=E.buildSource,NL=String.fromCharCode(10);
function change(s,a,b,where){a=a.join(NL);b=b.join(NL);if(s.split(a).length!==2)throw new Error('TEST223 missing '+where);return s.replace(a,b);}
E.buildSource=function(d){
 var src=old(d);if(d.type!=='up'&&d.type!=='down')return src;
 src=change(src,['main_busy=$17'],['main_busy=$17','meter_busy223=$28','meter_wait223=$29','meter_commit223=$2a'],'ZP');
 src=change(src,
  [' sta prep_request',' sta prep_ready',' sta deferred_pixels',' sta main_busy',' jsr render_front'],
  [' sta prep_request',' sta prep_ready',' sta deferred_pixels',' sta main_busy',
  ' sta meter_busy223',' sta meter_wait223',' sta meter_commit223',' jsr render_front'],'reset meters');
 src=change(src,[' lda main_busy',' bne irq_done_tick',' jsr frame_tick','irq_done_tick'],
  [' lda main_busy',' beq irq_meter_call223',' inc meter_busy223',' jmp irq_done_tick',
   'irq_meter_call223',' jsr frame_tick','irq_done_tick'],'busy IRQ');
 src=change(src,['frame_tick_fast8',' lda prep_ready',' beq frame_tick_done',' dec step_counter'],
  ['frame_tick_fast8',' lda prep_ready',' bne frame_fast_ready223',
   ' inc meter_wait223',' jmp frame_tick_done',
   'frame_fast_ready223',' dec step_counter'],'fast wait');
 src=change(src,[' lda prep_request',' beq frame_tick_timer',' lda prep_ready',' beq frame_tick_done',' jsr commit_prepared'],
  [' lda prep_request',' beq frame_tick_timer',' lda prep_ready',' bne frame_fine_ready223',
   ' inc meter_wait223',' jmp frame_tick_done',
   'frame_fine_ready223',' jsr commit_prepared'],'fine wait');
 for(var i=0;i<2;i++){
  var label=i?'commit_fast8':'commit_prepared',q=NL+label+NL;
  if(src.split(q).length!==2)throw new Error('TEST223 ambiguous label '+label);
  src=src.replace(q,NL+label+NL+' inc meter_commit223'+NL);
 }
 return src;
};
window.RICO_TEST223_VERTICAL_METERS={version:223,mode:'diagnostic',viceMonitor:'m 0028 002a',busy:'$28',wait:'$29',commits:'$2a'};
})();