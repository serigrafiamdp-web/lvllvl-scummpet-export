/* TEST360 — Focused right-dock workspace from TEST358 C3.
 * Only: startup right dock, 50/50 split, 256-character bank visibility,
 * and move colour swatches below the scrollable Tile Editor controls.
 * No TEST359, no changes to banks/character data/export.
 */
(function(){
'use strict';
if(window.RICO_TEST360)return;
var base=window.RICO_TEST358_DOCK;
var state={version:360,started:false,layoutApplied:false,swatchesBelow:false,lastError:null,bankVisible:0,bankFit:'WAITING'};
window.RICO_TEST360={state:state,restoreColours:restoreColours,fitBank:fitBank,apply:apply};
if(!base){state.lastError='Missing TEST358 C3';return;}
var nodes=[],holderOriginalWidth=null,holderOriginalMarginLeft=null,holderOriginalMarginRight=null,holder=null,resizeObs=null;
var checkTimer=null,pending=false,firstFit=false,userMovedDivider=false;
function ed(){return window.g_app&&g_app.textModeEditor;}
function getTile(){return document.getElementById('tileEditor');}
function right(){return base.rightDock;}
function inRight(){return !!(right()&&right().active&&!base.panels.tileEditor.floating);}
function resize(){
 var e=ed();if(!e)return;
 try{if(e.sideTilePalette&&e.sideTilePalette.resize)e.sideTilePalette.resize();}catch(x){console.warn('[TEST360] Tiles resize',x);}
 try{if(e.tileEditor&&e.tileEditor.resize)e.tileEditor.resize();}catch(x){console.warn('[TEST360] TileEditor resize',x);}
}
function resizeLater(){
 if(pending)return;pending=true;
 requestAnimationFrame(function(){pending=false;resize();});
}
function moveColoursBelow(){
 var root=getTile();if(!root||!inRight())return;
 var canvas=document.getElementById('tileEditorCanvasHolder'),body=canvas&&canvas.parentElement;
 if(!body)return;
 ['tileEditorMultiColors','tileEditorC64Colors','tileEditorSubPaletteColors'].forEach(function(id){
  var el=document.getElementById(id);
  if(!el||!body.contains(el)||nodes.some(function(n){return n.el===el;}))return;
  var marker=document.createComment('TEST360 restore '+id);
  el.parentNode.insertBefore(marker,el);
  nodes.push({el:el,marker:marker});
  body.appendChild(el); // after tools and animation; accessible by scrolling
 });
 state.swatchesBelow=nodes.length>0;
}
function restoreColours(){
 nodes.forEach(function(n){if(n.marker.parentNode)n.marker.parentNode.insertBefore(n.el,n.marker);n.marker.remove();});
 nodes=[];state.swatchesBelow=false;
 if(holder&&holderOriginalWidth!==null){
  holder.style.maxWidth=holderOriginalWidth;
  holder.style.marginLeft=holderOriginalMarginLeft||'';
  holder.style.marginRight=holderOriginalMarginRight||'';
 }
 holder=null;holderOriginalWidth=null;holderOriginalMarginLeft=null;holderOriginalMarginRight=null;
}
function fitSelectedTile(){
 if(!inRight())return;
 var r=right(),pane=r.bottom&&r.bottom.getElement&&r.bottom.getElement();
 var c=document.getElementById('tileEditorCanvasHolder');
 if(!pane||!c)return;
 if(c!==holder){
  holder=c;holderOriginalWidth=c.style.maxWidth||'';
  holderOriginalMarginLeft=c.style.marginLeft||'';
  holderOriginalMarginRight=c.style.marginRight||'';
 }
 // Keep the full selected tile visible above the fold, and never change the
 // actual 8x8 pixels or the pixel-editing engine.
 var h=pane.getBoundingClientRect().height;
 if(h>0){
  var maxWidth=Math.floor(Math.max(145,Math.min(350,h-75)));
  var desired=maxWidth+'px';
  if(c.style.maxWidth!==desired){
   c.style.maxWidth=desired;
   c.style.marginLeft='auto';c.style.marginRight='auto';
   resizeLater();
  }
 }
}
function fitBank(){
 if(!inRight())return false;
 var e=ed(),d=e&&e.sideTilePalette&&e.sideTilePalette.tilePaletteDisplay;
 if(!d||!d.canvas)return false;
 // TEST17 uses virtual UI indexes 256..511; never modify actual charset.
 // Start with the user's existing 200% scale. Decrease only if BANK 1
 // (16 rows, 256 chars) physically does not fit in the top viewport.
 try{
  if(!d.tileLocations||!d.tileLocations[256]||!d.tileLocations[256].length)d.draw({redrawTiles:true});
  var loc=d.tileLocations&&d.tileLocations[256]&&d.tileLocations[256][0];
  if(!loc){state.bankFit='NO VIRTUAL BANK2 YET';return false;}
  var ratio=(window.UI&&UI.devicePixelRatio)||1;
  var split=loc.y/ratio;
  var available=d.viewHeight||d.canvas.height/ratio;
  // Only claim all 256 visible after the geometry has been checked.
  state.bankVisible=split<=available+3?256:Math.max(0,Math.min(255,Math.floor(256*available/Math.max(1,split))));
  if(split>available+3){
   var palette=e.sideTilePalette;
   // Only fall back to native 100% for genuinely short browser windows.
   // Do not auto-change the user's native Tiles scale. TEST359 did that and
   // displayed BANK 2 in the space meant for the first 256 characters.
   state.bankFit='BANK1 USES INDEX SCROLL AT CURRENT SCALE';

  } else {
   state.bankFit='256 GLYPHS FIT AT CURRENT SCALE';
  }
  return true;
 }catch(ex){state.lastError='Bank fit: '+(ex&&ex.message||ex);return false;}
}
function fitHalf(){
 var r=right();
 if(!inRight()||!r.host||!r.split||userMovedDivider)return false;
 var h=r.host.getBoundingClientRect().height;
 if(h<260)return false;
 var split=r.split,orig=split.resizePanel;
 try{split.resizeThePanel({panel:'south',size:Math.floor(h/2)});}
 finally{split.resizePanel=orig;}
 fitSelectedTile();
 resizeLater();
 setTimeout(fitBank,60);
 return true;
}
function apply(){
 var e=ed();
 if(!e||!e.tileEditor)return false;
 // C3's native docking works when the Tile Editor has first been opened.
 // On a fresh page, the original TileEditor.visible is false; initialize it
 // exactly as a user opening it would, BEFORE moving it into the right slot.
 // Otherwise C3 can leave the full-size Tiles index alone on the right.
 var tileSet=e.tileSetManager&&e.tileSetManager.getCurrentTileSet&&e.tileSetManager.getCurrentTileSet();
 if(!tileSet){state.lastError='WAITING FOR CURRENT TILESET';return false;}
 try{if(e.tileEditor.getVisible&&!e.tileEditor.getVisible())e.tileEditor.setVisible(true);}
 catch(ex){state.lastError='OPEN TILE EDITOR: '+(ex&&ex.message||ex);return false;}
 if(!base.panels.tileEditor||!base.panels.tiles){state.lastError='WAITING FOR DOCK CONTROL INSTALL';return false;}
 if(!getTile()||!document.getElementById('sidecharPalette')){state.lastError='WAITING FOR EDITOR HTML';return false;}
 if(!e.tileEditor.getVisible||!e.tileEditor.getVisible()){
  state.lastError='TILE EDITOR WAS NOT OPENED';
  return false;
 }
 if(!base.dockRight()) {state.lastError=base.state.lastError||'DOCK FAILED';return false;}
 // The right pane must exist before marking startup as complete.
 var rightPane=right().bottom&&right().bottom.getElement&&right().bottom.getElement();
 if(!rightPane||!rightPane.contains(getTile())){
  state.lastError='EDITOR MISSING IN RIGHT SPLIT';
  return false;
 }
 var chars=e.currentTile&&e.currentTile.getCharacters&&e.currentTile.getCharacters();
 if(chars&&chars.length&&chars[0]&&chars[0].length&&e.tileEditor.setCharacters)e.tileEditor.setCharacters(chars);
 // Restore the user's TEST358 C3 working 200% glyph-index size. TEST359
 // changed a persisted app preference to 100%, making BANK 2 appear before
 // all of BANK 1 had the intended visible viewport.
 var scaleSelect=document.getElementById('sidecharPaletteScale');
 if(scaleSelect&&Number(scaleSelect.value)===1&&e.sideTilePalette&&e.sideTilePalette.setScale){
  try{e.sideTilePalette.setScale(2);}catch(ex){console.warn('[TEST360] restore Tiles 200%',ex);}
 }
 state.started=true;state.layoutApplied=true;
 fitHalf();moveColoursBelow();fitSelectedTile();
 setTimeout(fitBank,140);
 state.lastError=null;
 return true;
}
// Reuse the native Tile Editor on double click, even if it was closed and
// reopened: always go back to the right rather than showing the left sidebar.
if(typeof TileEditor!=='undefined'&&!TileEditor.prototype.__rico360KeepRight){
 var originalVisible=TileEditor.prototype.setVisible;
 TileEditor.prototype.setVisible=function(show){
  if(show&&state.started&&!inRight()&&!base.panels.tileEditor.floating)base.dockRight();
  var v=originalVisible.apply(this,arguments);
  if(show&&inRight()){moveColoursBelow();fitSelectedTile();}
  return v;
 };
 TileEditor.prototype.__rico360KeepRight=true;
}
// User keeps full control of the native split handle after startup.
function observe(){
 if(resizeObs||typeof ResizeObserver==='undefined')return;
 var r=right(),host=r&&r.host,pane=r&&r.bottom&&r.bottom.getElement&&r.bottom.getElement();
 if(!host||!pane)return;
 var lastHost=host.getBoundingClientRect().height,lastPane=pane.getBoundingClientRect().height;
 resizeObs=new ResizeObserver(function(){
  if(!inRight())return;
  var hh=host.getBoundingClientRect().height,ph=pane.getBoundingClientRect().height;
  // Do not forcibly reset a divider dragged by the user.
  if(Math.abs(ph-lastPane)>4&&Math.abs(hh-lastHost)<4)userMovedDivider=true;
  lastPane=ph;lastHost=hh;
  fitSelectedTile();
 });
 resizeObs.observe(pane);
}
function housekeeping(){
 if(inRight()){
  moveColoursBelow();fitSelectedTile();
  if(!resizeObs)observe();
 }else if(nodes.length)restoreColours();
}
function boot(){
 var count=0;
 (function retry(){
  count++;
  if(!state.layoutApplied)apply();
  if(!state.layoutApplied&&count<180)setTimeout(retry,100);
  else if(!state.layoutApplied){state.lastError='UI not ready, try loading project';}
  if(state.layoutApplied){
   observe();
   if(!checkTimer)checkTimer=setInterval(housekeeping,700);
  }
 })();
}
if(typeof TextModeEditor!=='undefined'&&!TextModeEditor.prototype.__rico360Load){
 var previous=TextModeEditor.prototype.loadScreen;
 TextModeEditor.prototype.loadScreen=function(){
  var result=previous.apply(this,arguments);
  setTimeout(function(){if(!state.layoutApplied)apply();else if(inRight())resizeLater();},150);
  return result;
 };
 TextModeEditor.prototype.__rico360Load=true;
}
// Use LVLLVL's actual UI-ready event, not only DOMContentLoaded. The
// tileEditor.html and the current TileSet become available later than the
// surrounding document in some startup paths.
if(window.UI&&UI.on)UI.on('ready',function(){setTimeout(boot,0);});
else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
console.info('[TEST360] TEST358 C3 minimal 50/50 right dock, 256 bank focus, colour controls retained under scroll.');
})();