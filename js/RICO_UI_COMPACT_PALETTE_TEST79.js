(function(){
'use strict';
var quickInstalled=false,minInstalled=false,refreshTimer=null,observer=null,savedSouth=140;
function ed(){try{return window.g_app&&g_app.textModeEditor?g_app.textModeEditor:null;}catch(e){return null;}}
function palette(){var e=ed();try{return e&&e.colorPaletteManager?e.colorPaletteManager.getCurrentColorPalette():null;}catch(x){return null;}}
function refresh(){
  if(!quickInstalled)return;
  var e=ed(),p=palette(),fg=-999,bg=-999;
  try{fg=e.currentTile.getColor();bg=e.currentTile.getBGColor();}catch(x){}
  for(var i=0;i<16;i++){
    var n=document.getElementById('ricoQuickColor79_'+i);if(!n)continue;
    var h='000000';try{var v=p&&p.getHexString?p.getHexString(i):false;if(v!==false&&v!=null)h=v;}catch(x){}
    n.style.backgroundColor='#'+h;
    n.style.boxShadow=(fg===i)?'inset 0 0 0 2px #fff':'none';
    n.style.outline=(bg===i)?'1px dashed #fff':'1px solid #444';
    n.title='Color '+i+(fg===i?' · FG':'')+(bg===i?' · BG':'')+' · Left click FG / Right click BG';
  }
}
function choose(i,isBg){
  var e=ed();if(!e||!e.currentTile)return;
  try{if(isBg)e.currentTile.setBGColor(i);else e.currentTile.setColor(i);if(e.graphic)e.graphic.redraw({allCells:true});}catch(x){console.error('[RICO TEST79 UI] color select failed',x);}
  refresh();
}
function installQuick(){
  if(quickInstalled&&document.getElementById('ricoQuickPalette79'))return;
  var host=document.getElementById('toolsPanel');if(!host)return;
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  var box=document.createElement('div');box.id='ricoQuickPalette79';
  box.style.cssText='position:absolute;left:5px;right:5px;bottom:16px;padding:4px 3px 5px;background:#111;border:1px solid #333;z-index:50;box-sizing:border-box';
  var title=document.createElement('div');title.textContent='C64 COLORS';title.style.cssText='font-size:9px;color:#aaa;text-align:center;margin-bottom:3px;line-height:10px';box.appendChild(title);
  var grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:2px';
  for(let i=0;i<16;i++){
    var c=document.createElement('div');c.id='ricoQuickColor79_'+i;c.style.cssText='height:13px;cursor:pointer;box-sizing:border-box';
    c.addEventListener('mousedown',function(ev){ev.preventDefault();choose(i,ev.button===2);});
    c.addEventListener('contextmenu',function(ev){ev.preventDefault();});grid.appendChild(c);
  }
  box.appendChild(grid);host.appendChild(box);quickInstalled=true;refresh();
}
function rememberAndHide(body,title){
  body.children().each(function(){if(this===title[0])return;var $x=$(this);if(typeof $x.data('rico79display')==='undefined')$x.data('rico79display',this.style.display||'');$x.hide();});
}
function restore(body,title){
  body.children().each(function(){if(this===title[0])return;var $x=$(this),v=$x.data('rico79display');this.style.display=(typeof v==='undefined')?'':v;});
}
function setMin(v){
  var close=$('#colorPaletteCloseButton');if(!close.length)return;var title=close.closest('.title'),body=title.parent();if(!body.length)return;
  if(v){
    try{var sp=UI('textModeEastPanel'),sz=sp.getPanelSize({panel:'south'});if(sz>28)savedSouth=sz;sp.resizeThePanel({panel:'south',size:22});}catch(x){}
    rememberAndHide(body,title);$('#ricoColorMin79').text('+').attr('title','Restore Colours');
  }else{
    restore(body,title);try{UI('textModeEastPanel').resizeThePanel({panel:'south',size:Math.max(90,savedSouth||140)});}catch(x){}
    $('#ricoColorMin79').text('−').attr('title','Minimize Colours');
    try{var e=ed();if(e&&e.colorPalettePanel&&e.colorPalettePanel.colorPaletteResize)e.colorPalettePanel.colorPaletteResize();}catch(x){}
  }
  try{g_app.setPref('rico.colorPaletteMin79',v?'yes':'no');}catch(x){}
}
function installMin(){
  if(minInstalled&&document.getElementById('ricoColorMin79'))return;
  var close=$('#colorPaletteCloseButton');if(!close.length)return;var title=close.closest('.title');if(!title.length)return;
  title.find('> div').first().css('right','55px');
  var b=$('<div id="ricoColorMin79" class="ui-button" title="Minimize Colours" style="position:absolute;top:2px;right:27px;width:20px;height:16px;padding:0;text-align:center;line-height:14px;font-weight:bold">−</div>');
  title.append(b);b.on('click',function(){setMin($(this).text()!=='+' );});minInstalled=true;
  try{if(g_app.getPref('rico.colorPaletteMin79')==='yes')setTimeout(function(){setMin(true);},0);}catch(x){}
}
function install(){installQuick();installMin();}
function start(){install();if(!observer&&typeof MutationObserver!=='undefined'){observer=new MutationObserver(install);observer.observe(document.body,{childList:true,subtree:true});}if(!refreshTimer)refreshTimer=setInterval(function(){install();refresh();},500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.RICO_TEST79_UI={refreshPalette:refresh,setColoursMinimized:setMin};
console.log('[RICO TEST79 UI] compact C64 palette + robust Colours minimize loaded');
})();
