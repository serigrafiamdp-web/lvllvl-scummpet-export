/* TEST268 — C64 Import compact bottom joystick controls.
 * Requires TEST267 before this script. 100% UI-only; no VIC/CPU/PRG changes.
 * Preserve all existing radio IDs, events, hidden format-specific controls.
 */
(function() {
  'use strict';
  if (typeof ImportC64Formats === 'undefined' || typeof UI === 'undefined'
      || !window.RICO_TEST267_BIG_SCREEN) {
    console.error('[TEST268] TEST267 prerequisite missing; no changes made.');
    return;
  }

  var css = document.createElement('style');
  css.id = 'rico-test268-style';
  css.textContent = [
    '#importC64FormatsPanel #ricoTest267ImportTable{width:100%!important;table-layout:auto!important;border-spacing:0!important;}',
    '#importC64FormatsPanel #ricoTest267EmuCol{width:100%!important;min-width:0!important;padding:0!important;}',
    '#importC64FormatsPanel #ricoTest268Footer{display:flex;align-items:center;gap:6px 14px;flex-wrap:wrap;max-width:100%;margin-top:2px;padding:6px 0 3px;border-top:1px solid #353535;font-size:12px;}',
    '#importC64FormatsPanel #importC64PRGControls{display:block;margin:0!important;white-space:nowrap;font-size:12px;color:#aeb7c1;}',
    '#importC64FormatsPanel #importC64PRGControls>div{margin:0!important;}',
    '#importC64FormatsPanel #importC64Settings{margin:0!important;padding:0!important;background:transparent!important;font-size:12px;}',
    '#importC64FormatsPanel #importC64Settings h3{display:inline-block;margin:0 9px 0 0;font-size:12px;font-weight:600;color:#d7d7d7;}',
    '#importC64FormatsPanel #importC64Settings>div:nth-of-type(1){display:inline-flex!important;gap:10px;align-items:center;margin:0 10px 0 0;}',
    '#importC64FormatsPanel #importC64Settings .rb-container{font-size:12px;display:inline-flex;margin:0;padding-left:19px;white-space:nowrap;line-height:17px;}',
    '#importC64FormatsPanel #importC64Settings .rb-container .checkmark{top:1px;}',
    '#importC64FormatsPanel #importC64Settings>div:nth-of-type(2){display:inline-block;color:#89949f;font-size:11px;}',
    '#importC64FormatsPanel #importC64Settings>div:nth-of-type(2)>div{display:inline;margin-right:9px;}',
    '#importC64FormatsPanel #ricoTest268Footer .importC64Settings:not(#importC64Settings){width:100%;}',
    '#importC64FormatsPanel #importC64FormatsPreview{display:block!important;image-rendering:pixelated!important;max-width:100%!important;height:auto!important;}',
    '@media(max-width:740px){#importC64FormatsPanel #importC64Settings>div:nth-of-type(2){display:block;margin-top:4px;}}'
  ].join('\n');
  document.head.appendChild(css);

  var previousInit = ImportC64Formats.prototype.initContent;
  ImportC64Formats.prototype.initContent = function() {
    var result = previousInit.apply(this, arguments);
    moveControlsToBottom();
    compactLayout();
    return result;
  };

  function moveControlsToBottom() {
    if (document.getElementById('ricoTest268Footer')) return;
    var col = document.getElementById('ricoTest267EmuCol');
    var extra = document.getElementById('ricoTest267OptionsCol');
    var run = document.getElementById('importC64PRGControls');
    if (!col || !extra || !run) {
      console.warn('[TEST268] Import panel DOM not ready; will try again.');
      return;
    }
    // Retain the same actual elements so initEvents(), .show() and .hide()
    // keep working, including VSF, SEQ and CharPad import settings.
    var bar = document.createElement('div');
    bar.id = 'ricoTest268Footer';
    col.appendChild(bar);
    bar.appendChild(run);
    while (extra.firstChild) bar.appendChild(extra.firstChild);
    if (extra.parentNode) extra.parentNode.removeChild(extra);
    col.style.setProperty('width', '100%', 'important');
    col.style.setProperty('min-width', '0', 'important');
  }

  function compactLayout() {
    var dialog = UI('importC64FormatsDialog');
    if (!dialog || typeof dialog.setWidth !== 'function'
      || typeof dialog.setHeight !== 'function') return;
    var w = Math.min(855, Math.max(300, (window.innerWidth || 1280) - 38));
    var h = Math.min(850, Math.max(315, (window.innerHeight || 900) - 48));
    dialog.setWidth(w);
    dialog.setHeight(h);
    var dialogElement = document.getElementById('importC64FormatsDialog');
    if (dialogElement) {
      dialog.left = Math.max(8, Math.floor(((window.innerWidth || 1280) - w) / 2));
      dialogElement.style.left = dialog.left + 'px';
    }

    var canvas = document.getElementById('importC64FormatsPreview');
    if (canvas) {
      // Only enlarge the CSS display; leave the native C64 384x272
      // framebuffer intact for c64Redraw() and the VIC decoder.
      var cw = Math.max(220, Math.min(768, w - 52));
      canvas.style.setProperty('width', cw + 'px', 'important');
      canvas.style.setProperty('max-width', '100%', 'important');
      canvas.style.setProperty('height', 'auto', 'important');
      canvas.style.setProperty('image-rendering', 'pixelated', 'important');
      window.RICO_TEST268_VIDEO = {
        nativeWidth:384,nativeHeight:272,displayWidth:cw,
        scale:Math.round(cw / 384 * 100) / 100,
        dialogWidth:w,dialogHeight:h
      };
    }
  }

  // TEST267's show hook runs first. Re-center and reduce dead space after it.
  var oldShow = UI.showDialog;
  UI.showDialog = function() {
    var result = oldShow.apply(this, arguments);
    if (arguments[0] === 'importC64FormatsDialog') {
      moveControlsToBottom();
      compactLayout();
    }
    return result;
  };

  window.addEventListener('resize', function() {
    if (document.getElementById('ricoTest268Footer')) compactLayout();
  });

  window.RICO_TEST268_COMPACT_CONTROLS = {
    version:'TEST268',relayout:compactLayout
  };
  console.log('[TEST268] Compact joystick bar below C64 preview; TEST267 kept intact.');
})();