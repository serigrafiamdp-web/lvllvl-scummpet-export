(function() {
  'use strict';

  if(typeof TileEditorGrid === 'undefined') {
    console.error('[RICO TEST38] TileEditorGrid not found.');
    return;
  }

  var BANK_SIZE = 256;
  var FRAME_BANK_FIELD = 'charsetBank';

  function getActiveBank(tileSet) {
    try {
      var editor = tileSet && tileSet.editor;
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var frame = graphic.getCurrentFrame();
      if(frame < 0 || frame >= graphic.frames.length) return 1;
      return parseInt(graphic.frames[frame][FRAME_BANK_FIELD], 10) === 2 ? 2 : 1;
    } catch(e) {
      return 1;
    }
  }

  function uniqueCharacters(grid, character) {
    var out = [];
    var seen = {};

    function add(value) {
      value = parseInt(value, 10);
      if(isNaN(value) || value < 0 || value >= BANK_SIZE || seen[value]) return;
      seen[value] = true;
      out.push(value);
    }

    if(typeof character !== 'undefined' && character !== null) {
      add(character);
      return out;
    }

    var chars = grid && grid.characters ? grid.characters : [];
    for(var y = 0; y < chars.length; y++) {
      for(var x = 0; x < chars[y].length; x++) add(chars[y][x]);
    }
    return out;
  }

  function redrawPalette(tilePalette, tiles) {
    try {
      if(!tilePalette || !tilePalette.tilePaletteDisplay || !tiles || !tiles.length) return;
      tilePalette.tilePaletteDisplay.draw({ redrawTiles: true, tiles: tiles });
    } catch(e) {
      console.error('[RICO TEST38] Palette redraw failed.', e);
    }
  }

  function invalidatePreviewCache(tileSet, bank, chars) {
    var preview = tileSet && tileSet.__ricoPalettePreview33;
    if(!preview || !preview.pixels || !preview.phase || !preview.pixels[bank] || !preview.phase[bank]) return;

    for(var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      preview.pixels[bank][ch] = null;
      // TEST33 treats a defined-but-wrong phase as dirty even for non-animated chars.
      preview.phase[bank][ch] = '__rico_test38_dirty__';
    }
  }

  function invalidateGroupCache(tileSet, bank) {
    try {
      if(tileSet && tileSet.__ricoGroupPhase34) tileSet.__ricoGroupPhase34[bank] = {};
    } catch(e) {}
  }

  var previousUpdateCharacter38 = TileEditorGrid.prototype.updateCharacter;
  TileEditorGrid.prototype.updateCharacter = function(character) {
    var result = previousUpdateCharacter38.apply(this, arguments);

    try {
      var editor = this.editor;
      var tileSet = editor && editor.tileSetManager ? editor.tileSetManager.getCurrentTileSet() : null;
      if(!tileSet) return result;

      var chars = uniqueCharacters(this, character);
      if(!chars.length) return result;

      var bank = getActiveBank(tileSet);

      // TEST33 keeps a palette-only pixel cache so animated chars can continue
      // moving even when unused on the map. After a manual Tile Editor edit that
      // cache still contained the old glyph, which made the visible charset index
      // look unchanged although the real character had already been modified.
      invalidatePreviewCache(tileSet, bank, chars);

      // If one of the edited chars belongs to Group Animate, force the group
      // composite to be rebuilt from the new source pixels on this same tick.
      invalidateGroupCache(tileSet, bank);

      // Rebuild TEST33/TEST34 preview buffers immediately without waiting for the
      // next animation phase. This preserves animated palette preview behaviour.
      if(typeof tileSet.update === 'function') {
        var tick = (typeof g_tick !== 'undefined') ? g_tick : 0;
        tileSet.update(tick);
      }

      // Final explicit redraw guarantees immediate feedback for static chars too.
      redrawPalette(editor.tools && editor.tools.drawTools ? editor.tools.drawTools.tilePalette : null, chars);

      var sideChars = [];
      var offset = bank === 2 ? BANK_SIZE : 0;
      for(var i = 0; i < chars.length; i++) sideChars.push(offset + chars[i]);
      redrawPalette(editor.sideTilePalette, sideChars);

    } catch(e) {
      console.error('[RICO TEST38] Character palette refresh failed.', e);
    }

    return result;
  };

  window.RICO_TEST38_TILE_PALETTE_EDIT_REFRESH = true;
  console.log('[RICO TEST38] Edited characters now refresh immediately in visible palettes/indexes.');
})();