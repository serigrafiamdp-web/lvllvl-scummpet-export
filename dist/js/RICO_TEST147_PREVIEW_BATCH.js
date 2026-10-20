/* RICO TEST147 — Preview draw batching; derived from TEST120.
 * Narrow scope: do not change animation tick counters, PRG exporter, or map scroll.
 * TEST25 replaces currentTileData[i] for animated glyphs; detect changed references in O(256).
 * Preserve TEST120 pixel-hash fallback for other formats / original LVLLVL.
 */
(function(){
'use strict';
if(typeof TileSet==='undefined'||typeof Graphic==='undefined'){
  console.error('[RICO TEST147] TileSet/Graphic missing');
  return;
}
var previousUpdate=TileSet.prototype.update;
var previousInvalidate=Graphic.prototype.invalidateAllCells;
var previousRedraw=Graphic.prototype.redraw;
var inCharTick=false;
Graphic.prototype.invalidateAllCells=function(){
  if(inCharTick) return;
  return previousInvalidate.apply(this,arguments);
};
Graphic.prototype.redraw=function(){
  if(inCharTick) return true;
  return previousRedraw.apply(this,arguments);
};
function canTrackReferences(ts){
  try{
    var doc=ts&&ts.getDocRecord&&ts.getDocRecord();
    var b2=doc&&doc.data&&doc.data.ricoCharsetBank2;
    return !!(window.RICO_TEST25_DUAL_BANK_ANIMATION&&
      ts.getTileWidth()===8&&ts.getTileHeight()===8&&
      b2&&b2.version===1&&b2.tileData&&b2.tileData.length>=256&&
      ts.currentTileData&&ts.currentTileData.length>=256);
  }catch(e){return false;}
}
function hashPixels(a){
  if(!a) return 0;
  var h=2166136261>>>0;
  for(var i=0;i<a.length;i++){
    h^=((a[i]||0)+1);
    h=Math.imul(h,16777619)>>>0;
  }
  return (h^a.length)>>>0;
}
function snapshot(ts){
  var data=ts&&ts.currentTileData||[];
  var byRef=canTrackReferences(ts);
  var values=new Array(data.length);
  for(var i=0;i<data.length;i++) values[i]=byRef?data[i]:hashPixels(data[i]);
  return {byRef:byRef,values:values};
}
function samePixels(a,b){
  if(a===b) return true;
  if(!a||!b||a.length!==b.length) return false;
  for(var i=0;i<a.length;i++) if(a[i]!==b[i]) return false;
  return true;
}
function changedIds(ts,before){
  var data=ts&&ts.currentTileData||[],old=before.values;
  var changed=[],len=Math.max(data.length,old.length);
  for(var i=0;i<len;i++){
    var now=before.byRef?data[i]:hashPixels(data[i]);
    if(now!==old[i]&&(!before.byRef||!samePixels(now,old[i])))changed.push(i);
  }
  return changed;
}
function muteMethod(obj,name,stash){
  if(!obj||typeof obj[name]!=='function')return;
  stash.push({obj:obj,name:name,fn:obj[name]});
  obj[name]=function(){};
}
function muteTickUI(editor){
  var stash=[];
  if(!editor)return stash;
  muteMethod(editor.currentTile,'canvasDrawCharacters',stash);
  var tools=editor.tools&&editor.tools.drawTools, tp=tools&&tools.tilePalette;
  var sp=editor.sideTilePalette;
  muteMethod(tp,'drawTilePalette',stash);
  muteMethod(tp&&tp.tilePaletteDisplay,'draw',stash);
  muteMethod(tp&&tp.tilePaletteDisplay,'drawTilePalette',stash);
  muteMethod(sp,'drawTilePalette',stash);
  muteMethod(sp&&sp.tilePaletteDisplay,'draw',stash);
  muteMethod(sp&&sp.tilePaletteDisplay,'drawTilePalette',stash);
  return stash;
}
function restoreTickUI(stash){
  for(var i=stash.length-1;i>=0;i--) stash[i].obj[stash[i].name]=stash[i].fn;
}
function redrawChanged(ts,changed){
  if(!changed.length)return;
  var editor=ts&&ts.editor;
  if(!editor||!editor.layers||!editor.graphic)return;
  var dirty=new Uint8Array(512),i,li,y,x;
  for(i=0;i<changed.length;i++)if(changed[i]>=0&&changed[i]<512)dirty[changed[i]]=1;
  var frame=editor.graphic.getCurrentFrame();
  var layers=editor.layers.layers||[];
  var bg=editor.layers.isBackgroundVisible();
  for(li=0;li<layers.length;li++){
    var meta=layers[li];
    if(!meta||meta.type!=='grid'||meta.visible===false)continue;
    var layer=editor.layers.getLayerObject(meta.layerId);
    if(!layer||!layer.frames||!layer.frames[frame]||!layer.frames[frame].data||
       typeof layer.draw!=='function')continue;
    var canvas=typeof layer.getCanvas==='function'?layer.getCanvas():null;
    if(!canvas)continue;
    var grid=layer.frames[frame].data;
    var runs=[],touched=0,total=0,minX=Infinity,maxX=0,minY=Infinity,maxY=0;
    for(y=0;y<grid.length;y++){
      var row=grid[y];
      if(!row)continue;
      total+=row.length;
      x=0;
      while(x<row.length){
        while(x<row.length&&!(row[x]&&dirty[row[x].t]))x++;
        if(x===row.length)break;
        var first=x;
        while(x<row.length&&row[x]&&dirty[row[x].t]){x++;touched++;}
        runs.push({x1:first,x2:x,y:y});
        if(first<minX)minX=first;
        if(x>maxX)maxX=x;
        if(y<minY)minY=y;
        if(y+1>maxY)maxY=y+1;
      }
    }
    if(!runs.length)continue;
    // Small changes: original isolated draw. Dense changes: one bounded draw,
    // not hundreds of independent calls on every 20 ms PAL tick.
    if(touched>=total/4||runs.length>=24){
      layer.draw({canvas:canvas,frame:frame,allCells:false,
        drawBackground:bg,shapes:false,
        fromX:minX,fromY:minY,toX:maxX,toY:maxY});
    }else{
      for(i=0;i<runs.length;i++){
        var r=runs[i];
        layer.draw({canvas:canvas,frame:frame,allCells:false,
          drawBackground:bg,shapes:false,
          fromX:r.x1,fromY:r.y,toX:r.x2,toY:r.y+1});
      }
    }
  }
}
TileSet.prototype.update=function(tick){
  var before=snapshot(this);
  var stash=muteTickUI(this.editor);
  var result=false;
  inCharTick=true;
  try{
    result=previousUpdate.apply(this,arguments);
  }finally{
    inCharTick=false;
    restoreTickUI(stash);
  }
  var changed=changedIds(this,before);
  if(changed.length)redrawChanged(this,changed);
  return result||changed.length>0;
};
window.RICO_TEST147_PREVIEW_BATCH=true;
console.log('[RICO TEST147] Preview glyph references + batch draws; original timing preserved.');
})();
