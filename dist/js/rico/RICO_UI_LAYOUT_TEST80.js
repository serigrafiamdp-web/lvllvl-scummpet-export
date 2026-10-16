(function(){
'use strict';
var quickInstalled=false,minInstalled=false,initialMinDone=false,observer=null,refreshTimer=null,resizeObserver=null,savedSouth=140;
var BOTTOM_H=54;
function ed(){try{return window.g_app&&g_app.textModeEditor?g_app.textModeEditor:null;}catch(e){return null;}}
function palette(){var e=ed();try{return e&&e.colorPaletteManager?e.colorPaletteManager.getCurrentColorPalette():null;}catch(x){return null;}}

function ensureCss80(){
  if(document.getElementById('ricoUiCss80'))return;
  var s=document.createElement('style');s.id='ricoUiCss80';
  s.textContent='#frames{box-sizing:border-box!important;padding:3px 6px!important;background:#1b1b1b!important;border-top:1px solid #333!important;line-height:24px!important;}#frameTimelineHolder{border-top:1px solid #292929!important;}#ricoQuickPalette80{font-family:Arial,sans-serif;}#ricoQuickPalette80 .rico80swatch:hover{outline:2px solid #ddd!important;z-index:2;}';
  document.head.appendChild(s);
}

function hideLegacyBottom80(){
  try{
    g_app.setPref('textmode.tilePaletteVisible','no');
    if(UI.exists('textEditorContent')){
      var sp=UI('textEditorContent');
      if(sp.setPanelVisible)sp.setPanelVisible('south',false);
      else if(sp.resizeThePanel)sp.resizeThePanel({panel:'south',size:0});
      if(sp.setResizeVisible)sp.setResizeVisible('south',false);
    }
  }catch(e){}
}

function layoutBottom80(){
  try{
    if(!UI.exists('textModeEditor'))return;
    var root=UI('textModeEditor');
    if(root.resizeThePanel)root.resizeThePanel({panel:'south',size:BOTTOM_H});
    var rootEl=root.getElement(),south=document.getElementById(root.id+'south');
    var east=document.getElementById(root.id+'east'),eastbar=document.getElementById(root.id+'eastbar');
    if(!rootEl||!south)return;
    var right=0;
    if(east&&east.style.display!=='none'){
      var rr=rootEl.getBoundingClientRect(),er=east.getBoundingClientRect();
      if(er.width>0){right=Math.max(0,Math.round(rr.right-er.left));if(eastbar&&eastbar.style.display!=='none'){var br=eastbar.getBoundingClientRect();if(br.width>0)right+=Math.round(br.width);}}
      east.style.bottom='0px';
      if(eastbar)eastbar.style.bottom='0px';
    }
    south.style.right=right+'px';
    south.style.left='0px';south.style.height=BOTTOM_H+'px';south.style.zIndex='20';
    var framePanel=document.getElementById('framesPanel');
    if(framePanel){framePanel.style.left='0';framePanel.style.right='0';framePanel.style.top='0';framePanel.style.bottom='0';}
  }catch(e){console.error('[RICO TEST80 UI] bottom layout failed',e);}
}

function refreshQuick80(){
  if(!quickInstalled)return;
  var e=ed(),p=palette(),fg=-999,bg=-999;
  try{fg=e.currentTile.getColor();bg=e.currentTile.getBGColor();}catch(x){}
  for(var i=0;i<16;i++){
    var n=document.getElementById('ricoQuickColor80_'+i);if(!n)continue;
    var h='000000';try{var v=p&&p.getHexString?p.getHexString(i):false;if(v!==false&&v!=null)h=v;}catch(x){}
    n.style.backgroundColor='#'+h;
    n.style.boxShadow=(fg===i)?'inset 0 0 0 2px #fff':'none';
    n.style.outline=(bg===i)?'1px dashed #fff':'1px solid #444';
    n.title='Color '+i+(fg===i?' · FG':'')+(bg===i?' · BG':'')+' · Left click FG / Right click BG';
  }
}
function choose80(i,isBg){
  var e=ed();if(!e||!e.currentTile)return;
  try{if(isBg)e.currentTile.setBGColor(i);else e.currentTile.setColor(i);if(e.graphic)e.graphic.redraw({allCells:true});}catch(x){console.error('[RICO TEST80 UI] color select failed',x);}
  refreshQuick80();
}
function installQuick80(){
  if(quickInstalled&&document.getElementById('ricoQuickPalette80'))return true;
  var host=document.getElementById('toolsPanel');if(!host)return false;
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  var old=document.getElementById('ricoQuickPalette79');if(old)old.remove();
  var box=document.createElement('div');box.id='ricoQuickPalette80';
  box.style.cssText='position:absolute;left:7px;right:7px;bottom:14px;padding:5px 5px 6px;background:#111;border:1px solid #333;z-index:50;box-sizing:border-box;border-radius:2px';
  var title=document.createElement('div');title.textContent='C64 COLORS';title.style.cssText='font-size:9px;color:#aaa;text-align:center;margin-bottom:4px;line-height:11px;letter-spacing:.2px';box.appendChild(title);
  var grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px';
  for(let i=0;i<16;i++){
    var c=document.createElement('div');c.id='ricoQuickColor80_'+i;c.className='rico80swatch';c.style.cssText='height:17px;cursor:pointer;box-sizing:border-box;border-radius:1px';
    c.addEventListener('mousedown',function(ev){ev.preventDefault();choose80(i,ev.button===2);});
    c.addEventListener('contextmenu',function(ev){ev.preventDefault();});grid.appendChild(c);
  }
  box.appendChild(grid);host.appendChild(box);quickInstalled=true;refreshQuick80();return true;
}

function rememberAndHide80(body,title){body.children().each(function(){if(this===title[0])return;var $x=$(this);if(typeof $x.data('rico80display')==='undefined')$x.data('rico80display',this.style.display||'');$x.hide();});}
function restore80(body,title){body.children().each(function(){if(this===title[0])return;var $x=$(this),v=$x.data('rico80display');this.style.display=(typeof v==='undefined')?'':v;});}
function setMin80(v){
  var close=$('#colorPaletteCloseButton');if(!close.length)return false;var title=close.closest('.title'),body=title.parent();if(!body.length)return false;
  if(v){
    try{var sp=UI('textModeEastPanel'),sz=sp.getPanelSize({panel:'south'});if(sz>28)savedSouth=sz;sp.setPanelVisible('south',true,22,false);sp.resizeThePanel({panel:'south',size:22});}catch(x){}
    rememberAndHide80(body,title);$('#ricoColorMin80').text('+').attr('title','Restore Colours');
  }else{
    restore80(body,title);try{var sp2=UI('textModeEastPanel');sp2.setPanelVisible('south',true,Math.max(100,savedSouth||140),true);sp2.resizeThePanel({panel:'south',size:Math.max(100,savedSouth||140)});}catch(x){}
    $('#ricoColorMin80').text('−').attr('title','Minimize Colours');
    try{var e=ed();if(e&&e.colorPalettePanel&&e.colorPalettePanel.colorPaletteResize)e.colorPalettePanel.colorPaletteResize();}catch(x){}
  }
  setTimeout(layoutBottom80,0);return true;
}
function installMin80(){
  if(minInstalled&&document.getElementById('ricoColorMin80'))return true;
  var close=$('#colorPaletteCloseButton');if(!close.length)return false;var title=close.closest('.title');if(!title.length)return false;
  var old=$('#ricoColorMin79');if(old.length)old.remove();
  title.find('> div').first().css('right','55px');
  var b=$('<div id="ricoColorMin80" class="ui-button" title="Minimize Colours" style="position:absolute;top:2px;right:27px;width:20px;height:16px;padding:0;text-align:center;line-height:14px;font-weight:bold">−</div>');
  title.append(b);b.on('click',function(){setMin80($(this).text()!=='+');});minInstalled=true;
  if(!initialMinDone){initialMinDone=true;setTimeout(function(){try{var e=ed();if(e&&e.setColorPalettePanelVisible)e.setColorPalettePanelVisible(true);}catch(x){}setMin80(true);},0);}
  return true;
}

function forceColumns80(){
  try{
    if(!window.g_app||!g_app.textModeEditor)return false;
    g_app.setPref('textmode.petsciisortmethod','columns');
    var e=g_app.textModeEditor,p=e.sideTilePalette;
    if(!p||!p.tilePaletteDisplay)return false;
    var ts=e.tileSetManager&&e.tileSetManager.getCurrentTileSet?e.tileSetManager.getCurrentTileSet():null;
    if(!ts)return false;
    p.selectTilePaletteMapType('columns');
    $('#sidecharPaletteSortOrder').val('columns');$('#charPaletteSortOrder').val('columns');
    try{p.drawTilePalette({redrawTiles:true});}catch(x){}
    return true;
  }catch(x){console.error('[RICO TEST80 UI] Columns of 16 default failed',x);return false;}
}
function scheduleColumns80(){
  var tries=0,t=setInterval(function(){tries++;if(forceColumns80()||tries>=20)clearInterval(t);},50);
  setTimeout(forceColumns80,250);setTimeout(forceColumns80,600);
}
function hookScreenLoad80(){
  try{
    if(typeof TextModeEditor==='undefined'||TextModeEditor.prototype.__ricoColumns80)return;
    TextModeEditor.prototype.__ricoColumns80=true;
    var old=TextModeEditor.prototype.loadScreen;
    TextModeEditor.prototype.loadScreen=function(){
      try{g_app.setPref('textmode.petsciisortmethod','columns');}catch(e){}
      var r=old.apply(this,arguments);scheduleColumns80();setTimeout(layoutBottom80,0);return r;
    };
  }catch(e){console.error('[RICO TEST80 UI] loadScreen hook failed',e);}
}

function install80(){ensureCss80();hideLegacyBottom80();layoutBottom80();installQuick80();installMin80();}
function start80(){
  hookScreenLoad80();try{if(window.g_app)g_app.setPref('textmode.petsciisortmethod','columns');}catch(e){}
  install80();scheduleColumns80();
  if(!observer&&typeof MutationObserver!=='undefined'){observer=new MutationObserver(function(){install80();});observer.observe(document.body,{childList:true,subtree:true});}
  if(!resizeObserver&&typeof ResizeObserver!=='undefined'){
    try{resizeObserver=new ResizeObserver(function(){layoutBottom80();});var root=document.getElementById('textModeEditor');if(root)resizeObserver.observe(root);var east=document.getElementById('textModeEditoreast');if(east)resizeObserver.observe(east);}catch(e){}
  }
  if(!refreshTimer)refreshTimer=setInterval(function(){install80();refreshQuick80();},700);
  window.addEventListener('resize',layoutBottom80);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start80);else start80();
window.RICO_TEST80_UI={refreshPalette:refreshQuick80,setColoursMinimized:setMin80,forceColumns16:forceColumns80,layout:layoutBottom80};
console.log('[RICO TEST80 UI] clean two-row Frames layout + 2x8 C64 palette + default Columns of 16 + Colours minimized loaded');
})();