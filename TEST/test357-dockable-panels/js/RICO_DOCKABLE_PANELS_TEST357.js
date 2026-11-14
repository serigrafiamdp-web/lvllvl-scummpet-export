/* TEST357 — Isolated floating/dockable east panels + continuous BANK1/BANK2 scroller.
 * Reparents existing panel DOM (never clones canvas or mutates chars).
 * The original SplitPanel and exporters remain intact.
 */
(function(){
'use strict';
if(window.RICO_TEST357_DOCK) return;
var VERSION=357, panels={}, activeDrag=null, ready=false, throttle=0;
var definitions=[
 {key:'tiles',id:'eastTilesPanel',title:'#sidecharPaletteCloseButton',name:'Tiles',width:366,height:590},
 {key:'colours',id:'palettePanel',title:'#colorPaletteCloseButton',name:'Colours',width:330,height:380},
 {key:'layers',id:'layersPanel',title:null,name:'Layers',width:330,height:360}
];
var state={version:VERSION,installed:[],last:'INITIALIZING',floating:[],dockThreshold:96};
function $(id){return document.getElementById(id);}
function editor(){return window.g_app&&g_app.textModeEditor;}
function redraw(key){
 var e=editor();if(!e)return;
 try{
  if(key==='tiles'&&e.sideTilePalette){e.sideTilePalette.resize();e.sideTilePalette.drawTilePalette({redrawTiles:true});}
  if(key==='colours'&&e.colorPalettePanel&&e.colorPalettePanel.colorPaletteResize)e.colorPalettePanel.colorPaletteResize();
  if(key==='layers'&&e.layers&&e.layers.resize)e.layers.resize();
 }catch(err){console.warn('[TEST357] nonfatal resize',key,err);}
}
function scheduleDraw(key){
 var p=panels[key];if(!p||p.refreshPending)return;
 p.refreshPending=true;requestAnimationFrame(function(){p.refreshPending=false;redraw(key);});
}
function css(){
 if($('rico357DockCSS'))return;
 var el=document.createElement('style');el.id='rico357DockCSS';
 el.textContent=[
 '.rico357-dock-btn{position:absolute!important;top:2px;right:24px;z-index:31;width:20px;height:17px;line-height:16px;text-align:center;cursor:pointer;background:#272727;border:1px solid #555;color:#dedede;border-radius:2px;box-sizing:border-box;font:13px Arial!important;}',
 '.rico357-dock-btn:hover{background:#494949;}',
 '.rico357-float{position:fixed;z-index:2147482000;display:flex;flex-direction:column;min-width:260px;min-height:160px;background:#181818;border:1px solid #777;box-shadow:0 9px 26px #000b;resize:both;overflow:hidden;box-sizing:border-box;}',
 '.rico357-float-title{height:27px;flex:0 0 27px;display:flex;align-items:center;gap:6px;background:#292929;border-bottom:1px solid #444;box-sizing:border-box;padding:0 8px;cursor:move;user-select:none;color:#eee;font:12px Arial;}',
 '.rico357-float-title .rico357-grip{opacity:.7;font-size:14px;}',
 '.rico357-float-title .rico357-close{margin-left:auto;color:#ddd;background:#353535;border:1px solid #555;border-radius:2px;cursor:pointer;font:12px Arial;}',
 '.rico357-float-body{position:relative;flex:1 1 auto;overflow:hidden;min-height:0;min-width:0;}',
 '.rico357-floated-panel{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;overflow:hidden!important;}',
 '.rico357-placeholder{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding:12px 4px;box-sizing:border-box;color:#7e7e7e;background:#141414;font:11px Arial;text-align:center;}',
 '.rico357-bankbar{position:absolute;left:55px;right:50px;top:3px;height:18px;display:flex;align-items:center;gap:4px;z-index:30;white-space:nowrap;color:#eee;font:10px Arial;}',
 '.rico357-bankbar button{background:#303030;border:1px solid #4c4c4c;color:#ccc;cursor:pointer;height:17px;padding:0 4px;font:10px Arial;}',
 '.rico357-bankbar button:focus-visible{outline:1px solid white;}',
 '.rico357-bankbar input{width:35px;min-width:25px;flex:1;height:14px;accent-color:#999;cursor:ew-resize;}',
 '#rico357DropZone{display:none;position:fixed;right:0;top:28px;bottom:0;width:96px;background:rgba(90,160,255,.18);border-left:2px solid #7baaff;z-index:2147483646;pointer-events:none;}',
 '#rico357DropZone.visible{display:block;}'
 ].join('\n');
 document.head.appendChild(el);
 var z=document.createElement('div');z.id='rico357DropZone';document.body.appendChild(z);
}
function findTitle(cfg,host){
 var title=cfg.title&&document.querySelector(cfg.title);
 if(title)title=title.closest('.title');
 if(!title||!host.contains(title))title=host.querySelector('.title');
 return title;
}
function snapshot(panel){return {
 left:panel.style.left,top:panel.style.top,right:panel.style.right,
 bottom:panel.style.bottom,width:panel.style.width,height:panel.style.height,
 position:panel.style.position,display:panel.style.display,overflow:panel.style.overflow
};}
function updateState(){
 state.floating=Object.keys(panels).filter(function(k){return !!panels[k].floating;});
 state.last=state.floating.length?'FLOATING: '+state.floating.join(','):'DOCKED';
}
function floatPanel(key,pos){
 var p=panels[key];if(!p||p.floating)return false;
 var node=p.node,rect=node.getBoundingClientRect();
 if(rect.width<35||rect.height<35)return false;
 var w=Math.min(Math.max(260,p.cfg.width,rect.width),window.innerWidth-15),
     h=Math.min(Math.max(170,p.cfg.height),window.innerHeight-55);
 var left=pos&&Number.isFinite(pos.x)?pos.x:Math.max(20,rect.left-w-25);
 var top=pos&&Number.isFinite(pos.y)?pos.y:Math.max(35,rect.top);
 left=Math.max(5,Math.min(window.innerWidth-w-5,left));
 top=Math.max(28,Math.min(window.innerHeight-55,top));
 var shell=document.createElement('div');shell.className='rico357-float';
 shell.style.width=w+'px';shell.style.height=h+'px';shell.style.left=left+'px';shell.style.top=top+'px';
 shell.dataset.panel=key;
 var title=document.createElement('div');title.className='rico357-float-title';
 var grip=document.createElement('span');grip.className='rico357-grip';grip.textContent='⠿';
 var label=document.createElement('span');label.textContent=p.cfg.name;
 var btn=document.createElement('button');btn.className='rico357-close';btn.textContent='Dock ↘';btn.title='Return panel to the right';
 title.append(grip,label,btn);shell.append(title);
 var body=document.createElement('div');body.className='rico357-float-body';shell.append(body);
 var placeholder=document.createElement('div');placeholder.className='rico357-placeholder';
 placeholder.textContent=p.cfg.name+' is floating';p.node.parentNode.insertBefore(placeholder,p.node);
 p.placeholder=placeholder;p.floating=true;p.shell=shell;p.saved=snapshot(node);
 body.appendChild(node);node.classList.add('rico357-floated-panel');
 document.body.appendChild(shell);
 btn.addEventListener('click',function(ev){ev.stopPropagation();dockPanel(key);});
 title.addEventListener('pointerdown',function(ev){startFloatingDrag(ev,key);});
 if(typeof ResizeObserver!=='undefined'){
  p.resizeObserver=new ResizeObserver(function(){scheduleDraw(key);});
  p.resizeObserver.observe(body);
 }
 scheduleDraw(key);updateState();return true;
}
function dockPanel(key){
 var p=panels[key];if(!p||!p.floating)return false;
 try{if(p.resizeObserver)p.resizeObserver.disconnect();}catch(e){}
 var node=p.node;
 node.classList.remove('rico357-floated-panel');
 if(p.placeholder&&p.placeholder.parentNode){
  p.placeholder.parentNode.insertBefore(node,p.placeholder);
  p.placeholder.remove();
 } else if(p.nativeParent)p.nativeParent.appendChild(node);
 if(p.saved){
  ['left','top','right','bottom','width','height','position','display','overflow'].forEach(function(prop){node.style[prop]=p.saved[prop];});
 }
 if(p.shell)p.shell.remove();
 p.shell=null;p.placeholder=null;p.floating=false;p.resizeObserver=null;
 window.dispatchEvent(new Event('resize'));scheduleDraw(key);updateState();return true;
}
function dropZone(active){var z=$('rico357DropZone');if(z)z.classList.toggle('visible',!!active);}
function nearDock(x){return x>=window.innerWidth-state.dockThreshold;}
function startFloatingDrag(ev,key){
 if(ev.button!==0||ev.target.closest('button,input,select'))return;
 var p=panels[key];if(!p||!p.floating)return;
 ev.preventDefault();
 var shell=p.shell,rect=shell.getBoundingClientRect();
 var dx=ev.clientX-rect.left,dy=ev.clientY-rect.top;
 activeDrag={key:key,dx:dx,dy:dy};
 var move=function(e){
  if(!activeDrag)return;
  var w=shell.getBoundingClientRect().width,h=shell.getBoundingClientRect().height;
  shell.style.left=Math.max(0,Math.min(window.innerWidth-w,e.clientX-dx))+'px';
  shell.style.top=Math.max(26,Math.min(window.innerHeight-28,e.clientY-dy))+'px';
  dropZone(nearDock(e.clientX));
 };
 var stop=function(e){
  window.removeEventListener('pointermove',move);
  window.removeEventListener('pointerup',stop);
  window.removeEventListener('pointercancel',cancel);
  dropZone(false);activeDrag=null;
  if(nearDock(e.clientX))dockPanel(key);
 };
 var cancel=function(){window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',cancel);dropZone(false);activeDrag=null;};
 window.addEventListener('pointermove',move);
 window.addEventListener('pointerup',stop);
 window.addEventListener('pointercancel',cancel);
}
function startDockedDrag(ev,key){
 if(ev.button!==0||ev.target.closest('button,input,select,.rico357-bankbar,.rico357-dock-btn'))return;
 var p=panels[key];if(!p||p.floating)return;
 var sx=ev.clientX,sy=ev.clientY;
 function move(e){
  if(Math.hypot(e.clientX-sx,e.clientY-sy)<9)return;
  clean();
  var w=p.cfg.width;
  if(floatPanel(key,{x:e.clientX-w/2,y:e.clientY-12})){
   var down={button:0,clientX:e.clientX,clientY:e.clientY,
    target:p.shell.querySelector('.rico357-float-title'),
    preventDefault:function(){}};
   startFloatingDrag(down,key);
  }
 }
 function clean(){window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',clean);}
 window.addEventListener('pointermove',move);window.addEventListener('pointerup',clean);
}
function installPanel(cfg){
 if(panels[cfg.key])return true;
 var node=$(cfg.id);if(!node||!node.parentNode)return false;
 var title=findTitle(cfg,node);
 if(!title)return false;
 var nativeParent=node.parentNode;
 var p=panels[cfg.key]={key:cfg.key,cfg:cfg,node:node,title:title,nativeParent:nativeParent,floating:false,refreshPending:false};
 var btn=document.createElement('button');btn.className='rico357-dock-btn';
 btn.textContent='↗';btn.title='Undock '+cfg.name+' / drag title to float';
 btn.type='button';btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();floatPanel(cfg.key);});
 if(getComputedStyle(title).position==='static')title.style.position='relative';
 title.appendChild(btn);p.button=btn;
 title.addEventListener('pointerdown',function(ev){startDockedDrag(ev,cfg.key);});
 state.installed.push(cfg.key);
 if(cfg.key==='tiles')installBankControl(p);
 return true;
}
function display(){
 var e=editor();return e&&e.sideTilePalette&&e.sideTilePalette.tilePaletteDisplay;
}
function safeScroll(percent){
 var d=display();if(!d)return;
 if(d.drawTilePalette&&!d.contentHeight)d.draw({redrawTiles:true});
 var max=Math.max(0,(d.contentHeight||0)-(d.viewHeight||0));
 if(d.scrollToY)d.scrollToY(max*Math.max(0,Math.min(100,percent))/100);
}
function bankTarget(bank){
 var d=display();if(!d)return;
 if(!d.tileLocations||!d.tileLocations[256]||!d.tileLocations[256].length){
  if(d.drawTilePalette)d.draw({redrawTiles:true});
 }
 if(bank===1){if(d.scrollToY)d.scrollToY(0);return;}
 var location=d.tileLocations&&d.tileLocations[256]&&d.tileLocations[256][0];
 var y=location?location.y/(d.canvasScale||1):Math.max(0,(d.contentHeight||0)/2);
 if(d.scrollToY)d.scrollToY(y);
}
function installBankControl(p){
 var bar=document.createElement('div');bar.className='rico357-bankbar';
 var b1=document.createElement('button');b1.textContent='B1';b1.title='Scroll to BANK 1 · characters 0–255';
 var b2=document.createElement('button');b2.textContent='B2';b2.title='Scroll to BANK 2 · characters 256–511';
 var slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.value='0';
 slider.title='Drag to scroll through BANK 1 and BANK 2';
 b1.addEventListener('click',function(e){e.stopPropagation();bankTarget(1);});
 b2.addEventListener('click',function(e){e.stopPropagation();bankTarget(2);});
 slider.addEventListener('input',function(e){e.stopPropagation();safeScroll(Number(slider.value));});
 ['pointerdown','mousedown','click'].forEach(function(name){bar.addEventListener(name,function(e){e.stopPropagation();});});
 bar.append(b1,slider,b2);p.title.appendChild(bar);p.bankSlider=slider;
 var last=-1;
 setInterval(function(){
  if(!p.node.isConnected)return;
  var d=display();if(!d)return;
  var max=Math.max(0,(d.contentHeight||0)-(d.viewHeight||0));
  var v=max>0?Math.round(100*(d.scrollY||0)/max):0;
  if(v!==last&&document.activeElement!==slider){slider.value=String(v);last=v;}
 },500);
}
function init(){
 if(!document.body)return;
 css();
 definitions.forEach(installPanel);
 ready=definitions.every(function(cfg){return panels[cfg.key];});
 if(ready){state.last='DOCKED';return;}
 if(throttle<80){throttle++;setTimeout(init,100);}
 else state.last='PARTIAL INSTALL';
}
window.addEventListener('resize',function(){
 Object.keys(panels).forEach(function(key){
  var p=panels[key];if(!p.floating)return;
  var r=p.shell.getBoundingClientRect();
  p.shell.style.left=Math.max(0,Math.min(r.left,window.innerWidth-100))+'px';
  p.shell.style.top=Math.max(27,Math.min(r.top,window.innerHeight-35))+'px';
  scheduleDraw(key);
 });
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.RICO_TEST357_DOCK={state:state,floatPanel:floatPanel,dockPanel:dockPanel,scrollToBank:bankTarget};
console.info('[TEST357] Dockable Tiles/Colours/Layers and BANK 1–2 scroller installed; exports untouched');
})();