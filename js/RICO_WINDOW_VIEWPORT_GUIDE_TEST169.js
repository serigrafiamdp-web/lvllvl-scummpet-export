/* RICO TEST169 — viewport geometry, editor guide + auto effective Window.
 * When MAP SCROLL OFF: full Screen editable; outline never touches pixels/data/PRG.
 * When MAP SCROLL ON: TEST83 uses effective Window and complete Scroll Area.
 */
(function(){
'use strict';
if(typeof GridView2d==='undefined'||typeof Graphic==='undefined')return;
var geom=window.RICO_TEST75_WINDOW_DIMENSION;
if(!geom||typeof geom.getConfig!=='function')return;
var rawGet=geom.getConfig;
function grid(g){return{w:g.getGridWidth(),h:g.getGridHeight()};}
function rawFrame(g,n){return g.frames&&g.frames[n]||null;}
function effective(g,n){
  var raw=rawGet(g,n),s=grid(g),f=rawFrame(g,n);
  var saved=f&&f.ricoWindowDimensionV1;
  if(s.w<=40&&s.h<=25)return raw;
  var full=saved&&saved.x===0&&saved.y===0&&saved.width===s.w&&saved.height===s.h;
  if(!saved||full){
    return {version:1,x:0,y:0,width:Math.min(40,s.w),height:Math.min(25,s.h),clearOutside:false};
  }
  return raw;
}
geom.getConfig=effective;
window.RICO_TEST169_VIEWPORT_GEOMETRY={
  getEffectiveWindow:effective,
  maximum:{width:40,height:25},
  preservesScreen:true,autoInitialWindowWithoutMutation:true,
  editorGuideWhileScrollOff:true
};
var previousDraw=GridView2d.prototype.draw;
GridView2d.prototype.draw=function(){
  var result=previousDraw.apply(this,arguments);
  try{
    var e=this.editor,g=e&&e.graphic,ctx=this.context;
    if(!g||!ctx||!e||!e.layers||g.getType&&g.getType()==='sprite')return result;
    var s=grid(g),frame=g.getCurrentFrame(),f=rawFrame(g,frame);
    var mode=f&&f.ricoMapScrollV1;
    if(mode&&mode.type)return result; // animation already shows the Window, no guide.
    if(s.w<=40&&s.h<=25)return result;
    var w=effective(g,frame),cw=Math.min(40,s.w),ch=Math.min(25,s.h);
    var pxPerChar=g.getGraphicWidth()/s.w,pyPerChar=g.getGraphicHeight()/s.h;
    var scale=this.displayScale||1;
    // Position in the actual GridView2d canvas, not inside tile/frame data.
    var baseX=-(this.scrollX||0),baseY=-(this.scrollY||0);
    var originX=Math.max(0,Math.min(w.x,Math.max(0,s.w-cw)));
    var originY=Math.max(0,Math.min(w.y,Math.max(0,s.h-ch)));
    var gx=baseX+originX*pxPerChar*scale,gy=baseY+originY*pyPerChar*scale;
    var wx=baseX+w.x*pxPerChar*scale,wy=baseY+w.y*pyPerChar*scale;
    ctx.save();ctx.beginPath();ctx.rect(0,0,this.viewWidth||this.width,this.viewHeight||this.height);ctx.clip();
    ctx.globalAlpha=0.96;ctx.strokeStyle='#ff3535';ctx.lineWidth=2;
    ctx.setLineDash([]);
    ctx.strokeRect(Math.round(gx)+0.5,Math.round(gy)+0.5,cw*pxPerChar*scale,ch*pyPerChar*scale);
    if(w.x!==originX||w.y!==originY||w.width!==cw||w.height!==ch){
      ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.setLineDash([5,4]);
      ctx.strokeRect(Math.round(wx)+0.5,Math.round(wy)+0.5,w.width*pxPerChar*scale,w.height*pyPerChar*scale);
    }
    ctx.restore();
  }catch(e){console.warn('[RICO TEST169] viewport guide draw',e);}
  return result;
};
console.log('[RICO TEST169] Full Screen editable; red C64 40x25 guide, Window on Scroll ON.');
})();
