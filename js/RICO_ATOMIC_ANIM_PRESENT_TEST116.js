(function(){
'use strict';
if(typeof Graphic==='undefined'){
  console.error('[RICO TEST116] Graphic missing');
  return;
}
var previousRedraw116=Graphic.prototype.redraw;
Graphic.prototype.redraw=function(args){
  if(!(args&&args.animatedTilesOnly===true)){
    return previousRedraw116.apply(this,arguments);
  }
  var gv=this.editor&&this.editor.gridView2d?this.editor.gridView2d:null;
  if(!gv||!gv.canvas||!gv.context){
    return previousRedraw116.apply(this,arguments);
  }
  var visibleCanvas=gv.canvas;
  var visibleContext=gv.context;
  var w=Math.max(1,visibleCanvas.width||gv.width||1);
  var h=Math.max(1,visibleCanvas.height||gv.height||1);
  if(!gv.__ricoAtomicPresentCanvas116){
    gv.__ricoAtomicPresentCanvas116=document.createElement('canvas');
  }
  var stage=gv.__ricoAtomicPresentCanvas116;
  if(stage.width!==w) stage.width=w;
  if(stage.height!==h) stage.height=h;
  var stageContext=UI.getContextNoSmoothing?UI.getContextNoSmoothing(stage):stage.getContext('2d');
  stageContext.setTransform(1,0,0,1,0,0);
  stageContext.globalAlpha=1;
  stageContext.globalCompositeOperation='source-over';
  stageContext.clearRect(0,0,w,h);
  stageContext.drawImage(visibleCanvas,0,0);
  gv.canvas=stage;
  gv.context=stageContext;
  try{
    previousRedraw116.apply(this,arguments);
  } finally {
    gv.canvas=visibleCanvas;
    gv.context=visibleContext;
  }
  visibleContext.setTransform(1,0,0,1,0,0);
  visibleContext.globalAlpha=1;
  visibleContext.globalCompositeOperation='source-over';
  visibleContext.drawImage(stage,0,0);
  return true;
};
window.RICO_TEST116_ATOMIC_ANIM_PRESENT=true;
console.log('[RICO TEST116] Animated character redraw uses offscreen atomic present.');
})();