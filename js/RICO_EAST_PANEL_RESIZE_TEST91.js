(function(){
'use strict';

var installed = false;
var observer = null;

function getEditorSplit(){
  try {
    if(window.UI && UI.exists && UI.exists('textModeEditor')) return UI('textModeEditor');
  } catch(e) {}
  return null;
}

function install(){
  var bar = document.getElementById('textModeEditoreastbar');
  var east = document.getElementById('textModeEditoreast');
  var root = document.getElementById('textModeEditor');
  var split = getEditorSplit();
  if(!bar || !east || !root || !split) return false;

  bar.style.display = 'block';
  bar.style.width = '9px';
  bar.style.cursor = 'col-resize';
  bar.style.pointerEvents = 'auto';
  bar.style.touchAction = 'none';
  bar.style.zIndex = '90';

  if(bar.__ricoEastResize91) return true;
  bar.__ricoEastResize91 = true;

  bar.addEventListener('pointerdown', function(ev){
    if(ev.button !== undefined && ev.button !== 0) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();

    var startX = ev.clientX;
    var startWidth = east.getBoundingClientRect().width;
    if(!startWidth || startWidth < 1) startWidth = split.eastSize || 340;

    try { bar.setPointerCapture(ev.pointerId); } catch(e) {}
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function move(e){
      e.preventDefault();
      var dx = startX - e.clientX;
      var maxWidth = Math.max(40, root.clientWidth - 120);
      var newWidth = Math.round(startWidth + dx);
      if(newWidth < 40) newWidth = 40;
      if(newWidth > maxWidth) newWidth = maxWidth;
      split.resizeThePanel({panel:'east', size:newWidth});
    }

    function finish(e){
      try { bar.releasePointerCapture(ev.pointerId); } catch(x) {}
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', finish);
      bar.removeEventListener('pointercancel', finish);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        var type = 'textmode';
        if(window.g_app && g_app.textModeEditor && g_app.textModeEditor.graphic && g_app.textModeEditor.graphic.type === 'sprite') type = 'sprite';
        if(window.g_app && g_app.setPref) g_app.setPref(type + '.eastPanelSize', Math.round(east.getBoundingClientRect().width));
      } catch(x) {}
    }

    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', finish);
    bar.addEventListener('pointercancel', finish);
  }, true);

  installed = true;
  return true;
}

function start(){
  install();
  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    if(install() || tries > 100) clearInterval(timer);
  }, 100);

  if(typeof MutationObserver !== 'undefined'){
    observer = new MutationObserver(function(){ install(); });
    observer.observe(document.body, {childList:true, subtree:true});
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();

window.RICO_TEST91_EAST_RESIZE = { install: install };
console.log('[RICO TEST91] right Tiles panel horizontal resize unlocked');
})();