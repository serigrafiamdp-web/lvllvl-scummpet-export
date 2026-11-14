/* TEST359 — Full-viewport right sidebar, UI-only extension over unused menu
 * share/sign-in area. Keeps the proven TEST358 C17 splitter, data, callbacks,
 * native east resize, tiles zoom, banks and exporters untouched.
 * Desktop only. No new menu items, buttons, or cloned editor nodes.
 */
(function(){
 'use strict';
 if(window.RICO_TEST359_FULL_HEIGHT)return;
 var state={version:359,installed:false,attempts:0,last:'WAITING',error:null};
 var STYLES_ID='rico359TopRightUIStyle';
 function installStyles(){
  if(document.getElementById(STYLES_ID))return;
  var css=document.createElement('style');
  css.id=STYLES_ID;
  css.textContent=[
   // These two controls are created by Editor.buildInterface and
   // displayUserDetails. Don't disable GitHub services or menu commands.
   '#shareButton,#menuUserInfo,#menuSignIn,#menuSignOut{display:none!important;}',
   // Prevent the empty right-hand menu placeholder from covering Tile Editor.
   '#rico359RightSidebar{background:#171717;}'
  ].join('\n');
  document.head.appendChild(css);
 }
 function apply(){
  if(!document.body||!window.UI||!UI.exists||!UI.exists('textModeEditor'))return false;
  if(UI.isMobile&&UI.isMobile.any&&UI.isMobile.any()){
   state.last='DESKTOP ONLY';return true;
  }
  var root=UI('textModeEditor');
  if(!root||!root.id)return false;
  var east=document.getElementById(root.id+'east');
  var eastBar=document.getElementById(root.id+'eastbar');
  if(!east||!eastBar||!east.isConnected)return false;
  if(root.eastSize===0||east.style.display==='none')return false;
  installStyles();
  // The native east pane is positioned beneath projectSplitPanel's 30px menu.
  // Making this SAME DOM element viewport-fixed lets it span that menu on the
  // RIGHT without reparenting any canvases or mutating the proven C17 splitter.
  east.style.position='fixed';
  east.style.top='0px';
  east.style.bottom='0px';
  east.style.right='0px';
  east.style.left='auto';
  east.style.height='auto';
  east.style.zIndex='180';
  east.style.backgroundColor='#171717';
  // The actual native east divider stays interactive across full height.
  // Its CSS right offset and width remain managed by UI.SplitPanel.
  eastBar.style.position='fixed';
  eastBar.style.top='0px';
  eastBar.style.bottom='0px';
  eastBar.style.left='auto';
  eastBar.style.height='auto';
  eastBar.style.zIndex='181';
  if(!Number.isFinite(Number(root.eastSize))||root.eastSize<60){
   state.error='RIGHT WIDTH NOT READY';
   return false;
  }
  // Never alter width: the native right resize bar and saved Dock Status own it.
  state.installed=true;
  state.last='FULL HEIGHT RIGHT SIDEBAR';
  state.rootUIID=root.id;
  state.width=root.eastSize;
  state.menuTop=0;
  var dock=window.RICO_TEST358_DOCK;
  // Reflow the already-existing native C17 split ONCE after its parent grows.
  if(dock&&dock.rightDock&&dock.rightDock.active){
   var panel=dock.rightDock.split;
   if(panel&&panel.resize)panel.resize();
   if(dock.forceFit)dock.forceFit();
  }
  return true;
 }
 function boot(){
  if(!document.body){setTimeout(boot,80);return;}
  installStyles();
  (function tryOnce(){
   state.attempts++;
   try{
    if(apply())return;
   }catch(err){state.error=String(err&&err.message||err);}
   if(state.attempts<150)setTimeout(tryOnce,100);
   else state.last='FAILED TO FIND NATIVE RIGHT SIDEBAR';
  })();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
 else boot();
 window.RICO_TEST359_FULL_HEIGHT={state:state,apply:apply};
 console.info('[TEST359] Right sidebar extends to menu bar; Share/GitHub header buttons hidden. TEST358 C17 untouched.');
})();