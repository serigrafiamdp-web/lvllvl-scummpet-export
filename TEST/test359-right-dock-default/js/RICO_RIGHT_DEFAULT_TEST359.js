/* TEST359 — Default docked RIGHT workspace layout.
 * Builds on TEST358 C3 without editing its verified docking implementation.
 * Pure UI work: no PRG exporters, tile banks or JSON mutation.
 */
(function(){
'use strict';
if(window.RICO_TEST359_DEFAULT)return;
var dock=window.RICO_TEST358_DOCK;
var state={version:359,startup:'WAITING',tilesVisible:true,initialScale:false,defaultApplied:false,lastError:null};
window.RICO_TEST359_DEFAULT={state:state,openTiles:function(){return setTilesVisible(true);},closeTiles:function(){return setTilesVisible(false);},applyDefault:applyDefault,fit:fitRight};
if(!dock){state.lastError='TEST358 base missing';console.error('[TEST359]',state.lastError);return;}
function editor(){return window.g_app&&g_app.textModeEditor||null;}
function right(){return dock.rightDock;}
function uiPanel(name){try{return window.UI&&UI.exists(name)?UI(name):null;}catch(e){return null;}}
function redraw(){
 var e=editor();if(!e)return;
 if(e.sideTilePalette&&e.sideTilePalette.resize&&state.tilesVisible){
  try{e.sideTilePalette.resize();}catch(ex){console.warn('[TEST359] tile palette resize',ex);}
 }
 if(e.tileEditor&&e.tileEditor.resize&&e.tileEditor.getVisible&&e.tileEditor.getVisible()){
  try{e.tileEditor.resize();}catch(ex){console.warn('[TEST359] edit tile resize',ex);}
 }
}
function setTilesVisible(show){
 show=!!show;
 var r=right();
 if(!r.active||!r.split){state.lastError='RIGHT DOCK NOT ACTIVE';return false;}
 var sp=r.split;
 try{
  if(sp.getPanelVisible('center')!==show){
   sp.setPanelVisible('center',show,Math.max(160,Math.floor((r.host&&r.host.clientHeight||600)*0.48)),true);
  }
  state.tilesVisible=show;
  // Recalculate the south slot after native center collapse. This lets the
  // Edit Tile reclaim the height rather than leaving a blank index strip.
  if(sp.resize){var direction=sp.resizePanel;try{sp.resize();}finally{sp.resizePanel=direction;}}
  if(show)fitRight();
  if(!show){
   // When Tiles closes, the native SplitPanel expands the bottom Edit Tile
   // across the full available right sidebar; parent east panel stays visible.
   redraw();
  }
  syncMenu();
  state.lastError=null;
  return true;
 }catch(err){state.lastError='Tiles visibility: '+(err&&err.message||err);console.error('[TEST359]',err);return false;}
}
function syncMenu(){
 try{
  var menu=uiPanel('view-tilepalettepanelside');
  if(menu&&menu.setChecked)menu.setChecked(state.tilesVisible);
 }catch(e){}
}
function fitRight(){
 var r=right(),ed=editor();if(!r.active||!r.split||!ed)return false;
 var h=r.host&&r.host.getBoundingClientRect().height||0;
 if(!h||h<320)return false;
 if(!state.tilesVisible){redraw();return true;}
 // At 100% the 16x32 glyph index needs about 290px; give the full index
 // room and leave the rest for a legible, height-constrained tile editor.
 var bottom=Math.max(190,Math.min(Math.floor(h*0.44),h-360));
 if(h<580)bottom=Math.max(165,Math.min(Math.floor(h*0.44),h-220));
 var split=r.split,old=split.resizePanel;
 try{split.resizeThePanel({panel:'south',size:bottom});}
 finally{split.resizePanel=old;}
 redraw();
 return true;
}
function setScaleOnce(){
 if(state.initialScale)return;
 var ed=editor();
 if(!ed||!ed.sideTilePalette||!ed.tileSetManager||!ed.tileSetManager.getCurrentTileSet||!ed.tileSetManager.getCurrentTileSet())return;
 try{
  ed.sideTilePalette.setScale(1);
  var sel=document.getElementById('sidecharPaletteSortOrder');
  if(sel&&sel.value!=='columns')ed.sideTilePalette.selectTilePaletteMapType('columns');
  state.initialScale=true;
 }catch(e){state.lastError='Initial glyph scale: '+(e&&e.message||e);}
}
function applyDefault(){
 if(state.defaultApplied)return true;
 var e=editor();
 if(!e||!e.tileEditor||!e.tileSetManager||!e.tileSetManager.getCurrentTileSet||!e.tileSetManager.getCurrentTileSet())return false;
 if(!dock.panels.tileEditor||!dock.panels.tiles)return false;
 if(!document.getElementById('tileEditor')||!document.getElementById('sidecharPalette'))return false;
 try{
  // Move the original live Tile Editor to the native right splitter first.
  // Do NOT insert it on the left, even temporarily.
  if(!dock.dockRight())return false;
  if(!e.tileEditor.getVisible||!e.tileEditor.getVisible())e.tileEditor.setVisible(true);
  // Existing selected character, never a fabricated tile or bank.
  var chars=e.currentTile&&e.currentTile.getCharacters&&e.currentTile.getCharacters();
  if(chars&&chars.length&&chars[0]&&chars[0].length&&e.tileEditor.setCharacters){
   e.tileEditor.setCharacters(chars);
  }
  state.tilesVisible=true;
  state.defaultApplied=true;
  state.startup='DOCKED RIGHT';
  setScaleOnce();
  fitRight();
  redraw();
  return true;
 }catch(err){
  state.lastError='Startup docking: '+(err&&err.message||err);
  console.error('[TEST359] startup',err);
  return false;
 }
}
// Height-driven glyph fitting: the native Tile Editor tries to grow its canvas
// to the full sidebar width, concealing controls below it on short screens.
// Cap the 8x8 preview to the available Edit Tile height without changing
// pixel data or animation options. Existing TileEditorGrid.setSize handles draw.
if(typeof TileEditor!=='undefined'&&!TileEditor.prototype.__rico359HeightFit){
 var priorResize=TileEditor.prototype.resize;
 TileEditor.prototype.resize=function(){
  var value=priorResize.apply(this,arguments),r=right();
  if(!r.active||!r.bottom||!this.visible||!this.tileEditorGrid)return value;
  var shell=r.bottom.getElement&&r.bottom.getElement();
  if(!shell)return value;
  var rect=shell.getBoundingClientRect();
  if(!rect.height)return value;
  var w=this.width||rect.width;
  // Leave room for title, character number and some controls, with the rest
  // internally scrollable using Tile Editor's original overflow-y:auto.
  var max=Math.max(96,Math.min(w-20,222,rect.height-138));
  var chars=this.characters||[],wide=chars[0]&&chars[0].length||1;
  var tall=chars.length||1;
  var ch=wide>tall?Math.max(80,Math.round(max*tall/wide)):max;
  var cw=tall>wide?Math.max(80,Math.round(max*wide/tall)):max;
  if(this.tileEditorGrid.setSize&&Number.isFinite(cw)&&Number.isFinite(ch)){
   this.tileEditorGrid.setSize(Math.floor(cw),Math.floor(ch));
  }
  return value;
 };
 TileEditor.prototype.__rico359HeightFit=true;
}
// Keep Edit Tile docked, including on double-click or reopening it after its X.
// The Tiles index close button is independent of the Edit Tile visibility.
if(typeof TileEditor!=='undefined'&&!TileEditor.prototype.__rico359KeepRight){
 var priorVisible=TileEditor.prototype.setVisible;
 TileEditor.prototype.setVisible=function(show){
  var r=right();
  if(r.active&&show===false){
   this.visible=false;
   if(r.split&&r.split.getPanelVisible('south'))r.split.setPanelVisible('south',false);
   state.startup='EDIT TILE CLOSED; RIGHT DOCK RESERVED';
   return;
  }
  var result=priorVisible.apply(this,arguments);
  if(show&&r.active){
   if(r.split&&!r.split.getPanelVisible('south'))r.split.setPanelVisible('south',true,240,true);
   var left=uiPanel('gridSplitPanel');
   if(left&&left.getPanelVisible('west'))left.setPanelVisible('west',false);
   if(this.resize)this.resize();
  }
  return result;
 };
 TileEditor.prototype.__rico359KeepRight=true;
}
// The original X on Tiles calls TextModeEditor.setTilePalettePanelVisible
// which normally hides the WHOLE parent sidebar, including docked Edit Tile.
// Scope the action to only the inner Tiles section while right dock is active.
if(typeof TextModeEditor!=='undefined'&&!TextModeEditor.prototype.__rico359SeparateTiles){
 var oldSet=TextModeEditor.prototype.setTilePalettePanelVisible;
 var oldGet=TextModeEditor.prototype.getTilePalettePanelVisible;
 var oldUpdate=TextModeEditor.prototype.updateEastInfoPanel;
 TextModeEditor.prototype.setTilePalettePanelVisible=function(which,show){
  if(which==='side'&&right().active)return setTilesVisible(show);
  return oldSet.apply(this,arguments);
 };
 TextModeEditor.prototype.getTilePalettePanelVisible=function(which){
  if(which==='side'&&right().active&&!this.__rico359InternalEastUpdate)return state.tilesVisible;
  return oldGet.apply(this,arguments);
 };
 TextModeEditor.prototype.updateEastInfoPanel=function(){
  var r=right(),result;
  if(r.active){
   this.__rico359InternalEastUpdate=true;
   try{result=oldUpdate.apply(this,arguments);}
   finally{this.__rico359InternalEastUpdate=false;}
   syncMenu();
   return result;
  }
  return oldUpdate.apply(this,arguments);
 };
 TextModeEditor.prototype.__rico359SeparateTiles=true;
}
// Opening a file may happen after the short initial page startup retry window.
// Only fill the default layout if it has never been applied; do not forcibly
// redock an editor the user intentionally left floating.
if(typeof TextModeEditor!=='undefined'&&!TextModeEditor.prototype.__rico359AfterLoad){
 var previousLoadScreen359=TextModeEditor.prototype.loadScreen;
 TextModeEditor.prototype.loadScreen=function(){
  var value=previousLoadScreen359.apply(this,arguments);
  if(!state.defaultApplied)setTimeout(applyDefault,120);
  return value;
 };
 TextModeEditor.prototype.__rico359AfterLoad=true;
}

// Startup can finish before the tile set or the HTMLPanel contents load.
// Retry only until the first valid editor state; never force the user's
// deliberately chosen floating layout back into the dock later.
function start(){
 var attempts=0;
 function tick(){
  if(state.defaultApplied)return;
  attempts++;
  if(applyDefault())return;
  if(attempts<160)setTimeout(tick,100);
  else{state.startup='NOT INITIALIZED';console.warn('[TEST359] no editor state after startup retries',state.lastError);}
 }
 tick();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
console.info('[TEST359] Default RIGHT Tiles + Edit Tile dock, 100% 512 glyph index, responsive editing preview and separate Tiles close.');
})();