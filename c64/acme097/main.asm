; RICO TEST70 - WINDOW-DRIVEN MAP SCROLL runtime
; 40x25 source; each frame scrolls only its Window X/Y/W/H rectangle.
; Single-frame duration rollover preserves scroll state; duration is 16-bit up to 1024 in UI.
*=$0801
!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00 ; 10 SYS8192
*=$2000
current_frame=$02
frame_remaining=$03
frame_remaining_hi=$12
step_counter=$04
ticks_per_step=$05
pixels_per_step=$06
scroll_type=$07
fine_pos=$08
pixel_count=$09
src_lo=$0a
src_hi=$0b
dst_lo=$0c
dst_hi=$0d
tmp_byte=$0e
front_hi=$0f
back_hi=$10
charset_bits=$11
ping_pos_lo=$13
ping_pos_hi=$14
ping_reverse=$15
ping_char=$16
copy_count=$17
blank_char=$18
prep_request=$19
prep_ready=$1a
prep_kind=$1b
prep_target_fine=$1c
deferred_pixels=$1d
transition_request=$1e
transition_ready=$1f
main_busy=$20
active_fg=$21
pending_fg=$22
transition_blank=$23
window_w=$24
window_h=$25
window_off_lo=$26
window_off_hi=$27
window_max_x_lo=$28
window_max_x_hi=$29
window_max_y_lo=$2a
window_max_y_hi=$2b

start
 sei
 lda #$35
 sta $01
 lda $dd00
 ora #$03
 sta $dd00
 lda #$7f
 sta $dc0d
 sta $dd0d
 lda $dc0d
 lda $dd0d
 lda #$ff
 sta blank_char
 jsr fill_blank_stage
 lda #$00
 sta prep_request
 sta prep_ready
 sta prep_kind
 sta prep_target_fine
 sta deferred_pixels
 sta transition_request
 sta transition_ready
 sta main_busy
 sta transition_blank
 sta current_frame
 jsr load_frame
 lda #$01
 sta $d01a
 lda #$fa
 sta $d012
 lda #<irq
 sta $fffe
 lda #>irq
 sta $ffff
 cli
main_loop
 lda transition_request
 beq main_check_prep
 lda transition_ready
 bne main_loop
 lda #$01
 sta main_busy
 jsr load_frame_hidden
 lda #$00
 sta main_busy
 lda #$01
 sta transition_ready
 jmp main_loop
main_check_prep
 lda prep_request
 beq main_loop
 lda prep_ready
 bne main_loop
 lda #$01
 sta main_busy
 jsr prepare_requested
 lda #$00
 sta main_busy
 lda #$01
 sta prep_ready
 jmp main_loop

irq
 pha
 txa
 pha
 tya
 pha
 lda #$01
 sta $d019
 lda main_busy
 bne irq_skip_tick
 jsr frame_tick
irq_skip_tick
 pla
 tay
 pla
 tax
 pla
 rti

frame_tick
 lda transition_request
 beq frame_tick_timer
 lda transition_ready
 beq frame_tick_done
 jsr commit_hidden_frame
 rts
frame_tick_timer
 lda frame_remaining
 bne frame_tick_dec_low
 lda frame_remaining_hi
 beq frame_tick_next
 dec frame_remaining_hi
frame_tick_dec_low
 dec frame_remaining
 lda frame_remaining
 ora frame_remaining_hi
 bne frame_tick_prep
frame_tick_next
 jsr request_next_frame
 rts
frame_tick_prep
frame_tick_scroll
 lda scroll_type
 beq frame_tick_done
 dec step_counter
 bne frame_tick_done
 lda prep_request
 beq frame_tick_new_step
 lda prep_ready
 beq frame_tick_prep_wait
 lda ticks_per_step
 sta step_counter
 jsr commit_prepared
 rts
frame_tick_prep_wait
 lda #$01
 sta step_counter
 rts
frame_tick_new_step
 lda ticks_per_step
 sta step_counter
 lda pixels_per_step
 sta pixel_count
frame_pixel_loop
 jsr step_dispatch
 dec pixel_count
 lda prep_request
 beq frame_pixel_continue
 lda pixel_count
 sta deferred_pixels
 beq frame_pixel_defer_done
 lda #$01
 sta step_counter
frame_pixel_defer_done
 rts
frame_pixel_continue
 lda pixel_count
 bne frame_pixel_loop
frame_tick_done
 rts

request_next_frame
 inc current_frame
 lda current_frame
 cmp #$02
 bcc request_next_index_ok
 lda #$00
 sta current_frame
request_next_index_ok
 lda #$00
 sta prep_request
 sta prep_ready
 sta prep_kind
 sta deferred_pixels
 sta transition_ready
 sta transition_blank
 ldx current_frame
 lda fg_table,x
 sta pending_fg
 cmp active_fg
 beq request_next_no_blank
 lda #$01
 sta transition_blank
 jsr show_blank_stage
request_next_no_blank
 lda #$01
 sta transition_request
 rts

load_window_geometry
 ldx current_frame
 lda window_w_table,x
 sta window_w
 lda window_h_table,x
 sta window_h
 lda window_off_lo_table,x
 sta window_off_lo
 lda window_off_hi_table,x
 sta window_off_hi
 lda max_x_lo_table,x
 sta window_max_x_lo
 lda max_x_hi_table,x
 sta window_max_x_hi
 lda max_y_lo_table,x
 sta window_max_y_lo
 lda max_y_hi_table,x
 sta window_max_y_hi
 rts

load_frame
 ldx current_frame
 lda duration_lo_table,x
 sta frame_remaining
 lda duration_hi_table,x
 sta frame_remaining_hi
 lda type_table,x
 sta scroll_type
 lda ticks_table,x
 sta ticks_per_step
 sta step_counter
 lda pixels_table,x
 sta pixels_per_step
 lda #$00
 sta ping_pos_lo
 sta ping_pos_hi
 sta ping_reverse
 sta ping_char
 lda #$ff
 sta blank_char
 lda bank_table,x
 sta charset_bits
 jsr load_window_geometry
 lda scroll_type
 cmp #$0d
 bcc load_no_movein_stage
 cmp #$11
 bcs load_no_movein_stage
 ldx current_frame
 lda bg_table,x
 sta $d021
 lda border_table,x
 sta $d020
 jsr show_blank_stage
load_no_movein_stage
 ldx current_frame
 lda frame_ptr_lo,x
 sta src_lo
 lda frame_ptr_hi,x
 sta src_hi
 jsr copy_frame_to_screens
 lda #$04
 sta front_hi
 lda #$08
 sta back_hi
 ldx current_frame
 lda bg_table,x
 sta $d021
 lda border_table,x
 sta $d020
 lda fg_table,x
 sta active_fg
 sta pending_fg
 jsr fill_color_ram
 lda scroll_type
 cmp #$0d
 bcc load_no_movein_init
 cmp #$11
 bcs load_no_movein_init
 jsr init_movein_position
load_no_movein_init
 jsr update_d018
 lda scroll_type
 cmp #$01
 beq load_start_seven
 cmp #$03
 beq load_start_seven
 cmp #$05
 beq load_start_seven
 cmp #$07
 beq load_start_seven
 cmp #$09
 beq load_start_seven
 cmp #$0b
 beq load_start_seven
 cmp #$0d
 beq load_start_seven
 cmp #$0f
 beq load_start_seven
 lda #$00
 sta fine_pos
 jmp load_apply_regs
load_start_seven
 lda #$07
 sta fine_pos
load_apply_regs
 jsr apply_scroll_regs
 rts

set_ping_to_window_max
 lda scroll_type
 cmp #$0f
 bcs set_ping_max_vertical
 lda window_max_x_lo
 sta ping_pos_lo
 lda window_max_x_hi
 sta ping_pos_hi
 rts
set_ping_max_vertical
 lda window_max_y_lo
 sta ping_pos_lo
 lda window_max_y_hi
 sta ping_pos_hi
 rts

init_movein_position
 jsr set_ping_to_window_max
 jsr prepare_ping_screen
 jsr swap_screens
 rts

load_frame_hidden
 ldx current_frame
 lda duration_lo_table,x
 sta frame_remaining
 lda duration_hi_table,x
 sta frame_remaining_hi
 lda type_table,x
 sta scroll_type
 lda ticks_table,x
 sta ticks_per_step
 sta step_counter
 lda pixels_table,x
 sta pixels_per_step
 lda #$00
 sta ping_pos_lo
 sta ping_pos_hi
 sta ping_reverse
 sta ping_char
 lda bank_table,x
 sta charset_bits
 jsr load_window_geometry
 lda fg_table,x
 sta pending_fg
 lda transition_blank
 beq hidden_skip_color_fill
 lda pending_fg
 jsr fill_color_ram
hidden_skip_color_fill
 lda scroll_type
 cmp #$0d
 bcc hidden_regular_frame
 cmp #$11
 bcs hidden_regular_frame
 jsr set_src_frame
 jsr copy_frame_to_back
 jsr set_ping_to_window_max
 jsr prepare_ping_screen
 jmp hidden_set_fine
hidden_regular_frame
 jsr set_src_frame
 jsr copy_frame_to_back
hidden_set_fine
 lda scroll_type
 cmp #$01
 beq hidden_start_seven
 cmp #$03
 beq hidden_start_seven
 cmp #$05
 beq hidden_start_seven
 cmp #$07
 beq hidden_start_seven
 cmp #$09
 beq hidden_start_seven
 cmp #$0b
 beq hidden_start_seven
 cmp #$0d
 beq hidden_start_seven
 cmp #$0f
 beq hidden_start_seven
 lda #$00
 sta fine_pos
 rts
hidden_start_seven
 lda #$07
 sta fine_pos
 rts

commit_hidden_frame
 jsr swap_screen_ptrs
 ldx current_frame
 lda bg_table,x
 sta $d021
 lda border_table,x
 sta $d020
 lda pending_fg
 sta active_fg
 jsr update_d018
 jsr apply_scroll_regs
 lda #$00
 sta transition_request
 sta transition_ready
 sta transition_blank
 rts

copy_frame_to_back
 jsr set_dst_back
 ldy #$00
copy_back_p0
 lda (src_lo),y
 sta (dst_lo),y
 iny
 bne copy_back_p0
 inc src_hi
 inc dst_hi
 ldy #$00
copy_back_p1
 lda (src_lo),y
 sta (dst_lo),y
 iny
 bne copy_back_p1
 inc src_hi
 inc dst_hi
 ldy #$00
copy_back_p2
 lda (src_lo),y
 sta (dst_lo),y
 iny
 bne copy_back_p2
 inc src_hi
 inc dst_hi
 ldy #$00
copy_back_p3
 lda (src_lo),y
 sta (dst_lo),y
 iny
 cpy #$e8
 bne copy_back_p3
 rts

copy_frame_to_screens
 ldy #$00
copy_frame_p0
 lda (src_lo),y
 sta $0400,y
 sta $0800,y
 iny
 bne copy_frame_p0
 inc src_hi
 ldy #$00
copy_frame_p1
 lda (src_lo),y
 sta $0500,y
 sta $0900,y
 iny
 bne copy_frame_p1
 inc src_hi
 ldy #$00
copy_frame_p2
 lda (src_lo),y
 sta $0600,y
 sta $0a00,y
 iny
 bne copy_frame_p2
 inc src_hi
 ldy #$00
copy_frame_p3
 lda (src_lo),y
 sta $0700,y
 sta $0b00,y
 iny
 cpy #$e8
 bne copy_frame_p3
 rts

fill_blank_stage
 ldx #$00
 lda blank_char
fill_blank_stage_loop
 sta $0c00,x
 sta $0d00,x
 sta $0e00,x
 sta $0f00,x
 inx
 bne fill_blank_stage_loop
 rts

show_blank_stage
 lda #$30
 ora charset_bits
 sta $d018
 rts

fill_color_ram
 ldx #$00
fill_color_loop
 sta $d800,x
 sta $d900,x
 sta $da00,x
 sta $db00,x
 inx
 bne fill_color_loop
 rts

update_d018
 lda front_hi
 cmp #$04
 bne d018_screen_0800
 lda #$10
 jmp d018_add_charset
d018_screen_0800
 lda #$20
d018_add_charset
 ora charset_bits
 sta $d018
 rts

apply_scroll_regs
 ldx current_frame
 lda d011_base_table,x
 sta tmp_byte
 lda scroll_type
 cmp #$01
 beq apply_window_vertical
 cmp #$02
 beq apply_window_vertical
 cmp #$07
 beq apply_window_vertical
 cmp #$08
 beq apply_window_vertical
 cmp #$0b
 beq apply_window_vertical
 cmp #$0c
 beq apply_window_vertical
 cmp #$0f
 beq apply_window_vertical
 cmp #$10
 beq apply_window_vertical
 cmp #$03
 beq apply_window_horizontal
 cmp #$04
 beq apply_window_horizontal
 cmp #$05
 beq apply_window_horizontal
 cmp #$06
 beq apply_window_horizontal
 cmp #$09
 beq apply_window_horizontal
 cmp #$0a
 beq apply_window_horizontal
 cmp #$0d
 beq apply_window_horizontal
 cmp #$0e
 beq apply_window_horizontal
 lda tmp_byte
 sta $d011
 ldx current_frame
 lda d016_base_table,x
 sta $d016
 rts
apply_window_vertical
 lda fine_pos
 and #$07
 ora tmp_byte
 sta $d011
 ldx current_frame
 lda d016_base_table,x
 sta $d016
 rts
apply_window_horizontal
 lda tmp_byte
 sta $d011
 lda fine_pos
 and #$07
 sta tmp_byte
 ldx current_frame
 lda d016_base_table,x
 ora tmp_byte
 sta $d016
 rts

prepare_requested
 lda prep_kind
 cmp #$01
 bne prep_req_not_up
 jmp prepare_up
prep_req_not_up
 cmp #$02
 bne prep_req_not_down
 jmp prepare_down
prep_req_not_down
 cmp #$03
 bne prep_req_not_left
 jmp prepare_left
prep_req_not_left
 cmp #$04
 bne prep_req_ping
 jmp prepare_right
prep_req_ping
 jmp prepare_ping_screen

commit_prepared
 jsr swap_screens
 lda prep_target_fine
 sta fine_pos
 jsr apply_scroll_regs
 lda #$00
 sta prep_request
 sta prep_ready
 sta prep_kind
 lda deferred_pixels
 beq commit_prepared_done
 sta pixel_count
 lda #$00
 sta deferred_pixels
commit_deferred_loop
 jsr step_dispatch
 dec pixel_count
 lda prep_request
 bne commit_prepared_done
 lda pixel_count
 bne commit_deferred_loop
commit_prepared_done
 rts

request_prepare
 sta prep_kind
 stx prep_target_fine
 lda #$01
 sta prep_request
 lda #$00
 sta prep_ready
 rts

request_ping_prepare
 lda scroll_type
 cmp #$09
 bcc request_ping_pingpong
 cmp #$0d
 bcc request_ping_forward
 jmp request_ping_reverse
request_ping_pingpong
 lda ping_reverse
 bne request_ping_reverse
request_ping_forward
 jsr ping_at_max
 bcs request_ping_none
 jsr inc_ping_pos
 jmp request_ping_set
request_ping_reverse
 lda ping_pos_lo
 ora ping_pos_hi
 beq request_ping_none
 jsr dec_ping_pos
request_ping_set
 lda #$05
 jmp request_prepare
request_ping_none
 rts

step_dispatch
 lda scroll_type
 cmp #$01
 bne step_not_up
 jmp step_up
step_not_up
 cmp #$02
 bne step_not_down
 jmp step_down
step_not_down
 cmp #$03
 bne step_not_left
 jmp step_left
step_not_left
 cmp #$04
 bne step_check_ping
 jmp step_right
step_check_ping
 cmp #$05
 bcc step_dispatch_done
 cmp #$09
 bcc step_ping_dispatch
 cmp #$0d
 bcc step_moveout_dispatch
 cmp #$11
 bcs step_dispatch_done
 jmp movein_step
step_moveout_dispatch
 jmp move_step
step_ping_dispatch
 jmp ping_step
step_dispatch_done
 rts

step_up
 lda fine_pos
 beq step_up_wait
 dec fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 bne step_up_done
 lda #$01
 ldx #$07
 jsr request_prepare
step_up_done
 rts
step_up_wait
 rts
step_down
 lda fine_pos
 cmp #$07
 beq step_down_wait
 inc fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 cmp #$07
 bne step_down_done
 lda #$02
 ldx #$00
 jsr request_prepare
step_down_done
 rts
step_down_wait
 rts
step_left
 lda fine_pos
 beq step_left_wait
 dec fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 bne step_left_done
 lda #$03
 ldx #$07
 jsr request_prepare
step_left_done
 rts
step_left_wait
 rts
step_right
 lda fine_pos
 cmp #$07
 beq step_right_wait
 inc fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 cmp #$07
 bne step_right_done
 lda #$04
 ldx #$00
 jsr request_prepare
step_right_done
 rts
step_right_wait
 rts

ping_step
 lda ping_reverse
 bne ping_reverse_path
 jsr ping_at_max
 bcc ping_forward_move
 lda #$01
 sta ping_reverse
 jmp ping_reverse_move
ping_forward_move
 jsr inc_ping_pos
 jmp ping_dispatch_forward
ping_reverse_path
 lda ping_pos_lo
 ora ping_pos_hi
 bne ping_reverse_move
 lda #$00
 sta ping_reverse
 jmp ping_forward_move
ping_reverse_move
 jsr dec_ping_pos
 jmp ping_dispatch_reverse

move_step
 jsr ping_at_max
 bcs move_step_done
 jsr inc_ping_pos
 lda scroll_type
 cmp #$09
 bne move_not_left
 jmp ping_step_left
move_not_left
 cmp #$0a
 bne move_not_right
 jmp ping_step_right
move_not_right
 cmp #$0b
 bne move_down
 jmp ping_step_up
move_down
 jmp ping_step_down
move_step_done
 rts

movein_step
 lda ping_pos_lo
 ora ping_pos_hi
 beq movein_step_done
 jsr dec_ping_pos
 lda scroll_type
 cmp #$0d
 bne movein_not_left
 jmp ping_step_left
movein_not_left
 cmp #$0e
 bne movein_not_right
 jmp ping_step_right
movein_not_right
 cmp #$0f
 bne movein_down
 jmp ping_step_up
movein_down
 jmp ping_step_down
movein_step_done
 rts

ping_at_max
 lda scroll_type
 cmp #$07
 beq ping_max_vertical
 cmp #$08
 beq ping_max_vertical
 cmp #$0b
 beq ping_max_vertical
 cmp #$0c
 beq ping_max_vertical
 cmp #$0f
 beq ping_max_vertical
 cmp #$10
 beq ping_max_vertical
 lda ping_pos_hi
 cmp window_max_x_hi
 bne ping_max_no
 lda ping_pos_lo
 cmp window_max_x_lo
 bne ping_max_no
 sec
 rts
ping_max_vertical
 lda ping_pos_hi
 cmp window_max_y_hi
 bne ping_max_no
 lda ping_pos_lo
 cmp window_max_y_lo
 bne ping_max_no
 sec
 rts
ping_max_no
 clc
 rts

inc_ping_pos
 inc ping_pos_lo
 bne inc_ping_done
 inc ping_pos_hi
inc_ping_done
 rts
dec_ping_pos
 lda ping_pos_lo
 bne dec_ping_low
 dec ping_pos_hi
dec_ping_low
 dec ping_pos_lo
 rts

ping_dispatch_forward
 lda scroll_type
 cmp #$05
 bne ping_fwd_not_left
 jmp ping_step_left
ping_fwd_not_left
 cmp #$06
 bne ping_fwd_not_right
 jmp ping_step_right
ping_fwd_not_right
 cmp #$07
 bne ping_fwd_down
 jmp ping_step_up
ping_fwd_down
 jmp ping_step_down

ping_dispatch_reverse
 lda scroll_type
 cmp #$05
 bne ping_rev_not_left
 jmp ping_step_right
ping_rev_not_left
 cmp #$06
 bne ping_rev_not_right
 jmp ping_step_left
ping_rev_not_right
 cmp #$07
 bne ping_rev_down
 jmp ping_step_down
ping_rev_down
 jmp ping_step_up

ping_step_left
 lda fine_pos
 beq ping_left_wait
 dec fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 bne ping_left_done
 ldx #$07
 jsr request_ping_prepare
ping_left_done
 rts
ping_left_wait
 rts
ping_step_right
 lda fine_pos
 cmp #$07
 beq ping_right_wait
 inc fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 cmp #$07
 bne ping_right_done
 ldx #$00
 jsr request_ping_prepare
ping_right_done
 rts
ping_right_wait
 rts
ping_step_up
 lda fine_pos
 beq ping_up_wait
 dec fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 bne ping_up_done
 ldx #$07
 jsr request_ping_prepare
ping_up_done
 rts
ping_up_wait
 rts
ping_step_down
 lda fine_pos
 cmp #$07
 beq ping_down_wait
 inc fine_pos
 jsr apply_scroll_regs
 lda fine_pos
 cmp #$07
 bne ping_down_done
 ldx #$00
 jsr request_ping_prepare
ping_down_done
 rts
ping_down_wait
 rts

swap_screen_ptrs
 lda front_hi
 pha
 lda back_hi
 sta front_hi
 pla
 sta back_hi
 rts

swap_screens
 jsr swap_screen_ptrs
 jsr update_d018
 rts

set_src_front
 lda #$00
 sta src_lo
 lda front_hi
 sta src_hi
 rts
set_dst_back
 lda #$00
 sta dst_lo
 lda back_hi
 sta dst_hi
 rts
set_src_front_window
 lda window_off_lo
 sta src_lo
 lda front_hi
 clc
 adc window_off_hi
 sta src_hi
 rts
set_dst_back_window
 lda window_off_lo
 sta dst_lo
 lda back_hi
 clc
 adc window_off_hi
 sta dst_hi
 rts
add40_src
 clc
 lda src_lo
 adc #$28
 sta src_lo
 lda src_hi
 adc #$00
 sta src_hi
 rts
add40_dst
 clc
 lda dst_lo
 adc #$28
 sta dst_lo
 lda dst_hi
 adc #$00
 sta dst_hi
 rts
inc_src
 inc src_lo
 bne inc_src_done
 inc src_hi
inc_src_done
 rts
dec_src
 lda src_lo
 bne dec_src_low
 dec src_hi
dec_src_low
 dec src_lo
 rts
inc_dst
 inc dst_lo
 bne inc_dst_done
 inc dst_hi
inc_dst_done
 rts
dec_dst
 lda dst_lo
 bne dec_dst_low
 dec dst_hi
dec_dst_low
 dec dst_lo
 rts
copy_window
 ldy #$00
copy_window_loop
 lda (src_lo),y
 sta (dst_lo),y
 iny
 cpy window_w
 bne copy_window_loop
 rts
copy_count_bytes
 lda copy_count
 beq copy_count_bytes_done
 ldy #$00
copy_count_bytes_loop
 lda (src_lo),y
 sta (dst_lo),y
 iny
 cpy copy_count
 bne copy_count_bytes_loop
copy_count_bytes_done
 rts

set_src_frame
 ldx current_frame
 lda frame_ptr_lo,x
 sta src_lo
 lda frame_ptr_hi,x
 sta src_hi
 rts
set_src_frame_window
 jsr set_src_frame
 clc
 lda src_lo
 adc window_off_lo
 sta src_lo
 lda src_hi
 adc window_off_hi
 sta src_hi
 rts
add_ping_src
 clc
 lda src_lo
 adc ping_char
 sta src_lo
 lda src_hi
 adc #$00
 sta src_hi
 rts
add_ping_dst
 clc
 lda dst_lo
 adc ping_char
 sta dst_lo
 lda dst_hi
 adc #$00
 sta dst_hi
 rts
sub_ping_dst
 sec
 lda dst_lo
 sbc ping_char
 sta dst_lo
 lda dst_hi
 sbc #$00
 sta dst_hi
 rts
fill_window_blank
 ldy #$00
 lda blank_char
fill_window_blank_loop
 sta (dst_lo),y
 iny
 cpy window_w
 bne fill_window_blank_loop
 rts
compute_ping_char
 lda ping_pos_hi
 sta tmp_byte
 lda ping_pos_lo
 lsr tmp_byte
 ror
 lsr tmp_byte
 ror
 lsr tmp_byte
 ror
 sta ping_char
 rts

prepare_ping_screen
 jsr compute_ping_char
 lda scroll_type
 cmp #$05
 beq prep_ping_left
 cmp #$09
 beq prep_ping_left
 cmp #$0e
 beq prep_ping_left
 cmp #$06
 beq prep_ping_right
 cmp #$0a
 beq prep_ping_right
 cmp #$0d
 beq prep_ping_right
 cmp #$07
 beq prep_ping_up
 cmp #$0b
 beq prep_ping_up
 cmp #$10
 beq prep_ping_up
 cmp #$08
 beq prep_ping_down
 cmp #$0c
 beq prep_ping_down
 cmp #$0f
 beq prep_ping_down
 jmp prepare_ping_down
prep_ping_left
 jmp prepare_ping_left
prep_ping_right
 jmp prepare_ping_right
prep_ping_up
 jmp prepare_ping_up
prep_ping_down
 jmp prepare_ping_down

prepare_ping_left
 jsr set_src_frame_window
 jsr add_ping_src
 jsr set_dst_back_window
 lda window_w
 sec
 sbc ping_char
 sta copy_count
 ldx window_h
prep_ping_left_row
 ldy #$00
prep_ping_left_copy
 cpy copy_count
 beq prep_ping_left_fill
 lda (src_lo),y
 sta (dst_lo),y
 iny
 bne prep_ping_left_copy
prep_ping_left_fill
 cpy window_w
 beq prep_ping_left_row_done
 lda blank_char
 sta (dst_lo),y
 iny
 bne prep_ping_left_fill
prep_ping_left_row_done
 jsr add40_src
 jsr add40_dst
 dex
 bne prep_ping_left_row
 rts

prepare_ping_right
 jsr set_src_frame_window
 jsr set_dst_back_window
 lda window_w
 sec
 sbc ping_char
 sta copy_count
 ldx window_h
prep_ping_right_row
 ldy #$00
prep_ping_right_fill
 cpy ping_char
 beq prep_ping_right_copy_setup
 lda blank_char
 sta (dst_lo),y
 iny
 bne prep_ping_right_fill
prep_ping_right_copy_setup
 jsr add_ping_dst
 jsr copy_count_bytes
 jsr sub_ping_dst
 jsr add40_src
 jsr add40_dst
 dex
 bne prep_ping_right_row
 rts

prepare_ping_up
 jsr set_src_frame_window
 ldx ping_char
 beq prep_ping_up_src_ready
prep_ping_up_skip_rows
 jsr add40_src
 dex
 bne prep_ping_up_skip_rows
prep_ping_up_src_ready
 jsr set_dst_back_window
 lda window_h
 sec
 sbc ping_char
 sta copy_count
 tax
prep_ping_up_copy_rows
 jsr copy_window
 jsr add40_src
 jsr add40_dst
 dex
 bne prep_ping_up_copy_rows
 ldx ping_char
 beq prep_ping_up_done
prep_ping_up_fill_rows
 jsr fill_window_blank
 jsr add40_dst
 dex
 bne prep_ping_up_fill_rows
prep_ping_up_done
 rts

prepare_ping_down
 jsr set_src_frame_window
 jsr set_dst_back_window
 ldx ping_char
 beq prep_ping_down_fill_done
prep_ping_down_fill_rows
 jsr fill_window_blank
 jsr add40_dst
 dex
 bne prep_ping_down_fill_rows
prep_ping_down_fill_done
 lda window_h
 sec
 sbc ping_char
 sta copy_count
 tax
prep_ping_down_copy_rows
 jsr copy_window
 jsr add40_src
 jsr add40_dst
 dex
 bne prep_ping_down_copy_rows
 rts

prepare_up
 jsr set_src_front_window
 jsr add40_src
 jsr set_dst_back_window
 lda window_h
 sec
 sbc #$01
 sta copy_count
 tax
 beq prepare_up_last
prepare_up_rows
 jsr copy_window
 jsr add40_src
 jsr add40_dst
 dex
 bne prepare_up_rows
prepare_up_last
 jsr set_src_front_window
 jsr copy_window
 rts

prepare_down
 jsr set_src_front_window
 lda window_h
 sec
 sbc #$01
 sta copy_count
 tax
 beq prepare_down_last_ready
prepare_down_seek_last
 jsr add40_src
 dex
 bne prepare_down_seek_last
prepare_down_last_ready
 jsr set_dst_back_window
 jsr copy_window
 lda copy_count
 beq prepare_down_done
 jsr set_src_front_window
 jsr set_dst_back_window
 jsr add40_dst
 ldx copy_count
prepare_down_rows
 jsr copy_window
 jsr add40_src
 jsr add40_dst
 dex
 bne prepare_down_rows
prepare_down_done
 rts

prepare_left
 jsr set_src_front_window
 jsr set_dst_back_window
 lda window_w
 sec
 sbc #$01
 sta copy_count
 ldx window_h
prepare_left_rows
 ldy #$00
 lda (src_lo),y
 sta tmp_byte
 lda copy_count
 beq prepare_left_store
 jsr inc_src
 jsr copy_count_bytes
 jsr dec_src
prepare_left_store
 ldy copy_count
 lda tmp_byte
 sta (dst_lo),y
 jsr add40_src
 jsr add40_dst
 dex
 bne prepare_left_rows
 rts

prepare_right
 jsr set_src_front_window
 jsr set_dst_back_window
 lda window_w
 sec
 sbc #$01
 sta copy_count
 ldx window_h
prepare_right_rows
 ldy copy_count
 lda (src_lo),y
 sta tmp_byte
 lda copy_count
 beq prepare_right_store
 jsr inc_dst
 jsr copy_count_bytes
 jsr dec_dst
prepare_right_store
 ldy #$00
 lda tmp_byte
 sta (dst_lo),y
 jsr add40_src
 jsr add40_dst
 dex
 bne prepare_right_rows
 rts

duration_lo_table
!byte $c0,$c0
duration_hi_table
!byte $00,$00
type_table
!byte $0b,$0f
ticks_table
!byte $01,$01
pixels_table
!byte $01,$01
bg_table
!byte $00,$00
border_table
!byte $00,$00
fg_table
!byte $0b,$0b
bank_table
!byte $0c,$0c
window_w_table
!byte $28,$28
window_h_table
!byte $18,$18
window_off_lo_table
!byte $00,$00
window_off_hi_table
!byte $00,$00
max_x_lo_table
!byte $3f,$3f
max_x_hi_table
!byte $01,$01
max_y_lo_table
!byte $bf,$bf
max_y_hi_table
!byte $00,$00
d011_base_table
!byte $10,$10
d016_base_table
!byte $08,$08
frame_ptr_lo
!byte $00,$e8
frame_ptr_hi
!byte $40,$43

*=$3000
charset_bank1
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
*=$3800
charset_bank2
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
*=$4000
frame_screen_0
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00
frame_screen_1
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00
!byte $00,$00,$00,$00,$00,$00,$00,$00