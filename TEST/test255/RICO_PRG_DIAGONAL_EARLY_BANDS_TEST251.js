(function(){
'use strict';
/* TEST251: compact raster slots for TEST250 three-band in-place
 * multicolor diagonal. No copying/border/charset code changes.
 * From 86/150/248 to 86/132/218, reducing wasted idle raster lines.
 * Confirm visual correctness and speed in VICE before promoting.
 */
var E=window.RICO_TEST196_DIAGONAL;
if(!E||!E.build)return;
var old=E.build,N='\n';
E.build=function(d){
 var s=old(d),b=window.RICO_TEST250_LAST_BUILD||{};
 var state={version:251,selected:false,reason:'TEST250 three-band path not active'};
 if(!b.selected||b.mode!=='three-raster-bands'){
  window.RICO_TEST251_LAST_BUILD=state;return s;
 }
 var changes=[
  [' lda #$96'+N+' sta $d012'+N+' jsr char_color_top249',
   ' lda #$84'+N+' sta $d012'+N+' jsr char_color_top249'],
  [' lda #$f8'+N+' sta $d012'+N+' jsr char_color_midtop250',
   ' lda #$da'+N+' sta $d012'+N+' jsr char_color_midtop250']
 ];
 for(var i=0;i<changes.length;i++){
  if(s.split(changes[i][0]).length!==2)
   throw Error('TEST251 cannot patch raster boundary '+i);
  s=s.replace(changes[i][0],changes[i][1]);
 }
 state={version:251,selected:true,mode:'tight-three-band-raster',
  rasters:[86,132,218],
  oldRasters:[86,150,248],
  originalMethod:'TEST250 single screen in-place chars + Color RAM',
  chars:'unchanged',colors:'unchanged',borderWrites:'unchanged',
  edgeBuffers:'unchanged',irqCount:'unchanged',
  monitor:'m a020 a028',
  target:'finish last band before raster 50 of next PAL frame',
  status:'experimental, real VICE validation needed'};
 window.RICO_TEST251_LAST_BUILD=state;
 console.log('[TEST251 EARLY RASTER]',state);
 return s;
};
})();