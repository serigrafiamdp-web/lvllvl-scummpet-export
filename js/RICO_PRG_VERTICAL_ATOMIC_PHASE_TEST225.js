(function(){
'use strict';
// TEST225 atomic Up/Down fine scroll for 1-7 px. Prepare buffers one
// scheduled step ahead. Keep all 8px and horizontal/diagonal paths unchanged.
var E=window.RICO_TEST168_PRG_LARGE_MAP;if(!E)return;
var prev=E.buildSource,NL=String.fromCharCode(10);
function swap(s,a,b,name){a=a.join(NL);b=b.join(NL);if(s.split(a).length!==2)throw Error('TEST225 changed '+name);return s.replace(a,b);}
var atomic=[
'phase_tick225',' lda scroll_type',' cmp #$01',' beq phase_move_up225',
' jmp phase_move_down225',
'phase_move_up225',' lda fine_pos',' sec',' sbc pixels_per_step',
' bcs phase_move_up_ok225',' jmp phase_plan225',
'phase_move_up_ok225',' sta fine_pos',' jsr apply_scroll_regs',
' jmp phase_plan225',
'phase_move_down225',' lda fine_pos',' clc',' adc pixels_per_step',
' cmp #$08',' bcc phase_move_down_ok225',' jmp phase_plan225',
'phase_move_down_ok225',' sta fine_pos',' jsr apply_scroll_regs',
' jmp phase_plan225',
'phase_plan225',' lda prep_request',' bne phase_done225',
' lda scroll_type',' cmp #$01',' beq phase_plan_up225',
'phase_plan_down225',' lda fine_pos',' clc',' adc pixels_per_step',
' cmp #$08',' bcc phase_done225',
' sec',' sbc #$08',' sta prep_target_fine',' jsr camera_prev',
' jmp phase_queue225',
'phase_plan_up225',' lda fine_pos',' sec',' sbc pixels_per_step',
' bcs phase_done225',
' clc',' adc #$08',' sta prep_target_fine',' jsr camera_next',
'phase_queue225',' lda #$01',' sta prep_request',
' lda #$00',' sta prep_ready',
'phase_done225',' rts'].join(NL)+NL;
E.buildSource=function(d){
 var s=prev(d);
 if((d.type!=='up'&&d.type!=='down')||d.pixels<1||d.pixels>7)return s;
 s=swap(s,
 [' lda pixels_per_step',' cmp #$08',' beq frame_tick_fast8',
  ' lda prep_request',' beq frame_tick_timer'],
 [' lda pixels_per_step',' cmp #$08',' beq frame_tick_fast8',
  ' jmp frame_tick_timer',' lda prep_request',' beq frame_tick_timer'],
 'clock');
 s=swap(s,
 [' lda pixels_per_step',' sta pixel_count','frame_pixel_loop',
  ' jsr step_dispatch',' dec pixel_count',' lda prep_request',
  ' beq frame_pixel_continue',' lda pixel_count',
  ' sta deferred_pixels',' rts','frame_pixel_continue',
  ' lda pixel_count',' bne frame_pixel_loop','frame_tick_done',' rts'],
 [' lda prep_request',' beq phase_apply225',' lda prep_ready',
  ' bne phase_commit225',' inc meter_wait223',' jmp frame_tick_done',
  'phase_commit225',' jsr commit_prepared',' jsr phase_plan225',
  ' jmp frame_tick_done',
  'phase_apply225',' jsr phase_tick225','frame_tick_done',' rts'],
 'pixel loop');
 s=swap(s,['step_dispatch',' lda scroll_type'],
 [atomic.trimEnd(),'step_dispatch',' lda scroll_type'],'phase routine');
 return s;
};
window.RICO_TEST225_VERTICAL_ATOMIC={version:225,previous:prev};
})();