/* TEST288 — Native bitmap MC stamping must preserve SOURCE ink palette.
 * Earlier TEST279/280 overwritten every stamped cell with CURRENT C1/C2/C3
 * brush, so large tileset stamps often appeared decolorized (0,0,1).
 * TEST288 snapshots selected tile colors BEFORE normal Pencil writes and
 * transfers both original 8×8 tile index AND its per-cell 12-bit palette.
 * Explicit EDIT -> Rico's Decolorize (TEST287) remains the ONLY forced
 * C1=0,C2=0,C3=1 monochrome stamp.
 */
(function(){
'use strict';
var TAG='[RICO TEST288]',NO_COLOR=0x100;
if(typeof LayerGrid==='undefined'||!window.RICO_TEST279_BITMAP||
   !window.RICO_TEST280_BITMAP||typeof CurrentTile==='undefined')return;
if(LayerGrid.prototype.__rico288StampColors)return;
var stats={selections:0,stamps:0,colorWrites:0,sampledTiles:0,
  ambiguities:0,uncaptured:0,last:null};
var selection=null,selectedLayer=null,selectedIds={},colors={},brushAtSelection=null;
function editor(){return window.g_app&&window.g_app.textModeEditor;}
function layerOf(ed){try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject();}catch(e){return null;}}
function active(layer){return !!(layer&&layer.doc&&layer.doc.ricoBitmapV1Enabled&&
 layer.getScreenMode&&layer.getScreenMode()==='c64multicolor');}
function pack(c1,c2,c3){return (Number(c1)&15)|((Number(c2)&15)<<4)|((Number(c3)&15)<<8);}
function brushInk(ed){
 var b=ed&&ed.__ricoBitmapBrush;
 if(!b||!Number.isInteger(b.c1)||!Number.isInteger(b.c2)||!Number.isInteger(b.c3))return null;
 return pack(b.c1,b.c2,b.c3);
}
function gridCopy(g){
 if(!Array.isArray(g)||g.length<1||g.length>256)return null;
 var w=0,present=0,out=[];
 for(var j=0;j<g.length;j++){
  var row=g[j];if(!Array.isArray(row))return null;
  if(row.length>w)w=row.length;
 }
 if(w<1||w>256)return null;
 for(var y=0;y<g.length;y++){
  var arr=[];for(var x=0;x<w;x++){
   var t=g[y][x];if(Number.isInteger(t)&&t>=0&&t<256){arr.push(t);present++;}
   else arr.push(false);
  }out.push(arr);
 }
 return present?out:null;
}
function tilePalette(l,ts,id){
 // Explicit bitmap per-tile metadata wins when it exists.
 var entry=ts&&ts.tileData&&ts.tileData[id],props=entry&&entry.props||{};
 for(var key of ['ricoBmpColors','ricoBitmapColors','bitmapInk','bitmapColors']){
  var c=props[key];if(Number.isInteger(c)&&c>=0&&c<=4095)return c;
  if(Array.isArray(c)&&c.length>=3)return pack(c[0],c[1],c[2]);
 }
 // Standard C64 MC index palette: global Multicolor 1/2, tile foreground.
 // Bitmap MC allows all 16 C3 values. Keep the tile palette's full
 // foreground nibble: unlike native character MC, bit3 is not a mode flag.
 var c1=l.getC64Multi1Color?l.getC64Multi1Color()&15:0;
 var c2=l.getC64Multi2Color?l.getC64Multi2Color()&15:0;
 var fc=ts&&ts.getTileColor?ts.getTileColor(id):
    (Number.isInteger(props.fc)?props.fc:1);
 var c3=Number.isInteger(fc)?(fc&15):1;
 return pack(c1,c2,c3);
}
function sourceInkMap(l,selectedIds){
 // A tile ID has geometry only; Bitmap MC uses different colors per CELL.
 // Capture representative source colors from visible/other existing frames,
 // BEFORE the destination is overwritten. Freeze until index selection
 // changes. A single tile may appear with multiple palettes: choose the
 // most frequent non-empty source palette and report ambiguity.
 var frequencies={},sampled={};
 var fw=l.getGridWidth(),fh=l.getGridHeight();
 var frames=l.frames||[];
 for(var fi=0;fi<frames.length;fi++){
  var frame=frames[fi];
  if(!frame||!Array.isArray(frame.data))continue;
  var pal=window.RICO_TEST279_BITMAP.seed(frame,l);
  if(!pal)continue;
  for(var y=0;y<Math.min(fh,frame.data.length);y++){
   var row=frame.data[y];if(!row)continue;
   for(var x=0;x<Math.min(fw,row.length);x++){
    var tile=row[x]&&row[x].t;
    if(!selectedIds[tile])continue;
    var v=pal[y*fw+x];
    if(!Number.isInteger(v)||v<0||v>4095)continue;
    if(!frequencies[tile])frequencies[tile]={};
    frequencies[tile][v]=(frequencies[tile][v]||0)+1;
   }
  }
 }
 var result={};
 for(var id in selectedIds){
  var options=frequencies[id],best=-1,number=-1,unique=0;
  if(options){
   // $100 = the exact black/white ink pair stamped by Decolorize.
   // The blank tile (#0) and existing overpaint often dominate frequency
   // despite a genuinely colored source occurrence. Prefer a colored
   // sample when both exist, otherwise preserve an intentional B/W source.
   var hasColored=Object.keys(options).some(function(k){return Number(k)!==0x100;});
   for(var k in options){unique++;
    var ink=Number(k);
    if(hasColored&&ink===0x100)continue;
    if(options[k]>number){number=options[k];best=ink;}
   }
  }
  if(best>=0){result[id]=best;sampled[id]=true;if(unique>1)stats.ambiguities++;}
 }
 return {values:result,sampled:sampled};
}
function recordSelection(ed,g){
 var l=layerOf(ed),copy=gridCopy(g);
 if(!active(l)||!copy)return false;
 var needed={},total=0;
 for(var row of copy)for(var id of row)if(id!==false){needed[id]=true;total++;}
 var ts=l.getTileSet&&l.getTileSet();
 var sample=sourceInkMap(l,needed),resolved={},fromArt=0,fromTile=0;
 for(var id in needed){
  if(sample.sampled[id]){resolved[id]=sample.values[id];fromArt++;}
  else{resolved[id]=tilePalette(l,ts,Number(id));fromTile++;}
 }
 selection=copy;selectedLayer=l;selectedIds=needed;colors=resolved;brushAtSelection=brushInk(ed);
 stats.selections++;stats.sampledTiles=fromArt;stats.uncaptured=fromTile;
 stats.last={selection:copy[0].length+'×'+copy.length,selectedInstances:total,
  differentTiles:Object.keys(needed).length,colorsFromArt:fromArt,
  colorsFromTileset:fromTile};
 console.log(TAG,'source palette snapshotted:',stats.last);
 return true;
}
var baseSelect=CurrentTile.prototype.setTiles;
CurrentTile.prototype.setTiles=function(tiles){
 var value=baseSelect.apply(this,arguments);
 if(this.editor&&active(layerOf(this.editor))){
  recordSelection(this.editor,tiles);
 }
 return value;
};
function ensureSelection(l){
 var ed=l&&l.editor||editor(),now=l&&l.editor&&l.editor.currentTile;
 if(l!==selectedLayer||!selection){
  if(now&&now.getTiles)recordSelection(ed,now.getTiles());
 }
}
function paletteForTile(ed,l,id){
 // If the user deliberately changes the brush ink swatches AFTER selecting
 // the source, treat that as a new color choice. This does NOT activate
 // Decolorize: the 0/0/1 preset is still opt-in via EDIT.
 var current=brushInk(ed);
 if(current!==null&&brushAtSelection!==null&&current!==brushAtSelection)
  return current;
 if(Object.prototype.hasOwnProperty.call(colors,id))return colors[id];
 var ts=l.getTileSet&&l.getTileSet();
 return tilePalette(l,ts,id);
}
var baseCell=LayerGrid.prototype.setCell;
var pending=false;
function redraw(ed){
 if(pending)return;pending=true;
 var raf=window.requestAnimationFrame||function(fn){window.setTimeout(fn,0);};
 raf(function(){pending=false;
  if(ed&&ed.graphic){
   try{if(ed.graphic.invalidateAllCells)ed.graphic.invalidateAllCells();
    if(ed.graphic.redraw)ed.graphic.redraw({allCells:true});
   }catch(e){console.warn(TAG,'redraw',e);}
  }
 });
}
LayerGrid.prototype.setCell=function(args){
 var ed=this.editor||editor(),tools=ed&&ed.tools&&ed.tools.drawTools;
 var explicit=window.RICO_TEST287_DECOLORIZE&&
  window.RICO_TEST287_DECOLORIZE.active&&window.RICO_TEST287_DECOLORIZE.active();
 var isStamp=active(this)&&!explicit&&tools&&tools.tool==='pen'&&tools.drawCharacter!==false&&
  args&&Number.isInteger(args.x)&&Number.isInteger(args.y)&&
  Number.isInteger(args.t)&&args.t>=0&&args.t<256;
 var target=null;
 if(isStamp){
  var x=args.x,y=args.y;
  if(x>=0&&y>=0&&x<this.getGridWidth()&&y<this.getGridHeight()){
   ensureSelection(this);
   // Only alter pens originating from the selected index stamp, never
   // unrelated scripted setCell calls or active tools.
   if(selection&&Object.prototype.hasOwnProperty.call(selectedIds,args.t))
    target=paletteForTile(ed,this,args.t);
  }
 }
 var result=baseCell.apply(this,arguments); // TEST287 / TEST280 / TEST279 wrappers
 if(target===null)return result;
 var f=Number.isInteger(args.frame)?args.frame:this.currentFrame;
 var frame=this.frames&&this.frames[f],cell=frame&&frame.data&&frame.data[args.y]&&frame.data[args.y][args.x];
 if(!cell||cell.t!==args.t)return result;
 var palette=window.RICO_TEST279_BITMAP.seed(frame,this),n=args.y*this.getGridWidth()+args.x;
 if(palette&&palette[n]!==target){
  palette[n]=target;stats.colorWrites++;
  if(ed.modified)ed.modified();
  redraw(ed);
 }
 stats.stamps++;
 stats.lastStamp={tile:args.t,x:args.x,y:args.y,frame:f,ink:target};
 return result;
};
LayerGrid.prototype.__rico288StampColors=true;
window.RICO_TEST288_BITMAP={
 version:'TEST288',snapshot:function(){var ed=editor();
  return ed&&ed.currentTile&&recordSelection(ed,ed.currentTile.getTiles());},
 source:function(id){return Object.prototype.hasOwnProperty.call(colors,id)?colors[id]:null;},
 selection:function(){return selection;},stats:stats,pack:pack
};
console.log(TAG,'normal stamps now copy bitmap tile ID AND source local palette; Decolorize remains opt-in');
})();