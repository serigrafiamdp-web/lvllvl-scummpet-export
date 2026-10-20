(function(){
'use strict';
if(typeof Frames==='undefined'||typeof Graphic==='undefined'||typeof TileSet==='undefined'){console.error('[RICO TEST79 UI] dependencies missing');return;}
var FIELD='ricoMapScrollV1', DEF=6, DEF_PIX=1, PAL_TICK_MS=20, activeFrames58=null, previewLoop58=false, stepping79=false;
var pause79={paused:false,rawStart:0,offset:0,frozen:0};
var autoFit177=null;
var OPTS=[['','No'],['left','Scroll Left'],['right','Scroll Right'],['up','Scroll Up'],['down','Scroll Down'],['pingpong-left','Ping Pong Left'],['pingpong-right','Ping Pong Right'],['pingpong-up','Ping Pong Up'],['pingpong-down','Ping Pong Down'],['move-left','Move Out Left'],['move-right','Move Out Right'],['move-up','Move Out Up'],['move-down','Move Out Down'],['movein-left','Move In Left'],['movein-right','Move In Right'],['movein-up','Move In Up'],['movein-down','Move In Down']];
function rawTick79(){var ms=0;try{if(typeof getTimestamp==='function')ms=getTimestamp();else if(typeof performance!=='undefined'&&performance.now)ms=performance.now();else ms=Date.now();}catch(e){ms=Date.now();}return Math.floor(ms/PAL_TICK_MS);}
function tick(){var r=rawTick79();return pause79.paused?pause79.frozen:(r-pause79.offset);}
function updatePause79(){var b=$('#ricoMapScrollPause79');if(b.length)b.text(pause79.paused?'PLAY':'PAUSE');}
function setPaused79(v){v=!!v;if(v===pause79.paused){updatePause79();return;}var r=rawTick79();if(v){pause79.frozen=r-pause79.offset;pause79.rawStart=r;pause79.paused=true;}else{pause79.offset+=Math.max(0,r-pause79.rawStart);pause79.paused=false;}updatePause79();try{var g=graphicOf(activeFrames58);if(g)g.redraw({allCells:true});}catch(e){}}
function cfgClean(c){c=c||{};var t=c.type||'',ok=false;for(var i=0;i<OPTS.length;i++)if(OPTS[i][0]===t)ok=true;if(!ok)t='';var n=parseInt(c.ticksPerStep,10);if(isNaN(n)||n<1)n=DEF;if(n>255)n=255;var px=parseInt(c.pixelsPerStep,10);if(isNaN(px)||px<1)px=DEF_PIX;if(px>8)px=8;return{version:4,type:t,ticksPerStep:n,pixelsPerStep:px};}
function frameObj(g,n){if(!g||!g.frames)return null;if(typeof n==='undefined')n=g.getCurrentFrame();return n>=0&&n<g.frames.length?g.frames[n]:null;}
function getCfg(g,n){var f=frameObj(g,n);return f&&f[FIELD]?cfgClean(f[FIELD]):cfgClean(null);}function winCfg(g,n){try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getConfig)return window.RICO_TEST75_WINDOW_DIMENSION.getConfig(g,n);if(window.RICO_TEST67_WINDOW_DIMENSION&&window.RICO_TEST67_WINDOW_DIMENSION.getConfig)return window.RICO_TEST67_WINDOW_DIMENSION.getConfig(g,n);}catch(e){}var w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e2){}return{x:0,y:0,width:w,height:h};}function scrollAreaCfg(g,n){try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea)return window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea(g,n);}catch(e){}var w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e2){}return{x:0,y:0,width:w,height:h};}
function reset(g,n){if(!g)return;g.__ricoMap37={frame:typeof n==='number'?n:g.getCurrentFrame(),start:tick(),phase:-1};}
function setCfg(g,n,c){var f=frameObj(g,n);if(!f)return;f[FIELD]=cfgClean(c);reset(g,n);try{g.invalidateAllCells();g.redraw({allCells:true});}catch(e){}}
function phase(g,n,c,now){var s=g.__ricoMap37;if(!s||s.frame!==n||now<s.start){reset(g,n);s=g.__ricoMap37;}return Math.floor(Math.max(0,now-s.start)/c.ticksPerStep);}
function ping(p,size){if(size<=1)return 0;var cyc=size*2-2;p=((p%cyc)+cyc)%cyc;return p<size?p:cyc-p;}
function bgCSS(g,n){try{var pm=g&&g.editor&&g.editor.colorPaletteManager, pal=pm&&pm.getCurrentColorPalette?pm.getCurrentColorPalette():null, ci=g&&g.getBackgroundColor?g.getBackgroundColor(n):0;if((typeof ci!=='number'||ci<0))ci=0;if(pal&&pal.getHexString){var h=pal.getHexString(ci);if(h!==false&&typeof h!=='undefined'&&h!==null)return '#'+h;}}catch(e){}return '#000000';}
function options(v){var h='';for(var i=0;i<OPTS.length;i++)h+='<option value="'+OPTS[i][0]+'"'+(OPTS[i][0]===v?' selected':'')+'>'+OPTS[i][1]+'</option>';return h;}
function removeTicksWord(){var e=document.getElementById('frameDuration');if(!e||e.__rico37)return;e.__rico37=true;e.title='Frame Duration (ticks)';for(var n=e.nextSibling;n;n=n.nextSibling){if(n.nodeType===3&&/ticks/i.test(n.nodeValue||'')){n.nodeValue=(n.nodeValue||'').replace(/\s*ticks\s*/i,' ');break;}if(n.nodeType===1&&n.classList&&n.classList.contains('frameControlSeparator'))break;}}
function graphicOf(fc){return fc&&fc.editor?fc.editor.graphic:null;}
function drawNativeBorder58(g,n,ctx,canvas,ox,oy,nw,nh,sc){try{var ed=g&&g.editor;if(!ed||!ed.grid||!ed.grid.border||!ed.grid.border.visible||(g.getType&&g.getType()==='sprite'))return;var vw=nw*sc,vh=nh*sc;if(!(ox>0||oy>0||ox+vw<canvas.width||oy+vh<canvas.height))return;var layer=ed.layers&&ed.layers.getSelectedLayerObject?ed.layers.getSelectedLayerObject():null;if(!layer||typeof layer.getBorderColor==='undefined'||!layer.getColorPalette)return;var pal=layer.getColorPalette(),bc=layer.getBorderColor();if(!pal||bc===ed.colorPaletteManager.noColor)return;var hex=pal.getHexString(bc);if(hex===false||typeof hex==='undefined'||hex===null)return;var bw=32*sc;ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#'+hex;if(ox+bw>0)ctx.fillRect(ox-bw,oy-2,bw,vh+4);if(ox+vw<canvas.width)ctx.fillRect(ox+vw,oy-2,bw,vh+4);if(oy+bw>0)ctx.fillRect(ox-bw,oy-bw,(nw+64)*sc,bw);ctx.fillRect(ox-bw,oy+vh,(nw+64)*sc,bw);ctx.restore();}catch(e){console.error('[RICO TEST79 UI] border preview failed',e);}}
function previewPump58(){try{var fc=activeFrames58,g=graphicOf(fc);if(g&&g.frames&&g.frames.length){var n=g.getCurrentFrame(),cfg=getCfg(g,n);if(cfg.type){var p=phase(g,n,cfg,tick()),s=g.__ricoMap37;if(s&&s.phase!==p){s.phase=p;g.redraw({allCells:true});}}}}catch(e){console.error('[RICO TEST79 UI] preview pump failed',e);}if(typeof requestAnimationFrame==='function')requestAnimationFrame(previewPump58);}
function startPreviewPump58(){if(previewLoop58||typeof requestAnimationFrame!=='function')return;previewLoop58=true;requestAnimationFrame(previewPump58);}
function refreshButton(fc){var b=$('#ricoMapScrollButton37');if(!b.length)return;var g=graphicOf(fc);if(!g)return;var c=getCfg(g,g.getCurrentFrame());b.text('MAP SCROLL'+(c.type?' · ON':''));b.css('font-weight',c.type?'bold':'');b.attr('title',c.type?(c.type+' · '+c.ticksPerStep+' ticks/step · '+c.pixelsPerStep+' px/step'):'Map Scroll settings for this frame');}
function readDialogCfg79(){var n=parseInt($('#ricoMapScrollTicks37').val(),10);if(isNaN(n)||n<1)n=DEF;if(n>255)n=255;var px=parseInt($('#ricoMapScrollPixels37').val(),10);if(isNaN(px)||px<1)px=DEF_PIX;if(px>8)px=8;return{type:$('#ricoMapScrollType37').val()||'',ticksPerStep:n,pixelsPerStep:px};}
function saveDialogFrame79(fc){var g=graphicOf(fc);if(!g)return;var n=g.getCurrentFrame();setCfg(g,n,readDialogCfg79());
  if(autoFit177&&autoFit177.frame===n){var api=window.RICO_TEST75_WINDOW_DIMENSION;if(api&&api.setScrollArea)api.setScrollArea(g,n,autoFit177.rect);autoFit177=null;}
  refreshButton(fc);
}
function loadDialogFrame79(fc){var g=graphicOf(fc);if(!g)return;$('#ricoMapAutoFitStatus177').text('Auto Fit detecta los caracteres exteriores del frame. Guardar con OK.').css('color','#aaa');var n=g.getCurrentFrame(),count=g.getFrameCount?g.getFrameCount():(g.frames?g.frames.length:1),cfg=getCfg(g,n),f=frameObj(g,n);$('#ricoMapScrollType37').html(options(cfg.type)).val(cfg.type);$('#ricoMapScrollTicks37').val(cfg.ticksPerStep);$('#ricoMapScrollPixels37').val(cfg.pixelsPerStep);$('#ricoMapScrollFrame79').text('Frame '+(n+1)+' / '+count);$('#ricoMapScrollPrev79').css('opacity',n<=0?0.35:1);$('#ricoMapScrollNext79').css('opacity',n>=count-1?0.35:1);$('#ricoMapScrollInfo37').text('Frame Duration: '+(f&&f.duration?f.duration:'?')+' ticks · '+cfg.pixelsPerStep+' px every '+cfg.ticksPerStep+' tick'+(cfg.ticksPerStep===1?'':'s')+(pause79.paused?' · GLOBAL PAUSE':''));updatePause79();}
function autoFitScroll177(fc){
  var g=graphicOf(fc),api=window.RICO_TEST177_ART_FIT;
  if(!g||!api)return;
  var editor=g.editor;
  if(!editor||!editor.layers||!editor.layers.getSelectedLayerObject)editor=typeof g_app!=='undefined'&&g_app?g_app.textModeEditor:null;
  var v=api.scan(editor,g.getCurrentFrame(),'scroll');
  if(!v.ok){$('#ricoMapAutoFitStatus177').text(v.error).css('color','#e8ae68');return;}
  autoFit177={frame:g.getCurrentFrame(),rect:v.rect};
  var r=v.rect;
  $('#ricoMapAutoFitStatus177').text('Scroll Area '+r.width+'×'+r.height+' (X'+r.x+', Y'+r.y+') lista; pulsa OK para guardar.'+(v.warning?' '+v.warning:'')).css('color',v.warning?'#e8ae68':'#9cddaa');
}
function stepDialogFrame79(fc,delta){var g=graphicOf(fc);if(!g)return;var n=g.getCurrentFrame(),count=g.getFrameCount?g.getFrameCount():(g.frames?g.frames.length:1),target=n+delta;if(target<0||target>=count)return;saveDialogFrame79(fc);stepping79=true;try{fc.gotoFrame(target);}finally{stepping79=false;}loadDialogFrame79(fc);}

function ensureDialog(fc){
  if(UI.get&&UI.get('ricoMapScrollDialog37'))return;
  var d=UI.create('UI.Dialog',{id:'ricoMapScrollDialog37',title:"Rico's Map Scroll",width:470,height:388});
  var html='<div style="padding:14px 18px">';
  html+='<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:14px"><div class="ui-button" id="ricoMapScrollPrev79" style="min-width:30px;text-align:center">&lt;</div><div id="ricoMapScrollFrame79" style="min-width:100px;text-align:center;font-weight:bold">Frame</div><div class="ui-button" id="ricoMapScrollNext79" style="min-width:30px;text-align:center">&gt;</div><div class="ui-button" id="ricoMapScrollPause79" style="min-width:66px;text-align:center;margin-left:10px">PAUSE</div></div>';
  html+='<div style="margin-bottom:14px"><label style="display:inline-block;width:125px">Map Scroll:</label><select id="ricoMapScrollType37" style="width:230px">'+options('')+'</select></div>';
  html+='<div style="margin-bottom:10px"><label style="display:inline-block;width:125px">Ticks / Step:</label><input id="ricoMapScrollTicks37" class="number integer" type="number" min="1" max="255" value="6" style="width:70px"></div>';
  html+='<div><label style="display:inline-block;width:125px">Pixels / Step:</label><input id="ricoMapScrollPixels37" class="number integer" type="number" min="1" max="8" value="1" style="width:70px"> <span style="color:#aaa;font-size:11px">1–8 px</span></div>';
  html+='<div style="margin-top:13px;text-align:center"><div id="ricoMapAutoFit177" class="ui-button">Auto Fit Scroll Area to Art</div></div>';
  html+='<div id="ricoMapAutoFitStatus177" style="margin-top:7px;text-align:center;color:#aaa;font-size:11px;min-height:16px">Auto Fit detecta los caracteres exteriores del frame. Guardar con OK.</div>';
  html+='<div id="ricoMapScrollInfo37" style="margin-top:12px;color:#aaa;font-size:11px"></div>';
  html+='<div style="margin-top:10px;color:#888;font-size:11px">&lt; &gt; saves the current frame before changing. PAUSE / PLAY freezes every MAP SCROLL preview without changing its configuration.</div></div>';
  d.add(UI.create('UI.HTMLPanel',{html:html}));
  var ok=UI.create('UI.Button',{text:'OK',color:'primary'});d.addButton(ok);ok.on('click',function(){saveDialogFrame79(fc);UI.closeDialog();});
  var ca=UI.create('UI.Button',{text:'Cancel',color:'secondary'});d.addButton(ca);ca.on('click',function(){autoFit177=null;UI.closeDialog();});
  setTimeout(function(){$('#ricoMapScrollPrev79').on('click',function(){stepDialogFrame79(fc,-1);});$('#ricoMapScrollNext79').on('click',function(){stepDialogFrame79(fc,1);});$('#ricoMapScrollPause79').on('click',function(){setPaused79(!pause79.paused);loadDialogFrame79(fc);});$('#ricoMapAutoFit177').on('click',function(){autoFitScroll177(fc);});},0);
}
function openDialog(fc){var g=graphicOf(fc);if(!g)return;autoFit177=null;activeFrames58=fc;ensureDialog(fc);UI.showDialog('ricoMapScrollDialog37');setTimeout(function(){loadDialogFrame79(fc);},0);}
function install(fc){activeFrames58=fc;startPreviewPump58();if($('#ricoMapScrollButton37').length){refreshButton(fc);return;}var d=$('#frameDuration');if(!d.length)return;removeTicksWord();var b=$('<div class="ui-button" id="ricoMapScrollButton37" style="margin-left:8px;vertical-align:middle">MAP SCROLL</div>');d.after(b);b.on('click.rico37',function(){openDialog(fc);});refreshButton(fc);}
var oldInit=Frames.prototype.initEvents;Frames.prototype.initEvents=function(){var r=oldInit.apply(this,arguments);install(this);return r;};
var oldGoto=Frames.prototype.gotoFrame;Frames.prototype.gotoFrame=function(n){var open=!stepping79&&$('#ricoMapScrollDialog37').is(':visible')&&activeFrames58===this;if(open)saveDialogFrame79(this);var r=oldGoto.apply(this,arguments),g=graphicOf(this);if(g)reset(g,g.getCurrentFrame());refreshButton(this);if(open)setTimeout((function(fc){return function(){loadDialogFrame79(fc);};})(this),0);return r;};
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
  var wc=winCfg(this,n),ac=scrollAreaCfg(this,n);
  var viewX=wc.x*cellW,viewY=wc.y*cellH,viewW=Math.max(1,wc.width*cellW),viewH=Math.max(1,wc.height*cellH);
  var areaX=ac.x*cellW,areaY=ac.y*cellH,areaW=Math.max(1,ac.width*cellW),areaH=Math.max(1,ac.height*cellH);
  var areaMW=Math.max(1,Math.round(areaW*sc)),areaMH=Math.max(1,Math.round(areaH*sc));

  if(!this.__ricoMapScrollAreaSurface75)this.__ricoMapScrollAreaSurface75=document.createElement('canvas');
  var s=this.__ricoMapScrollAreaSurface75;s.width=areaMW;s.height=areaMH;
  var sx=UI.getContextNoSmoothing?UI.getContextNoSmoothing(s):s.getContext('2d');
  sx.clearRect(0,0,areaMW,areaMH);
  var inner={};for(var k in a)if(a.hasOwnProperty(k))inner[k]=a[k];
  inner.__ricoMap37=true;inner.canvas=s;inner.context=sx;inner.frame=n;
  inner.srcX=areaX;inner.srcY=areaY;inner.srcWidth=areaW;inner.srcHeight=areaH;
  inner.dstX=0;inner.dstY=0;inner.drawAtX=0;inner.drawAtY=0;
  inner.dstWidth=areaMW;inner.dstHeight=areaMH;inner.scale=sc;inner.allCells=true;inner.drawPreviousFrame=false;
  oldDraw.call(this,inner);

  var baseOx,baseOy;
  if(typeof a.drawAtX!=='undefined'){baseOx=a.drawAtX;baseOy=a.drawAtY;}
  else{baseOx=(a.dstX||0)-(a.srcX||0)*sc;baseOy=(a.dstY||0)-(a.srcY||0)*sc;}
  var clipX=baseOx+viewX*sc,clipY=baseOy+viewY*sc,clipW=viewW*sc,clipH=viewH*sc;
  var areaOx=baseOx+areaX*sc,areaOy=baseOy+areaY*sc;

  var p=phase(this,n,cfg,tick()),dist=p*cfg.pixelsPerStep,dxs=0,dys=0,wrapX=false,wrapY=false;
  switch(cfg.type){
    case'left':dxs=-(dist%areaW);wrapX=true;break;
    case'right':dxs=dist%areaW;wrapX=true;break;
    case'up':dys=-(dist%areaH);wrapY=true;break;
    case'down':dys=dist%areaH;wrapY=true;break;
    case'pingpong-left':dxs=-ping(dist,areaW);break;
    case'pingpong-right':dxs=ping(dist,areaW);break;
    case'pingpong-up':dys=-ping(dist,areaH);break;
    case'pingpong-down':dys=ping(dist,areaH);break;
    case'move-left':dxs=-Math.min(dist,Math.max(0,areaW-1));break;
    case'move-right':dxs=Math.min(dist,Math.max(0,areaW-1));break;
    case'move-up':dys=-Math.min(dist,Math.max(0,areaH-1));break;
    case'move-down':dys=Math.min(dist,Math.max(0,areaH-1));break;
    case'movein-left':dxs=Math.max(0,areaW-1)-Math.min(dist,Math.max(0,areaW-1));break;
    case'movein-right':dxs=-Math.max(0,areaW-1)+Math.min(dist,Math.max(0,areaW-1));break;
    case'movein-up':dys=Math.max(0,areaH-1)-Math.min(dist,Math.max(0,areaH-1));break;
    case'movein-down':dys=-Math.max(0,areaH-1)+Math.min(dist,Math.max(0,areaH-1));break;
  }
  var dx=dxs*sc,dy=dys*sc,ctx=a.context;
  ctx.save();ctx.beginPath();ctx.rect(clipX,clipY,clipW,clipH);ctx.clip();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=bgCSS(this,n);ctx.fillRect(clipX,clipY,clipW,clipH);
  if(wrapX){ctx.drawImage(s,areaOx+dx-areaMW,areaOy);ctx.drawImage(s,areaOx+dx,areaOy);ctx.drawImage(s,areaOx+dx+areaMW,areaOy);}
  else if(wrapY){ctx.drawImage(s,areaOx,areaOy+dy-areaMH);ctx.drawImage(s,areaOx,areaOy+dy);ctx.drawImage(s,areaOx,areaOy+dy+areaMH);}
  else{ctx.drawImage(s,areaOx+dx,areaOy+dy);}
  ctx.restore();
  drawNativeBorder58(this,n,ctx,a.canvas,clipX,clipY,viewW,viewH,sc);
};
var oldUpdate=TileSet.prototype.update;TileSet.prototype.update=function(t){var r=oldUpdate.apply(this,arguments);try{var g=this.editor&&this.editor.graphic;if(g&&g.frames&&g.frames.length){var n=g.getCurrentFrame(),c=getCfg(g,n);if(c.type){var p=phase(g,n,c,tick()),s=g.__ricoMap37;if(s&&s.phase!==p){s.phase=p;g.redraw({allCells:true});return true;}}}}catch(e){console.error('[RICO TEST79 UI] update failed',e);}return r;};
window.RICO_TEST79_MAP_SCROLL={getConfig:getCfg,setConfig:setCfg,field:FIELD,moveOut:true,moveIn:true,previewPalHz:50,zoomSynced:true,borderPreserved:true,windowIsViewport:true,scrollAreaIsSource:true,frameNavigation:true,setPaused:setPaused79,isPaused:function(){return pause79.paused;}};
window.RICO_TEST75_MAP_SCROLL=window.RICO_TEST79_MAP_SCROLL;
window.RICO_TEST71_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST69_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST67_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST65_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST59_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST58_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST57_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST56_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
window.RICO_TEST37_MAP_SCROLL=window.RICO_TEST75_MAP_SCROLL;
console.log("[RICO TEST79 UI] Rico's Map Scroll: proven TEST75 base + frame navigation + global PAUSE/PLAY");
})();