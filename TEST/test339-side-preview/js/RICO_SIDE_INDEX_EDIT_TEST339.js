/* TEST339 — precise refresh of SIDE Tiles thumbnails following tile edits.
 * Does not redraw map, mutate saved charsets or touch PRG exporters.
 * Fixes preview33 pixel state and native TilePaletteDisplay image cache.
 */
(function(){
'use strict';
if(typeof TileEditorGrid==='undefined')return;
if(TileEditorGrid.prototype.__rico339SidePreview)return;
var original=TileEditorGrid.prototype.updateCharacter;
var pending=false,lastGrid=null,changed={1:{},2:{}};
function bankOf(grid){
 try{
  var gr=grid.editor.graphic,frame=gr.frames[gr.getCurrentFrame()];
  return Number(frame&&frame.charsetBank)===2?2:1;
 }catch(e){return 1;}
}
function idsOf(grid,character){
 var seen={};
 function add(n){n=Number(n);if(Number.isInteger(n)&&n>=0&&n<256)seen[n]=true;}
 if(character!==undefined&&character!==null)add(character);
 else{
  var gridChars=grid&&grid.characters||[];
  for(var y=0;y<gridChars.length;y++)for(var x=0;x<(gridChars[y]||[]).length;x++)add(gridChars[y][x]);
 }
 return Object.keys(seen).map(Number);
}
function getTile(ts,bank,id){
 if(bank===1)return ts.tileData&&ts.tileData[id];
 var r=ts.getDocRecord&&ts.getDocRecord(),data=r&&r.data&&r.data.ricoCharsetBank2;
 return data&&data.tileData&&data.tileData[id];
}
function refresh(){
 pending=false;
 var ed=lastGrid&&lastGrid.editor;
 if(!ed||!ed.tileSetManager)return;
 var ts=ed.tileSetManager.getCurrentTileSet();
 if(!ts)return;
 var state=ts.__ricoPalettePreview33;
 // Preview TEST33 temporarily uses its own pixel copies while drawing side indices.
 // Replace ONLY edited glyphs in that temporary preview so it never masks fresh source pixels.
 if(state&&state.pixels){
  [1,2].forEach(function(bank){
   Object.keys(changed[bank]).forEach(function(k){
    var id=Number(k),tile=getTile(ts,bank,id),pix=tile&&tile.data&&tile.data[0];
    if(!pix||!state.pixels[bank])return;
    state.pixels[bank][id]=Array.prototype.slice.call(pix,0);
    if(state.phase&&state.phase[bank])state.phase[bank][id]=undefined;
   });
  });
 }
 changed={1:{},2:{}};
 var display=ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay;
 if(!display||display.canvasElementId!=='sidecharPaletteCanvas')return;
 // The image buffer is distinct from map's Graphic canvas. Rebuild from canonical glyphs.
 display.tilePaletteImageData=null;
 if(typeof display.draw==='function')display.draw({redrawTiles:true});
 window.RICO_TEST339_LAST_REFRESH={at:Date.now(),bank:bankOf(lastGrid),canvasId:display.canvasElementId};
}
function queue(grid,character){
 lastGrid=grid;
 var bank=bankOf(grid);
 idsOf(grid,character).forEach(function(id){changed[bank][id]=true;});
 if(pending)return;
 pending=true;
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){
  try{refresh();}catch(e){pending=false;console.error('[TEST339] side index refresh',e);}
 });
 else setTimeout(function(){try{refresh();}catch(e){pending=false;console.error('[TEST339]',e);}},16);
}
TileEditorGrid.prototype.updateCharacter=function(character){
 var value=original.apply(this,arguments);
 queue(this,character);
 return value;
};
TileEditorGrid.prototype.__rico339SidePreview=true;
window.RICO_TEST339_SIDE_PREVIEW={version:339,refresh:function(){
 lastGrid=lastGrid||{editor:window.g_app&&g_app.textModeEditor};
 try{refresh();return true;}catch(e){console.error('[TEST339]',e);return false;}
}};
console.log('[TEST339] Edit-driven SIDE Tiles preview cache synchronization loaded.');
})();