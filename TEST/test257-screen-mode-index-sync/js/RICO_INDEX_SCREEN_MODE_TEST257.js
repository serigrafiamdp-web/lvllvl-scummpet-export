/* TEST257 — RICO screen-mode index refresh.
   Fix: SCREEN -> C64 Multicolor changes main artwork, but the dual-bank
   512-char side index retains its old cached monochrome tilePaletteImageData.
   Native LVLLVL only redraws that image on draw({redrawTiles:true}).
   Side index is owned by TEST17 + TEST19; do NOT mutate charset pixels,
   currentTile, 256/512 virtual bank map, palette selection or color registers.
*/
(function(){
'use strict';
var installed=false, timer=null, lastMode=null;
function editor(){
  try{return window.g_app&&g_app.textModeEditor||null;}catch(e){return null;}
}
function getMode(ed){
  if(!ed)return null;
  try{
    var layer=ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
    if(layer&&typeof layer.getScreenMode==='function')return layer.getScreenMode();
    if(typeof ed.getScreenMode==='function')return ed.getScreenMode();
  }catch(e){}
  return ed.screenMode||null;
}
function refresh(ed,mode){
  ed=ed||editor();
  if(!ed||!ed.sideTilePalette||!ed.sideTilePalette.tilePaletteDisplay)return false;
  var side=ed.sideTilePalette.tilePaletteDisplay;
  if(side.canvasElementId!=='sidecharPaletteCanvas')return false;
  if(!side.drawEnabled)return false;
  // Full bitmap re-render: draw() alone reuses a cached, incorrectly colored
  // canvas. TEST17 virtual BANK2 and TEST19 BANK1 override work as before.
  if(typeof side.draw==='function'){
    side.draw({redrawTiles:true,screenMode:mode||getMode(ed)});
    return true;
  }
  return false;
}
function schedule(ed,mode){
  // Side palette may be rebuilt asynchronously on document load.
  // Coalesce immediate redraw with callbacks from setScreenMode.
  if(timer!==null)clearTimeout(timer);
  timer=setTimeout(function(){
    timer=null;
    try{refresh(ed,mode);}catch(e){console.warn('[TEST257] index refresh',e);}
  },0);
}
function install(){
  if(installed||typeof TextModeEditor==='undefined'||!TextModeEditor.prototype)return false;
  var proto=TextModeEditor.prototype;
  if(typeof proto.setInterfaceScreenMode!=='function')return false;
  if(proto.__rico257ScreenModeIndex){installed=true;return true;}
  var original=proto.setInterfaceScreenMode;
  proto.setInterfaceScreenMode=function(screenMode){
    var result=original.apply(this,arguments);
    // Original setter has updated layer mode and palette colors by this point.
    // Read the live mode (rather than a stale cached index canvas).
    lastMode=getMode(this)||screenMode;
    schedule(this,lastMode);
    return result;
  };
  proto.__rico257ScreenModeIndex=true;
  installed=true;
  console.log('[RICO TEST257] SCREEN mode synchronizes dual-bank charset index');
  return true;
}
function start(){
  install();
  var ed=editor();
  if(ed){var mode=getMode(ed);if(mode!==lastMode){lastMode=mode;schedule(ed,mode);}}
}
if(typeof UI!=='undefined'&&UI.on)UI.on('ready',start);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
window.RICO_TEST257_SCREEN_INDEX={
  refresh:function(){var ed=editor();return refresh(ed,getMode(ed));},
  getMode:function(){return getMode(editor());}
};
})();