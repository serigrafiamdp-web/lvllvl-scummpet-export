(function(){
'use strict';
// TEST230 diagnostic A/B only. Up at 1px/tick, 25-row viewport:
// ?topguard=25 leaves the TEST229 producer byte-identical.
// ?topguard=24 masks VIC-II top/bottom scroll-reveal with RSEL=24.
// IMPORTANT: 24-row mode clips FOUR scanlines at the top and bottom;
// this comparison is NOT a final 25-row fix. It does not alter map RAM.
// All other speeds/directions, SID, and historic masters remain unchanged.
var E=window.RICO_TEST168_PRG_LARGE_MAP;if(!E)return;
var original=E.buildSource;
var query='',mode='25';
try{
 query=String(window.location&&window.location.search||'');
 var p=new URLSearchParams(query);
 if(p.get('topguard')==='24')mode='24';
}catch(e){}
var target='apply_scroll_regs\n lda fine_pos\n and #$07\n ora #$18\n sta $d011';
var adapted='apply_scroll_regs\n lda fine_pos\n and #$07\n ora #$10\n sta $d011';
window.RICO_TEST230_UP_EDGE={
 version:230,mode:mode,variant:mode==='24'?'24-row diagnostic clipping':'25-row original',
 exports:0,last:null
};
E.buildSource=function(d){
 var asm=original(d),state=window.RICO_TEST230_UP_EDGE;
 state.exports++;
 var eligible=d&&d.type==='up'&&Number(d.pixels)===1&&
  d.window&&Number(d.window.height)===25;
 state.last={direction:d&&d.type,pixels:d&&d.pixels,height:d&&d.window&&d.window.height,
  eligible:!!eligible,applied:!!eligible&&mode==='24'};
 if(!eligible||mode!=='24'){
  if(eligible)console.log('[RICO TEST230 UP TOP EDGE] Original 25-row VIC-II; same ASM as TEST229.');
  return asm;
 }
 if(asm.split(target).length!==2)
  throw new Error('TEST230: la rutina vertical $D011 cambió; no se puede comparar sin alterar otra cosa.');
 asm=asm.replace(target,adapted);
 console.log('[RICO TEST230 UP TOP EDGE] Diagnostic 24-row VIC-II active. NOTE 4 scanlines hidden at top and bottom.');
 return asm;
};
})();