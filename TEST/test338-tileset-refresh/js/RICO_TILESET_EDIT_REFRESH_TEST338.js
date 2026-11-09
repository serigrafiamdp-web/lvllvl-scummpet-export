/* TEST338 — refresh edited charset in palette and working canvas.
 * Repairs TEST38's missing canvas invalidation after editing pixels in place.
 * Non-destructive; never edits tileData, groups, bank configuration or PRG.
 */
(function(){
'use strict';
if(typeof TileEditorGrid==='undefined')return;
if(TileEditorGrid.prototype.__rico338RefreshEdit)return;
var previous=TileEditorGrid.prototype.updateCharacter;
var busy=false;
function currentEditor(grid){
 return grid&&grid.editor||
        (window.g_app&&g_app.textModeEditor)||null;
}
function refresh(ed){
 if(!ed)return;
 // Palette atlas can be cached independently of its per-character pixel arrays.
 var palettes=[
  ed.tools&&ed.tools.drawTools&&ed.tools.drawTools.tilePalette,
  ed.sideTilePalette
 ];
 palettes.forEach(function(p){
  try{
   var display=p&&p.tilePaletteDisplay;
   if(display&&typeof display.draw==='function')
    display.draw({redrawTiles:true});
  }catch(e){console.warn('[TEST338] Palette refresh:',e);}
 });
 // Character grid may reuse a canvas cache after an in-place pixel edit.
 // This call takes place OUTSIDE the TEST147 animation-tick redraw suppression.
 try{
  var graphic=ed.graphic;
  if(graphic){
   if(typeof graphic.invalidateAllCells==='function')graphic.invalidateAllCells();
   if(typeof graphic.redraw==='function')graphic.redraw({allCells:true});
  }
 }catch(e){console.warn('[TEST338] Canvas refresh:',e);}
}
TileEditorGrid.prototype.updateCharacter=function(){
 var result=previous.apply(this,arguments);
 if(busy)return result;
 busy=true;
 try{refresh(currentEditor(this));}
 finally{busy=false;}
 return result;
};
TileEditorGrid.prototype.__rico338RefreshEdit=true;
window.RICO_TEST338_EDIT_REFRESH={version:338,refresh:function(){
 refresh(window.g_app&&g_app.textModeEditor);
}};
console.log('[TEST338] Tile Editor edits invalidate the cached palettes and full canvas.');
})();