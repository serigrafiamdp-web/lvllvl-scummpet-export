/* TEST289 — Live recolor of Bitmap MC selected index + actual Pencil cursor.
 * TEST288 keeps color sources immutable; this is a VISUAL PREVIEW ONLY until
 * native Pencil commits the selected tiles and palette. TEST287 remains opt-in.
 * UI: no extra controls — observes existing BG/C1/C2/C3 swatches and native
 * left palette, then redraws selected tile index, Tile Editor and brush.
 */
(function(){
'use strict';
var TAG='[RICO TEST289]',DOCMODE='c64multicolor';
if(!window.RICO_TEST288_BITMAP||!window.RICO_TEST279_BITMAP||
   !window.RICO_TEST280_BITMAP||typeof CurrentTile==='undefined'||
   typeof TilePaletteDisplay==='undefined')return;
if(CurrentTile.prototype.__rico289LivePreview)return;
var metrics={changes:0,indexUpdates:0,cursorUpdates:0,refreshes:0,
  selectedTiles:0,lastInk:null,lastEvent:'',lastError:null};
var currentEditor=null,latestSelection=null,hasOverride=false,overrideInk=null;
var persisted={}; // live-chosen C1/C2/C3 saved by selected tile ID
var pending=false,selectionChange=false,muting=false;
function edNow(){return window.g_app&&window.g_app.textModeEditor;}
function layer(ed){try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}catch(e){return null;}}
function active(ed){var l=layer(ed);return !!(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&
  l.getScreenMode&&l.getScreenMode()===DOCMODE);}
function pack(b){return ((b.c1||0)&15)|(((b.c2||0)&15)<<4)|(((b.c3||0)&15)<<8);}
function grid(ed){
 var g=ed&&ed.currentTile&&ed.currentTile.getTiles&&ed.currentTile.getTiles();
 return Array.isArray(g)&&g.length&&Array.isArray(g[0])&&g[0].length?g:null;
}
function selectedSet(ed){
 var out={},g=grid(ed);
 if(!g)return out;
 for(var y=0;y<g.length;y++)for(var x=0;x<g[y].length;x++){
  var id=g[y][x];if(Number.isInteger(id)&&id>=0&&id<256)out[id]=true;
 }
 return out;
}
function decolorActive(){
 var d=window.RICO_TEST287_DECOLORIZE;
 return !!(d&&d.active&&d.active());
}
function inkFor(id){
 if(decolorActive())return 0x100;
 if(hasOverride&&overrideInk!==null)return overrideInk;
 if(Object.prototype.hasOwnProperty.call(persisted,id))return persisted[id];
 var ed=edNow(),l=layer(ed),ts=l&&l.getTileSet&&l.getTileSet();
 var rec=ts&&ts.tileData&&ts.tileData[id]&&ts.tileData[id].props;
 if(rec&&Number.isInteger(rec.ricoBmpColors))return rec.ricoBmpColors&4095;
 var source=window.RICO_TEST288_BITMAP.source(id);
 return typeof source==='number'?source:null;
}
function palette(ed){
 var l=layer(ed),p=l&&l.getColorPalette&&l.getColorPalette();
 return p||(ed&&ed.colorPaletteManager&&ed.colorPaletteManager.getCurrentColorPalette&&
    ed.colorPaletteManager.getCurrentColorPalette());
}
function rgb(p,id){
 var c=p.getHex(id&15);return [(c>>>16)&255,(c>>>8)&255,c&255];
}
function colors(p,bg,ink){
 return [rgb(p,bg),rgb(p,ink&15),rgb(p,(ink>>4)&15),rgb(p,(ink>>8)&15)];
}
function fillPixels(img,canvasWidth,canvasHeight,left,top,width,height,ink){
 var d=img.data,minX=Math.max(0,Math.floor(left)),minY=Math.max(0,Math.floor(top));
 var maxX=Math.min(canvasWidth,Math.ceil(left+width)),maxY=Math.min(canvasHeight,Math.ceil(top+height));
 for(var y=minY;y<maxY;y++)for(var x=minX;x<maxX;x++){
  var j=(y*canvasWidth+x)*4;
  d[j]=ink[0];d[j+1]=ink[1];d[j+2]=ink[2];d[j+3]=255;
 }
}
function renderTile(img,cw,ch,ox,oy,scale,src,ink){
 // Every 8×8 LVLLVL glyph is 4 multicolor pixel pairs ×8 rows.
 // This colorization changes only canvas pixels, never source 8×8 bits.
 if(!src||src.length<64)return;
 for(var py=0;py<8;py++)for(var pair=0;pair<4;pair++){
  var i=py*8+pair*2,code=(src[i]?2:0)|(src[i+1]?1:0);
  fillPixels(img,cw,ch,ox+pair*2*scale,oy+py*scale,2*scale,scale,ink[code]);
 }
}
function recolorCursor(tile){
 var ed=tile&&tile.editor;if(!active(ed)||!tile.cursorCanvas)return;
 var g=grid(ed),l=layer(ed),p=palette(ed);
 if(!g||!l||!p)return;
 var ts=l.getTileSet&&l.getTileSet(),data=ts&&ts.getData&&ts.getData();
 if(!data||ts.getTileWidth()!==8||ts.getTileHeight()!==8)return;
 var canvas=tile.cursorCanvas,ctx=canvas.getContext('2d');
 if(!ctx)return;
 var w=canvas.width,h=canvas.height,scale=1;
 // Native Cursor canvas is an 8×8 logical pixel plane; getCursorCanvas
 // feeds gridView2d's drawImage, so preserve its existing dimensions.
 if(w<8||h<8)return;
 var image=ctx.getImageData(0,0,w,h),bg=l.getBackgroundColor(l.currentFrame)&15;
 var visited=0;
 for(var gy=0;gy<g.length;gy++)for(var gx=0;gx<g[gy].length;gx++){
  var id=g[gy][gx];if(!Number.isInteger(id)||id<0||id>255)continue;
  var ink=inkFor(id);
  if(ink===null)continue;
  renderTile(image,w,h,gx*8,gy*8,scale,data[id],colors(p,bg,ink));
  visited++;
 }
 if(visited){ctx.putImageData(image,0,0);metrics.cursorUpdates++;}
}
// TEST288 preserves colors of the map's source snapshot. When a user has
// explicitly recolored a tile in TEST289, that new TILE INDEX palette wins
// on future stamps even after selecting another tile and coming back.
if(typeof LayerGrid!=='undefined'){
 var originalCell=LayerGrid.prototype.setCell;
 LayerGrid.prototype.setCell=function(args){
  var ed=this.editor||edNow(),tools=ed&&ed.tools&&ed.tools.drawTools;
  var desired=null;
  if(active(ed)&&!decolorActive()&&tools&&tools.tool==='pen'&&
     tools.drawCharacter!==false&&args&&Number.isInteger(args.t)){
    var ts=this.getTileSet&&this.getTileSet();
    var props=ts&&ts.tileData&&ts.tileData[args.t]&&ts.tileData[args.t].props;
    if(Object.prototype.hasOwnProperty.call(persisted,args.t))
      desired=persisted[args.t];
    else if(props&&Number.isInteger(props.ricoBmpColors))
      desired=props.ricoBmpColors&4095;
  }
  var result=originalCell.apply(this,arguments);
  if(desired!==null&&Number.isInteger(args.x)&&Number.isInteger(args.y)&&
    args.x>=0&&args.y>=0&&args.x<this.getGridWidth()&&args.y<this.getGridHeight()){
   var f=Number.isInteger(args.frame)?args.frame:this.currentFrame;
   var frame=this.frames&&this.frames[f],
       cell=frame&&frame.data&&frame.data[args.y]&&frame.data[args.y][args.x];
   if(cell&&cell.t===args.t){
    var ink=window.RICO_TEST279_BITMAP.seed(frame,this),pos=args.y*this.getGridWidth()+args.x;
    if(ink&&ink[pos]!==desired){
     ink[pos]=desired;if(ed.modified)ed.modified();
     if(ed.graphic&&ed.graphic.invalidateAllCells)ed.graphic.invalidateAllCells();
     if(ed.graphic&&ed.graphic.redraw)ed.graphic.redraw({allCells:true});
    }
   }
  }
  return result;
 };
}
var oldCursor=CurrentTile.prototype.drawCursor;
CurrentTile.prototype.drawCursor=function(args){
 var result=oldCursor.apply(this,arguments);
 try{
  // Native currentTile.drawCursor is also used with a custom vector canvas.
  // The edit cursor always uses the stable physical currentTile.cursorCanvas.
  if(!args||!args.canvas||args.canvas===this.cursorCanvas)recolorCursor(this);
 }catch(e){metrics.lastError=String(e);console.warn(TAG,'brush preview',e);}
 return result;
};
var oldPalette=TilePaletteDisplay.prototype.drawTilePalette;
TilePaletteDisplay.prototype.drawTilePalette=function(args){
 var r=oldPalette.apply(this,arguments),ed=this.editor,l=layer(ed);
 if(!active(ed)||!l||!this.tileCanvas||!this.tileContext)return r;
 try{
  var ts=l.getTileSet&&l.getTileSet(),data=ts&&ts.getData&&ts.getData();
  if(!data||ts.getTileWidth()!==8||ts.getTileHeight()!==8)return r;
  var chosen=selectedSet(ed),ids=Object.keys(chosen);
  if(!ids.length)return r;
  var p=palette(ed);if(!p)return r;
  var cv=this.tileCanvas,ctx=this.tileContext;
  var cw=cv.width,ch=cv.height,scale=this.tilePaletteScale||1,
      canvasScale=this.canvasScale||1;
  if(!cw||!ch)return r;
  var image=ctx.getImageData(0,0,cw,ch),bg=l.getBackgroundColor(l.currentFrame)&15;
  var done=0;
  for(var index=0;index<ids.length;index++){
   var id=Number(ids[index]),src=data[id],ink=inkFor(id);
   if(!src||ink===null)continue;
   var locations=this.tileLocations&&this.tileLocations[id];
   if(!locations)continue;
   var inks=colors(p,bg,ink);
   for(var j=0;j<locations.length;j++){
    var loc=locations[j];
    // Native tileLocations are recorded in canvasScale units, whereas
    // tileCanvas is the unscaled source displayed by TilePaletteDisplay.draw.
    renderTile(image,cw,ch,Math.round(loc.x/canvasScale),Math.round(loc.y/canvasScale),
      scale,src,inks);
    done++;
   }
  }
  if(done){ctx.putImageData(image,0,0);metrics.indexUpdates++;}
 }catch(e){metrics.lastError=String(e);console.warn(TAG,'index preview',e);}
 return r;
};
function refreshNow(ed){
 if(!active(ed))return;
 metrics.refreshes++;
 // index and the secondary Tile Palette may have separate offscreen
 // tileCanvas objects. Redraw both so neither retains the previous colors.
 var palettes=[ed.sideTilePalette,ed.tools&&ed.tools.drawTools&&ed.tools.drawTools.tilePalette];
 for(var i=0;i<palettes.length;i++){
  var v=palettes[i];
  if(v&&v.tilePaletteDisplay&&v.tilePaletteDisplay.draw)
   try{v.tilePaletteDisplay.draw({redrawTiles:true});}
   catch(e){metrics.lastError=String(e);console.warn(TAG,'index refresh',e);}
 }
 try{
  if(ed.currentTile&&ed.currentTile.canvasDrawCharacters)
   ed.currentTile.canvasDrawCharacters();
  else if(ed.currentTile&&ed.currentTile.drawCursor)
   ed.currentTile.drawCursor();
 }catch(e){metrics.lastError=String(e);console.warn(TAG,'brush refresh',e);}
 try{
  if(ed.tileEditor&&ed.tileEditor.tileEditorGrid&&ed.tileEditor.tileEditorGrid.draw)
   ed.tileEditor.tileEditorGrid.draw();
 }catch(e){console.warn(TAG,'tile editor refresh',e);}
 try{
  if(ed.graphic&&ed.graphic.redraw)ed.graphic.redraw();
 }catch(e){console.warn(TAG,'cursor refresh',e);}
}
function schedule(ed){
 if(!active(ed)||pending)return;
 pending=true;
 var later=window.requestAnimationFrame||function(fn){window.setTimeout(fn,0);};
 later(function(){pending=false;refreshNow(ed);});
}
function onInkChange(ed,event){
 if(muting||selectionChange||!active(ed))return;
 var b=ed.__ricoBitmapBrush;
 if(!b)return;
 hasOverride=true;overrideInk=pack(b);
 metrics.changes++;metrics.lastInk=overrideInk;metrics.lastEvent=event;
 // Persist the chosen ink palette per selected tile ID. The C64 bitmap
 // STILL has colors per screen CELL; saving tile props affects future
 // Pencil stamps and index preview, not existing map cells or glyph bits.
 if(!decolorActive()){
  var ids=selectedSet(ed),l=layer(ed),ts=l&&l.getTileSet&&l.getTileSet(),count=0;
  for(var id in ids){
   persisted[id]=overrideInk;
   var entry=ts&&ts.tileData&&ts.tileData[id];
   if(entry){
    if(!entry.props)entry.props={};
    entry.props.ricoBmpColors=overrideInk;
   }
   count++;
  }
  if(count&&ed.modified)ed.modified();
 }
 schedule(ed);
}
function observeBrush(ed){
 if(!ed||!active(ed)||ed.__rico289Observed)return;
 var current=ed.__ricoBitmapBrush||{c1:1,c2:2,c3:3};
 var proxied=null;
 function proxify(obj){
  return new Proxy(obj,{
   set:function(target,key,value,receiver){
    var before=target[key],ok=Reflect.set(target,key,value,receiver);
    if(ok&&(key==='c1'||key==='c2'||key==='c3')&&Number(before)!==Number(value))
     onInkChange(ed,'swatch '+String(key));
    return ok;
   }
  });
 }
 proxied=proxify(current);
 try{
  Object.defineProperty(ed,'__ricoBitmapBrush',{
    configurable:true,enumerable:true,
    get:function(){return proxied;},
    set:function(next){proxied=proxify(next||{c1:1,c2:2,c3:3});onInkChange(ed,'brush assigned');}
  });
  ed.__rico289Observed=true;currentEditor=ed;
 }catch(e){metrics.lastError=String(e);console.warn(TAG,'observe brush',e);}
}
var baseSelect=CurrentTile.prototype.setTiles;
CurrentTile.prototype.setTiles=function(){
 var ed=this.editor;
 selectionChange=true;
 var result;
 try{result=baseSelect.apply(this,arguments);}
 finally{selectionChange=false;}
 if(active(ed)){
  observeBrush(ed);
  // TEST288 resets its source palette snapshot during setTiles.
  // Match that reset here, without touching image or map color data.
  hasOverride=false;overrideInk=null;latestSelection=grid(ed);
  metrics.selectedTiles=Object.keys(selectedSet(ed)).length;
  schedule(ed);
 }
 return result;
};
// Native left-side picker changes C3 via CurrentTile.setColor. The ink
// actually being edited is the chosen BG/C1/C2/C3 selector from TEST281.
var baseSetColor=CurrentTile.prototype.setColor;
CurrentTile.prototype.setColor=function(value){
 var result=baseSetColor.apply(this,arguments),ed=this.editor;
 if(!selectionChange&&active(ed)&&Number.isInteger(Number(value))){
  observeBrush(ed);
  var chosen=window.RICO_TEST281_BITMAP&&window.RICO_TEST281_BITMAP.selected&&
     window.RICO_TEST281_BITMAP.selected();
  var num=Number(value)&15;
  if(chosen==='bg'){
   if(typeof ed.setBackgroundColor==='function')ed.setBackgroundColor(num);
  } else {
   var key=(chosen==='c1'||chosen==='c2'||chosen==='c3')?chosen:'c3';
   if(ed.__ricoBitmapBrush[key]!==num)ed.__ricoBitmapBrush[key]=num;
  }
 }
 return result;
};
function watchNative(proto,name,key){
 if(!proto||typeof proto[name]!=='function')return;
 var prior=proto[name];
 proto[name]=function(value){
  var ret=prior.apply(this,arguments);
  var ed=this.editor||this;
  if(active(ed)){
   observeBrush(ed);
   if(key&&Number.isInteger(Number(value))){
    var v=Number(value)&15;
    if(ed.__ricoBitmapBrush[key]!==v)ed.__ricoBitmapBrush[key]=v;
   }
   if(!key)schedule(ed);
  }
  return ret;
 };
}
// These setters are also invoked from the native color picker, independently
// of TEST280's special swatches.
if(typeof TextModeEditor!=='undefined'){
 watchNative(TextModeEditor.prototype,'setC64Multi1Color','c1');
 watchNative(TextModeEditor.prototype,'setC64Multi2Color','c2');
 watchNative(TextModeEditor.prototype,'setBackgroundColor',null);
}
if(typeof LayerGrid!=='undefined'){
 watchNative(LayerGrid.prototype,'setC64Multi1Color','c1');
 watchNative(LayerGrid.prototype,'setC64Multi2Color','c2');
 watchNative(LayerGrid.prototype,'setBackgroundColor',null);
}
// TEST287's EDIT toggle is handled by a menuClick wrapper; refresh preview
// so the monochrome preview never sticks after it is switched off.
if(typeof Editor!=='undefined'&&Editor.prototype){
 var baseMenu=Editor.prototype.menuClick;
 Editor.prototype.menuClick=function(id){
  var r=baseMenu.apply(this,arguments);
  if(id==='edit-ricos-decolorize')schedule(this.textModeEditor);
  return r;
 };
}
// Observe when entering Bitmap mode, not before: TEST279 initializes the
// 3 inks from the selected layer on activation.
if(typeof TextModeEditor!=='undefined'&&TextModeEditor.prototype){
 var previousScreen=TextModeEditor.prototype.setScreenMode;
 TextModeEditor.prototype.setScreenMode=function(){
  var r=previousScreen.apply(this,arguments);
  if(active(this)){observeBrush(this);schedule(this);}
  return r;
 };
}
function ready(){
 var ed=edNow();if(!ed)return false;
 if(active(ed)){
  observeBrush(ed);
  latestSelection=grid(ed);
  metrics.selectedTiles=Object.keys(selectedSet(ed)).length;schedule(ed);
 }
 return true;
}
var attempts=0;
function retry(){if(!ready()&&attempts++<70)window.setTimeout(retry,120);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retry);
else retry();
if(window.UI&&UI.on)UI.on('ready',retry);
window.RICO_TEST289_BITMAP={
 version:'TEST289',refresh:function(){var ed=edNow();if(ed){observeBrush(ed);refreshNow(ed);}},
 observe:observeBrush,inkFor:inkFor,state:metrics,
 stored:function(id){return Object.prototype.hasOwnProperty.call(persisted,id)?persisted[id]:null;},
 live:function(){return hasOverride?overrideInk:null;}
};
CurrentTile.prototype.__rico289LivePreview=true;
console.log(TAG,'live C1/C2/C3/BG refresh for selected index, brush cursor, Tile Editor installed');
})();