(function(){
'use strict';
if(typeof TileSet==='undefined'){
  console.error('[RICO TEST114] TileSet missing');
  return;
}

var BANK2_FIELD='ricoCharsetBank2';
var FRAME_BANK_FIELD='charsetBank';
var previousUpdate114=TileSet.prototype.update;

function hasBank2(tileSet){
  try{
    var rec=tileSet&&tileSet.getDocRecord?tileSet.getDocRecord():null;
    var st=rec&&rec.data?rec.data[BANK2_FIELD]:null;
    return !!(st&&st.version===1&&st.tileData&&st.tileData.length>=256);
  }catch(e){return false;}
}

function activeBank(tileSet){
  try{
    var g=tileSet&&tileSet.editor&&tileSet.editor.graphic;
    if(!g||!g.frames||!g.frames.length)return 1;
    var n=g.getCurrentFrame();
    var f=g.frames[n];
    return f&&parseInt(f[FRAME_BANK_FIELD],10)===2?2:1;
  }catch(e){return 1;}
}

function isNativeType(t){
  return t==='left'||t==='right'||t==='up'||t==='down'||t==='blink'||t==='frames';
}

TileSet.prototype.update=function(tick){
  if(!hasBank2(this)||activeBank(this)!==1){
    return previousUpdate114.apply(this,arguments);
  }

  var updatedCharacters=[];
  var tileCount=this.tileData.length;
  for(var i=0;i<tileCount;i++){
    var tile=this.tileData[i];
    if(!tile||!tile.props||tile.props.animated===false)continue;

    var type=tile.props.animated;
    if(!isNativeType(type)){
      return previousUpdate114.apply(this,arguments);
    }

    var frameCount=this.getFrameCount(i,type);
    if(!frameCount||frameCount<1)continue;
    var ticks=parseInt(tile.props.ticksPerFrame,10);
    if(isNaN(ticks)||ticks<1)ticks=1;
    var frame=Math.floor(tick/ticks)%frameCount;

    if(tile.props.frame!=frame){
      tile.props.frame=frame;
      tile.props.lastTick=tick;
      switch(type){
        case 'right': this.rotatePixels(i,-frame,0); break;
        case 'up': this.rotatePixels(i,0,frame); break;
        case 'down': this.rotatePixels(i,0,-frame); break;
        case 'blink': this.invertPixels(i,frame); break;
        case 'frames': this.setCharacterFrame(i,frame); break;
        case 'left':
        default: this.rotatePixels(i,frame,0); break;
      }
      updatedCharacters.push(i);
    }
  }

  if(updatedCharacters.length>0){
    if(this.editor&&this.editor.type==='2d'){
      this.editor.currentTile.canvasDrawCharacters();
      this.editor.graphic.invalidateAllCells();
      this.editor.graphic.redraw({animatedTilesOnly:true});
    }
    return true;
  }
  return false;
};

window.RICO_TEST114_JAMES_NATIVE_UPDATE_BANK1=true;
console.log('[RICO TEST114] BANK1 character animation uses James native TileSet.update path.');
})();