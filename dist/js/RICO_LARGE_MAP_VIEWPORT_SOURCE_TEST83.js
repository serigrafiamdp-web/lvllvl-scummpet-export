(function(){
'use strict';
if(typeof Graphic==='undefined'||typeof GridView2d==='undefined'){
  console.error('[RICO TEST83 UI] Graphic/GridView2d missing');
  return;
}

var nativeGetHeight83=Graphic.prototype.getGraphicHeight;
var previousDraw83=Graphic.prototype.drawFrame;
var gridMetricDepth83=0;

function mapCfg83(g,n){
  try{
    if(window.RICO_TEST79_MAP_SCROLL&&window.RICO_TEST79_MAP_SCROLL.getConfig)return window.RICO_TEST79_MAP_SCROLL.getConfig(g,n);
    if(window.RICO_TEST75_MAP_SCROLL&&window.RICO_TEST75_MAP_SCROLL.getConfig)return window.RICO_TEST75_MAP_SCROLL.getConfig(g,n);
  }catch(e){}
  return null;
}
function winCfg83(g,n){
  try{
    if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getConfig)return window.RICO_TEST75_WINDOW_DIMENSION.getConfig(g,n);
  }catch(e){}
  var w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e2){}
  return{x:0,y:0,width:w,height:h};
}
function areaCfg83(g,n){
  try{
    if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea)return window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea(g,n);
  }catch(e){}
  var w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e2){}
  return{x:0,y:0,width:w,height:h};
}
function active83(g,n){
  try{
    var c=mapCfg83(g,n);
    if(!c||!c.type)return false;
    var gh=g.getGridHeight(),gw=g.getGridWidth(),w=winCfg83(g,n),a=areaCfg83(g,n);
    if(gh<=25&&gw<=40)return false; // Regular-size projects retain their approved rendering.
    if(!w||!a||w.width<1||w.height<1||a.width<1||a.height<1)return false;
    // Source is larger than its camera; editor remains full-sized when Scroll is OFF.
    return w.width<gw||w.height<gh;
  }catch(e){return false;}
}
function ping83(phase,size){
  if(size<=1)return 0;
  var cycle=2*size-2;
  phase=mod83(phase,cycle);
  return phase<size?phase:cycle-phase;
}
function mod83(v,m){if(!m)return 0;v%=m;if(v<0)v+=m;return v;}
function bgCSS83(g,n){
  try{
    var pm=g&&g.editor&&g.editor.colorPaletteManager;
    var pal=pm&&pm.getCurrentColorPalette?pm.getCurrentColorPalette():null;
    var ci=g&&g.getBackgroundColor?g.getBackgroundColor(n):0;
    if(typeof ci!=='number'||ci<0)ci=0;
    if(pal&&pal.getHexString){var h=pal.getHexString(ci);if(h!==false&&h!==null&&typeof h!=='undefined')return '#'+h;}
  }catch(e){}
  return '#000000';
}
function phase83(g){
  try{var s=g.__ricoMap37;if(s&&typeof s.phase==='number'&&s.phase>=0)return s.phase|0;}catch(e){}
  return 0;
}
function nativeBorder83(g,n,ctx,canvas,ox,oy,w,h,sc){
  try{
    var ed=g&&g.editor;if(!ed||!ed.grid||!ed.grid.border||!ed.grid.border.visible||(g.getType&&g.getType()==='sprite'))return;
    var layer=ed.layers&&ed.layers.getSelectedLayerObject?ed.layers.getSelectedLayerObject():null;
    if(!layer||typeof layer.getBorderColor==='undefined'||!layer.getColorPalette)return;
    var pal=layer.getColorPalette(),bc=layer.getBorderColor();if(!pal||bc===ed.colorPaletteManager.noColor)return;
    var hex=pal.getHexString(bc);if(hex===false||hex===null||typeof hex==='undefined')return;
    var vw=w*sc,vh=h*sc,bw=32*sc;
    ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#'+hex;
    if(ox+bw>0)ctx.fillRect(ox-bw,oy-2,bw,vh+4);
    if(ox+vw<canvas.width)ctx.fillRect(ox+vw,oy-2,bw,vh+4);
    if(oy+bw>0)ctx.fillRect(ox-bw,oy-bw,(w+64)*sc,bw);
    ctx.fillRect(ox-bw,oy+vh,(w+64)*sc,bw);
    ctx.restore();
  }catch(e){console.error('[RICO TEST83 UI] border draw failed',e);}
}

// Only GridView2d sees the viewport height while MAP SCROLL is active.
// The document, Screen dimensions and all source rows stay untouched.
Graphic.prototype.getGraphicHeight=function(){
  if(gridMetricDepth83>0){
    try{
      var n=this.getCurrentFrame();
      if(active83(this,n)){
        var full=nativeGetHeight83.call(this),gh=this.getGridHeight(),w=winCfg83(this,n);
        if(gh>0&&w&&w.height>0)return full*(w.height/gh);
      }
    }catch(e){}
  }
  return nativeGetHeight83.apply(this,arguments);
};

function wrapGridMethod83(name){
  var fn=GridView2d.prototype[name];if(typeof fn!=='function'||fn.__rico83)return;
  var wrapped=function(){gridMetricDepth83++;try{return fn.apply(this,arguments);}finally{gridMetricDepth83--;}};
  wrapped.__rico83=true;GridView2d.prototype[name]=wrapped;
}
// draw() is the important one; these keep centering/scroll calculations coherent.
['draw','findViewBounds','calculateScroll','fitOnScreen','zoomToXY','setYScroll'].forEach(wrapGridMethod83);

Graphic.prototype.drawFrame=function(args){
  args=args||{};
  var n=typeof args.frame!=='undefined'?parseInt(args.frame,10):this.getCurrentFrame();
  if(!active83(this,n)||args.updateLayerCanvas===false||args.__ricoMap37||!args.canvas||!args.context){
    return previousDraw83.apply(this,arguments);
  }

  try{
    var cfg=mapCfg83(this,n),wc=winCfg83(this,n),ac=areaCfg83(this,n);
    var fullW=this.getGraphicWidth();
    var fullH=nativeGetHeight83.call(this);
    var gw=this.getGridWidth(),gh=this.getGridHeight();
    var cellW=fullW/Math.max(1,gw),cellH=fullH/Math.max(1,gh);
    var viewW=Math.max(1,wc.width*cellW),viewH=Math.max(1,wc.height*cellH);
    var areaX=ac.x*cellW,areaY=ac.y*cellH;
    var areaW=Math.max(1,ac.width*cellW),areaH=Math.max(1,ac.height*cellH);
    var sc=typeof args.scale!=='undefined'?args.scale:1;
    var areaMW=Math.max(1,Math.round(areaW*sc)),areaMH=Math.max(1,Math.round(areaH*sc));

    if(!this.__ricoLargeSource83)this.__ricoLargeSource83=document.createElement('canvas');
    var source=this.__ricoLargeSource83;source.width=areaMW;source.height=areaMH;
    var sx=UI.getContextNoSmoothing?UI.getContextNoSmoothing(source):source.getContext('2d');
    sx.clearRect(0,0,areaMW,areaMH);

    // Render the complete Scroll Area with native/full Screen metrics.
    var inner={};for(var k in args)if(args.hasOwnProperty(k))inner[k]=args[k];
    inner.__ricoMap37=true;inner.canvas=source;inner.context=sx;inner.frame=n;
    inner.srcX=areaX;inner.srcY=areaY;inner.srcWidth=areaW;inner.srcHeight=areaH;
    inner.dstX=0;inner.dstY=0;inner.drawAtX=0;inner.drawAtY=0;
    inner.dstWidth=areaMW;inner.dstHeight=areaMH;inner.scale=sc;inner.allCells=true;inner.drawPreviousFrame=false;
    var savedDepth=gridMetricDepth83;gridMetricDepth83=0;
    try{previousDraw83.call(this,inner);}finally{gridMetricDepth83=savedDepth;}

    var baseX,baseY;
    if(typeof args.drawAtX!=='undefined'){baseX=args.drawAtX;baseY=args.drawAtY;}
    else{baseX=(args.dstX||0)-(args.srcX||0)*sc;baseY=(args.dstY||0)-(args.srcY||0)*sc;}

    // Window is a camera into the full Scroll Area. It never truncates source data.
    var startX=(wc.x-ac.x)*cellW;
    var startY=(wc.y-ac.y)*cellH;
    var dist=phase83(this)*(parseInt(cfg.pixelsPerStep,10)||1);
    var movementX=0,movementY=0,repeat=false;
    switch(cfg.type){
      case'up':startY+=dist;repeat=true;break;
      case'down':startY-=dist;repeat=true;break;
      case'left':startX+=dist;repeat=true;break;
      case'right':startX-=dist;repeat=true;break;
      case'pingpong-left':movementX=-ping83(dist,areaW);break;
      case'pingpong-right':movementX=ping83(dist,areaW);break;
      case'pingpong-up':movementY=-ping83(dist,areaH);break;
      case'pingpong-down':movementY=ping83(dist,areaH);break;
      case'move-left':movementX=-Math.min(dist,Math.max(0,areaW-1));break;
      case'move-right':movementX=Math.min(dist,Math.max(0,areaW-1));break;
      case'move-up':movementY=-Math.min(dist,Math.max(0,areaH-1));break;
      case'move-down':movementY=Math.min(dist,Math.max(0,areaH-1));break;
      case'movein-left':movementX=Math.max(0,areaW-1)-Math.min(dist,Math.max(0,areaW-1));break;
      case'movein-right':movementX=-Math.max(0,areaW-1)+Math.min(dist,Math.max(0,areaW-1));break;
      case'movein-up':movementY=Math.max(0,areaH-1)-Math.min(dist,Math.max(0,areaH-1));break;
      case'movein-down':movementY=-Math.max(0,areaH-1)+Math.min(dist,Math.max(0,areaH-1));break;
    }
    if(repeat){startX=mod83(startX,areaW);startY=mod83(startY,areaH);}

    var ctx=args.context,tw=viewW*sc,th=viewH*sc;
    ctx.save();
    ctx.beginPath();ctx.rect(baseX,baseY,tw,th);ctx.clip();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=bgCSS83(this,n);ctx.fillRect(baseX,baseY,tw,th);

    var drawX=baseX-startX*sc+movementX*sc,drawY=baseY-startY*sc+movementY*sc;
    // Only continuous Scroll repeats source around the selected camera.
    // Ping Pong and Move keep the naturally exposed background (no phantom wrap).
    if(repeat){
      for(var yy=-1;yy<=1;yy++){
        for(var xx=-1;xx<=1;xx++){
          ctx.drawImage(source,drawX+xx*areaMW,drawY+yy*areaMH);
        }
      }
    }else{
      ctx.drawImage(source,drawX,drawY);
    }
    ctx.restore();
    nativeBorder83(this,n,ctx,args.canvas,baseX,baseY,viewW,viewH,sc);
    return;
  }catch(e){
    console.error('[RICO TEST83 UI] viewport source preview failed',e);
    return previousDraw83.apply(this,arguments);
  }
};

window.RICO_TEST83_LARGE_VIEWPORT={
  sourceScreenPreserved:true,
  viewportOnlyWhenScrollOn:true,
  fullScreenWhenScrollOff:true,
  sourceRowsNotCropped:true,
  scrollTypes:['left','right','up','down','pingpong-left','pingpong-right','pingpong-up','pingpong-down','move-left','move-right','move-up','move-down','movein-left','movein-right','movein-up','movein-down']
};
console.log('[RICO TEST169 UI] Large Screen stays editable when OFF; all map scroll types use Window viewport when ON.');
})();
