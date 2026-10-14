(function() {
  'use strict';

  if(typeof TilePaletteDisplay === 'undefined' || typeof TilePalette === 'undefined') {
    console.error('[RICO TEST17] TilePaletteDisplay/TilePalette not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var VIRTUAL_TILE_COUNT = 512;
  var LOGICAL_BANK_SIZE = 256;

  function isSideDisplay(display) {
    return !!(display && display.canvasElementId === 'sidecharPaletteCanvas');
  }

  function isColumns(display) {
    return !!(display && display.charPaletteMapType === 'columns');
  }

  function getActiveBank(editor) {
    try {
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || graphic.frames.length === 0) return 1;
      var frameIndex = graphic.getCurrentFrame();
      if(frameIndex < 0 || frameIndex >= graphic.frames.length) return 1;
      var value = parseInt(graphic.frames[frameIndex][FRAME_BANK_FIELD], 10);
      return value === 2 ? 2 : 1;
    } catch(e) {
      return 1;
    }
  }

  function getStoredBank2(tileSet) {
    var record = null;
    try { record = tileSet.getDocRecord(); } catch(e) {}
    var stored = record && record.data ? record.data[BANK2_FIELD] : null;

    if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= LOGICAL_BANK_SIZE) {
      return stored.tileData;
    }
    return null;
  }

  function buildContinuous512Map() {
    var map = [];
    for(var y = 0; y < 32; y++) {
      map[y] = [];
      for(var x = 0; x < 16; x++) map[y][x] = y * 16 + x;
    }
    return map;
  }

  function ensureContinuous512Map(display) {
    if(!isSideDisplay(display) || !isColumns(display)) return;
    if(display.charPaletteMap && display.charPaletteMap.length === 32 &&
       display.charPaletteMap[31] && display.charPaletteMap[31][15] === 511) return;
    display.charPaletteMap = buildContinuous512Map();
  }

  function withVirtualBank2(display, fn) {
    var tileSet = display.editor && display.editor.tileSetManager ? display.editor.tileSetManager.getCurrentTileSet() : null;
    if(!tileSet || !tileSet.tileData || tileSet.getTileCount() !== LOGICAL_BANK_SIZE) return fn();

    var storedBank2 = getStoredBank2(tileSet);
    var originalCount = tileSet.tileCount;
    var originalLength = tileSet.tileData.length;
    var originalTail = originalLength > LOGICAL_BANK_SIZE ? tileSet.tileData.slice(LOGICAL_BANK_SIZE) : null;

    // drawCharacter() does NOT read tileData directly in its normal path.
    // It reads currentTileData[character]. TEST16 only virtualised tileData,
    // so indexes 256..511 existed for layout/hit-testing but rendered black.
    // Mirror BANK 2 into currentTileData for the duration of this palette draw.
    var originalCurrentLength = tileSet.currentTileData ? tileSet.currentTileData.length : 0;
    var originalCurrentTail = (tileSet.currentTileData && originalCurrentLength > LOGICAL_BANK_SIZE)
      ? tileSet.currentTileData.slice(LOGICAL_BANK_SIZE) : null;

    try {
      if(!tileSet.currentTileData) tileSet.currentTileData = [];

      for(var i = 0; i < LOGICAL_BANK_SIZE; i++) {
        var virtualTile = storedBank2 && storedBank2[i] ? storedBank2[i] : tileSet.tileData[i];
        tileSet.tileData[LOGICAL_BANK_SIZE + i] = virtualTile;

        var pixels = null;
        if(virtualTile && virtualTile.data && virtualTile.data.length) pixels = virtualTile.data[0];
        if(!pixels && tileSet.currentTileData[i]) pixels = tileSet.currentTileData[i];
        tileSet.currentTileData[LOGICAL_BANK_SIZE + i] = pixels || [];
      }

      tileSet.tileCount = VIRTUAL_TILE_COUNT;
      ensureContinuous512Map(display);
      return fn();
    } finally {
      tileSet.tileCount = originalCount;

      if(originalTail) {
        tileSet.tileData.length = LOGICAL_BANK_SIZE;
        for(var j = 0; j < originalTail.length; j++) tileSet.tileData.push(originalTail[j]);
      } else {
        tileSet.tileData.length = originalLength;
      }

      if(tileSet.currentTileData) {
        tileSet.currentTileData.length = LOGICAL_BANK_SIZE;
        if(originalCurrentTail) {
          for(var k = 0; k < originalCurrentTail.length; k++) tileSet.currentTileData.push(originalCurrentTail[k]);
        } else {
          tileSet.currentTileData.length = originalCurrentLength;
        }
      }
    }
  }

  // Keep the side palette in native "Columns of 16" form, but make its
  // palette map 32 rows so BANK 1 (0..255) and BANK 2 (256..511) are continuous.
  var originalSetMapType = TilePaletteDisplay.prototype.setCharPaletteMapType;
  TilePaletteDisplay.prototype.setCharPaletteMapType = function(type) {
    var result = originalSetMapType.apply(this, arguments);
    if(type === 'columns' && isSideDisplay(this)) {
      ensureContinuous512Map(this);
      this.draw({ redrawTiles: true });
    }
    return result;
  };

  // Render BANK 2 only inside the side palette. The real LVLLVL tileset remains
  // 256 characters at all other times; 256..511 are virtual UI indices only.
  var originalDrawTilePalette = TilePaletteDisplay.prototype.drawTilePalette;
  TilePaletteDisplay.prototype.drawTilePalette = function(args) {
    if(!isSideDisplay(this) || !isColumns(this)) {
      return originalDrawTilePalette.apply(this, arguments);
    }

    var self = this;
    return withVirtualBank2(this, function() {
      return originalDrawTilePalette.call(self, args);
    });
  };

  // Native LVLLVL hides the vertical scrollbar when content fits. For RICO's
  // continuous bank palette we keep the scrollbar rail/handle visible in
  // Columns of 16. If scrolling is actually needed, native calculations remain.
  var originalCalculateScroll = TilePaletteDisplay.prototype.calculateScroll;
  TilePaletteDisplay.prototype.calculateScroll = function() {
    var result = originalCalculateScroll.apply(this, arguments);

    if(isSideDisplay(this) && isColumns(this) && this.vScrollBarWidth === 0) {
      this.vScrollBarWidth = styles.ui.scrollbarWidth;
      this.viewWidth = this.width - this.vScrollBarWidth;
      this.vScrollBarHeight = this.viewHeight;
      this.vScrollBarPosition = 0;
      this.vScrollBarPositionHeight = this.vScrollBarHeight;
    }
    return result;
  };

  // The inactive bank stays visible as reference but is dimmed.
  var originalDraw = TilePaletteDisplay.prototype.draw;
  TilePaletteDisplay.prototype.draw = function(args) {
    var result = originalDraw.apply(this, arguments);

    if(isSideDisplay(this) && isColumns(this) && this.context &&
       this.tileLocations && this.tileLocations.length >= VIRTUAL_TILE_COUNT &&
       this.tileLocations[LOGICAL_BANK_SIZE] && this.tileLocations[LOGICAL_BANK_SIZE].length) {

      var ratio = UI.devicePixelRatio || 1;
      var splitY = this.tileLocations[LOGICAL_BANK_SIZE][0].y - this.scrollY * ratio - Math.max(1, this.charMargin * ratio);
      var viewHeightPx = this.viewHeight * ratio;
      var viewWidthPx = this.viewWidth * ratio;
      var activeBank = getActiveBank(this.editor);

      this.context.save();
      this.context.fillStyle = 'rgba(0,0,0,0.58)';
      if(activeBank === 1) {
        var start = Math.max(0, Math.min(viewHeightPx, splitY));
        this.context.fillRect(0, start, viewWidthPx, Math.max(0, viewHeightPx - start));
      } else {
        var end = Math.max(0, Math.min(viewHeightPx, splitY));
        this.context.fillRect(0, 0, viewWidthPx, end);
      }
      this.context.restore();
    }

    return result;
  };

  // Prevent clicking the bank that is not selected for the current frame.
  // Keep the virtual 256..511 value internally so the highlight stays on the
  // correct half; the callback below translates it back to the C64 code 0..255.
  var originalXYToTile = TilePaletteDisplay.prototype.tilePaletteXYToTile;
  TilePaletteDisplay.prototype.tilePaletteXYToTile = function(x, y) {
    var tile = originalXYToTile.apply(this, arguments);
    if(!isSideDisplay(this) || !isColumns(this) || tile === false) return tile;

    var bank = tile >= LOGICAL_BANK_SIZE ? 2 : 1;
    if(bank !== getActiveBank(this.editor)) return false;
    return tile;
  };

  function mapGridToLogicalBank(grid) {
    var mapped = [];
    if(!grid) return mapped;
    for(var y = 0; y < grid.length; y++) {
      mapped[y] = [];
      for(var x = 0; x < grid[y].length; x++) {
        var value = grid[y][x];
        mapped[y][x] = (typeof value === 'number' && value >= LOGICAL_BANK_SIZE) ? value - LOGICAL_BANK_SIZE : value;
      }
    }
    return mapped;
  }

  function installSideCallbacks(tilePalette) {
    if(!tilePalette || tilePalette.prefix !== 'side' || !tilePalette.tilePaletteDisplay) return;
    var display = tilePalette.tilePaletteDisplay;
    if(display.__rico16CallbacksInstalled) return;
    display.__rico16CallbacksInstalled = true;

    // Replace the native callback only for the side palette. This avoids ever
    // passing virtual indices 256..511 into the real C64 screen data.
    display.selectedGridChanged = function(selectedGrid) {
      var mapped = mapGridToLogicalBank(selectedGrid);
      tilePalette.tileChosen();
      tilePalette.editor.currentTile.setCharacters(mapped);
    };

    display.highlightChanged = function(character) {
      if(character === false) {
        tilePalette.setCharacterInfo(false);
        return;
      }
      var logical = character >= LOGICAL_BANK_SIZE ? character - LOGICAL_BANK_SIZE : character;
      tilePalette.setCharacterInfo(logical);
    };

    display.charDblClick = function(character) {
      if(character === false) return;
      var logical = character >= LOGICAL_BANK_SIZE ? character - LOGICAL_BANK_SIZE : character;
      tilePalette.editor.currentTile.setCharacters([[logical]]);
      tilePalette.editor.tileEditor.setVisible(true);
    };
  }

  // Install callback replacement after the native TilePalette builds its UI.
  var originalTilePaletteBuild = TilePalette.prototype.buildInterface;
  TilePalette.prototype.buildInterface = function(parentPanel) {
    var result = originalTilePaletteBuild.apply(this, arguments);
    var self = this;
    UI.on('ready', function() {
      installSideCallbacks(self);
    });
    return result;
  };

  function syncSelectionToActiveBank(editor, display) {
    try {
      var chars = editor.currentTile && editor.currentTile.getCharacters ? editor.currentTile.getCharacters() : null;
      if(!chars || !chars.length || !chars[0] || !chars[0].length) return;
      var activeBank = getActiveBank(editor);
      var selected = [];
      for(var y = 0; y < chars.length; y++) {
        for(var x = 0; x < chars[y].length; x++) {
          var slot = parseInt(chars[y][x], 10);
          if(isNaN(slot)) continue;
          slot = ((slot % LOGICAL_BANK_SIZE) + LOGICAL_BANK_SIZE) % LOGICAL_BANK_SIZE;
          selected.push(slot + (activeBank === 2 ? LOGICAL_BANK_SIZE : 0));
        }
      }
      display.clearSelectedGridCells();
      display.setSelected(selected);
    } catch(e) {}
  }

  function redrawSidePalette(redrawTiles) {
    try {
      var editor = g_app && g_app.textModeEditor;
      if(!editor || !editor.sideTilePalette || !editor.sideTilePalette.tilePaletteDisplay) return;
      var display = editor.sideTilePalette.tilePaletteDisplay;
      ensureContinuous512Map(display);
      syncSelectionToActiveBank(editor, display);
      display.draw({ redrawTiles: redrawTiles === true });
    } catch(e) {
      console.error('[RICO TEST17] Could not redraw side palette.', e);
    }
  }

  function applyStartupLayout() {
    try {
      if(!g_app || !g_app.textModeEditor) return false;
      var editor = g_app.textModeEditor;
      if(!editor.sideTilePalette || !editor.sideTilePalette.tilePaletteDisplay) return false;

      // RICO default layout: side Tiles visible, Layers minimized, Columns of 16.
      // The preference is written even before a project exists, so the native
      // TileSetManager will choose Columns of 16 when a document is opened.
      g_app.setPref('textmode.petsciisortmethod', 'columns');
      g_app.setPref('textmode.layersPanelVisible', 'no');
      g_app.setPref('textmode.sideTilePaletteVisible', 'yes');

      if(typeof editor.setLayersPanelVisible === 'function') editor.setLayersPanelVisible(false);
      if(typeof editor.setTilePalettePanelVisible === 'function') editor.setTilePalettePanelVisible('side', true);

      installSideCallbacks(editor.sideTilePalette);

      var tileSet = editor.tileSetManager && editor.tileSetManager.getCurrentTileSet ? editor.tileSetManager.getCurrentTileSet() : null;
      if(tileSet) {
        editor.sideTilePalette.selectTilePaletteMapType('columns');
        redrawSidePalette(true);
      }

      console.log('[RICO TEST17] Startup layout applied: Columns of 16 + Layers minimized + dual-bank side palette.');
      return true;
    } catch(e) {
      console.error('[RICO TEST17] Startup layout failed.', e);
      return false;
    }
  }

  // TEST15 owns the per-frame value. TEST16 only reacts to it visually.
  if(typeof Frames !== 'undefined') {
    var originalGotoFrame16 = Frames.prototype.gotoFrame;
    Frames.prototype.gotoFrame = function(frame) {
      var result = originalGotoFrame16.apply(this, arguments);
      redrawSidePalette(false);
      return result;
    };

    var originalInitEvents16 = Frames.prototype.initEvents;
    Frames.prototype.initEvents = function() {
      var result = originalInitEvents16.apply(this, arguments);
      $('#ricoCharsetBank').off('change.rico16').on('change.rico16', function() {
        setTimeout(function() { redrawSidePalette(false); }, 0);
      });
      $('#ricoCharsetBank').off('keyup.rico16').on('keyup.rico16', function() {
        var v = parseInt(this.value, 10);
        if(v === 1 || v === 2) setTimeout(function() { redrawSidePalette(false); }, 0);
      });
      return result;
    };
  }

  // If Remix BANK 2 changes, refreshing the side palette after returning to the
  // editor is enough because the data is read directly from the document record.
  window.addEventListener('focus', function() {
    setTimeout(function() { redrawSidePalette(true); }, 0);
  });

  UI.on('ready', function() {
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      if(applyStartupLayout() || tries >= 80) clearInterval(timer);
    }, 50);
  });

  window.RICO_TEST17_SIDE_TILE_BANKS = true;
  console.log('[RICO TEST17] Side dual-bank palette hook loaded.');
})();