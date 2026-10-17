(function(){
'use strict';
if(typeof TileSet==='undefined' || typeof Graphic==='undefined'){
  console.error('[RICO TEST120] TileSet/Graphic missing');
  return;
}

var previousUpdate120 = TileSet.prototype.update;
var previousInvalidate120 = Graphic.prototype.invalidateAllCells;
var previousRedraw120 = Graphic.prototype.redraw;
var inCharTick120 = false;

Graphic.prototype.invalidateAllCells = function(){
  if(inCharTick120) return;
  return previousInvalidate120.apply(this, arguments);
};

Graphic.prototype.redraw = function(args){
  if(inCharTick120) return true;
  return previousRedraw120.apply(this, arguments);
};

function hashPixels120(a){
  if(!a) return 0;
  var h = 2166136261 >>> 0;
  for(var i=0;i<a.length;i++){
    h ^= ((a[i]||0) + 1);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= a.length;
  return h >>> 0;
}

function snapshot120(tileSet){
  var out=[];
  var data=tileSet&&tileSet.currentTileData?tileSet.currentTileData:[];
  for(var i=0;i<data.length;i++) out[i]=hashPixels120(data[i]);
  return out;
}

function changedIds120(tileSet,before){
  var out=[];
  var data=tileSet&&tileSet.currentTileData?tileSet.currentTileData:[];
  var n=Math.max(before.length,data.length);
  for(var i=0;i<n;i++) if((before[i]||0)!==hashPixels120(data[i])) out.push(i);
  return out;
}

function muteMethod120(obj,name,stash){
  if(!obj || typeof obj[name]!=='function') return;
  stash.push({obj:obj,name:name,fn:obj[name]});
  obj[name]=function(){ return; };
}

function muteTickUI120(editor){
  var stash=[];
  if(!editor) return stash;
  muteMethod120(editor.currentTile,'canvasDrawCharacters',stash);

  var tp=editor.tools&&editor.tools.drawTools?editor.tools.drawTools.tilePalette:null;
  var sp=editor.sideTilePalette||null;
  muteMethod120(tp,'drawTilePalette',stash);
  muteMethod120(tp&&tp.tilePaletteDisplay,'draw',stash);
  muteMethod120(tp&&tp.tilePaletteDisplay,'drawTilePalette',stash);
  muteMethod120(sp,'drawTilePalette',stash);
  muteMethod120(sp&&sp.tilePaletteDisplay,'draw',stash);
  muteMethod120(sp&&sp.tilePaletteDisplay,'drawTilePalette',stash);
  return stash;
}

function restoreTickUI120(stash){
  for(var i=stash.length-1;i>=0;i--) stash[i].obj[stash[i].name]=stash[i].fn;
}

function redrawChangedCells120(tileSet, changed){
  if(!changed || !changed.length) return;
  var editor=tileSet&&tileSet.editor;
  if(!editor||!editor.layers||!editor.graphic) return;

  var changedMap={};
  for(var i=0;i<changed.length;i++) changedMap[changed[i]]=true;

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
        while(x<row.length && !(row[x]&&changedMap[row[x].t])) x++;
        if(x>=row.length) break;
        var fromX=x;
        while(x<row.length && row[x]&&changedMap[row[x].t]) x++;
        layer.draw({
          canvas:canvas,
          frame:frame,
          allCells:false,
          drawBackground:drawBackground,
          shapes:false,
          fromX:fromX,
          fromY:y,
          toX:x,
          toY:y+1
        });
      }
    }
  }
}

TileSet.prototype.update = function(tick){
  var before=snapshot120(this);
  var editor=this.editor;
  var stash=muteTickUI120(editor);
  var result=false;
  inCharTick120=true;
  try{
    result=previousUpdate120.apply(this,arguments);
  } finally {
    inCharTick120=false;
    restoreTickUI120(stash);
  }

  var changed=changedIds120(this,before);
  if(changed.length) redrawChangedCells120(this,changed);
  return result || changed.length>0;
};

window.RICO_TEST120_ISOLATED_CHAR_RENDER=true;
console.log('[RICO TEST120] Character tick mutates glyph data only; UI/palettes muted; only changed map cells redraw.');
})();
