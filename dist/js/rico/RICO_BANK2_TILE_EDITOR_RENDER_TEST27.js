(function() {
  'use strict';

  if(typeof TileEditorGrid === 'undefined') {
    console.error('[RICO TEST27] TileEditorGrid not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;

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

  function canRenderBank2(tileSet) {
    if(!tileSet) return false;
    try {
      if(tileSet.getTileWidth() !== 8 || tileSet.getTileHeight() !== 8) return false;
    } catch(e) { return false; }
    return getActiveBank(tileSet) === 2 && !!getBank2Record(tileSet);
  }

  /*
   * TEST26 correctly redirected TileEditorGrid.getPixel()/setPixel() through
   * TileSet.getPixel()/setPixel(), but the visible Tile Editor preview does not
   * use that path. drawTileCanvas() calls TileSet.drawCharacter() and passes a
   * numeric characterFrame. Stock drawCharacter() then reads tileSet.tileData
   * directly, which is always BANK 1.
   *
   * For the duration of the Tile Editor's own offscreen render ONLY, expose the
   * BANK 2 tile array as tileSet.tileData. Restore BANK 1 immediately in finally.
   * This keeps every other LVLLVL renderer and the 0..255 screen-code model
   * untouched.
   */
  var previousDrawTileCanvas27 = TileEditorGrid.prototype.drawTileCanvas;
  TileEditorGrid.prototype.drawTileCanvas = function() {
    var tileSet = null;
    try {
      tileSet = this.editor && this.editor.tileSetManager
        ? this.editor.tileSetManager.getCurrentTileSet() : null;
    } catch(e) {}

    if(!canRenderBank2(tileSet)) {
      return previousDrawTileCanvas27.apply(this, arguments);
    }

    var stored = getBank2Record(tileSet);
    if(!stored || !stored.tileData) {
      return previousDrawTileCanvas27.apply(this, arguments);
    }

    var bank1TileData = tileSet.tileData;
    try {
      tileSet.tileData = stored.tileData;
      return previousDrawTileCanvas27.apply(this, arguments);
    } finally {
      tileSet.tileData = bank1TileData;
    }
  };

  /*
   * When TEST26 edits BANK 2, TileEditorGrid.updateCharacter() asks the native
   * TileSet.updateCharacter() to refresh palettes. The actual left editor is
   * redrawn separately. Add a lightweight final draw so a pixel edit is visible
   * immediately even when the character has no animation tick pending.
   */
  var previousUpdateCharacter27 = TileEditorGrid.prototype.updateCharacter;
  TileEditorGrid.prototype.updateCharacter = function(character) {
    var result = previousUpdateCharacter27.apply(this, arguments);
    try {
      var tileSet = this.editor && this.editor.tileSetManager
        ? this.editor.tileSetManager.getCurrentTileSet() : null;
      if(canRenderBank2(tileSet) && typeof this.draw === 'function') this.draw();
    } catch(e) {}
    return result;
  };

  window.RICO_TEST27_BANK2_TILE_EDITOR_RENDER = true;
  console.log('[RICO TEST27] Tile Editor visual renderer now reads active BANK 2 tileData.');
})();