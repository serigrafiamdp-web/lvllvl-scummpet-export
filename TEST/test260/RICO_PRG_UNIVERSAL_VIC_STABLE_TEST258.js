(function(){
'use strict';
/* TEST258 — VIC-II stable fine-scroll writes across all eight map directions.
 * Extends TEST257 (PASS provisional) without opening unsafe fast-down
 * raster-chasing kernels. Full 8px scrolling has constant fine phase:
 * 0 for positive movement, 7 for negative movement. Keep startup VIC setup.
 * Leave 1..7px and group/multiframe unchanged for correct fractional motion.
 * Three independent source pipelines (diagonal, horizontal, vertical).
 */
var NL='\n';
function replaceOnce(source,from,to,context){
 if(source.split(from).length!==2)throw Error('TEST258 '+context+' ASM anchor missing/ambiguous');
 return source.replace(from,to);
}
var result={
 version:258,diagonal:null,horizontal:null,vertical:null,
 note:'8px VIC-II stable regs; all other velocities preserve actual fine writes'
};
var D=window.RICO_TEST196_DIAGONAL;
if(D&&D.build){
 var oldD=D.build;
 D.build=function(d){
  var s=oldD(d),prev=window.RICO_TEST257_LAST_BUILD||{};
  var status={selected:false,kind:'diagonal',direction:d&&d.direction,pixels:d&&d.pixels,reason:'requires valid 8px diagonal'};
  if(!d||!d.dir||Math.abs(d.dir.x)!==1||Math.abs(d.dir.y)!==1||d.pixels!==8){
   result.diagonal=status;window.RICO_TEST258_DIAGONAL_LAST=status;return s;
  }
  if(prev.selected&&prev.mode==='vic-ii-stable-fine-scroll-registers'){
   status={selected:true,kind:'diagonal',direction:d.direction,pixels:8,path:'TEST257 unchanged PASS'};
  }else{
   var start=s.indexOf(NL+'irq'+NL),end=start<0?-1:s.indexOf(NL+'irq_tick'+NL,start);
   if(start<0||end<0)throw Error('TEST258 diagonal: missing IRQ block');
   var block=s.slice(start,end);
   var from=' sta fine_y'+NL+' jsr apply_fine'+NL+' lda #$00',to=' sta fine_y'+NL+' lda #$00';
   if(block.split(from).length!==2){
    // An unfamiliar fast path is safer unchanged than with a blind
    // patched JSR. Normal original export continues to work.
    status.reason='unknown diagonal IRQ layout: safe original export';
   }else{
    if(!s.includes(' jsr update_d018'+NL+' jsr apply_fine'))
     throw Error('TEST258 diagonal: startup VIC setup absent');
    s=s.slice(0,start)+block.replace(from,to)+s.slice(end);
    status={selected:true,kind:'diagonal',direction:d.direction,pixels:8,
     path:'generic double-buffer or two-stage raster, skip redundant commit VIC rewrite'};
   }
  }
  result.diagonal=status;window.RICO_TEST258_DIAGONAL_LAST=status;return s;
 };
}
var H=window.RICO_TEST186_HORIZONTAL;
if(H&&H.build){
 var oldH=H.build;
 H.build=function(d){
  var s=oldH(d),status={selected:false,kind:'horizontal',direction:d&&d.type,pixels:d&&d.pixels,reason:'unsupported optimization; safe original export'};
  if(d&&d.pixels===8&&(d.type==='left'||d.type==='right')&&
      d.duration===undefined&&!d.group){
   var from=' jsr swap_screens'+NL+' jsr apply_horizontal'+NL+' lda #$00';
   var to=' jsr swap_screens'+NL+' lda #$00';
   if(s.split(from).length===2&&s.includes(' jsr update_d018'+NL+' jsr apply_horizontal')){
    s=replaceOnce(s,from,to,'horizontal');
    status={selected:true,kind:'horizontal',direction:d.type,pixels:8,
      path:'single-frame, skip commit apply_horizontal; startup and nonboundary fine remain'};
   }else status.reason='unrecognized horizontal commit, leaving source untouched';
  }
  result.horizontal=status;window.RICO_TEST258_HORIZONTAL_LAST=status;return s;
 };
}
var V=window.RICO_TEST168_PRG_LARGE_MAP;
if(V&&V.buildSource){
 var oldV=V.buildSource;
 V.buildSource=function(d){
  var s=oldV(d),status={selected:false,kind:'vertical',direction:d&&d.type,pixels:d&&d.pixels,reason:'requires up/down 8px original vertical kernel'};
  if(d&&d.pixels===8&&(d.type==='up'||d.type==='down')&&d.duration!==0){
   var from='commit_fast8_fine'+NL+' sta fine_pos'+NL+' jsr apply_scroll_regs'+NL+' lda #$00';
   var to='commit_fast8_fine'+NL+' sta fine_pos'+NL+' lda #$00';
   if(s.split(from).length===2&&
      s.includes(' jsr update_d018'+NL+' jsr apply_scroll_regs')){
    s=replaceOnce(s,from,to,'vertical fast8');
    status={selected:true,kind:'vertical',direction:d.type,pixels:8,
      path:'fast8 commit, eliminate redundant VIC writes, startup untouched'};
   }else status.reason='no recognized fast8 commit, keeping source untouched';
  }
  result.vertical=status;window.RICO_TEST258_VERTICAL_LAST=status;return s;
 };
}
window.RICO_TEST258_UNIVERSAL_VIC={version:258,last:result};
console.log('[TEST258] 8-direction VIC-II fine scroll stability installed',result);
})();