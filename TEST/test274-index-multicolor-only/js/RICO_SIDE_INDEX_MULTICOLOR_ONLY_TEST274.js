/* TEST274 — All glyph THUMBNAILS display C64 multicolor in MC layers.
 * User validated indices, selected glyphs, map and frame data. Only the
 * side character palette's DRAW operation is adjusted: force bit 3 of the
 * thumbnail foreground (8..15) regardless of cell's FC 0..15.
 * No changes to stored characters, map cells, FC, banks or editing tools.
 * Also covers slots not currently used in the map, both BANK 1 and BANK 2.
 * Keeps all TEST17/19 virtual 512-char palette rendering wrappers.
 */
(function(){
'use strict';
var tag='[RICO TEST274]';
if(typeof TilePaletteDisplay==='undefined'||typeof TileSet==='undefined')return;
if(TilePaletteDisplay.prototype.__rico274AllMCIndex)return;
var originalPalette=TilePaletteDisplay.prototype.drawTilePalette;
var originalCharacter=TileSet.prototype.drawCharacter;
var active=null;
function getLayer(ed){
  try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}catch(e){return null;}
}
function isMC(layer){
  try{return !!(layer&&typeof layer.getScreenMode==='function'&&
    layer.getScreenMode()==='c64multicolor');}catch(e){return false;}
}
function colorFallback(ed){
  // Unused slots get a constant 8-bit multicolor flag too, not HiRes.
  return 9;  // 8 | 1, neutral preview foreground
}
function usedColors(ed,layer){
  var hist=Object.create(null);
  var selected=Object.create(null);
  try{
    var frameNo=Number.isInteger(layer.currentFrame)?layer.currentFrame:0;
    var frame=layer.frames&&layer.frames[frameNo], rows=frame&&frame.data;
    if(!rows)return selected;
    for(var y=0;y<rows.length;y++){
      var row=rows[y];if(!row)continue;
      for(var x=0;x<row.length;x++){
        var cell=row[x],code=cell&&cell.t,fc=cell&&cell.fc;
        if(!Number.isInteger(code)||code<0||code>255||
           !Number.isInteger(fc)||fc<0||fc>15)continue;
        var displayColor=8+(fc&7);
        if(!hist[code])hist[code]=new Uint32Array(16);
        hist[code][displayColor]++;
      }
    }
    Object.keys(hist).forEach(function(code){
      var most=9, count=0;
      for(var color=8;color<16;color++){
        if(hist[code][color]>count){
          most=color;count=hist[code][color];
        }
      }
      selected[code]=most;
    });
  }catch(e){console.warn(tag,'could not sample preview colors',e);}
  return selected;
}
TilePaletteDisplay.prototype.drawTilePalette=function(){
  if(this.canvasElementId!=='sidecharPaletteCanvas'||!isMC(getLayer(this.editor)))
    return originalPalette.apply(this,arguments);
  var ed=this.editor,layer=getLayer(ed),tileSet=null;
  try{tileSet=ed.tileSetManager.getCurrentTileSet();}catch(e){}
  if(!tileSet)return originalPalette.apply(this,arguments);
  var old=active;
  active={tileSet:tileSet,editor:ed,layer:layer,
    colors:usedColors(ed,layer),fallback:colorFallback(ed)};
  try{return originalPalette.apply(this,arguments);}
  finally{active=old;}
};
TileSet.prototype.drawCharacter=function(args){
  var context=active;
  if(!context||this!==context.tileSet||!args)
    return originalCharacter.apply(this,arguments);
  var code=Number(args.character),logical=Number.isInteger(code)?((code%256)+256)%256:0;
  var paletteColor=typeof context.colors[logical]==='number'
    ?context.colors[logical]:context.fallback;
  var normalized=Object.assign({},args);
  normalized.screenMode='c64multicolor';
  normalized.color=8+(paletteColor&7); // Preview ONLY: all glyphs forced to MC
  try{
    normalized.backgroundColor=context.layer.getBackgroundColor();
    normalized.c64Multi1Color=context.layer.getC64Multi1Color();
    normalized.c64Multi2Color=context.layer.getC64Multi2Color();
  }catch(e){}
  return originalCharacter.call(this,normalized);
};
TilePaletteDisplay.prototype.__rico274AllMCIndex=true;
window.RICO_TEST274_MC_ONLY_INDEX={
  refresh:function(){
    try{
      var ed=window.g_app&&g_app.textModeEditor;
      var disp=ed&&ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay;
      if(!disp)return false;
      disp.draw({redrawTiles:true});
      return true;
    }catch(e){console.warn(tag,e);return false;}
  }
};
console.log(tag,'all C64 MULTICOLOR side-index thumbnails forced to MC, editor data/selection unchanged');
})();