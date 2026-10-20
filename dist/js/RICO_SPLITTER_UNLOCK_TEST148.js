/* RICO TEST148 — Restores drag on the vertical work area / tileset splitter.
 * Additive UI-only fix on TEST147 WEB+LOCAL. Does not touch exporter, animation,
 * screen contents, or user panel-size preferences.
 */
(function () {
  'use strict';
  var ID = 'ricoEastResizeHit148';
  var ROOT = 'textModeEditor';
  var timer = null;
  var observer = null;
  var ro = null;
  var monitoredRoot = null;
  var monitoredBar = null;
  var desktopOnly = true;

  function getSplit() {
    try { return window.UI && typeof UI.get === 'function' ? UI.get(ROOT) : null; }
    catch (e) { return null; }
  }
  function sync() {
    var split = getSplit(), root = document.getElementById(ROOT);
    var bar = document.getElementById(ROOT + 'eastbar');
    var east = document.getElementById(ROOT + 'east');
    var hit = document.getElementById(ID);
    if (!split || !root || !bar || !east) {
      if (hit) hit.style.display = 'none';
      return;
    }
    if (!hit) {
      hit = document.createElement('div');
      hit.id = ID;
      hit.title = 'Arrastrar para ajustar el ancho del tileset';
      hit.setAttribute('role', 'separator');
      hit.setAttribute('aria-orientation', 'vertical');
      hit.setAttribute('aria-label', 'Ajustar ancho del tileset');
      hit.style.cssText = 'position:absolute;z-index:210;cursor:col-resize;touch-action:none;user-select:none;-webkit-user-select:none;background:transparent;';
      hit.addEventListener('mousedown', function (event) {
        if (event.button !== 0) return;
        var active = getSplit();
        if (!active || !active.east || typeof UI.SplitPanelResizeMouseDown !== 'function') return;
        event.preventDefault();
        event.stopPropagation();
        // Use LVLLVL's real splitter interaction, preserving constraints and
        // the registered resizeeast callback that saves the user's preference.
        UI.SplitPanelResizeMouseDown(event, 'east', ROOT);
      });
      root.appendChild(hit);
      // The stock splitter owns mouse capture once drag has started.
      window.addEventListener('mouseup', function () { setTimeout(sync, 0); });
    }
    if (hit.parentNode !== root) root.appendChild(hit);

    var visible = split.east && split.eastSize > 0 && east.style.display !== 'none' &&
      bar.style.display !== 'none' && window.getComputedStyle(east).display !== 'none';
    if (desktopOnly && window.UI && UI.isMobile && typeof UI.isMobile.any === 'function' && UI.isMobile.any()) visible = false;
    hit.style.display = visible ? 'block' : 'none';
    if (!visible) return;

    // TEST80 extends the east area to the bottom of the root and raises the
    // bottom panel. Keep the grip above both layers. The hit-area is 13px wide,
    // while the original native resize bar and all geometry remain unchanged.
    var width = Math.max(5, split.eastBarSize || bar.offsetWidth || 5);
    hit.style.right = Math.max(0, split.eastSize - 4) + 'px';
    hit.style.width = (width + 8) + 'px';
    hit.style.top = bar.style.top || '0px';
    hit.style.bottom = bar.style.bottom || '0px';
    bar.style.zIndex = '205';
    bar.style.pointerEvents = 'auto';
    bar.style.cursor = 'col-resize';

    if (typeof ResizeObserver === 'function') {
      if (!ro) ro = new ResizeObserver(sync);
      if (monitoredRoot !== root) { if (monitoredRoot) ro.unobserve(monitoredRoot); ro.observe(root); monitoredRoot = root; }
      if (monitoredBar !== bar) { if (monitoredBar) ro.unobserve(monitoredBar); ro.observe(bar); monitoredBar = bar; }
    }
  }
  function initialize() {
    sync();
    if (!observer && typeof MutationObserver === 'function') {
      observer = new MutationObserver(function (records) {
        // Only recheck for replacements of the UI structure, not style updates.
        for (var i = 0; i < records.length; i++) {
          if (records[i].addedNodes.length || records[i].removedNodes.length) { sync(); break; }
        }
      });
      observer.observe(document.body, {childList:true, subtree:true});
    }
    if (!timer) timer = setInterval(sync, 800);
    window.addEventListener('resize', sync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
  window.RICO_TEST148_SPLITTER_UNLOCK = {refresh:sync};
  console.log('[RICO TEST148] Work/tileset east divider restored (native splitter, 13px hit target).');
})();
