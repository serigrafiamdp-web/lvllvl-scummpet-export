(function(){
'use strict';
if(typeof TileSet==='undefined'){
  console.error('[RICO TEST118] TileSet missing');
  return;
}
var previousUpdate118=TileSet.prototype.update;
function hasAnimatedChars118(tileSet){
  try{
    var data=tileSet&&tileSet.tileData?tileSet.tileData:[];
    for(var i=0;i<data.length;i++){
      var t=data[i];
      if(t&&t.props&&t.props.animated!==false&&typeof t.props.animated!=='undefined') return true;
    }
  }catch(e){}
  return false;
}
TileSet.prototype.update=function(tick){
  if(hasAnimatedChars118(this)){
    return false;
  }
  return previousUpdate118.apply(this,arguments);
};
window.RICO_TEST118_NO_CHAR_TICK_REPAINT=true;
console.log('[RICO TEST118] Character animation tick disabled in editor preview: zero tick-coupled repaint.');
})();