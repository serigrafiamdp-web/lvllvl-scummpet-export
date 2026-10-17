(function(){
'use strict';
if(typeof Graphic==='undefined'){console.error('[RICO TEST115] Graphic missing');return;}
var previousRedraw115=Graphic.prototype.redraw;
var previousDrawFrame115=Graphic.prototype.drawFrame;
Graphic.prototype.redraw=function(args){
  var gv=this.editor&&this.editor.gridView2d?this.editor.gridView2d:null;
  if(gv&&args&&args.animatedTilesOnly===true){
    gv.__ricoAnimatedTilesOnly115=true;
    try{return previousRedraw115.apply(this,arguments);}finally{gv.__ricoAnimatedTilesOnly115=false;}
  }
  return previousRedraw115.apply(this,arguments);
};
Graphic.prototype.drawFrame=function(args){
  var gv=this.editor&&this.editor.gridView2d?this.editor.gridView2d:null;
  if(gv&&gv.__ricoAnimatedTilesOnly115){
    args=args||{};
    var safe={};for(var k in args)if(Object.prototype.hasOwnProperty.call(args,k))safe[k]=args[k];
    safe.animatedTilesOnly=true;
    return previousDrawFrame115.call(this,safe);
  }
  return previousDrawFrame115.apply(this,arguments);
};
window.RICO_TEST115_FULL_CHAR_TICK_DECOUPLE=true;
console.log('[RICO TEST115] Character tick redraw bypasses TEST83 + TEST81 + TEST79.');
})();