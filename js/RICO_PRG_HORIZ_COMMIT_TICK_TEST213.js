(function(){
'use strict';
// TEST213: recover the horizontal Map Scroll tick lost when the backbuffer
// is committed. Scope: Left / Right only, one or multiple frames, SID or not.
// Crucially, this changes ONE JMP destination, keeps machine-code size,
// and preserves all previously validated screen/charset/color routines.
var H=window.RICO_TEST186_HORIZONTAL;
if(!H||typeof H.build!=='function'){
 console.error('[RICO TEST213] Missing horizontal TEST203 source generator.');
 return;
}
var oldBuild=H.build,stats={builds:0,patched:0,lastDirection:'',lastPixels:0,lastTicks:0};
var from=' sta prep_request\n sta prep_ready\n jmp irq_only_group\nirq_map_step\n';
var to=' sta prep_request\n sta prep_ready\n jmp irq_map_step\nirq_map_step\n';
H.build=function(d){
 var src=oldBuild.apply(this,arguments);
 // No patch for another direction; this is intentionally scoped to Left/Right.
 if(!d||(d.type!=='left'&&d.type!=='right'))return src;
 var i=src.indexOf(from);
 if(i<0||src.indexOf(from,i+from.length)>=0)
  throw new Error('TEST213: no encontre el unico salto de commit del scroll horizontal; ninguna correccion aplicada.');
 stats.builds++;
 stats.patched++;
 stats.lastDirection=d.type;stats.lastPixels=d.pixels;stats.lastTicks=d.ticks;
 return src.slice(0,i)+to+src.slice(i+from.length);
};
window.RICO_TEST213_HORIZ_COMMIT_TICK={
 version:213,
 stats:function(){return Object.assign({},stats);},
 originalBuild:oldBuild,
 description:'Commit raster tick reused for horizontal Map Scroll; zero music changes; existing buffers preserved.'
};
console.log('[RICO TEST213] Left/Right: preserve raster tick on double-buffer commit; applies to SID+no SID and single/multiframe.');
})();