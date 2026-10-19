/* RICO TEST139 — preview-only fix. NEVER changes map, background or exporter. */
(function () {
  'use strict';
  if (typeof TileSet === 'undefined') return;
  var oldUpdate = TileSet.prototype.update;
  var BANK_SIZE = 256;
  var PREVIEW_INTERVAL_MS = 95; // visual identification, not C64-exact timing
  var running = false;

  function activeBank(tileSet) {
    var editor = tileSet && tileSet.editor;
    var g = editor && editor.graphic;
    if (!g || !g.frames || !g.frames.length) return 1;
    var frame = g.getCurrentFrame();
    return g.frames[frame] && +g.frames[frame].charsetBank === 2 ? 2 : 1;
  }
  function takePhases(tileSet) {
    var s = tileSet && tileSet.__ricoPalettePreview33;
    if (!s || !s.phase || !s.phase[1] || !s.phase[2]) return null;
    return { 1: s.phase[1].slice(0, BANK_SIZE), 2: s.phase[2].slice(0, BANK_SIZE) };
  }
  function delta(after, before, bank, force) {
    var changes = [];
    if (!after || !after.pixels || !after.pixels[bank] || !after.phase || !after.phase[bank]) return changes;
    for (var i = 0; i < BANK_SIZE; i++) {
      var phase = after.phase[bank][i];
      // A defined numeric phase signals an animated glyph. A phase equal to
      // '__rico_test38_dirty__' indicates the manual editor invalidated it.
      if (typeof phase === 'undefined' && !before) continue;
      var was = before && before[bank] ? before[bank][i] : undefined;
      if (phase !== was || (force && typeof phase !== 'undefined')) changes.push(i);
    }
    return changes;
  }
  function redrawPalette(tilePalette, codes) {
    if (!codes.length || !tilePalette || !tilePalette.tilePaletteDisplay) return;
    var display = tilePalette.tilePaletteDisplay;
    if (typeof display.draw !== 'function') return;
    // draw({redrawTiles:true,tiles:codes}) reuses TEST33's temporary
    // animated pixel substitution and TEST17/TEST21's virtual BANK2 mapping.
    // TEST120's temporary muting has already been restored at this point.
    display.draw({ redrawTiles: true, tiles: codes });
  }

  TileSet.prototype.update = function (tick) {
    if (running) return oldUpdate.apply(this, arguments);
    var before = takePhases(this);
    var result = oldUpdate.apply(this, arguments);
    var state = this.__ricoPalettePreview33;
    if (!state || !state.phase) return result; // no dual-bank preview available

    var changed1 = delta(state, before, 1, !this.__ricoIndex139Init);
    var changed2 = delta(state, before, 2, !this.__ricoIndex139Init);
    // Keep pending indices across the throttled ticks. An animation with a
    // long ticks-per-frame interval must not lose its only palette update.
    var pending = this.__ricoIndex139Pending;
    if (!pending) pending = this.__ricoIndex139Pending = { 1: {}, 2: {} };
    for (var j = 0; j < changed1.length; j++) pending[1][changed1[j]] = true;
    for (var k = 0; k < changed2.length; k++) pending[2][changed2[k]] = true;
    var codes1 = Object.keys(pending[1]).map(Number);
    var codes2 = Object.keys(pending[2]).map(Number);
    if (!codes1.length && !codes2.length) return result;

    var now = Date.now();
    // 95ms is presentation-only. Never re-time real character data / PRG.
    if (this.__ricoIndex139Init && now - (this.__ricoIndex139Last || 0) < PREVIEW_INTERVAL_MS) return result;

    var editor = this.editor;
    if (!editor) return result;
    var selected = activeBank(this);
    var activeChanged = selected === 2 ? codes2 : codes1;
    var sideChanged = codes1.slice(0);
    for (var i = 0; i < codes2.length; i++) sideChanged.push(BANK_SIZE + codes2[i]);

    running = true;
    try {
      redrawPalette(editor.tools && editor.tools.drawTools && editor.tools.drawTools.tilePalette, activeChanged);
      redrawPalette(editor.sideTilePalette, sideChanged);
      this.__ricoIndex139Init = true;
      this.__ricoIndex139Last = now;
      this.__ricoIndex139Pending = { 1: {}, 2: {} };
    } catch(e) {
      console.error('[RICO TEST139] Palette-only animation refresh failed', e);
    } finally {
      running = false;
    }
    return result;
  };

  window.RICO_TEST139_INDEX_ANIMATED = true;
  console.log('[RICO TEST139] Animated charset index preview enabled; canvas/scroll/export untouched.');
})();
