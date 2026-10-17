(function(){
'use strict';
if(typeof Graphic==='undefined'){
  console.error('[RICO TEST113] Graphic missing');
  return;
}
var previousRedraw113=Graphic.prototype.redraw;
var previousDrawFrame113=Graphic.prototype.drawFrame;

Graphic.prototype.redraw=function(args){
  var gv=this.editor&&this.editor.gridView2d?this.editor.gridView2d:null;
  var animOnly=!!(args&&args.animatedTilesOnly===true);
  if(gv&&animOnly){
    gv.__ricoAnimatedTilesOnly113=true;
    try{
      return previousRedraw113.apply(this,arguments);
    } finally {
      gv.__ricoAnimatedTilesOnly113=false;
    }
  }
  return previousRedraw113.apply(this,arguments);
};

Graphic.prototype.drawFrame=function(args){
  var gv=this.editor&&this.editor.gridView2d?this.editor.gridView2d:null;
  if(gv&&gv.__ricoAnimatedTilesOnly113){
    var safe={};
    args=args||{};
    for(var k in args) if(Object.prototype.hasOwnProperty.call(args,k)) safe[k]=args[k];
    safe.animatedTilesOnly=true;
    return previousDrawFrame113.call(this,safe);
  }
  return previousDrawFrame113.apply(this,arguments);
};

window.RICO_TEST113_PRESERVE_ANIMATED_ONLY=true;
console.log('[RICO TEST113] Preserve animatedTilesOnly through GridView2d and bypass MAP SCROLL full redraw.');
})();