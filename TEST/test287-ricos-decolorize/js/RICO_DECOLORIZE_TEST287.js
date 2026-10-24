/* TEST287 — Rico's Decolorize, selected-index sized bitmap multicolor stamp.
 * Reproduces the observed TEST286 pencil effect: stamp selected tile IDs
 * while changing per-cell bitmap inks to C1=0,C2=0,C3=1 (black / white).
 * SCREEN and Export PRG remain native; never mutates charset tile pixels.
 */
(function(){
'use strict';
var ID='edit-ricos-decolorize',TAG="[RICO TEST287 DECOLORIZE]",BW=0x100;
if(typeof Editor==='undefined'||typeof LayerGrid==='undefined'||
   !window.RICO_TEST279_BITMAP || !window.RICO_TEST280_BITMAP) return;
if(Editor.prototype.__rico287)return;
var state={enabled:false,grid:null,layer:null,saved:null,stampCount:0,cellChanges:0,
  lastCell:null,menuItem:null,lastError:null,dimensions:null};
function editor(){return window.g_app&&window.g_app.textModeEditor;}
function layerOf(ed){try{return ed.layers.getSelectedLayerObject();}catch(e){return null;}}
function inBitmap(ed){
 var l=ed&&layerOf(ed);
 return !!(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&l.getScreenMode&&l.getScreenMode()==='c64multicolor');
}
function cloneGrid(g){
 if(!Array.isArray(g)||!g.length||!Array.isArray(g[0])||!g[0].length)return null;
 var w=g.reduce(function(m,row){return Math.max(m,Array.isArray(row)?row.length:0);},0);
 if(w<1 || w>256 || g.length>256)return null;
 var ans=[],seen=0;
 for(var y=0;y<g.length;y++){
  var r=[];for(var x=0;x<w;x++){
   var id=g[y]&&g[y][x];
   var valid=Number.isInteger(id)&&id>=0&&id<=255;
   r.push(valid?id:false);
   if(valid)seen++;
  }ans.push(r);
 }
 return seen?ans:null;
}
function dimensions(grid){
 return grid?{width:grid[0].length,height:grid.length,tiles:grid.reduce(function(a,r){
  return a+r.filter(function(id){return id!==false;}).length;},0)}:null;
}
function selectedGrid(ed){
 // The tile palette already calls currentTile.setTiles(selectedGrid) on selection.
 // That matrix is EXACTLY what the native pencil uses for its brush cursor.
 var fromCurrent=ed&&ed.currentTile&&ed.currentTile.getTiles&&ed.currentTile.getTiles();
 var grid=cloneGrid(fromCurrent);
 if(grid)return grid;
 var display=ed&&ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay;
 return cloneGrid(display&&display.getSelectedCharactersGrid&&display.getSelectedCharactersGrid());
}
function tell(message){
 state.lastError=message;
 if(typeof window.alert==='function')window.alert("Rico's Decolorize: "+message);
}
function setCheckboxes(flags){
 if(typeof window.$!=='function')return;
 [['#drawChangesCharacter',flags.drawCharacter],
  ['#drawChangesColor',flags.drawColor],
  ['#drawChangesBGColor',flags.drawBGColor],
  ['#drawChangesCharacterMobile',flags.drawCharacter],
  ['#drawChangesColorMobile',flags.drawColor],
  ['#drawChangesBGColorMobile',flags.drawBGColor]].forEach(function(pair){
  var el=$(pair[0]);if(el&&el.length)el.prop('checked',pair[1]);
 });
}
function menuLabel(){
 var suffix=state.enabled?' ✓':'';
 var item=state.menuItem;
 if(item&&item.setLabel)item.setLabel("Rico's Decolorize"+suffix);
}
function deactivate(){
 if(!state.enabled)return false;
 var ed=editor(),saved=state.saved;
 state.enabled=false;state.layer=null;state.grid=null;state.dimensions=null;
 // Restore the pencil's user settings, NOT the drawing: the finished
 // grayscale stamp stays on the map and exports as real bitmap ink metadata.
 if(ed&&saved&&ed.tools&&ed.tools.drawTools){
  var dt=ed.tools.drawTools;
  dt.drawCharacter=saved.drawCharacter;
  dt.drawColor=saved.drawColor;
  dt.drawBgColor=saved.drawBGColor;
  setCheckboxes(saved);
 }
 state.saved=null;
 menuLabel();
 return true;
}
function activate(){
 var ed=editor();
 if(!inBitmap(ed)){tell('Activá SCREEN → Multicolor Bitmap y seleccioná una capa de mapa.');return false;}
 if(!ed.currentTile || !ed.tools || !ed.tools.drawTools)return false;
 var sel=selectedGrid(ed);
 if(!sel){tell('Seleccioná uno o varios tiles del índice antes de activar el pincel.');return false;}
 var tools=ed.tools.drawTools;
 if(typeof tools.setDrawTool!=='function'){tell('No se encontró la herramienta Pencil.');return false;}
 state.saved={drawCharacter:!!tools.drawCharacter,drawColor:!!tools.drawColor,drawBGColor:!!tools.drawBgColor};
 state.layer=layerOf(ed);
 state.grid=sel;
 state.dimensions=dimensions(sel);
 state.enabled=true;state.lastError=null;
 // The native cursor renders a selection-sized tile stamp. This is intentional:
 // no separate overlay or floating palettes in the EDIT menu.
 ed.currentTile.setTiles(sel.map(function(r){return r.slice();}));
 tools.setDrawTool('pen');
 tools.drawCharacter=true;tools.drawColor=true;
 tools.drawBgColor=true;
 setCheckboxes({drawCharacter:true,drawColor:true,drawBGColor:true});
 menuLabel();
 if(state.layer.getBackgroundColor&&state.layer.getBackgroundColor()!==0){
  console.warn(TAG,'The global background is not black. $D021 is shared; 00 pixels retain existing BG.');
 }
 console.log(TAG,'Activated '+state.dimensions.width+'x'+state.dimensions.height+' tile brush; C1=0 C2=0 C3=1');
 return true;
}
function toggle(){return state.enabled?deactivate():activate();}
var pendingRedraw=false;
function redraw(ed){
 if(pendingRedraw)return;
 pendingRedraw=true;
 var raf=window.requestAnimationFrame||function(fn){window.setTimeout(fn,0);};
 raf(function(){
  pendingRedraw=false;
  try{
   if(ed&&ed.graphic){
    if(ed.graphic.invalidateAllCells)ed.graphic.invalidateAllCells();
    if(ed.graphic.redraw)ed.graphic.redraw({allCells:true});
   }
  }catch(e){console.warn(TAG,'redraw',e);}
 });
}
// Run AFTER TEST279/280's original painting so the final per-cell palette
// cannot be overwritten by their own brush C1/C2/C3 values.
var originalCell=LayerGrid.prototype.setCell;
LayerGrid.prototype.setCell=function(args){
 var paint=state.enabled && this===state.layer && inBitmap(this.editor) &&
   this.editor.tools&&this.editor.tools.drawTools&&this.editor.tools.drawTools.tool==='pen'&&
   args&&Number.isInteger(args.x)&&Number.isInteger(args.y)&&Number.isInteger(args.t);
 var result=originalCell.apply(this,arguments);
 if(!paint)return result;
 var x=args.x,y=args.y;
 if(x<0||y<0||x>=this.getGridWidth()||y>=this.getGridHeight())return result;
 var f=Number.isInteger(args.frame)?args.frame:this.currentFrame;
 var frame=this.frames&&this.frames[f];
 if(!frame||!frame.data||!frame.data[y]||!frame.data[y][x])return result;
 // Only apply if the native pencil actually stamped this tile ID.
 if(frame.data[y][x].t!==args.t)return result;
 var palette=window.RICO_TEST279_BITMAP.seed(frame,this),index=y*this.getGridWidth()+x;
 if(palette&&palette[index]!==BW){
  palette[index]=BW;
  state.cellChanges++;
  state.lastCell={x:x,y:y,frame:f,tile:args.t,inks:[0,0,1]};
  if(this.editor.modified)this.editor.modified();
  redraw(this.editor);
 }
 state.stampCount++;
 return result;
};
// If user changes selection in the index while the mode is active, the native
// grid stamp follows that new geometry automatically.
if(typeof CurrentTile!=='undefined'&&CurrentTile.prototype&&!CurrentTile.prototype.__rico287){
 var originalSetTiles=CurrentTile.prototype.setTiles;
 CurrentTile.prototype.setTiles=function(grid){
  var result=originalSetTiles.apply(this,arguments);
  if(state.enabled && this.editor===editor()){
   var sel=cloneGrid(grid);
   if(sel){state.grid=sel;state.dimensions=dimensions(sel);}
  }
  return result;
 };
 CurrentTile.prototype.__rico287=true;
}
// A different tool automatically ends the special stamp to avoid unintended
// recoloring by fills, erasers, pixel editor or subsequent tools.
if(typeof DrawTools!=='undefined'&&DrawTools.prototype&&!DrawTools.prototype.__rico287){
 var originalTool=DrawTools.prototype.setDrawTool;
 DrawTools.prototype.setDrawTool=function(name){
  if(state.enabled && name!=='pen')deactivate();
  return originalTool.apply(this,arguments);
 };
 DrawTools.prototype.__rico287=true;
}
// Switching screen modes disables Decolorize without changing the drawn cells.
if(typeof TextModeEditor!=='undefined'&&TextModeEditor.prototype&&!TextModeEditor.prototype.__rico287){
 var originalMode=TextModeEditor.prototype.setScreenMode;
 TextModeEditor.prototype.setScreenMode=function(){
  var result=originalMode.apply(this,arguments);
  if(state.enabled&&!inBitmap(this))deactivate();
  return result;
 };
 TextModeEditor.prototype.__rico287=true;
}
function installMenu(){
 var ed=window.g_app,menuBar=ed&&ed.menuBar,menus=menuBar&&menuBar.menus;
 if(!menus)return false;
 for(var i=0;i<menus.length;i++){
  var menu=menus[i];
  if(menu.label!=='Edit'||typeof menu.getItem!=='function'||!menu.getItem('edit-clearHiddenTiles'))continue;
  var existing=menu.getItem(ID);
  if(existing){state.menuItem=existing;menuLabel();return true;}
  var item=menu.addItem({label:"Rico's Decolorize",id:ID});
  state.menuItem=item;
  var items=menu.getItems&&menu.getItems();
  var anchor=menu.getItem('edit-clearHiddenTiles');
  if(items&&anchor){
   var from=items.indexOf(item),to=items.indexOf(anchor);
   if(from>=0&&to>=0){items.splice(from,1);items.splice(items.indexOf(anchor)+1,0,item);}
  }
  // UI.MenuBar can already be mounted: reposition new item in DOM too.
  if(typeof document!=='undefined'){
   var node=document.getElementById(item.id),anchorNode=anchor&&document.getElementById(anchor.id);
   if(node&&anchorNode&&node.parentNode===anchorNode.parentNode)
    anchorNode.parentNode.insertBefore(node,anchorNode.nextSibling);
  }
  menuLabel();
  console.log(TAG,'EDIT menu item installed');
  return true;
 }
 return false;
}
var oldMenu=Editor.prototype.menuClick;
Editor.prototype.menuClick=function(id){
 if(id===ID)return toggle();
 return oldMenu.apply(this,arguments);
};
Editor.prototype.__rico287=true;
var tries=0;
function onReady(){
 if(installMenu())return;
 if(tries++<50)window.setTimeout(onReady,120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady);
else onReady();
if(window.UI&&UI.on)UI.on('ready',onReady);
document.addEventListener('keydown',function(ev){
 if(!state.enabled||ev.key!=='Escape')return;
 var target=ev.target,tag=target&&target.tagName;
 if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
 deactivate();
});
window.RICO_TEST287_DECOLORIZE={
 version:'TEST287',toggle:toggle,activate:activate,deactivate:deactivate,
 selectedGrid:selectedGrid,paintValue:BW,installMenu:installMenu,state:state,
 active:function(){return state.enabled;}
};
console.log(TAG,'EDIT stamp installed, native selection-size pencil and bitmap B/W per-cell inks.');
})();