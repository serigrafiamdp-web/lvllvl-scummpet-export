/* TEST384 — unified themed mouse hints / native-title replacement.
 * LVLLVL has many `title` attributes in its static and dynamically
 * generated controls; browser-native title bubbles cannot be CSS-themed.
 * This layer renders their text in a theme-aware tooltip without changing
 * user controls, buttons, keyboard shortcuts, menu logic or editor state.
 */
(function(){
'use strict';
if(window.RICO_TEST384_HINTS)return;
var STYLE_ID='rico384-hints-style', TIP_ID='rico384-hint',
    active=null, originalTitle='', timer=null, shown=false,
    focusOwned=false, pointerX=0, pointerY=0, savedAria=null,
    pointerMode='mouse', tip=null, lastTheme='';
function css(){
 if(document.getElementById(STYLE_ID))return;
 var s=document.createElement('style');s.id=STYLE_ID;
 s.textContent=[
  '#'+TIP_ID+' {position:fixed;display:none;pointer-events:none;',
  'left:0;top:0;z-index:2147483646;box-sizing:border-box;',
  'max-width:min(340px,calc(100vw - 20px));width:max-content;',
  'padding:6px 9px;border-radius:4px;border:1px solid #5c5c5c;',
  'background:#272727;color:#ededed;box-shadow:0 3px 12px rgba(0,0,0,.42);',
  'font:12px/1.42 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;',
  'white-space:pre-wrap;overflow-wrap:anywhere;text-align:left;',
  'user-select:none;-webkit-user-select:none;}',
  '#'+TIP_ID+'[data-visible="1"]{display:block;}',
  '@media (prefers-reduced-motion:reduce){#'+TIP_ID+'{transition:none!important;}}'
 ].join('');
 (document.head||document.documentElement).appendChild(s);
}
function ensure(){
 if(tip&&tip.isConnected)return tip;
 css();
 tip=document.getElementById(TIP_ID);
 if(!tip){tip=document.createElement('div');tip.id=TIP_ID;tip.setAttribute('role','tooltip');tip.setAttribute('aria-hidden','true');document.body.appendChild(tip);}
 return tip;
}
function hitTitle(start){
 var e=start&&start.nodeType===1?start:start&&start.parentElement;
 while(e&&e!==document.documentElement){
  if(e===active&&originalTitle.trim())return{element:e,title:originalTitle};
  var title=e.getAttribute&&e.getAttribute('title');
  if(title&&title.trim())return{element:e,title:title};
  e=e.parentElement;
 }
 return null;
}
function validColor(v){
 if(!v||v==='transparent'||v==='inherit'||v==='initial')return false;
 var m=v.match(/^rgba?\(([^)]+)\)$/);
 if(m){var a=m[1].split(',').map(function(x){return Number(x.trim());});return a.length<4||a[3]>0.9;}
 return /^#([0-9a-f]{3,8})$/i.test(v)||/^(color|hsl)/i.test(v);
}
function luminance(value){
 var m=value.match(/^rgba?\(([^)]+)\)$/),a;
 if(m)a=m[1].split(',').slice(0,3).map(Number);
 else if(/^#[0-9a-f]{6}$/i.test(value))a=[1,3,5].map(function(j){return parseInt(value.slice(j,j+2),16);});
 else if(/^#[0-9a-f]{3}$/i.test(value))a=[1,2,3].map(function(j){return parseInt(value[j]+value[j],16);});
 else return 0.15;
 return (a[0]*0.2126+a[1]*0.7152+a[2]*0.0722)/255;
}
function theme(el){
 var root=window.getComputedStyle(document.documentElement);
 var bg=root.getPropertyValue('--rico-hint-bg').trim()||root.getPropertyValue('--tooltip-bg').trim();
 var fg=root.getPropertyValue('--rico-hint-color').trim()||root.getPropertyValue('--tooltip-color').trim()||'#eeeeee';
 var border=root.getPropertyValue('--rico-hint-border').trim()||'#606060';
 if(!bg){
  var p=el&&el.closest&&el.closest('.ui-dialog,.ui-popup,.activeBackground,.ui-button-holder,.ui-tab-panel,.ui-menu');
  for(;p&&p!==document.documentElement;p=p.parentElement){
   if(!window.getComputedStyle)break;
   var b=window.getComputedStyle(p).backgroundColor;
   if(validColor(b)&&luminance(b)<0.49){bg=b;break;}
  }
 }
 bg=bg||'#282828';
 // An explicit light theme can choose its own text color through --rico-hint-color.
 // Otherwise match the editor's existing high-contrast dark controls.
 if(luminance(bg)>0.68&&!root.getPropertyValue('--rico-hint-color').trim()&&!root.getPropertyValue('--tooltip-color').trim())fg='#191919';
 return {bg:bg,fg:fg,border:border};
}
function applyTheme(el){
 var colors=theme(el),key=[colors.bg,colors.fg,colors.border].join('|');
 if(key===lastTheme)return;
 var t=ensure();t.style.backgroundColor=colors.bg;
 t.style.color=colors.fg;t.style.borderColor=colors.border;
 lastTheme=key;
}
function position(x,y,keyboard){
 var t=ensure(),r=keyboard&&active&&active.getBoundingClientRect?active.getBoundingClientRect():null;
 if(r){x=r.left+Math.min(22,r.width/2);y=r.bottom+6;}
 else{x+=14;y+=18;}
 var w=t.offsetWidth||220,h=t.offsetHeight||30;
 x=Math.max(8,Math.min(x,window.innerWidth-w-8));
 if(y+h>window.innerHeight-8)y=keyboard&&r?r.top-h-8:y-h-28;
 y=Math.max(8,Math.min(y,window.innerHeight-h-8));
 t.style.left=Math.round(x)+'px';
 t.style.top=Math.round(y)+'px';
}
function clearDelay(){if(timer!==null){window.clearTimeout(timer);timer=null;}}
function conceal(){clearDelay();if(tip){tip.removeAttribute('data-visible');tip.setAttribute('aria-hidden','true');}shown=false;}
function restore(){
 conceal();
 if(active){
  // If another part of the editor supplied a new title during hover, do not
  // overwrite it; otherwise restore the EXACT native title value.
  if(active.getAttribute('title')===null)active.setAttribute('title',originalTitle);
  if(focusOwned){
   if(active.getAttribute('aria-label')===originalTitle)active.removeAttribute('aria-label');
   focusOwned=false;
  }
 }
 active=null;originalTitle='';savedAria=null;lastTheme='';
}
function activate(target,mode){
 var found=hitTitle(target);
 if(!found){if(active)restore();return;}
 if(active===found.element)return;
 restore();
 active=found.element;originalTitle=found.title;pointerMode=mode;
 // Remove native title on ENTER, not when tooltip appears, so no white
 // browser bubble is ever shown alongside the themed hint.
 active.removeAttribute('title');
 if(!active.hasAttribute('aria-label')&&!active.hasAttribute('aria-labelledby')&&
    !(active.textContent||'').trim()){
  active.setAttribute('aria-label',originalTitle);focusOwned=true;
 }
 ensure().textContent=originalTitle;
 applyTheme(active);
 clearDelay();
 timer=window.setTimeout(function(){
  timer=null;
  if(!active||!active.isConnected){restore();return;}
  var t=ensure();t.setAttribute('data-visible','1');t.setAttribute('aria-hidden','false');
  shown=true;position(pointerX,pointerY,pointerMode==='focus');
 },mode==='focus'?160:460);
}
function onOver(e){
 if(e.pointerType==='touch')return;
 if(e.clientX!=null){pointerX=e.clientX;pointerY=e.clientY;}
 activate(e.target,'mouse');
}
function onMove(e){
 if(!active)return;
 pointerX=e.clientX;pointerY=e.clientY;
 if(shown&&pointerMode==='mouse')position(pointerX,pointerY,false);
}
function onOut(e){
 if(!active)return;
 var related=e.relatedTarget;
 if(related&&active.contains&&active.contains(related))return;
 // The matching mouseover will reactivate a parent/sibling title when needed.
 restore();
}
function onFocus(e){
 // A keyboard-focused hint uses the control bounds rather than the cursor.
 if(e.target&&e.target!==active)activate(e.target,'focus');
}
function onBlur(e){if(active&&e.target===active)restore();}
function init(){
 if(!document.body){document.addEventListener('DOMContentLoaded',init,{once:true});return;}
 ensure();
 document.addEventListener('mouseover',onOver,true);
 document.addEventListener('mousemove',onMove,{passive:true,capture:true});
 document.addEventListener('mouseout',onOut,true);
 document.addEventListener('focusin',onFocus,true);
 document.addEventListener('focusout',onBlur,true);
 document.addEventListener('mousedown',conceal,true);
 document.addEventListener('keydown',function(e){if(e.key==='Escape')conceal();},true);
 window.addEventListener('blur',restore);
 window.addEventListener('resize',function(){if(shown)position(pointerX,pointerY,pointerMode==='focus');});
 console.log('[RICO TEST384] themed hints active for dynamically added native title attributes');
}
window.RICO_TEST384_HINTS={version:384,init:init,restore:restore,getState:function(){return{active:!!active,shown:shown,theme:lastTheme};}};
init();
})();