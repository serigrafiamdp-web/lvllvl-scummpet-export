/* TEST260 — Paint selected multicolor tiles as C64 multicolor cells.
 * C64 character mode is controlled by COLOR RAM bit 3, NOT glyph bitmap
 * conversion. TEST259 was visual-only; this module synchronizes the brush FC.
 * 0..7 -> 8..15 only while the active grid is SCREEN c64multicolor.
 * Leave existing screen cells, TileSet glyph bytes and 512 bank selection
 * untouched. Native LayerGrid.setCell writes currentTile.color as fc.
 */
(function(){
  'use strict';
  if(typeof CurrentTile==='undefined'||!CurrentTile.prototype) {
    console.warn('[RICO TEST260] CurrentTile class not found');
    return;
  }
  var proto=CurrentTile.prototype;
  if(proto.__rico260MCBrush)return;
  var oldSetColor=proto.setColor;
  var oldSetTiles=proto.setTiles;
  var oldSetScreenMode=proto.setScreenMode;
  function activeMulticolor(tile){
    var ed=tile&&tile.editor,layer=null;
    if(!ed||!ed.graphic||ed.graphic.getType&&ed.graphic.getType()==='sprite')return false;
    try{layer=ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}catch(e){}
    if(!layer)return false;
    try{
      return (typeof layer.getScreenMode==='function'
        ?layer.getScreenMode():ed.screenMode)==='c64multicolor';
    }catch(e){return false;}
  }
  function color8(color){
    var n=typeof color==='number'?color:Number(color);
    if(!Number.isInteger(n)||n<0||n>15)return color;
    return (n&7)|8;
  }
  function sync(tile){
    if(!activeMulticolor(tile))return;
    var old=tile.getColor?tile.getColor():tile.color;
    var normalized=color8(old);
    if(normalized===old)return;
    // Use the existing CurrentTile setter to refresh the brush preview,
    // settings and palette. Unlike rewriting LayerGrid cells, this changes
    // only the new brush, not existing artwork or tile bitmap data.
    tile.setColor(normalized,{force:true});
  }
  proto.setColor=function(color,args){
    if(activeMulticolor(this))color=color8(color);
    return oldSetColor.call(this,color,args);
  };
  proto.setTiles=function(){
    var result=oldSetTiles.apply(this,arguments);
    sync(this); // tile chosen from side BANK1/BANK2 or other selector
    return result;
  };
  proto.setScreenMode=function(mode){
    var result=oldSetScreenMode.apply(this,arguments);
    if(mode==='c64multicolor')sync(this);
    return result;
  };
  proto.__rico260MCBrush=true;
  window.RICO_TEST260_MULTICOLOR_BRUSH={
    normalize:color8,
    sync:function(){
      try{
        var ed=window.g_app&&window.g_app.textModeEditor;
        if(!ed||!ed.currentTile)return false;
        sync(ed.currentTile);return true;
      }catch(e){return false;}
    }
  };
  console.log('[RICO TEST260] C64 multicolor brush uses color RAM flag 8..15 when painting');
})();