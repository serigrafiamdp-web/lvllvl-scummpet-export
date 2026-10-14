(function() {
  'use strict';

  if(typeof TilePaletteDisplay === 'undefined' || typeof Frames === 'undefined') {
    console.error('[RICO TEST19] TilePaletteDisplay/Frames not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;

  function getEditor() {
    try { return g_app && g_app.textModeEditor ? g_app.textModeEditor : null; } catch(e) { return null; }
  }

  function getTileSet(editor) {
    try {
      return editor && editor.tileSetManager && editor.tileSetManager.getCurrentTileSet
        ? editor.tileSetManager.getCurrentTileSet() : null;
    } catch(e) { return null; }
  }

  function getBank2Record(tileSet) {
    var record = null;
    try { record = tileSet && tileSet.getDocRecord ? tileSet.getDocRecord() : null; } catch(e) {}
    var stored = record && record.data ? record.data[BANK2_FIELD] : null;
    if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) return stored;
    return null;
  }

  function getActiveBank(editor) {
    try {
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var frameIndex = graphic.getCurrentFrame();
      if(frameIndex < 0 || frameIndex >= graphic.frames.length) return 1;
      return parseInt(graphic.frames[frameIndex][FRAME_BANK_FIELD], 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function bank1Pixels(tileSet, index) {
    var tile = tileSet && tileSet.tileData ? tileSet.tileData[index] : null;
    return tile && tile.data && tile.data.length ? tile.data[0] : [];
  }

  function bank2Pixels(stored, index) {
    var tile = stored && stored.tileData ? stored.tileData[index] : null;
    return tile && tile.data && tile.data.length ? tile.data[0] : [];
  }

  function refreshCurrentTilePreview(editor) {
    try {
      if(editor && editor.currentTile) {
        if(typeof editor.currentTile.canvasDrawCharacters === 'function') {
          editor.currentTile.canvasDrawCharacters();
        } else if(typeof editor.currentTile.canvasDrawCharacter === 'function') {
          editor.currentTile.canvasDrawCharacter();
        }
      }
    } catch(e) {}
  }

  function redrawGraphic(editor) {
    try {
      if(editor && editor.graphic) {
        if(typeof editor.graphic.invalidateAllCells === 'function') editor.graphic.invalidateAllCells();
        if(typeof editor.graphic.redraw === 'function') editor.graphic.redraw({ allCells: true });
      }
    } catch(e) {
      console.error('[RICO TEST19] Graphic redraw failed.', e);
    }
  }

  function redrawSideSelection(editor) {
    try {
      if(editor && editor.sideTilePalette && typeof editor.sideTilePalette.drawTilePalette === 'function') {
        editor.sideTilePalette.drawTilePalette({ redrawTiles: false });
      }
    } catch(e) {}
  }

  // Activate the selected frame bank for every normal LVLLVL renderer.
  // Screen codes remain 0..255; only currentTileData changes underneath them.
  function applyActiveBank(forceRedraw) {
    var editor = getEditor();
    var tileSet = getTileSet(editor);
    if(!editor || !tileSet || !tileSet.tileData || tileSet.tileData.length < BANK_SIZE) return false;

    var requestedBank = getActiveBank(editor);
    var stored = getBank2Record(tileSet);
    var effectiveBank = (requestedBank === 2 && stored) ? 2 : 1;
    var sourceRef = effectiveBank === 2 ? stored.tileData : tileSet.tileData;

    if(!tileSet.currentTileData) tileSet.currentTileData = [];

    var changed = tileSet.__ricoActiveCharsetBank !== effectiveBank ||
                  tileSet.__ricoActiveCharsetSource !== sourceRef;

    if(changed) {
      for(var i = 0; i < BANK_SIZE; i++) {
        tileSet.currentTileData[i] = effectiveBank === 2
          ? bank2Pixels(stored, i)
          : bank1Pixels(tileSet, i);
      }
      tileSet.__ricoActiveCharsetBank = effectiveBank;
      tileSet.__ricoActiveCharsetSource = sourceRef;
      console.log('[RICO TEST19] Active frame renderer -> CHARSET BANK ' + effectiveBank +
                  (requestedBank === 2 && effectiveBank !== 2 ? ' (BANK 2 not ready; temporary BANK 1 fallback)' : ''));
    }

    if(changed || forceRedraw) {
      refreshCurrentTilePreview(editor);
      redrawGraphic(editor);
      redrawSideSelection(editor);
    }
    return true;
  }

  // TEST17's special side palette must ALWAYS show BANK 1 in the upper 256 and
  // BANK 2 in the lower 256. When a BANK 2 frame is active, currentTileData[0..255]
  // intentionally contains BANK 2 for the main renderer, so temporarily restore
  // BANK 1 only while TEST17 renders the side palette.
  var previousDrawTilePalette = TilePaletteDisplay.prototype.drawTilePalette;
  TilePaletteDisplay.prototype.drawTilePalette = function(args) {
    var isSideColumns = this.canvasElementId === 'sidecharPaletteCanvas' && this.charPaletteMapType === 'columns';
    if(!isSideColumns) return previousDrawTilePalette.apply(this, arguments);

    var tileSet = getTileSet(this.editor);
    if(!tileSet || !tileSet.currentTileData || !tileSet.tileData) {
      return previousDrawTilePalette.apply(this, arguments);
    }

    var saved = tileSet.currentTileData.slice(0, BANK_SIZE);
    try {
      for(var i = 0; i < BANK_SIZE; i++) tileSet.currentTileData[i] = bank1Pixels(tileSet, i);
      return previousDrawTilePalette.apply(this, arguments);
    } finally {
      for(var j = 0; j < BANK_SIZE; j++) tileSet.currentTileData[j] = saved[j];
    }
  };

  // Every frame navigation path reaches gotoFrame. TEST15 already refreshes the
  // numeric control; TEST19 now also makes that frame's bank the actual renderer.
  var previousGotoFrame = Frames.prototype.gotoFrame;
  Frames.prototype.gotoFrame = function(frame) {
    var result = previousGotoFrame.apply(this, arguments);
    applyActiveBank(true);
    return result;
  };

  // Attach after TEST15/17 have installed their own handlers. The timeout lets
  // TEST15 first store 1/2 into the current frame, then we swap the renderer.
  var previousInitEvents = Frames.prototype.initEvents;
  Frames.prototype.initEvents = function() {
    var result = previousInitEvents.apply(this, arguments);

    $('#ricoCharsetBank').off('change.rico19').on('change.rico19', function() {
      setTimeout(function() { applyActiveBank(true); }, 0);
    });
    $('#ricoCharsetBank').off('keyup.rico19').on('keyup.rico19', function() {
      var v = parseInt(this.value, 10);
      if(v === 1 || v === 2) setTimeout(function() { applyActiveBank(true); }, 0);
    });
    return result;
  };

  // TEST18 creates default C64 Shifted BANK 2 asynchronously. Poll briefly so a
  // frame already set to BANK 2 begins using it the moment the data arrives.
  UI.on('ready', function() {
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      var editor = getEditor();
      var tileSet = getTileSet(editor);
      var stored = getBank2Record(tileSet);
      applyActiveBank(false);
      if((tileSet && stored) || tries >= 200) clearInterval(timer);
    }, 50);
  });

  // Returning from Rico's Remix may replace the BANK 2 snapshot. Rebind the
  // active renderer to the newly committed pixels without touching screen codes.
  window.addEventListener('focus', function() {
    setTimeout(function() { applyActiveBank(true); }, 0);
  });

  window.RICO_TEST19_ACTIVE_FRAME_BANK_RENDER = true;
  window.RICO_applyActiveCharsetBank = applyActiveBank;
  console.log('[RICO TEST19] Active per-frame charset bank renderer loaded.');
})();