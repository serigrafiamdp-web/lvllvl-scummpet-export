/* TEST281 — Map bitmap C1/C2/C3 selection to the REAL Tile Editor pixel brush.
 * Only active inside TEST279/280 experimental Bitmap Multicolor.
 * Preserves native LVLLVL editing in every other mode.
 */
(function(){
'use strict';
var TAG='[RICO TEST281]';
if(!window.RICO_TEST280_BITMAP || !window.RICO_TEST279_BITMAP ||
   typeof TileEditorGrid==='undefined') { console.warn(TAG,'requires TEST279 and TEST280'); return; }
if(TileEditorGrid.prototype.__rico281)return;
var SLOT_TO_NATIVE={bg:'background',c1:'multi1',c2:'multi2',c3:'cell'};
var activeSlot='c1';
var stats={paletteClicks:0,characterPaints:0,lastSlot:null};
function editor(){return window.g_app&&window.g_app.textModeEditor;}
function layer(ed){try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}catch(e){return null;}}
function enabled(ed){var l=layer(ed);return !!(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&
  l.getScreenMode&&l.getScreenMode()==='c64multicolor');}
function getBrush(ed) {
 if(!ed.__ricoBitmapBrush)ed.__ricoBitmapBrush={c1:1,c2:2,c3:3};
 return ed.__ricoBitmapBrush;
}
function syncSlot(ed) {
 if(!enabled(ed))return false;
 var nativeType=SLOT_TO_NATIVE[activeSlot];
 // The glyph editor reads its OWN c64ColorType; changing an RGB palette
 // value never touched this property in TEST280.
 var grid=ed.tileEditor&&ed.tileEditor.tileEditorGrid;
 if(grid&&grid.setC64ColorType)grid.setC64ColorType(nativeType);
 // Pixel-painting directly in the map has a separate tool instance.
 var mapPixel=ed.tools&&ed.tools.drawTools&&ed.tools.drawTools.pixelDraw;
 if(mapPixel&&mapPixel.setC64MultiColorType && mapPixel.c64MultiColorType!==nativeType) {
   mapPixel.setC64MultiColorType(nativeType);
 }
 return true;
}
function syncAppearance(){
 var ed=editor(),yes=enabled(ed);
 var bar=document.getElementById('rico280InkBar');
 if(!bar)return;
 var buttons=['bg','c1','c2','c3'];
 for(var i=0;i<buttons.length;i++){
   var k=buttons[i],btn=document.getElementById('rico280-'+k);
   if(!btn)continue;
   btn.style.outline=yes&&k===activeSlot?'2px solid #ffffff':'none';
   btn.style.outlineOffset='2px';
   btn.setAttribute('aria-pressed',yes&&k===activeSlot?'true':'false');
   btn.title=k.toUpperCase()+' — '+(k===activeSlot?'PINCEL ACTIVO':'seleccionar tinta del pincel')+
     '; clic para elegir color';
 }
 var info=document.getElementById('rico281ActiveBrush');
 if(info)info.textContent=yes?('Pincel activo: '+activeSlot.toUpperCase()+
   ' · seleccioná BG/C1/C2/C3 y pintá directamente sobre el carácter'):'';
}
function choose(slot,opts){
 var ed=editor();
 if(!enabled(ed)||!SLOT_TO_NATIVE[slot])return false;
 activeSlot=slot;
 syncSlot(ed);syncAppearance();
 if(opts&&opts.redraw&&ed.tileEditor&&ed.tileEditor.tileEditorGrid){
   try{ed.tileEditor.tileEditorGrid.draw();}catch(e){console.warn(TAG,'glyph redraw:',e);}
 }
 return true;
}
// Force the native glyph editor to remain in multicolor pairing even when
// the imported character's foreground has bit 3 unset. Otherwise toolStart
// enters HIRES and paints only boolean 0/1, ignoring C1/C2/C3.
var baseGetColor=TileEditorGrid.prototype.getCellColor;
TileEditorGrid.prototype.getCellColor=function(x,y){
 var color=baseGetColor.apply(this,arguments);
 if(enabled(this.editor))return (Number(color)&7)|8;
 return color;
};
// When tile-editor pixel drawing actually happens, install the chosen ink
// immediately before the original native drawing path. Reuse its own
// undo/history, animation-frame handling, 2-pixel addressing and redraw.
var baseDrawPixel=TileEditorGrid.prototype.drawPixel;
TileEditorGrid.prototype.drawPixel=function(x,y,mode){
 if(!enabled(this.editor))return baseDrawPixel.apply(this,arguments);
 this.setC64ColorType(SLOT_TO_NATIVE[activeSlot]);
 stats.characterPaints++;stats.lastSlot=activeSlot;
 return baseDrawPixel.call(this,x,y,'c64multicolor');
};
// On clicking one of TEST280's 4 swatches, select the brush BEFORE its
// original click listener opens the color picker. The picker still chooses
// the ink RGB; this patch only chooses the paint code.
document.addEventListener('click',function(ev){
 var el=ev.target;
 for(var d=0;el&&d<4;d++,el=el.parentElement) {
   var id=el.id||'';
   if(id.indexOf('rico280-')!==0)continue;
   var key=id.substring('rico280-'.length);
   if(SLOT_TO_NATIVE[key]) {
     stats.paletteClicks++;
     choose(key,{redraw:false});
     break;
   }
 }
},true);
// TEST279's palette selectors also select the matching bitmap ink.
document.addEventListener('change',function(ev){
 var id=ev.target&&ev.target.id||'';
 if(id.indexOf('rico279')!==0)return;
 var key=id.substring(7);
 if(SLOT_TO_NATIVE[key]&&key!=='bg'){
   window.setTimeout(function(){choose(key,{redraw:true});},0);
 }
});
// Since the TEST280 bar can be created asynchronously, decorate only once.
function mount(){
 var bar=document.getElementById('rico280InkBar');
 if(!bar)return false;
 if(!document.getElementById('rico281ActiveBrush')){
   var hint=document.createElement('div');
   hint.id='rico281ActiveBrush';
   hint.style.cssText='margin-top:7px;font:bold 10px Arial;color:#bfe4ce;';
   bar.appendChild(hint);
 }
 syncSlot(editor());syncAppearance();
 return true;
}
var retries=0;
function ready(){if(!mount() && retries++<60)window.setTimeout(ready,120);}
if(window.UI&&UI.on)UI.on('ready',ready);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
var priorSet=TextModeEditor.prototype.setScreenMode;
TextModeEditor.prototype.setScreenMode=function(){
 var result=priorSet.apply(this,arguments);
 window.setTimeout(function(){mount();},0);
 return result;
};
TileEditorGrid.prototype.__rico281=true;
window.RICO_TEST281_BITMAP={
 version:'TEST281',
 select:choose,
 selected:function(){return activeSlot;},
 stats:stats,
 sync:function(){return mount();}
};
console.log(TAG,'pixel brush now follows BG/C1/C2/C3, native modes untouched.');
})();