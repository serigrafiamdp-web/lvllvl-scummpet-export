/* TEST278 — Independent per-index character colors (PREVIEW ONLY).
 *
 * C64 HW shares BG, MC1 and MC2 globally. This editor PREVIEW optionally
 * provides per-index custom MC1, MC2 and cell color for the side tile grid.
 * BG alone is read live from the selected layer and shared in the preview.
 * Never writes layer colors, per-cell colors, char bitmaps, banks or exporter.
 *
 * Based on TEST275's TEST274 side-only renderer. DrawCharacter receives
 * c64Multi1Color/2 and color, and this patch overrides them only during
 * TilePaletteDisplay.drawTilePalette of sidecharPaletteCanvas.
 */
(function(){
'use strict';
var TAG='[RICO TEST278]';
if(typeof TilePaletteDisplay==='undefined'||typeof TileSet==='undefined')return;
if(TilePaletteDisplay.prototype.__rico278IndexColors)return;

var paletteBase=TilePaletteDisplay.prototype.drawTilePalette;
var drawBase=TileSet.prototype.drawCharacter;
var inSide=null;
var savedColors=(typeof WeakMap!=='undefined')?new WeakMap():null;
if(!savedColors)return;
var PALETTE=[
  ['Negro','#000000'],['Blanco','#ffffff'],['Rojo','#883932'],
  ['Cian','#67b6bd'],['Violeta','#8b3f96'],['Verde','#55a049'],
  ['Azul','#40318d'],['Amarillo','#bfce72'],['Naranja','#8b5429'],
  ['Marrón','#574200'],['Rojo claro','#b86962'],['Gris oscuro','#505050'],
  ['Gris medio','#787878'],['Verde claro','#94e089'],
  ['Azul claro','#7869c4'],['Gris claro','#9f9f9f']
];
function getEditor(){
  try{return window.g_app&&window.g_app.textModeEditor||null;}catch(e){return null;}
}
function layerOf(ed){
  try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject()}catch(e){return null;}
}
function isMC(layer){return !!(layer&&layer.getScreenMode&&layer.getScreenMode()==='c64multicolor');}
function tileSetOf(ed){
  try{return ed&&ed.tileSetManager&&ed.tileSetManager.getCurrentTileSet()}catch(e){return null;}
}
function state(ts){
  if(!savedColors.has(ts))savedColors.set(ts,Object.create(null));
  return savedColors.get(ts);
}
function activeBank(ed){
  var g=ed&&ed.graphic,idx=g&&g.getCurrentFrame&&g.getCurrentFrame();
  var row=g&&g.frames&&g.frames[idx],requested=row&&Number(row.charsetBank);
  return requested===2?2:1;
}
function currentIndex(ed){
  var chars=ed&&ed.currentTile&&ed.currentTile.getCharacters&&ed.currentTile.getCharacters();
  var logical=chars&&chars[0]&&chars[0][0];
  logical=Number(logical);
  if(!Number.isInteger(logical)||logical<0)return null;
  // In the editor each bank stores C64 indices 0..255.
  return (logical%256)+(activeBank(ed)===2?256:0);
}
function indexLabel(index){
  return (index>=256?'B2:':'B1:')+String(index%256).padStart(3,'0');
}
function defaults(ed){
  var layer=layerOf(ed);
  var m1=layer&&layer.getC64Multi1Color?layer.getC64Multi1Color():0;
  var m2=layer&&layer.getC64Multi2Color?layer.getC64Multi2Color():0;
  var fg=ed&&ed.currentTile&&ed.currentTile.getColor?ed.currentTile.getColor():9;
  return {mc1:(Number(m1)||0)&15,mc2:(Number(m2)||0)&15,fg:(Number(fg)||9)&7};
}
function effective(ed,ts,index){
  var record=state(ts)[index];
  return record ? record : defaults(ed);
}
function redraw(ed){
  var d=ed&&ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay;
  if(d&&d.canvasElementId==='sidecharPaletteCanvas'&&d.draw)d.draw({redrawTiles:true});
}
TilePaletteDisplay.prototype.drawTilePalette=function(){
  if(this.canvasElementId!=='sidecharPaletteCanvas'||!isMC(layerOf(this.editor)))
    return paletteBase.apply(this,arguments);
  var old=inSide;
  inSide={ed:this.editor,ts:tileSetOf(this.editor),layer:layerOf(this.editor)};
  try{return paletteBase.apply(this,arguments);}
  finally{inSide=old;}
};
TileSet.prototype.drawCharacter=function(args){
  var scope=inSide;
  if(!scope||scope.ts!==this||!args)return drawBase.apply(this,arguments);
  var code=Number(args.character);
  if(!Number.isInteger(code)||code<0||code>=512)return drawBase.apply(this,arguments);
  var override=state(this)[code];
  if(!override)return drawBase.apply(this,arguments);
  // Apply ONLY to the side index preview. No global layer setters involved.
  var a=Object.assign({},args);
  a.screenMode='c64multicolor';
  a.color=8+(override.fg&7);
  a.c64Multi1Color=override.mc1&15;
  a.c64Multi2Color=override.mc2&15;
  // Shared BG from the layer: no per-index background override allowed.
  if(scope.layer&&scope.layer.getBackgroundColor){
    a.backgroundColor=scope.layer.getBackgroundColor();
    a.bgColor=a.backgroundColor;
  }
  return drawBase.call(this,a);
};
TilePaletteDisplay.prototype.__rico278IndexColors=true;

function setStatus(s){
  var e=document.getElementById('rico278Status');if(e)e.textContent=s;
}
function readSelect(name){
  var x=document.getElementById('rico278'+name);
  return x?Number(x.value):null;
}
function setSelect(name,value){
  var x=document.getElementById('rico278'+name);
  if(x)x.value=String(value);
}
function sync(){
  var ed=getEditor(),layer=layerOf(ed),ts=tileSetOf(ed);
  var controls=document.getElementById('rico278Controls');
  if(!controls)return;
  controls.style.opacity=isMC(layer)?'1':'0.45';
  var ix=currentIndex(ed);
  var values=(ts&&ix!==null)?effective(ed,ts,ix):defaults(ed);
  setSelect('M1',values.mc1);
  setSelect('M2',values.mc2);
  setSelect('FG',values.fg);
  var bg=(layer&&layer.getBackgroundColor)?layer.getBackgroundColor():'?';
  setStatus('Índice '+(ix===null?'—':indexLabel(ix))+' · Fondo compartido '+bg);
}
function setIndexColor(which,next){
  var ed=getEditor(),layer=layerOf(ed),ts=tileSetOf(ed),ix=currentIndex(ed);
  if(!ed||!isMC(layer)||!ts||ix===null){sync();return false;}
  if(!Number.isInteger(next)||next<0||next>(which==='fg'?7:15))return false;
  var record=state(ts)[ix];
  if(!record)record=Object.assign({},defaults(ed));
  record[which]=next;
  state(ts)[ix]=record;
  // No editor.modified(), no changed grid, no touch to C64 color registers.
  redraw(ed);
  sync();
  return true;
}
function buildSelect(id,limit,field,wide){
  var s=document.createElement('select');
  s.id='rico278'+id;
  s.setAttribute('aria-label','Vista previa '+id);
  s.style.cssText='width:'+(wide?'105px':'74px')+';font-size:11px;background:#222;color:#ddd;border:1px solid #536273;';
  for(var i=0;i<limit;i++){
    var option=document.createElement('option');
    option.value=String(i);
    option.textContent=i+' '+PALETTE[i][0];
    s.appendChild(option);
  }
  s.addEventListener('change',function(){setIndexColor(field,Number(s.value));});
  return s;
}
function mount(){
  if(document.getElementById('rico278Controls'))return true;
  var root=document.getElementById('sidecharPalette');
  var holder=document.getElementById('sidetilePaletteHolder');
  if(!root||!holder)return false;
  var bar=document.createElement('div');
  bar.id='rico278Controls';
  bar.style.cssText='position:absolute;top:43px;left:2px;right:2px;min-height:59px;z-index:80;'+
    'display:flex;align-content:center;align-items:center;flex-wrap:wrap;gap:4px 6px;padding:3px 5px;box-sizing:border-box;'+
    'background:#20252d;border-bottom:1px solid #4b5966;white-space:normal;';
  var title=document.createElement('span');
  title.textContent='Índice:';
  title.title='Solo miniaturas. Fondo compartido; no altera mapa ni exportación.';
  title.style.cssText='font-size:11px;font-weight:bold;flex-shrink:0;color:#d0dce7;';
  bar.appendChild(title);
  function label(value){var e=document.createElement('span');e.textContent=value;e.style.cssText='font-size:11px;color:#9eb6c9;';return e;}
  bar.appendChild(label('MC1'));bar.appendChild(buildSelect('M1',16,'mc1',false));
  bar.appendChild(label('MC2'));bar.appendChild(buildSelect('M2',16,'mc2',false));
  bar.appendChild(label('Celda'));bar.appendChild(buildSelect('FG',8,'fg',false));
  var status=document.createElement('span');
  status.id='rico278Status';status.title='El fondo lo controla SCREEN. MC1/MC2 aquí son solo colores de preview.';
  status.style.cssText='font-size:10px;color:#b5d4c1;overflow:hidden;text-overflow:ellipsis;';
  bar.appendChild(status);
  root.appendChild(bar);
  holder.style.setProperty('top','105px','important');
  var canvas=document.getElementById('sidecharPaletteCanvas');
  if(canvas&&canvas.addEventListener){
    canvas.addEventListener('mouseup',function(){setTimeout(sync,0);});
    canvas.addEventListener('keyup',function(){setTimeout(sync,0);});
  }
  sync();
  return true;
}
if(typeof UI!=='undefined'&&typeof UI.on==='function')UI.on('ready',mount);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
if(typeof ImportC64Formats!=='undefined'&&ImportC64Formats.prototype){
  var oldImport=ImportC64Formats.prototype.importPrg;
  ImportC64Formats.prototype.importPrg=function(){
    var result=oldImport.apply(this,arguments);
    if(result===true){mount();sync();}
    return result;
  };
}
if(typeof CurrentTile!=='undefined'&&CurrentTile.prototype&&typeof CurrentTile.prototype.setCharacters==='function'){
  var setCharacters=CurrentTile.prototype.setCharacters;
  CurrentTile.prototype.setCharacters=function(){
    var result=setCharacters.apply(this,arguments);
    sync();return result;
  };
}
window.RICO_TEST278_INDEX_COLORS={
  version:'TEST278',update:setIndexColor,sync:sync,refresh:redraw,
  get:function(ts,index){return ts?state(ts)[index]||null:null;}
};
console.log(TAG,'per-index MC1 MC2 cell preview independent, BG shared; no map writes.');
})();