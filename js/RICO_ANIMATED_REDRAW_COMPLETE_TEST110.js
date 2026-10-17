(function(){
'use strict';
if(typeof Graphic==='undefined'){
  console.error('[RICO TEST110] Graphic missing');
  return;
}

var previousRedraw110=Graphic.prototype.redraw;
Graphic.prototype.redraw=function(args){
  if(args && args.animatedTilesOnly===true && typeof args.allCells==='undefined'){
    var safe={};
    for(var k in args) if(Object.prototype.hasOwnProperty.call(args,k)) safe[k]=args[k];
    safe.allCells=true;
    return previousRedraw110.call(this,safe);
  }
  return previousRedraw110.apply(this,arguments);
};

window.RICO_TEST110_ANIMATED_REDRAW_COMPLETE=true;
console.log('[RICO TEST110] animated redraw -> complete backbuffer frame before present.');
})();