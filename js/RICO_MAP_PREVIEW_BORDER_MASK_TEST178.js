/* RICO TEST180 — keep the native-sized C64 border around the viewport ONLY.
 * TEST179 incorrectly filled ALL editor space outside Rico's Window using
 * the selected border color, invisible with black but obvious with cyan.
 * Draw editor-black outside the C64; render the actual C64 border as a
 * 32-pixel band (scaled with editor zoom), keep uncovered screen cells in
 * screen background color. No Screen data, Window geometry or PRG changes.
 */
(function(){
'use strict';
if(typeof GridView2d==='undefined' || typeof Graphic==='undefined')return;

function mapConfig(g,frame){
  try { var m=window.RICO_TEST79_MAP_SCROLL;
    return m && typeof m.getConfig==='function'?m.getConfig(g,frame):null;
  } catch(e){return null;}
}
function windowConfig(g,frame){
  try { var w=window.RICO_TEST75_WINDOW_DIMENSION;
    return w&&w.getConfig?w.getConfig(g,frame):null;
  } catch(e){return null;}
}
function areaConfig(g,frame){
  try { var w=window.RICO_TEST75_WINDOW_DIMENSION;
    return w&&w.getScrollArea?w.getScrollArea(g,frame):null;
  } catch(e){return null;}
}
function supportedMovement(cfg){
  // TEST179: horizontal Map Scroll must obey the same Window mask
  // as TEST178's approved vertical mode. Leave OFF and legacy 40x25 alone.
  return cfg && /^(?:up|down|left|right|pingpong-up|pingpong-down|pingpong-left|pingpong-right|move-up|move-down|move-left|move-right|movein-up|movein-down|movein-left|movein-right)$/.test(cfg.type||'');
}
function state(view){
  try {
    var ed=view&&view.editor, g=ed&&ed.graphic;
    if(!g || !ed.grid || g.getType&&g.getType()==='sprite')return null;
    var frame=g.getCurrentFrame(),cfg=mapConfig(g,frame),w=windowConfig(g,frame),a=areaConfig(g,frame);
    if(!supportedMovement(cfg)||!w||!a)return null;
    var cols=g.getGridWidth(),rows=g.getGridHeight();
    if(cols<=40&&rows<=25)return null; // legacy 40x25 untouched
    if(w.width>=cols&&w.height>=rows)return null; // no camera crop
    var gw=g.getGraphicWidth(),gh=g.getGraphicHeight(),sx=view.displayScale;
    if(!(sx>0)||!(cols>0)||!(rows>0)||!(w.width>0)||!(w.height>0))return null;
    var px=gw/cols,py=gh/rows;
    // TEST83 presents Window at full Screen's X origin but viewport Y size.
    var x=Math.floor(view.width/2-gw*sx/2-view.camera.position.x*sx);
    var camH=w.height*py;
    var y=Math.floor(view.height/2-camH*sx/2+view.camera.position.y*sx);
    return {x:x,y:y,width:w.width*px*sx,height:camH*sx,
      left:(a.x-w.x)*px*sx,
      right:(w.x+w.width-a.x-a.width)*px*sx,
      border:borderColor(ed),
      showBorder:!!(ed.grid&&ed.grid.border&&ed.grid.border.visible),
      borderSize:32*sx,
      background:screenBackgroundColor(ed,frame)};
  }catch(e){return null;}
}
function borderColor(editor){
  try {
    var layer=editor.layers.getSelectedLayerObject();
    if(layer&&layer.getBorderColor&&layer.getColorPalette){
      var bc=layer.getBorderColor();
      if(bc!==editor.colorPaletteManager.noColor){
        var hex=layer.getColorPalette().getHexString(bc);
        if(hex!==false && hex!==null && typeof hex!=='undefined')return '#'+hex;
      }
    }
  }catch(e){}
  return '#000000';
}
function screenBackgroundColor(editor,frame){
  try {
    var g=editor.graphic;
    var ci=g&&g.getBackgroundColor?g.getBackgroundColor(frame):null;
    var palette=editor.colorPaletteManager&&editor.colorPaletteManager.getCurrentColorPalette
      ?editor.colorPaletteManager.getCurrentColorPalette():null;
    if(palette && typeof ci==='number' && ci>=0){
      var h=palette.getHexString(ci);
      if(h!==false && h!==null && typeof h!=='undefined')return '#'+h;
    }
    var layer=editor.layers&&editor.layers.getSelectedLayerObject
      ?editor.layers.getSelectedLayerObject():null;
    if(layer&&layer.getBackgroundColor&&layer.getColorPalette){
      var lc=layer.getBackgroundColor(frame),lp=layer.getColorPalette();
      if(lp&&typeof lc==='number'&&lc>=0){
        var hex=lp.getHexString(lc);
        if(hex!==false&&hex!==null&&typeof hex!=='undefined')return '#'+hex;
      }
    }
  }catch(e){}
  return '#000000';
}
function paint(ctx,x,y,w,h){if(w>0&&h>0)ctx.fillRect(x,y,w,h);}
function drawBorder(view,s){
  if(!s || !view.context)return;
  var ctx=view.context;
  var maxW=Math.max(0,view.viewWidth||view.width-(view.vScrollBarWidth||0));
  var maxH=Math.max(0,view.viewHeight||view.height-(view.hScrollBarHeight||0));
  var x=s.x,y=s.y,x2=x+s.width,y2=y+s.height;
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,maxW,maxH);ctx.clip();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';

  // IMPORTANT: this is NOT the VIC-II border. It is the workbench outside
  // the simulated C64. Clean up the checkerboard/grid there using neutral
  // black, not the user's border color (TEST179 regression).
  ctx.fillStyle='#000000';
  paint(ctx,0,0,maxW,y);
  paint(ctx,0,y2,maxW,maxH-y2);
  paint(ctx,0,y,x,s.height);
  paint(ctx,x2,y,maxW-x2,s.height);

  // The VIC-II C64 border is a fixed 32 logical pixels on every side of
  // the visible Window, independent of Screen/Scroll Area sizes. Native
  // TEST83 already draws it; the workbench cleanup above covered it, so
  // paint ONLY this narrow ring once again. Do not flood the editor.
  if(s.showBorder && s.borderSize>0){
    var b=s.borderSize;
    ctx.fillStyle=s.border;
    paint(ctx,x-b,y-b,s.width+2*b,b);
    paint(ctx,x-b,y2,s.width+2*b,b);
    paint(ctx,x-b,y,b,s.height);
    paint(ctx,x2,y,b,s.height);
  }

  // Cells in Window but outside Scroll Area belong to the C64 screen,
  // not to its border. A narrow source must show the SCREEN background
  // color here, while staying opaque and free of checkerboard artifacts.
  ctx.fillStyle=s.background;
  if(s.left>0)paint(ctx,x,y,Math.min(s.width,s.left),s.height);
  if(s.right>0)paint(ctx,Math.max(x,x2-s.right),y,Math.min(s.width,s.right),s.height);
  ctx.restore();
}
// Don't draw editing grid lines into the C64 border.  Keep the original
// inside the picture; the legacy GridView2d drawGrid stays unmodified.
var originalGrid=GridView2d.prototype.drawGrid;
GridView2d.prototype.drawGrid=function(){
  var s=typeof this.__rico178DrawState!=='undefined'?this.__rico178DrawState:state(this);
  if(!s)return originalGrid.apply(this,arguments);
  var ctx=this.context;if(!ctx)return originalGrid.apply(this,arguments);
  ctx.save();ctx.beginPath();ctx.rect(s.x,s.y,s.width,s.height);ctx.clip();
  try{return originalGrid.apply(this,arguments);}finally{ctx.restore();}
};
var originalDraw=GridView2d.prototype.draw;
GridView2d.prototype.draw=function(){
  // Resolve before TEST83 temporarily exposes cropped getGraphicHeight()
  // for its camera calculations. DrawGrid must reuse the full-size metrics.
  var s=state(this),prev=this.__rico178DrawState;
  this.__rico178DrawState=s;
  var result;
  try{result=originalDraw.apply(this,arguments);}
  finally{this.__rico178DrawState=prev;}
  drawBorder(this,s);
  return result;
};
window.RICO_TEST178_PREVIEW_BORDER={enabled:true,verticalMapOnly:false,horizontalMap:true,test179:true,test180:true,c64BorderOnly:true,sourceUntouched:true,
  windowUntouched:true,exporterUntouched:true,getState:state};
console.log('[RICO TEST180] C64 32px border only; editor exterior black and blank screen cells use background color.');
})();
