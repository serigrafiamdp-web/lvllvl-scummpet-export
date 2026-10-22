(function(){
'use strict';
// TEST231: prefetch next buffer while scrolling at 1px Up.
// The VIC remains in 25-row mode; only Up 1px is affected.
var E=window.RICO_TEST168_PRG_LARGE_MAP;if(!E)return;
var old=E.buildSource,NL=String.fromCharCode(10);
function patch(s,a,b){
 a=a.join(NL);b=b.join(NL);
 if(s.split(a).length!==2)throw Error('TEST231: changed assembly layout');
 return s.replace(a,b);
}
E.buildSource=function(d){
 var s=old(d);
 if(!d||d.type!=='up'||Number(d.pixels)!==1||!d.window||Number(d.window.height)!==25)return s;
 s=patch(s,
 [' lda prep_request',' beq phase_apply225',' lda prep_ready',' bne phase_commit225',' inc meter_wait223',' jmp frame_tick_done','phase_commit225'],
 [' lda prep_request',' beq phase_apply225',' lda fine_pos',' bne phase_apply225',' lda prep_ready',' bne phase_commit225',' inc meter_wait223',' jmp frame_tick_done','phase_commit225']);
 s=patch(s,
 ['phase_plan_up225',' lda fine_pos',' sec',' sbc pixels_per_step',' bcs phase_done225',' clc',' adc #$08',' sta prep_target_fine',' jsr camera_next','phase_queue225'],
 ['phase_plan_up225',' lda fine_pos',' cmp #$03',' bne phase_done225',' lda #$07',' sta prep_target_fine',' jsr camera_next','phase_queue225']);
 if(!s.includes(['apply_scroll_regs',' lda fine_pos',' and #$07',' ora #$18',' sta $d011'].join(NL)))
  throw Error('TEST231: 25-row VIC-II code unexpectedly changed');
 window.RICO_TEST231_LAST={direction:'up',pixels:1,queuedAtFine:3,committedAtFine:0,rows:25};
 return s;
};
window.RICO_TEST231_UP_1PX={version:231,previous:old};
})();