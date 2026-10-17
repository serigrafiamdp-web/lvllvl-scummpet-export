(function(){
'use strict';
if(typeof Graphic==='undefined'){console.error('[RICO TEST81 UI] Graphic missing');return;}

var previousDraw81=Graphic.prototype.drawFrame;

function mapScrollCfg81(g,n){
  try{
    if(window.RICO_TEST79_MAP_SCROLL&&window.RICO_TEST79_MAP_SCROLL.getConfig)return window.RICO_TEST79_MAP_SCROLL.getConfig(g,n);
    if(window.RICO_TEST75_MAP_SCROLL&&window.RICO_TEST75_MAP_SCROLL.getConfig)return window.RICO_TEST75_MAP_SCROLL.getConfig(g,n);
  }catch(e){}
  return null;
}

Graphic.prototype.drawFrame=function(args){
  args=args||{};
  try{
    var n=typeof args.frame!=='undefined'?parseInt(args.frame,10):this.getCurrentFrame();
    var cfg=mapScrollCfg81(this,n);

    // TEST81 does not change Window/Scroll Area geometry at all.
    // It only gives the existing TEST79 clipped preview an opaque black backing
    // so unused canvas below/around a smaller viewport is never transparent.
    if(cfg&&cfg.type&&n===this.getCurrentFrame()&&args.updateLayerCanvas!==false&&!args.__ricoMap37&&args.canvas&&args.context){
      var ctx=args.context;
      ctx.save();
      if(ctx.setTransform)ctx.setTransform(1,0,0,1,0,0);
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='#000000';
      ctx.fillRect(0,0,args.canvas.width,args.canvas.height);
      ctx.restore();
    }
  }catch(e){console.error('[RICO TEST81 UI] black gap fill failed',e);}

  return previousDraw81.apply(this,arguments);
};

window.RICO_TEST81_VIEWPORT_BLACK_GAP={enabled:true,color:'#000000',geometryUntouched:true};
console.log('[RICO TEST81 UI] transparent viewport gap -> black backing; geometry untouched.');
})();
