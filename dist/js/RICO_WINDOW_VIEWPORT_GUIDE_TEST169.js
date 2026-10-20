/* RICO TEST170 — auto effective Window; guide only inside Window dialog.
 * When MAP SCROLL OFF: full Screen editable; no red outline in artwork canvas.
 * When MAP SCROLL ON: TEST83 uses effective Window and complete Scroll Area.
 */
(function(){
'use strict';
if(typeof Graphic==='undefined')return;
var geom=window.RICO_TEST75_WINDOW_DIMENSION;
if(!geom||typeof geom.getConfig!=='function')return;
var rawGet=geom.getConfig;
function grid(g){return{w:g.getGridWidth(),h:g.getGridHeight()};}
function rawFrame(g,n){return g.frames&&g.frames[n]||null;}
function effective(g,n){
  var raw=rawGet(g,n),s=grid(g),f=rawFrame(g,n);
  var saved=f&&f.ricoWindowDimensionV1;
  if(s.w<=40&&s.h<=25)return raw;
  var full=saved&&saved.x===0&&saved.y===0&&saved.width===s.w&&saved.height===s.h;
  if(!saved||full){
    return {version:1,x:0,y:0,width:Math.min(40,s.w),height:Math.min(25,s.h),clearOutside:false};
  }
  return raw;
}
geom.getConfig=effective;
window.RICO_TEST169_VIEWPORT_GEOMETRY={
  getEffectiveWindow:effective,
  maximum:{width:40,height:25},
  preservesScreen:true,autoInitialWindowWithoutMutation:true,
  editorGuideWhileScrollOff:false
};
// TEST170: No viewport outlines on the artwork canvas.
// Keep auto effective Window for Map Scroll and keep the red C64 MAX legend
// exclusively inside the Rico's Window Dimensions dialog (TEST75).
console.log("[RICO TEST170] Full Screen editable without viewport outlines; Rico's Window dialog retains red C64 MAX.");
})();
