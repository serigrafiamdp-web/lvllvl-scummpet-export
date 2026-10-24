/* TEST279 — ECM color selection safety. Built from TEST275.
 * Diagnose/fix TEST80 quick palette: it sends C64 PALETTE INDEX (0..15)
 * directly to CurrentTile.setBGColor(). ECM instead expects a BACKGROUND
 * REGISTER INDEX (0..3), not a palette color. Values >=4 remap screen codes
 * to invalid groups and can corrupt the editor's selected character IDs.
 * In this preview, right-clicking a quick swatch chooses an EXISTING ECM
 * BG register matching that color, or leaves everything unchanged.
 * The 4 actual global ECM background registers remain global C64 state.
 * No writes to layer's map, registers, charset, frames or exporters.
 */
(function(){
'use strict';
var TAG='[RICO TEST279 ECM]';
if(typeof CurrentTile==='undefined'||!CurrentTile.prototype)return;
if(CurrentTile.prototype.__rico279BGGuard)return;
var nativeBG=CurrentTile.prototype.setBGColor;
function selectedLayer(ed){
  try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}catch(e){return null;}
}
function isECM(ed){
  var l=selectedLayer(ed);
  try{return !!(l&&l.getScreenMode&&l.getScreenMode()==='c64ecm');}catch(e){return false;}
}
function paletteError(msg){
  var status=document.getElementById('rico279ECMColorStatus');
  if(status){status.textContent=msg;status.style.color='#ffc68e';}
  console.warn(TAG,msg);
}
function ensureStatus(){
  var pal=document.getElementById('ricoQuickPalette80');
  if(!pal||document.getElementById('rico279ECMColorStatus'))return;
  var s=document.createElement('div');
  s.id='rico279ECMColorStatus';
  s.style.cssText='font-size:10px;line-height:13px;color:#aec9d2;padding-top:3px;'+
    'overflow:hidden;text-overflow:ellipsis;white-space:normal;';
  s.textContent='ECM: clic derecho = elegir uno de los cuatro fondos existentes.';
  pal.appendChild(s);
}
CurrentTile.prototype.setBGColor=function(bgColor,args){
  if(isECM(this.editor)){
    var n=Number(bgColor);
    var noColor=this.editor&&this.editor.colorPaletteManager&&this.editor.colorPaletteManager.noColor;
    // Sentinel "No Color" stays valid; hardware slot is only 0..3.
    if(bgColor!==false && bgColor!==noColor &&
       (!Number.isInteger(n)||n<0||n>3)){
      paletteError('ECM usa índices de fondo 0–3; el color '+bgColor+
        ' no puede convertirse directamente en un índice.');
      return false;
    }
  }
  return nativeBG.apply(this,arguments);
};
CurrentTile.prototype.__rico279BGGuard=true;

function findExistingSlot(layer,color){
  if(!layer||typeof layer.getC64ECMColor!=='function')return null;
  for(var i=0;i<4;i++){
    if(Number(layer.getC64ECMColor(i))===color)return i;
  }
  return null;
}
function interceptQuickPalette(ev){
  if(!ev||ev.button!==2)return;
  var el=ev.target;
  if(!el||typeof el.closest!=='function')return;
  var swatch=el.closest('.rico80swatch');
  if(!swatch||!/^ricoQuickColor80_\d+$/.test(swatch.id))return;
  var ed=null;
  try{ed=window.g_app&&window.g_app.textModeEditor;}catch(e){}
  if(!isECM(ed))return;
  // Parent capture runs before TEST80's child mousedown and entirely
  // prevents its invalid setBGColor(colorIndex) call.
  if(ev.preventDefault)ev.preventDefault();
  if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  if(ev.stopPropagation)ev.stopPropagation();
  ensureStatus();
  var color=Number(swatch.id.replace('ricoQuickColor80_',''));
  var layer=selectedLayer(ed),slot=findExistingSlot(layer,color);
  if(slot===null){
    paletteError('El color '+color+' no es uno de los 4 fondos ECM. '+
      'No se modificó ningún carácter ni el mapa.');
    return;
  }
  try{
    ed.currentTile.setBGColor(slot);
    var status=document.getElementById('rico279ECMColorStatus');
    if(status){status.textContent='ECM: elegido fondo '+slot+' (color '+color+
      '). Solo selección del pincel; mapa intacto.';status.style.color='#acd8b6';}
  }catch(e){paletteError('Error al elegir fondo ECM: '+e.message);}
}
document.addEventListener('mousedown',interceptQuickPalette,true);
function install(){
  ensureStatus();
}
if(typeof UI!=='undefined'&&typeof UI.on==='function')UI.on('ready',install);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();
window.RICO_TEST279_ECM_COLOR_GUARD={
  version:'TEST279',
  findSlot:findExistingSlot,
  isECM:isECM
};
console.log(TAG,'safe ECM color quick picker installed; foreground / global registers unchanged.');
})();