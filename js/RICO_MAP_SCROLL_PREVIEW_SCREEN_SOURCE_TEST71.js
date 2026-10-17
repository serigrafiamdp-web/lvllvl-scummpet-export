(function(){
'use strict';
if(typeof Frames==='undefined'||typeof Graphic==='undefined'||typeof TileSet==='undefined'){console.error('[RICO TEST71 UI] dependencies missing');return;}
var FIELD='ricoMapScrollV1', DEF=6, DEF_PIX=1, PAL_TICK_MS=20, activeFrames58=null, previewLoop58=false;
var OPTS=[['','No'],['left','Scroll Left'],['right','Scroll Right'],['up','Scroll Up'],['down','Scroll Down'],['pingpong-left','Ping Pong Left'],['pingpong-right','Ping Pong Right'],['pingpong-up','Ping Pong Up'],['pingpong-down','Ping Pong Down'],['move-left','Move Out Left'],['move-right','Move Out Right'],['move-up','Move Out Up'],['move-down','Move Out Down'],['movein-left','Move In Left'],['movein-right','Move In Right'],['movein-up','Move In Up'],['movein-down','Move In Down']];
function tick(){var ms=0;try{if(typeof getTimestamp==='function')ms=getTimestamp();else if(typeof performance!=='undefined'&&performance.now)ms=performance.now();else ms=Date.now();}catch(e){ms=Date.now();}return Math.floor(ms/PAL_TICK_MS);}
function cfgClean(c){c=c||{};var t=c.type||'',ok=false;for(var i=0;i<OPTS.length;i++)if(OPTS[i][0]===t)ok=true;if(!ok)t='';var n=parseInt(c.ticksPerStep,10);if(isNaN(n)||n<1)n=DEF;if(n>255)n=255;var px=parseInt(c.pixelsPerStep,10);if(isNaN(px)||px<1)px=DEF_PIX;if(px>8)px=8;return{version:4,type:t,ticksPerStep:n,pixelsPerStep:px};}
function frameObj(g,n){if(!g||!g.frames)return null;if(typeof n==='undefined')n=g.getCurrentFrame();return n>=0&&n<g.frames.length?g.frames[n]:null;}
function getCfg(g,n){var f=frameObj(g,n);return f&&f[FIELD]?cfgClean(f[FIELD]):cfgClean(null);}function winCfg(g,n){try{if(window.RICO_TEST67_WINDOW_DIMENSION&&window.RICO_TEST67_WINDOW_DIMENSION.getConfig)return window.RICO_TEST67_WINDOW_DIMENSION.getConfig(g,n);}catch(e){}var w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e2){}return{x:0,y:0,width:w,height:h};}
function reset(g,n){if(!g)return;g.__ricoMap37={frame:typeof n==='number'?n:g.getCurrentFrame(),start:tick(),phase:-1};}
function setCfg(g,n,c){var f=frameObj(g,n);if(!f)return;f[FIELD]=cfgClean(c);reset(g,n);try{g.invalidateAllCells();g.redraw({allCells:true});}catch(e){}}
function phase(g,n,c,now){var s=g.__ricoMap37;if(!s||s.frame!==n||now<s.start){reset(g,n);s=g.__ricoMap37;}return Math.floor(Math.max(0,now-s.start)/c.ticksPerStep);}
function ping(p,size){if(size<=1)return 0;var cyc=size*2-2;p=((p%cyc)+cyc)%cyc;return p<size?p:cyc-p;}
function bgCSS(g,n){try{var pm=g&&g.editor&&g.editor.colorPaletteManager, pal=pm&&pm.getCurrentColorPalette?pm.getCurrentColorPalette():null, ci=g&&g.getBackgroundColor?g.getBackgroundColor(n):0;if((typeof ci!=='number'||ci<0))ci=0;if(pal&&pal.getHexString){var h=pal.getHexString(ci);if(h!==false&&typeof h!=='undefined'&&h!==null)return '#'+h;}}catch(e){}return '#000000';}
function options(v){var h='';for(var i=0;i<OPTS.length;i++)h+='<option value="'+OPTS[i][0]+'"'+(OPTS[i][0]===v?' selected':'')+'>'+OPTS[i][1]+'</option>';return h;}
function removeTicksWord(){var e=document.getElementById('frameDuration');if(!e||e.__rico37)return;e.__rico37=true;e.title='Frame Duration (ticks)';for(var n=e.nextSibling;n;n=n.nextSibling){if(n.nodeType===3&&/ticks/i.test(n.nodeValue||'')){n.nodeValue=(n.nodeValue||'').replace(/\s*ticks\s*/i,' ');break;}if(n.nodeType===1&&n.classList&&n.classList.contains('frameControlSeparator'))break;}}
function graphicOf(fc){return fc&&fc.editor?fc.editor.graphic:null;}
function drawNativeBorder58(g,n,ctx,canvas,ox,oy,nw,nh,sc){try{var ed=g&&g.editor;if(!ed||!ed.grid||!ed.grid.border||!ed.grid.border.visible||(g.getType&&g.getType()==='sprite'))return;var vw=nw*sc,vh=nh*sc;if(!(ox>0||oy>0||ox+vw<canvas.width||oy+vh<canvas.height))return;var layer=ed.layers&&ed.layers.getSelectedLayerObject?ed.layers.getSelectedLayerObject():null;if(!layer||typeof layer.getBorderColor==='undefined'||!layer.getColorPalette)return;var pal=layer.getColorPalette(),bc=layer.getBorderColor();if(!pal||bc===ed.colorPaletteManager.noColor)return;var hex=pal.getHexString(bc);if(hex===false||typeof hex==='undefined'||hex===null)return;var bw=32*sc;ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#'+hex;if(ox+bw>0)ctx.fillRect(ox-bw,oy-2,bw,vh+4);if(ox+vw<canvas.width)ctx.fillRect(ox+vw,oy-2,bw,vh+4);if(oy+bw>0)ctx.fillRect(ox-bw,oy-bw,(nw+64)*sc,bw);ctx.fillRect(ox-bw,oy+vh,(nw+64)*sc,bw);ctx.restore();}catch(e){console.error('[RICO TEST71 UI] border preview failed',e);}}
function previewPump58(){try{var fc=activeFrames58,g=graphicOf(fc);if(g&&g.frames&&g.frames.length){var n=g.getCurrentFrame(),cfg=getCfg(g,n);if(cfg.type){var p=phase(g,n,cfg,tick()),s=g.__ricoMap37;if(s&&s.phase!==p){s.phase=p;g.redraw({allCells:true});}}}}catch(e){console.error('[RICO TEST71 UI] preview pump failed',e);}if(typeof requestAnimationFrame==='function')requestAnimationFrame(previewPump58);}
function startPreviewPump58(){if(previewLoop58||typeof requestAnimationFrame!=='function')return;previewLoop58=true;requestAnimationFrame(previewPump58);}
function refreshButton(fc){var b=$('#ricoMapScrollButton37');if(!b.length)return;var g=graphicOf(fc);if(!g)return;var c=getCfg(g,g.getCurrentFrame());b.text('MAP SCROLL'+(c.type?' · ON':''));b.css('font-weight',c.type?'bold':'');b.attr('title',c.type?(c.type+' · '+c.ticksPerStep+' ticks/step · '+c.pixelsPerStep+' px/step'):'Map Scroll settings for this frame');}
function ensureDialog(fc){if(UI.get&&UI.get('ricoMapScrollDialog37'))return;var d=UI.create('UI.Dialog',{id:'ricoMapScrollDialog37',title:'MAP SCROLL',width:430,height:245});var p=UI.create('UI.HTMLPanel',{html:'<div style="padding:16px 18px"><div style="margin-bottom:14px"><label style="display:inline-block;width:125px">Map Scroll:</label><select id="ricoMapScrollType37" style="width:210px">'+options('')+'</select></div><div style="margin-bottom:10px"><label style="display:inline-block;width:125px">Ticks / Step:</label><input id="ricoMapScrollTicks37" class="number integer" type="number" min="1" max="255" value="6" style="width:70px"></div><div><label style="display:inline-block;width:125px">Pixels / Step:</label><input id="ricoMapScrollPixels37" class="number integer" type="number" min="1" max="8" value="1" style="width:70px"> <span style="color:#aaa;font-size:11px">1–8 px</span></div><div id="ricoMapScrollInfo37" style="margin-top:16px;color:#aaa;font-size:11px">Stored independently for each LVLLVL frame.</div></div>'});d.add(p);var ok=UI.create('UI.Button',{text:'OK',color:'primary'});d.addButton(ok);ok.on('click',function(){var g=graphicOf(fc);if(g){var n=parseInt($('#ricoMapScrollTicks37').val(),10);if(isNaN(n)||n<1)n=DEF;var px=parseInt($('#ricoMapScrollPixels37').val(),10);if(isNaN(px)||px<1)px=DEF_PIX;if(px>8)px=8;setCfg(g,g.getCurrentFrame(),{type:$('#ricoMapScrollType37').val()||'',ticksPerStep:n,pixelsPerStep:px});}refreshButton(fc);UI.closeDialog();});var ca=UI.create('UI.Button',{text:'Cancel',color:'secondary'});d.addButton(ca);ca.on('click',function(){UI.closeDialog();});}
function openDialog(fc){var g=graphicOf(fc);if(!g)return;ensureDialog(fc);var c=getCfg(g,g.getCurrentFrame()),f=frameObj(g);$('#ricoMapScrollType37').html(options(c.type)).val(c.type);$('#ricoMapScrollTicks37').val(c.ticksPerStep);$('#ricoMapScrollPixels37').val(c.pixelsPerStep);$('#ricoMapScrollInfo37').text('Frame '+(g.getCurrentFrame()+1)+' · Frame Duration: '+(f&&f.duration?f.duration:'?')+' ticks · '+c.pixelsPerStep+' px every '+c.ticksPerStep+' tick'+(c.ticksPerStep===1?'':'s'));UI.showDialog('ricoMapScrollDialog37');}
function install(fc){activeFrames58=fc;startPreviewPump58();if($('#ricoMapScrollButton37').length){refreshButton(fc);return;}var d=$('#frameDuration');if(!d.length)return;removeTicksWord();var b=$('<div class="ui-button" id="ricoMapScrollButton37" style="margin-left:8px;vertical-align:middle">MAP SCROLL</div>');d.after(b);b.on('click.rico37',function(){openDialog(fc);});refreshButton(fc);}
var oldInit=Frames.prototype.initEvents;Frames.prototype.initEvents=function(){var r=oldInit.apply(this,arguments);install(this);return r;};
var oldGoto=Frames.prototype.gotoFrame;Frames.prototype.gotoFrame=function(n){var r=oldGoto.apply(this,arguments),g=graphicOf(this);if(g)reset(g,g.getCurrentFrame());refreshButton(this);return r;};
var oldInsert=Graphic.prototype.insertFrame;Graphic.prototype.insertFrame=function(){var n=oldInsert.apply(this,arguments);if(n>=0&&n<this.frames.length&&!this.frames[n][FIELD])this.frames[n][FIELD]=cfgClean(null);return n;};
var oldDup=Graphic.prototype.duplicateFrame;Graphic.prototype.duplicateFrame=function(n){var src=typeof n==='undefined'?this.currentFrame:parseInt(n,10),c=getCfg(this,src),r=oldDup.apply(this,arguments);if(r>=0&&r<this.frames.length)this.frames[r][FIELD]=cfgClean(c);return r;};
var oldDraw=Graphic.prototype.drawFrame;
Graphic.prototype.drawFrame=function(a){
  a=a||{};
  var n=typeof a.frame!=='undefined'?parseInt(a.frame,10):this.getCurrentFrame(),cfg=getCfg(this,n);
  if(!cfg.type||n!==this.getCurrentFrame()||a.updateLayerCanvas===false||a.__ricoMap37)return oldDraw.apply(this,arguments);
  if(!a.canvas||!a.context)return oldDraw.apply(this,arguments);

  var sc=typeof a.scale!=='undefined'?a.scale:1;
  var fullW=this.getGraphicWidth(),fullH=this.getGraphicHeight();
  var gridW=40,gridH=25;
  try{gridW=this.getGridWidth();gridH=this.getGridHeight();}catch(e){}
  var cellW=fullW/Math.max(1,gridW),cellH=fullH/Math.max(1,gridH);
  var wc=winCfg(this,n);
  var viewX=wc.x*cellW,viewY=wc.y*cellH;
  var viewW=Math.max(1,wc.width*cellW),viewH=Math.max(1,wc.height*cellH);
  var mw=Math.max(1,Math.round(fullW*sc)),mh=Math.max(1,Math.round(fullH*sc));

  if(!this.__ricoMapScreenSurface71)this.__ricoMapScreenSurface71=document.createElement('canvas');
  var s=this.__ricoMapScreenSurface71;s.width=mw;s.height=mh;
  var sx=UI.getContextNoSmoothing?UI.getContextNoSmoothing(s):s.getContext('2d');
  sx.clearRect(0,0,mw,mh);
  var inner={};for(var k in a)if(a.hasOwnProperty(k))inner[k]=a[k];
  inner.__ricoMap37=true;inner.canvas=s;inner.context=sx;inner.frame=n;
  inner.srcX=0;inner.srcY=0;inner.srcWidth=fullW;inner.srcHeight=fullH;
  inner.dstX=0;inner.dstY=0;inner.drawAtX=0;inner.drawAtY=0;
  inner.dstWidth=mw;inner.dstHeight=mh;inner.scale=sc;inner.allCells=true;inner.drawPreviousFrame=false;
  oldDraw.call(this,inner);

  var baseOx,baseOy;
  if(typeof a.drawAtX!=='undefined'){baseOx=a.drawAtX;baseOy=a.drawAtY;}
  else{baseOx=(a.dstX||0)-(a.srcX||0)*sc;baseOy=(a.dstY||0)-(a.srcY||0)*sc;}
  var clipX=baseOx+viewX*sc,clipY=baseOy+viewY*sc,clipW=viewW*sc,clipH=viewH*sc;

  var p=phase(this,n,cfg,tick()),dist=p*cfg.pixelsPerStep,dxs=0,dys=0,wrapX=false,wrapY=false;
  switch(cfg.type){
    case'left':dxs=-(dist%fullW);wrapX=true;break;
    case'right':dxs=dist%fullW;wrapX=true;break;
    case'up':dys=-(dist%fullH);wrapY=true;break;
    case'down':dys=dist%fullH;wrapY=true;break;
    case'pingpong-left':dxs=-ping(dist,fullW);break;
    case'pingpong-right':dxs=ping(dist,fullW);break;
    case'pingpong-up':dys=-ping(dist,fullH);break;
    case'pingpong-down':dys=ping(dist,fullH);break;
    case'move-left':dxs=-Math.min(dist,Math.max(0,fullW-1));break;
    case'move-right':dxs=Math.min(dist,Math.max(0,fullW-1));break;
    case'move-up':dys=-Math.min(dist,Math.max(0,fullH-1));break;
    case'move-down':dys=Math.min(dist,Math.max(0,fullH-1));break;
    case'movein-left':dxs=Math.max(0,fullW-1)-Math.min(dist,Math.max(0,fullW-1));break;
    case'movein-right':dxs=-Math.max(0,fullW-1)+Math.min(dist,Math.max(0,fullW-1));break;
    case'movein-up':dys=Math.max(0,fullH-1)-Math.min(dist,Math.max(0,fullH-1));break;
    case'movein-down':dys=-Math.max(0,fullH-1)+Math.min(dist,Math.max(0,fullH-1));break;
  }
  var dx=dxs*sc,dy=dys*sc,ctx=a.context;
  ctx.save();ctx.beginPath();ctx.rect(clipX,clipY,clipW,clipH);ctx.clip();
  if(!wrapX&&!wrapY){ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=bgCSS(this,n);ctx.fillRect(clipX,clipY,clipW,clipH);}
  if(wrapX){ctx.drawImage(s,baseOx+dx-mw,baseOy);ctx.drawImage(s,baseOx+dx,baseOy);ctx.drawImage(s,baseOx+dx+mw,baseOy);}
  else if(wrapY){ctx.drawImage(s,baseOx,baseOy+dy-mh);ctx.drawImage(s,baseOx,baseOy+dy);ctx.drawImage(s,baseOx,baseOy+dy+mh);}
  else{ctx.drawImage(s,baseOx+dx,baseOy+dy);}
  ctx.restore();
  drawNativeBorder58(this,n,ctx,a.canvas,clipX,clipY,viewW,viewH,sc);
};
var oldUpdate=TileSet.prototype.update;TileSet.prototype.update=function(t){var r=oldUpdate.apply(this,arguments);try{var g=this.editor&&this.editor.graphic;if(g&&g.frames&&g.frames.length){var n=g.getCurrentFrame(),c=getCfg(g,n);if(c.type){var p=phase(g,n,c,tick()),s=g.__ricoMap37;if(s&&s.phase!==p){s.phase=p;g.redraw({allCells:true});return true;}}}}catch(e){console.error('[RICO TEST71 UI] update failed',e);}return r;};
window.RICO_TEST71_MAP_SCROLL={getConfig:getCfg,setConfig:setCfg,field:FIELD,moveOut:true,moveIn:true,previewPalHz:50,zoomSynced:true,borderPreserved:true,screenIsScrollSource:true,windowIsViewport:true};
window.RICO_TEST69_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST67_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST65_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST59_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST58_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST57_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST56_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
window.RICO_TEST37_MAP_SCROLL=window.RICO_TEST71_MAP_SCROLL;
console.log('[RICO TEST71 UI] MAP SCROLL preview: full Screen source clipped by Window viewport');
})();