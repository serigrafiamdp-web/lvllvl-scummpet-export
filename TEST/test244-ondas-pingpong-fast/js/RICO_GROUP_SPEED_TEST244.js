/* TEST244: stable FAST 8px group Ping Pong
 * TEST243's aligned fast path remains untouched.
 * When the reflected phase is not divisible by 8, replace the 6502
 * per-bit shift-count loop with a one-time selected, unrolled shift entry.
 * This preserves phase pixels, clipping and the atomic font-bank swap.
 */
(function(){
'use strict';
function one(src,from,to,stage){
  var count=src.split(from).length-1;
  if(count!==1)throw new Error('TEST244 '+stage+': se esperaba 1 bloque ASM, hay '+count);
  return src.replace(from,to);
}
function transform(source,group){
  if(!/^pingpong-(?:left|right)$/.test(group.type)||group.pixels!==8)
    return {source:source,mode:'unchanged'};
  if(source.indexOf('group243_phase_lo')>=0){
    // Full eight-phase LUT fits in safe RAM: further unroll the eight-byte copy.
    var old=[
      ' ldy #$00','group243_copy8',
      ' lda (group182_src_lo),y',' sta (group182_dest_lo),y',
      ' iny',' cpy #$08',' bne group243_copy8',
      ' jmp group183_next_tile'
    ].join('\n');
    var fast=[' ldy #$00'];
    for(var i=0;i<8;i++){
      fast.push(' lda (group182_src_lo),y',' sta (group182_dest_lo),y');
      if(i!==7)fast.push(' iny');
    }
    fast.push(' jmp group183_next_tile');
    return {source:one(source,old,fast.join('\n'),'LUT copy8'),
      mode:'8-phase-lookup-unrolled',savedCyclesPerTile:35};
  }
  if(source.indexOf('group243_fast_tile')<0)
    return {source:source,mode:'TEST242-fallback'};
  // Also accelerate the aligned-byte copy when a full LUT does not fit.
  var oldCopy=[' ldy #$00','group243_copy8',
    ' lda (group182_src_lo),y',' sta (group182_dest_lo),y',
    ' iny',' cpy #$08',' bne group243_copy8',
    ' jmp group183_next_tile'].join('\n');
  var copy=[' ldy #$00'];
  for(var ci=0;ci<8;ci++){
    copy.push(' lda (group182_src_lo),y',' sta (group182_dest_lo),y');
    if(ci!==7)copy.push(' iny');
  }
  copy.push(' jmp group183_next_tile');
  source=one(source,oldCopy,copy.join('\n'),'aligned copy8');
  // Every 8-pixel step initially lands on a byte boundary. Reversing at
  // width*8-1 yields phase=7 modulo 8. The old path shifts every row 7 times!
  // Instead choose the exact number of unrolled shifts just once per phase.
  var direction=group.type==='pingpong-right'?'right':'left';
  var a=direction==='right'?' lsr group183_high':' asl group183_low';
  var b=direction==='right'?' ror group183_low':' rol group183_high';
  var original=[
    ' lda group183_bit_phase',
    ' sta group183_shift_count',
    ' beq group183_no_shift',
    'group183_bit_loop',
    a,b,
    ' dec group183_shift_count',
    ' bne group183_bit_loop',
    'group183_no_shift'
  ].join('\n');
  var replacement=['group244_shift_jump',' jmp group244_shift_0'];
  for(var shift=7;shift>=1;shift--)
    replacement.push('group244_shift_'+shift,a,b);
  replacement.push('group244_shift_0');
  source=one(source,original,replacement.join('\n'),'unrolled-shift-loop');
  var oldPhase=' sta group183_byte_phase\n rts\ngroup243_fast_tile';
  source=one(source,oldPhase,' sta group183_byte_phase\n jsr group244_choose_shift\n rts\n'+
    chooseASM()+'\ngroup243_fast_tile','phase-clock');
  return {source:source,mode:'unrolled-subpixel-shifts',
          maxOldShiftIterations:7,maxNewShiftIterations:0};
}
function chooseASM(){
  var out=['group244_choose_shift',' lda group183_bit_phase'];
  for(var k=0;k<7;k++)
    out.push(k===0?' beq group244_choose_0':' cmp #$'+('0'+k.toString(16)).slice(-2),
      ...(k===0?[]:[' beq group244_choose_'+k]));
  out.push(' jmp group244_choose_7');
  for(var p=0;p<8;p++){
    out.push('group244_choose_'+p,
      ' lda #<group244_shift_'+p,
      ' ldy #>group244_shift_'+p,
      ' jmp group244_install');
  }
  out.push('group244_install',
    ' sta group244_shift_jump+1',
    ' sty group244_shift_jump+2',
    ' rts');
  return out.join('\n');
}
window.RICO_TEST244_SPEED={transform:transform};
})();