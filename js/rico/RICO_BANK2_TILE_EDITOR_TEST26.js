(function() {
  'use strict';

  if(typeof TileSet === 'undefined' || typeof TileEditor === 'undefined' || typeof TileEditorGrid === 'undefined') {
    console.error('[RICO TEST26] TileSet/TileEditor/TileEditorGrid not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;

  function copyPixels(src) {
    if(!src) return [];
    return src.slice ? src.slice(0) : Array.prototype.slice.call(src);
  }

  function getBank2Record(tileSet) {
    var record = null;
    try { record = tileSet && tileSet.getDocRecord ? tileSet.getDocRecord() : null; } catch(e) {}
    var stored = record && record.data ? record.data[BANK2_FIELD] : null;
    if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) return stored;
    return null;
  }

  function getActiveBank(tileSet) {
    try {
      var editor = tileSet && tileSet.editor;
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var frame = graphic.getCurrentFrame();
      if(frame < 0 || frame >= graphic.frames.length) return 1;
      return parseInt(graphic.frames[frame][FRAME_BANK_FIELD], 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function isStandardLike(tileSet) {
    try {
      var editor = tileSet && tileSet.editor;
      var layer = editor && editor.layers ? editor.layers.getSelectedLayerObject() : null;
      if(!layer || !layer.getType || layer.getType() !== 'grid') return true;
      if(!layer.getScreenMode || typeof TextModeEditor === 'undefined') return true;
      var mode = layer.getScreenMode();
      return mode === TextModeEditor.Mode.TEXTMODE || mode === TextModeEditor.Mode.C64STANDARD;
    } catch(e) { return true; }
  }

  function isEditableBank2(tileSet, character) {
    if(!tileSet || character === false || character < 0 || character >= BANK_SIZE) return false;
    try {
      if(tileSet.getTileWidth() !== 8 || tileSet.getTileHeight() !== 8) return false;
    } catch(e) { return false; }
    return getActiveBank(tileSet) === 2 && !!getBank2Record(tileSet) && isStandardLike(tileSet);
  }

  function ensureProps(tile) {
    if(!tile) return null;
    if(!tile.props) tile.props = {};
    if(typeof tile.props.animated === 'undefined') tile.props.animated = false;
    if(typeof tile.props.ticksPerFrame === 'undefined' || !tile.props.ticksPerFrame) tile.props.ticksPerFrame = 6;
    if(typeof tile.props.frame === 'undefined') tile.props.frame = 0;
    if(typeof tile.props.lastTick === 'undefined') tile.props.lastTick = 0;
    if(typeof tile.props.frameCount === 'undefined') tile.props.frameCount = tile.data ? tile.data.length : 1;
    return tile.props;
  }

  function markModified(tileSet) {
    try { if(tileSet && typeof tileSet.modified === 'function') tileSet.modified(); } catch(e) {}
  }

  function getBank2Tile(tileSet, character) {
    var stored = getBank2Record(tileSet);
    return stored && stored.tileData ? stored.tileData[character] : null;
  }

  // -------------------------------------------------------------------------
  // PIXEL READS
  // Native TileEditorGrid asks tileSet.getPixel(..., numericFrame). The stock
  // implementation always reads tileSet.tileData, i.e. BANK 1. When the active
  // LVLLVL frame is BANK 2 we instead read ricoCharsetBank2.tileData.
  // -------------------------------------------------------------------------
  var originalGetPixel26 = TileSet.prototype.getPixel;
  TileSet.prototype.getPixel = function(character, x, y, frame) {
    if(!isEditableBank2(this, character)) return originalGetPixel26.apply(this, arguments);

    var tile = getBank2Tile(this, character);
    if(!tile || !tile.data || !tile.data.length) return false;

    var srcPos = x + y * this.getTileWidth();

    if(frame === 'current') {
      if(this.currentTileData && this.currentTileData[character]) {
        return this.currentTileData[character][srcPos];
      }
      return tile.data[0][srcPos];
    }

    if(typeof frame === 'undefined' || frame === null || isNaN(parseInt(frame, 10))) frame = 0;
    frame = parseInt(frame, 10);

    var props = ensureProps(tile);
    if(props.animated === 'frames' && frame >= 0 && frame < tile.data.length) {
      return tile.data[frame][srcPos];
    }

    // Scroll/Ping Pong/Blink edit their canonical source glyph, exactly like
    // native LVLLVL does for BANK 1.
    return tile.data[0][srcPos];
  };

  // -------------------------------------------------------------------------
  // PIXEL WRITES
  // All Tile Editor tools (pencil, erase, clear, paste, flip, shift, invert and
  // multi-character edits) ultimately pass through tileSet.setPixel(). Keep the
  // same UI/tooling but redirect the write into the active BANK 2 snapshot.
  // -------------------------------------------------------------------------
  var originalSetPixel26 = TileSet.prototype.setPixel;
  TileSet.prototype.setPixel = function(character, x, y, set, updateCharacter, frame) {
    if(!isEditableBank2(this, character)) return originalSetPixel26.apply(this, arguments);

    if(typeof set === 'undefined') set = true;
    if(typeof updateCharacter === 'undefined') updateCharacter = true;
    if(typeof frame === 'undefined' || frame === null || isNaN(parseInt(frame, 10))) frame = 0;
    frame = parseInt(frame, 10);

    var tile = getBank2Tile(this, character);
    if(!tile || !tile.data || !tile.data.length) return;
    var props = ensureProps(tile);

    var targetFrame = 0;
    if(props.animated === 'frames' && frame >= 0 && frame < tile.data.length) targetFrame = frame;
    if(!tile.data[targetFrame]) tile.data[targetFrame] = copyPixels(tile.data[0]);

    var pos = x + y * this.getTileWidth();
    var oldValue = tile.data[targetFrame][pos];
    tile.data[targetFrame][pos] = set;

    // Keep ordinary LVLLVL undo information. The BANK marker is extra metadata;
    // current stock history ignores unknown fields, while future RICO history can
    // use it to make cross-bank undo explicit.
    try {
      if(this.editor && this.editor.history && typeof this.editor.history.addAction === 'function') {
        this.editor.history.addAction('setCharPixel', {
          c: character,
          x: x,
          y: y,
          oldValue: oldValue,
          newValue: set,
          bank: 2,
          frame: targetFrame
        });
      }
    } catch(e) {}

    // Non-animated glyphs can be reflected immediately. Animated glyphs are
    // regenerated by TEST25 from this edited canonical source on the next tick.
    if(!this.currentTileData) this.currentTileData = [];
    if(props.animated === false || props.animated === '' || props.animated === 'none' || typeof props.animated === 'undefined') {
      this.currentTileData[character] = copyPixels(tile.data[0]);
    } else if(props.animated === 'frames' && props.frame === targetFrame) {
      this.currentTileData[character] = copyPixels(tile.data[targetFrame]);
    } else {
      // Force TEST25 to rebuild the animated visual even if the numerical phase
      // has not changed since the edit.
      props.frame = -1;
    }

    markModified(this);

    if(updateCharacter && typeof this.updateCharacter === 'function') {
      this.updateCharacter(character);
    }
    return;
  };

  // -------------------------------------------------------------------------
  // TILE EDITOR REFRESH / BANK INDICATOR
  // Rebuild the left editor from the same logical codes whenever it becomes
  // visible. Because getPixel is now bank-aware this works for one glyph or a
  // whole selected block (including all 256 characters, as in the screenshot).
  // -------------------------------------------------------------------------
  function refreshTileEditor(editor) {
    if(!editor || !editor.tileEditor) return;
    var tileEditor = editor.tileEditor;
    try {
      if(tileEditor.characters && tileEditor.characters.length) {
        var chars = tileEditor.characters;
        tileEditor.characters = [];
        tileEditor.setCharacters(chars);
        if(tileEditor.tileEditorGrid && typeof tileEditor.tileEditorGrid.draw === 'function') {
          tileEditor.tileEditorGrid.draw();
        }
      }
    } catch(e) {
      console.error('[RICO TEST26] Tile Editor refresh failed.', e);
    }
  }

  var originalSetVisible26 = TileEditor.prototype.setVisible;
  TileEditor.prototype.setVisible = function(visible) {
    var result = originalSetVisible26.apply(this, arguments);
    if(visible) {
      var self = this;
      setTimeout(function() {
        refreshTileEditor(self.editor);
      }, 0);
    }
    return result;
  };

  // Update the small info line to make the destination explicit without
  // changing the native Tile Editor layout.
  var originalSetCharacters26 = TileEditor.prototype.setCharacters;
  TileEditor.prototype.setCharacters = function(characters) {
    var result = originalSetCharacters26.apply(this, arguments);
    try {
      var tileSet = this.editor && this.editor.tileSetManager ? this.editor.tileSetManager.getCurrentTileSet() : null;
      if(tileSet && getBank2Record(tileSet)) {
        var bank = getActiveBank(tileSet);
        var info = $('#tileEditorTileInfo').html();
        if(info && info.indexOf('BANK ') === -1) $('#tileEditorTileInfo').html(info + ' · BANK ' + bank);
      }
    } catch(e) {}
    return result;
  };

  // TEST25 already refreshes animation properties on bank changes. Add a final
  // pixel redraw after that chain so an open multi-selection switches visually
  // between BANK 1 and BANK 2 immediately.
  if(typeof Frames !== 'undefined') {
    var previousGotoFrame26 = Frames.prototype.gotoFrame;
    Frames.prototype.gotoFrame = function(frame) {
      var result = previousGotoFrame26.apply(this, arguments);
      var editor = this.editor;
      setTimeout(function() { refreshTileEditor(editor); }, 0);
      return result;
    };

    var previousInitEvents26 = Frames.prototype.initEvents;
    Frames.prototype.initEvents = function() {
      var result = previousInitEvents26.apply(this, arguments);
      var editor = this.editor;
      $('#ricoCharsetBank').off('change.rico26').on('change.rico26', function() {
        setTimeout(function() { refreshTileEditor(editor); }, 0);
      });
      $('#ricoCharsetBank').off('keyup.rico26').on('keyup.rico26', function() {
        var v = parseInt(this.value, 10);
        if(v === 1 || v === 2) setTimeout(function() { refreshTileEditor(editor); }, 0);
      });
      return result;
    };
  }

  window.RICO_TEST26_BANK2_TILE_EDITOR = true;
  console.log('[RICO TEST26] Tile Editor is now BANK-aware for pixel read/write and multi-selection.');
})();