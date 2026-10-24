/* RICO TEST267 — Enlarged C64 Formats import window, isolated UI-only patch.
 * Original import/export functionality remains unchanged.
 * Native emulator backbuffer stays 384x272; scale happens via canvas CSS.
 * Page base: MASTER_LVLLVL_RICO_24_OCTUBRE_2026 (TEST264).
 */
(function () {
  'use strict';
  if (typeof UI === 'undefined' || typeof UI.showDialog !== 'function'
      || typeof g_htmlCache === 'undefined') {
    console.error('[RICO TEST267] Import UI not initialized; no changes made.');
    return;
  }
  var key = 'html/textMode/importC64Formats.html';
  var originalHTML = g_htmlCache[key];
  if (typeof originalHTML !== 'string') {
    console.error('[RICO TEST267] Original Import C64 Formats panel missing.');
    return;
  }
  var header = '<h2 style="margin: 0 0 6px 0">Import C64 Formats</h2>';
  if (originalHTML.indexOf(header) < 0) {
    console.error('[RICO TEST267] Expected import header missing; no changes made.');
    return;
  }
  g_htmlCache[key] = originalHTML.replace(header,
    '<h2 style="margin: 0 0 6px 0">Import C64 Formats <span style="font-size:12px;color:#a5b2c1;font-weight:normal">— RICO TEST267 · Big Screen</span></h2>');

  // Never resize the internal C64 image buffer; decoder/redraw assumes 384x272.
  var css = document.createElement('style');
  css.id = 'rico-test267-import-c64-style';
  css.textContent =
    '#importC64FormatsPanel #importC64FormatsPreview{' +
    'display:block;image-rendering:pixelated;image-rendering:crisp-edges;' +
    'height:auto;max-width:100%;box-sizing:border-box;' +
    'border:1px solid #424951!important;}' +
    '#importC64FormatsPanel table{border-collapse:separate;border-spacing:0;}' +
    '#importC64FormatsPanel td{vertical-align:top;}' +
    '#importC64FormatsPanel #importC64PRGControls{margin-bottom:8px;}';
  document.head.appendChild(css);

  var oldShowDialog = UI.showDialog;
  function layout() {
    var dialog = UI('importC64FormatsDialog');
    if (!dialog || typeof dialog.setWidth !== 'function'
      || typeof dialog.setHeight !== 'function') return null;
    var viewportWidth = Math.max(320, window.innerWidth || 1280);
    var viewportHeight = Math.max(340, window.innerHeight || 900);
    var dialogWidth = Math.min(1120, Math.max(290, viewportWidth - 38));
    var dialogHeight = Math.min(850, Math.max(310, viewportHeight - 46));
    dialog.setWidth(dialogWidth);
    dialog.setHeight(dialogHeight);
    var canvas = document.getElementById('importC64FormatsPreview');
    if (canvas) {
      // Reserve width for the joystick, and height for import toolbar/buttons.
      // The native backing resolution remains 384x272, preserving pixel data.
      var availableW = dialogWidth - 288;
      var availableH = (dialogHeight - 220) * 384 / 272;
      var scaledWidth = Math.max(220,
        Math.min(768, Math.floor(availableW), Math.floor(availableH)));
      canvas.style.width = scaledWidth + 'px';
      canvas.style.height = 'auto';
      canvas.style.imageRendering = 'pixelated';
      window.RICO_TEST267_VIDEO = {
        cssWidth: scaledWidth,
        nativeWidth: 384,
        nativeHeight: 272,
        scale: Math.round(scaledWidth / 384 * 100) / 100,
        dialogWidth: dialogWidth,
        dialogHeight: dialogHeight
      };
    }
    return dialog;
  }
  UI.showDialog = function(id) {
    if (id === 'importC64FormatsDialog') layout();
    return oldShowDialog.apply(this, arguments);
  };
  window.addEventListener('resize', function() {
    try {
      var dialog = UI('importC64FormatsDialog');
      if (!dialog || !dialog.visible || dialog.visible === false) return;
      // A reopen also relays out the dialog via UI.showDialog.
      layout();
    } catch (err) { /* Resize must never interrupt running C64. */ }
  });
  window.RICO_TEST267_BIG_SCREEN = { version:'TEST267', relayout:layout };
  console.log('[RICO TEST267] Big Screen installed (up to 1120x850 dialog, native 384x272 displayed up to 768x544).');
})();
