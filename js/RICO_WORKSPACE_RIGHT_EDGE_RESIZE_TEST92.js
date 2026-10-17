(function(){
'use strict';

function getRoot(){
  try { return (window.UI && UI.exists && UI.exists('textModeEditor')) ? UI('textModeEditor') : null; }
  catch(e){ return null; }
}

function install(){
  var root = getRoot();
  if(!root) return false;

  var bar = document.getElementById(root.id + 'eastbar');
  var east = document.getElementById(root.id + 'east');
  if(!bar || !east) return false;

  // Keep the same visual divider, but make its hit area easy to grab.
  bar.style.display = 'block';
  bar.style.width = '10px';
  bar.style.cursor = 'col-resize';
  bar.style.pointerEvents = 'auto';
  bar.style.zIndex = '120';
  bar.style.background = 'transparent';

  if(bar.__ricoWorkspaceResize92) return true;
  bar.__ricoWorkspaceResize92 = true;

  // Replace the old tiny/native hit area with a reliable drag on the
  // vertical boundary between the workspace and the right Tiles panel.
  bar.removeAttribute('onmousedown');

  bar.addEventListener('mousedown', function(ev){
    if(ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();

    var startX = ev.pageX;
    var startEast = root.eastSize;
    if(!isFinite(startEast) || startEast <= 0){
      startEast = east.getBoundingClientRect().width || 340;
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function move(e){
      e.preventDefault();
      var diff = e.pageX - startX;
      var newEast = Math.round(startEast - diff);
      var rootEl = root.getElement ? root.getElement() : null;
      var total = rootEl ? rootEl.clientWidth : window.innerWidth;
      var minEast = 120;
      var maxEast = Math.max(minEast, total - 180);
      if(newEast < minEast) newEast = minEast;
      if(newEast > maxEast) newEast = maxEast;
      root.resizeThePanel({panel:'east', size:newEast});
    }

    function up(){
      window.removeEventListener('mousemove', move, true);
      window.removeEventListener('mouseup', up, true);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        var type = 'textmode';
        if(window.g_app && g_app.textModeEditor && g_app.textModeEditor.graphic && g_app.textModeEditor.graphic.type === 'sprite') type = 'sprite';
        if(window.g_app && g_app.setPref) g_app.setPref(type + '.eastPanelSize', root.eastSize);
      } catch(e){}
    }

    window.addEventListener('mousemove', move, true);
    window.addEventListener('mouseup', up, true);
  }, true);

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
    var observer = new MutationObserver(function(){ install(); });
    observer.observe(document.body, {childList:true, subtree:true});
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();

window.RICO_TEST92_WORKSPACE_EDGE = { install: install };
console.log('[RICO TEST92] workspace right vertical boundary resize enabled');
})();