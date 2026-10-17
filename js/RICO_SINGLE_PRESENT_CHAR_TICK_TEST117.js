(function(){
'use strict';
if(typeof TileSet==='undefined' || typeof Graphic==='undefined'){
  console.error('[RICO TEST117] TileSet/Graphic missing');
  return;
}
var previousUpdate117=TileSet.prototype.update;
var previousRedraw117=Graphic.prototype.redraw;
var inCharacterTick117=false;

Graphic.prototype.redraw=function(args){
  if(inCharacterTick117 && args && args.animatedTilesOnly===true){
    return true;
  }
  return previousRedraw117.apply(this,arguments);
};

TileSet.prototype.update=function(tick){
  inCharacterTick117=true;
  try{
    return previousUpdate117.apply(this,arguments);
  }finally{
    inCharacterTick117=false;
  }
};

window.RICO_TEST117_SINGLE_PRESENT_CHAR_TICK=true;
console.log('[RICO TEST117] Character tick updates state/invalidation only; normal GridView2d.render performs the single present.');
})();