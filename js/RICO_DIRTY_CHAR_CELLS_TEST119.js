(function(){
'use strict';
if(typeof TileSet==='undefined' || typeof Graphic==='undefined'){
  console.error('[RICO TEST119] TileSet/Graphic missing');
  return;
}
var previousUpdate119=TileSet.prototype.update;
var previousInvalidate119=Graphic.prototype.invalidateAllCells;
var previousRedraw119=Graphic.prototype.redraw;
var inCharUpdate119=false;

Graphic.prototype.invalidateAllCells=function(){
  if(inCharUpdate119) return;
  return previousInvalidate119.apply(this,arguments);
};

Graphic.prototype.redraw=function(args){
  if(inCharUpdate119) return true;
  return previousRedraw119.apply(this,arguments);
};

function animatedIds119(tileSet){
  var ids={};
  var data=tileSet&&tileSet.tileData?tileSet.tileData:[];
  for(var i=0;i<data.length;i++){
    var t=data[i];
    if(t&&t.props&&typeof t.props.animated!=='undefined'&&t.props.animated!==false){
      ids[i]=true;
    }
  }
  return ids;
}

function refreshDirtyCells119(tileSet){
  var editor=tileSet&&tileSet.editor;
  if(!editor||!editor.layers||!editor.graphic) return;
  var ids=animatedIds119(tileSet);
  var hasAny=false;
  for(var k in ids){hasAny=true;break;}
  if(!hasAny) return;

  var frame=editor.graphic.getCurrentFrame();
  var layers=editor.layers.layers||[];
  var drawBackground=editor.layers.isBackgroundVisible();

  for(var li=0;li<layers.length;li++){
    var meta=layers[li];
    if(!meta||meta.type!=='grid'||meta.visible===false) continue;
    var layer=editor.layers.getLayerObject(meta.layerId);
    if(!layer||!layer.frames||!layer.frames[frame]||!layer.frames[frame].data||typeof layer.draw!=='function') continue;
    var grid=layer.frames[frame].data;
    var canvas=typeof layer.getCanvas==='function'?layer.getCanvas():null;
    if(!canvas) continue;

    for(var y=0;y<grid.length;y++){
      var row=grid[y];
      if(!row) continue;
      var x=0;
      while(x<row.length){
        while(x<row.length && !(row[x]&&ids[row[x].t])) x++;
        if(x>=row.length) break;
        var fromX=x;
        while(x<row.length && row[x]&&ids[row[x].t]) x++;
        var toX=x;
        layer.draw({
          canvas:canvas,
          frame:frame,
          allCells:false,
          drawBackground:drawBackground,
          shapes:false,
          fromX:fromX,
          fromY:y,
          toX:toX,
          toY:y+1
        });
      }
    }
  }
}

TileSet.prototype.update=function(tick){
  inCharUpdate119=true;
  var changed=false;
  try{
    changed=previousUpdate119.apply(this,arguments);
  } finally {
    inCharUpdate119=false;
  }
  if(changed){
    refreshDirtyCells119(this);
  }
  return changed;
};

window.RICO_TEST119_DIRTY_CHAR_CELLS=true;
console.log('[RICO TEST119] Character animation redraws only cells using animated glyphs; no full-grid invalidation/redraw.');
})();