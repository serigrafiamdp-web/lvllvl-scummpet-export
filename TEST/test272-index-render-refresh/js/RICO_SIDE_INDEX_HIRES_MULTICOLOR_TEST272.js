/* TEST272 — Correct mixed HiRes/MC rendering for the active tileset index.
 * Root cause of TEST271 side-index mismatch: TEST259 changed FC 0..7 to
 * FC 8..15 for ALL side-index tiles, forcing HiRes characters into MC.
 * Restore C64 rule: FC<8 is HiRes; FC>=8 is MC, for both banks.
 * edits, source bitmap, BANK1/2 and screen modes remain untouched.
 * Wrapping the drawing scope preserves RICO TEST17 (virtual BANK2) and
 * TEST19 (BANK1 image override) in the original wrapping order.
 */
(function(){
'use strict';
var tag='[RICO TEST272]';
if(typeof TilePaletteDisplay==='undefined'||typeof TileSet==='undefined')return;
if(TilePaletteDisplay.prototype.__rico272MixedIndex)return;
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
  // Unused characters must display their RAW 8x8 bits, not as
  // pseudo-multicolor symbols in arbitrary changing palette colors.
  return 1; // HiRes, neutral foreground for unused glyphs
}
function usedColors(ed,layer){
  var stats=Object.create(null);
  var selected=Object.create(null);
  try{
    var frameNo=Number.isInteger(layer.currentFrame)?layer.currentFrame:0;
    var frame=layer.frames&&layer.frames[frameNo];
    var rows=frame&&frame.data;
    if(!rows)return selected;
    for(var y=0;y<rows.length;y++){
      var row=rows[y];if(!row)continue;
      for(var x=0;x<row.length;x++){
        var cell=row[x],code=cell&&cell.t,color=cell&&cell.fc;
        if(!Number.isInteger(code)||code<0||code>255||
           !Number.isInteger(color)||color<0||color>15)continue;
        var rec=stats[code];
        if(!rec)rec=stats[code]={hi:0,mc:0,hiColor:1,mcColor:8};
        if(color<8){
          rec.hi++;
          if(rec.hi===1)rec.hiColor=color;
        }else{
          rec.mc++;
          if(rec.mc===1)rec.mcColor=color;
        }
      }
    }
    // One side-index image per glyph cannot show HiRes and MC
    // simultaneously. Choose the most frequent HW mode for that code
    // in the currently selected frame, preserving its actual color bit3.
    Object.keys(stats).forEach(function(k){
      var r=stats[k];
      selected[k]=r.mc>r.hi?r.mcColor:r.hiColor;
    });
  }catch(e){console.warn(tag,'cell-color sampling unavailable',e);}
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
  normalized.color=paletteColor; // Crucial: bit3 forces multicolor C64 glyph pixels
  try{
    normalized.backgroundColor=context.layer.getBackgroundColor();
    normalized.c64Multi1Color=context.layer.getC64Multi1Color();
    normalized.c64Multi2Color=context.layer.getC64Multi2Color();
  }catch(e){}
  return originalCharacter.call(this,normalized);
};
TilePaletteDisplay.prototype.__rico272MixedIndex=true;
window.RICO_TEST272_MIXED_INDEX={
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
console.log(tag,'side index respects FC HiRes/MC bit3 and raw bitmap for unused characters, both banks intact');
})();