(function(){
'use strict';
if(typeof Frames==='undefined'){console.error('[RICO TEST78 UI] Frames dependency missing');return;}
var activeFrames78=null, resizeObserver78=null, paletteTimer78=null, colorPanelSavedSize78=140;

function editor78(){return activeFrames78&&activeFrames78.editor?activeFrames78.editor:(window.g_app&&g_app.textModeEditor?g_app.textModeEditor:null);}

function adjustFramesBar78(){
  try{
    if(!UI.exists('textModeEditor')||!UI.exists('framesPanel'))return;
    var rootComp=UI('textModeEditor'), frameComp=UI('framesPanel');
    var root=rootComp.getElement(), frame=frameComp.getElement();
    var center=document.getElementById(rootComp.id+'center');
    if(!root||!frame||!center)return;
    if(frame.parentNode!==root)root.appendChild(frame);
    var rr=root.getBoundingClientRect(),cr=center.getBoundingClientRect();
    var right=Math.max(0,Math.round(rr.right-cr.right));
    frame.style.position='absolute';frame.style.left='0px';frame.style.right=right+'px';frame.style.bottom='0px';frame.style.top='auto';
    frame.style.height='60px';frame.style.zIndex='40';frame.style.overflow='hidden';
    if(typeof frameComp.resize==='function')frameComp.resize();
  }catch(e){console.error('[RICO TEST78 UI] frames bar layout failed',e);}
}

function beginObserve78(){
  try{
    if(resizeObserver78||typeof ResizeObserver==='undefined'||!UI.exists('textModeEditor'))return;
    var root=UI('textModeEditor').getElement(),center=document.getElementById(UI('textModeEditor').id+'center');
    resizeObserver78=new ResizeObserver(function(){adjustFramesBar78();});
    if(root)resizeObserver78.observe(root);if(center)resizeObserver78.observe(center);
  }catch(e){}
}

function quickPaletteHost78(){try{return UI.exists('toolsDesktopPanel')?UI('toolsDesktopPanel').getElement():null;}catch(e){return null;}}
function getPalette78(ed){try{return ed&&ed.colorPaletteManager&&ed.colorPaletteManager.getCurrentColorPalette?ed.colorPaletteManager.getCurrentColorPalette():null;}catch(e){return null;}}
function refreshQuickPalette78(){
  var ed=editor78(),host=document.getElementById('ricoQuickPalette78');if(!ed||!host)return;
  var pal=getPalette78(ed),fg=-1,bg=-1;try{fg=ed.currentTile.getColor();bg=ed.currentTile.getBGColor();}catch(e){}
  for(var i=0;i<16;i++){
    var cell=document.getElementById('ricoQuickColor78_'+i);if(!cell)continue;
    var hex='000000';try{var h=pal&&pal.getHexString?pal.getHexString(i):false;if(h!==false&&h!=null)hex=h;}catch(e){}
    cell.style.backgroundColor='#'+hex;
    cell.style.boxShadow=(fg===i)?'inset 0 0 0 2px #ffffff':'none';
    cell.style.outline=(bg===i)?'1px dashed #ffffff':'none';
    cell.title='Color '+i+(fg===i?' · FG':'')+(bg===i?' · BG':'')+' (left=FG, right=BG)';
  }
}
function chooseQuickColor78(index,bg){
  var ed=editor78();if(!ed||!ed.currentTile)return;
  try{if(bg){ed.currentTile.setBGColor(index);}else{ed.currentTile.setColor(index);}if(ed.graphic)ed.graphic.redraw({allCells:true});}catch(e){console.error('[RICO TEST78 UI] quick color select failed',e);}
  refreshQuickPalette78();
}
function installQuickPalette78(){
  var host=quickPaletteHost78();if(!host)return false;if(document.getElementById('ricoQuickPalette78')){refreshQuickPalette78();return true;}
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  var box=document.createElement('div');box.id='ricoQuickPalette78';
  box.style.cssText='position:absolute;left:5px;right:5px;bottom:66px;padding:4px 3px 5px;background:#111;border:1px solid #333;z-index:25;box-sizing:border-box';
  var title=document.createElement('div');title.textContent='16 COLORS';title.style.cssText='font-size:9px;color:#aaa;text-align:center;margin-bottom:3px;line-height:10px';box.appendChild(title);
  var grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:2px';
  for(let i=0;i<16;i++){
    var cell=document.createElement('div');cell.id='ricoQuickColor78_'+i;cell.setAttribute('data-color',i);
    cell.style.cssText='height:13px;border:1px solid #444;box-sizing:border-box;cursor:pointer';
    cell.addEventListener('mousedown',function(ev){ev.preventDefault();chooseQuickColor78(i,ev.button===2);});
    cell.addEventListener('contextmenu',function(ev){ev.preventDefault();});grid.appendChild(cell);
  }
  box.appendChild(grid);host.appendChild(box);refreshQuickPalette78();
  if(!paletteTimer78)paletteTimer78=setInterval(refreshQuickPalette78,700);
  return true;
}

function setColorPanelMin78(minimized){
  var close=$('#colorPaletteCloseButton');if(!close.length)return;
  var title=close.closest('.title'),body=title.parent();if(!body.length)return;
  if(minimized){
    try{var sp=UI('textModeEastPanel');var sz=sp.getPanelSize({panel:'south'});if(sz>30)colorPanelSavedSize78=sz;sp.resizeThePanel({panel:'south',size:22});}catch(e){}
    body.children().not(title).hide();$('#ricoColorPaletteMin78').text('+').attr('title','Restore Colours panel');
  }else{
    body.children().not(title).show();try{UI('textModeEastPanel').resizeThePanel({panel:'south',size:Math.max(90,colorPanelSavedSize78||140)});}catch(e){}
    $('#ricoColorPaletteMin78').text('−').attr('title','Minimize Colours panel');
    try{var ed=editor78();if(ed&&ed.colorPalettePanel&&ed.colorPalettePanel.colorPaletteResize)ed.colorPalettePanel.colorPaletteResize();}catch(e){}
  }
  try{g_app.setPref('rico.colorPaletteMinimized78',minimized?'yes':'no');}catch(e){}
}
function installColorMin78(){
  var close=$('#colorPaletteCloseButton');if(!close.length)return false;if($('#ricoColorPaletteMin78').length)return true;
  var title=close.closest('.title');if(!title.length)return false;
  title.find('> div').first().css('right','55px');
  var b=$('<div id="ricoColorPaletteMin78" class="ui-button" title="Minimize Colours panel" style="position:absolute;top:2px;right:27px;width:20px;height:16px;padding:0;text-align:center;line-height:14px;font-weight:bold">−</div>');
  title.append(b);b.on('click',function(){setColorPanelMin78($(this).text()!=='+' );});
  var pref=null;try{pref=g_app.getPref('rico.colorPaletteMinimized78');}catch(e){}if(pref==='yes')setTimeout(function(){setColorPanelMin78(true);},0);
  return true;
}

function installAll78(){adjustFramesBar78();beginObserve78();installQuickPalette78();installColorMin78();}
var oldInit78=Frames.prototype.initEvents;
Frames.prototype.initEvents=function(){var r=oldInit78.apply(this,arguments);activeFrames78=this;setTimeout(installAll78,0);setTimeout(installAll78,250);setTimeout(installAll78,800);return r;};
window.addEventListener('resize',function(){adjustFramesBar78();});
window.RICO_TEST78_UI={adjustFrames:adjustFramesBar78,refreshQuickPalette:refreshQuickPalette78,minimizeColors:setColorPanelMin78,framesFullLeft:true,quick16Colors:true};
console.log('[RICO TEST78 UI] full-left Frames + compact 16-color palette + minimizable Colours loaded');
})();
