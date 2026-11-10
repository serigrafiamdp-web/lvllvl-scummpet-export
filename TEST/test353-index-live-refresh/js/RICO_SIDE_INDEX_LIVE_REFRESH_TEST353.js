/* TEST353 — Side Tileset Index live refresh after any actual TileSet edit.
 * Complements TEST339: TileEditorGrid.updateCharacter was the only observed
 * edit path; TileSet.setPixel / setTileData and TileSet.updateCharacter can
 * bypass it. Never touch map buffers, banks, frames, PRG or SID exporters.
 */
(function(){
'use strict';
if(typeof TileSet==='undefined'||typeof TileEditorGrid==='undefined')return;
if(TileSet.prototype.__rico353IndexRefresh)return;
var tag='[TEST353 SIDE INDEX]',dirty=new Map(),pending=false,flushing=false;
var counts={events:0,flushes:0,skipped:0,last:null};
function editorFor(tileSet,grid){
 return (tileSet&&tileSet.editor)||(grid&&grid.editor)||
  (window.g_app&&window.g_app.textModeEditor)||null;
}
function getTileset(ed){
 try{return ed&&ed.tileSetManager&&ed.tileSetManager.getCurrentTileSet();}catch(e){return null;}
}
function bankOf(ed){
 try{
  var gr=ed&&ed.graphic,f=gr&&gr.frames&&gr.frames[gr.getCurrentFrame()];
  return Number(f&&f.charsetBank)===2?2:1;
 }catch(e){return 1;}
}
function activeTile(ts,bank,id){
 if(bank===1)return ts&&ts.tileData&&ts.tileData[id];
 var doc=ts&&ts.getDocRecord&&ts.getDocRecord();
 return doc&&doc.data&&doc.data.ricoCharsetBank2&&
    doc.data.ricoCharsetBank2.tileData&&doc.data.ricoCharsetBank2.tileData[id];
}
function add(set,id){
 id=Number(id);
 if(Number.isInteger(id)&&id>=0&&id<256)set.add(id);
}
function mark(ts,bank,ids){
 if(!ts||!ids||!ids.length||flushing)return;
 var ed=editorFor(ts);if(!ed)return;
 var item=dirty.get(ts);
 if(!item){item={bank1:new Set(),bank2:new Set(),editor:ed};dirty.set(ts,item);}
 var set=bank===2?item.bank2:item.bank1;
 ids.forEach(function(id){add(set,id);});
 if(!set.size)return;
 counts.events++;
 if(!pending){
  pending=true;
  var next=typeof requestAnimationFrame==='function'?requestAnimationFrame:
    function(fn){setTimeout(fn,0);};
  next(flush);
 }
}
function gridIDs(grid,char){
 var ids=[];
 if(char!==undefined&&char!==null){
  if(Array.isArray(char))char.forEach(function(id){ids.push(id);});
  else ids.push(char);
 }else{
  var lines=grid&&grid.characters||[];
  for(var y=0;y<lines.length;y++)for(var x=0;x<(lines[y]||[]).length;x++)ids.push(lines[y][x]);
  var cells=grid&&grid.cells||[];
  if(!ids.length)for(var cy=0;cy<cells.length;cy++)
   for(var cx=0;cx<(cells[cy]||[]).length;cx++)
    ids.push(cells[cy][cx]&&cells[cy][cx].t);
 }
 return ids;
}
function updatePreview(ts,item){
 var preview=ts&&ts.__ricoPalettePreview33;
 if(!preview||!preview.pixels)return;
 [[1,item.bank1],[2,item.bank2]].forEach(function(entry){
  var bank=entry[0],set=entry[1];
  set.forEach(function(id){
   var tile=activeTile(ts,bank,id),p=tile&&tile.data&&tile.data[0];
   if(!p)return;
   if(preview.pixels[bank])preview.pixels[bank][id]=Array.prototype.slice.call(p,0);
   // TEST33 may synthesize animation from an old cached phase.
   if(preview.phase&&preview.phase[bank])preview.phase[bank][id]=undefined;
  });
 });
}
function redrawSide(ed){
 var display=ed&&ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay;
 if(!display||display.canvasElementId!=='sidecharPaletteCanvas'||
    typeof display.draw!=='function')return false;
 // Important: TilePaletteDisplay.draw({redrawTiles:true}) rebuilds the
 // atlas before presenting, while ordinary draw() can reuse stale pixels.
 display.tilePaletteImageData=null;
 display.draw({redrawTiles:true});
 return true;
}
function flush(){
 pending=false;if(flushing)return;
 flushing=true;
 var batch=Array.from(dirty.entries());dirty.clear();
 try{
  batch.forEach(function(entry){
   var ts=entry[0],item=entry[1],ed=item.editor||editorFor(ts);
   if(!ed||getTileset(ed)!==ts){counts.skipped++;return;}
   updatePreview(ts,item);
   var ok=redrawSide(ed);
   counts.flushes++;
   counts.last={bank1:Array.from(item.bank1),bank2:Array.from(item.bank2),
    refreshed:ok,canvas:'sidecharPaletteCanvas',at:Date.now()};
   window.RICO_TEST353_LAST_REFRESH=counts.last;
  });
 }catch(error){
  console.error(tag,'index redraw failed',error);
 }finally{flushing=false;}
}
function wrap(proto,name,idsFn){
 var previous=proto&&proto[name];if(typeof previous!=='function')return;
 proto[name]=function(){
  var editor=editorFor(this),tileSet=this instanceof TileSet?this:getTileset(editor);
  var bank=bankOf(editor),ids=idsFn.call(this,arguments);
  var result=previous.apply(this,arguments);
  mark(tileSet,bank,ids);
  return result;
 };
}
wrap(TileSet.prototype,'setPixel',function(args){return [args[0]];});
wrap(TileSet.prototype,'setTileData',function(args){return [args[0]];});
wrap(TileSet.prototype,'updateCharacter',function(args){return [args[0]];});
wrap(TileEditorGrid.prototype,'updateCharacter',function(args){return gridIDs(this,args[0]);});
TileSet.prototype.__rico353IndexRefresh=true;
window.RICO_TEST353_SIDE_INDEX={
 version:353,
 status:counts,
 refresh:function(){
  var ed=window.g_app&&g_app.textModeEditor,ts=getTileset(ed);
  if(!ts)return false;
  mark(ts,bankOf(ed),Array.from({length:256},function(_,i){return i;}));
  return true;
 }
};
console.log(tag,'TileSet edit pathways + SIDE atlas refresh installed. Exporters unchanged.');
})();