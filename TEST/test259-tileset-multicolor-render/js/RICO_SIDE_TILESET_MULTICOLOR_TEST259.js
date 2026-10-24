/* TEST259 — C64 MULTICOLOR is the visual MODE of the active tileset index.
 * Root cause in original LVLLVL: TileSet.drawCharacter() falls back to
 * Hi-Res if args.color/currentTile.color < 8 even with screenMode=c64multicolor.
 * This renderer-only correction passes 8..15 to the 512-glyph SIDE INDEX;
 * edits, source bitmap, BANK1/2 and screen modes remain untouched.
 * Wrapping the drawing scope preserves RICO TEST17 (virtual BANK2) and
 * TEST19 (BANK1 image override) in the original wrapping order.
 */
(function(){
'use strict';
var tag='[RICO TEST259]';
if(typeof TilePaletteDisplay==='undefined'||typeof TileSet==='undefined')return;
if(TilePaletteDisplay.prototype.__rico259SideMC)return;
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
  var color=1;
  try{var c=ed.currentTile.getColor();if(Number.isInteger(c)&&c>=0&&c<=15)color=c;}catch(e){}
  return 8+(color&7);
}
function usedColors(ed,layer){
  var found=Object.create(null);
  try{
    var frameNo=Number.isInteger(layer.currentFrame)?layer.currentFrame:0;
    var frame=layer.frames&&layer.frames[frameNo];
    var rows=frame&&frame.data;
    if(!rows)return found;
    for(var y=0;y<rows.length;y++){
      var row=rows[y];if(!row)continue;
      for(var x=0;x<row.length;x++){
        var c=row[x],code=c&&c.t,color=c&&c.fc;
        if(!Number.isInteger(code)||code<0||code>255||
           !Number.isInteger(color)||color<0||color>15)continue;
        // Prefer a cell drawn in hardware Multicolor; otherwise force
        // the 8 flag for the index preview alone.
        if(typeof found[code]==='undefined'||color>=8)
          found[code]=8+(color&7);
      }
    }
  }catch(e){console.warn(tag,'cell colour sampling unavailable',e);}
  return found;
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
  normalized.color=paletteColor; // Crucial: bit3 forces multicolor C64 glyph pixels
  try{
    normalized.backgroundColor=context.layer.getBackgroundColor();
    normalized.c64Multi1Color=context.layer.getC64Multi1Color();
    normalized.c64Multi2Color=context.layer.getC64Multi2Color();
  }catch(e){}
  return originalCharacter.call(this,normalized);
};
TilePaletteDisplay.prototype.__rico259SideMC=true;
window.RICO_TEST259_SIDE_TILESET_MC={
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
console.log(tag,'side index displays C64 multicolor pixels for BANK1+2, no charset mutation');
})();