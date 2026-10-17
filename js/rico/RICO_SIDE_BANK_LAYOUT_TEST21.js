(function() {
  'use strict';

  if(typeof TilePaletteDisplay === 'undefined' || typeof TilePalette === 'undefined') {
    console.error('[RICO TEST21] TilePaletteDisplay/TilePalette not found.');
    return;
  }

  var LAYOUT_ID = 'rico-banks-32x8';
  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;
  var VIRTUAL_COUNT = 512;

  function isSideDisplay(display) {
    return !!(display && display.canvasElementId === 'sidecharPaletteCanvas');
  }

  function isBanks32x8(display) {
    return !!(isSideDisplay(display) && display.__ricoBanks32x8 === true);
  }

  function getActiveBank(editor) {
    try {
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || graphic.frames.length === 0) return 1;
      var frame = graphic.getCurrentFrame();
      if(frame < 0 || frame >= graphic.frames.length) return 1;
      return parseInt(graphic.frames[frame][FRAME_BANK_FIELD], 10) === 2 ? 2 : 1;
    } catch(e) {
      return 1;
    }
  }

  function getStoredBank2(tileSet) {
    var record = null;
    try { record = tileSet.getDocRecord(); } catch(e) {}
    var stored = record && record.data ? record.data[BANK2_FIELD] : null;
    if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) {
      return stored.tileData;
    }
    return null;
  }

  // Preserve the natural 32x8 order of an imported 256-character image.
  // Rows 0..7   = BANK 1, slots 0..255, 32 characters per row.
  // Rows 8..15  = BANK 2, slots 0..255 represented virtually as 256..511.
  //
  // Visually:
  //   BANK 1: 32 x 8
  //   BANK 2: 32 x 8
  // stacked vertically.
  function buildBanks32x8Map() {
    var map = [];
    for(var y = 0; y < 16; y++) {
      map[y] = [];
      var bank = y < 8 ? 0 : 1;
      var bankRow = y % 8;
      for(var x = 0; x < 32; x++) {
        map[y][x] = bank * BANK_SIZE + bankRow * 32 + x;
      }
    }
    return map;
  }

  function ensureBanks32x8Map(display) {
    if(!isBanks32x8(display)) return;
    if(display.charPaletteMap && display.charPaletteMap.length === 16 &&
       display.charPaletteMap[0] && display.charPaletteMap[0].length === 32 &&
       display.charPaletteMap[0][0] === 0 &&
       display.charPaletteMap[7][31] === 255 &&
       display.charPaletteMap[8][0] === 256 &&
       display.charPaletteMap[15][31] === 511) {
      return;
    }
    display.charPaletteMap = buildBanks32x8Map();
  }

  function withVirtualBank2(display, fn) {
    var tileSet = display.editor && display.editor.tileSetManager ? display.editor.tileSetManager.getCurrentTileSet() : null;
    if(!tileSet || !tileSet.tileData || tileSet.getTileCount() !== BANK_SIZE) return fn();

    var storedBank2 = getStoredBank2(tileSet);
    var originalCount = tileSet.tileCount;
    var originalLength = tileSet.tileData.length;
    var originalTail = originalLength > BANK_SIZE ? tileSet.tileData.slice(BANK_SIZE) : null;
    var originalCurrentLength = tileSet.currentTileData ? tileSet.currentTileData.length : 0;
    var originalCurrentTail = (tileSet.currentTileData && originalCurrentLength > BANK_SIZE)
      ? tileSet.currentTileData.slice(BANK_SIZE) : null;

    try {
      if(!tileSet.currentTileData) tileSet.currentTileData = [];
      for(var i = 0; i < BANK_SIZE; i++) {
        var virtualTile = storedBank2 && storedBank2[i] ? storedBank2[i] : tileSet.tileData[i];
        tileSet.tileData[BANK_SIZE + i] = virtualTile;
        var pixels = null;
        if(virtualTile && virtualTile.data && virtualTile.data.length) pixels = virtualTile.data[0];
        if(!pixels && tileSet.currentTileData[i]) pixels = tileSet.currentTileData[i];
        tileSet.currentTileData[BANK_SIZE + i] = pixels || [];
      }
      tileSet.tileCount = VIRTUAL_COUNT;
      ensureBanks32x8Map(display);
      return fn();
    } finally {
      tileSet.tileCount = originalCount;
      if(originalTail) {
        tileSet.tileData.length = BANK_SIZE;
        for(var j = 0; j < originalTail.length; j++) tileSet.tileData.push(originalTail[j]);
      } else {
        tileSet.tileData.length = originalLength;
      }
      if(tileSet.currentTileData) {
        tileSet.currentTileData.length = BANK_SIZE;
        if(originalCurrentTail) {
          for(var k = 0; k < originalCurrentTail.length; k++) tileSet.currentTileData.push(originalCurrentTail[k]);
        } else {
          tileSet.currentTileData.length = originalCurrentLength;
        }
      }
    }
  }

  function appendLayoutOption() {
    var $select = $('#sidecharPaletteSortOrder');
    if(!$select.length) return false;

    // Remove the TEST20 prototype option if it exists in a cached/reused UI.
    $select.find('option[value="rico-banks-horizontal"]').remove();

    if($select.find('option[value="' + LAYOUT_ID + '"]').length === 0) {
      var $columns = $select.find('option[value="columns"]');
      var option = '<option value="' + LAYOUT_ID + '">Banks 32 x 8</option>';
      if($columns.length) $columns.after(option);
      else $select.append(option);
    }
    return true;
  }

  function activateBanks32x8(tilePalette) {
    if(!tilePalette || tilePalette.prefix !== 'side' || !tilePalette.tilePaletteDisplay) return false;
    var display = tilePalette.tilePaletteDisplay;
    display.__ricoBanks32x8 = true;

    // Native custom-map renderer can represent 32 columns x 16 rows as two
    // vertically stacked 32x8 blocks. This preserves the exact visual order
    // of a 32x8 imported charset image for each bank.
    display.charPaletteMapType = 'custom';
    display.charPaletteMap = buildBanks32x8Map();
    display.blockStacking = 'vertical';
    display.scrollX = 0;
    display.scrollY = 0;
    display.draw({ redrawTiles: true });

    appendLayoutOption();
    $('#sidecharPaletteSortOrder').val(LAYOUT_ID);
    console.log('[RICO TEST21] Side palette -> BANKS 32 x 8 (BANK 1 top, BANK 2 bottom).');
    return true;
  }

  function leaveBanks32x8(tilePalette) {
    if(tilePalette && tilePalette.tilePaletteDisplay) {
      tilePalette.tilePaletteDisplay.__ricoBanks32x8 = false;
      tilePalette.tilePaletteDisplay.blockStacking = 'vertical';
    }
  }

  // Intercept only the new side-only layout. Existing LVLLVL options keep
  // their native behaviour; Columns of 16 remains the current 16x32 layout.
  var originalSelectMapType = TilePalette.prototype.selectTilePaletteMapType;
  TilePalette.prototype.selectTilePaletteMapType = function(mapType) {
    if(this.prefix === 'side' && mapType === LAYOUT_ID) {
      return activateBanks32x8(this);
    }
    if(this.prefix === 'side') leaveBanks32x8(this);
    return originalSelectMapType.apply(this, arguments);
  };

  var originalSetMapTypePalette = TilePalette.prototype.setCharPaletteMapType;
  TilePalette.prototype.setCharPaletteMapType = function(type) {
    if(this.prefix === 'side' && type === LAYOUT_ID) {
      return activateBanks32x8(this);
    }
    if(this.prefix === 'side') leaveBanks32x8(this);
    return originalSetMapTypePalette.apply(this, arguments);
  };

  // TEST17 virtualises BANK 2 for Columns of 16. TEST21 provides the same
  // temporary 512-character draw surface for the 32x8-banks view.
  var previousDrawTilePalette = TilePaletteDisplay.prototype.drawTilePalette;
  TilePaletteDisplay.prototype.drawTilePalette = function(args) {
    if(!isBanks32x8(this)) return previousDrawTilePalette.apply(this, arguments);
    var self = this;
    return withVirtualBank2(this, function() {
      self.charPaletteMapType = 'custom';
      ensureBanks32x8Map(self);
      return previousDrawTilePalette.call(self, args);
    });
  };

  // BANK 1 is the upper 32x8 block and BANK 2 is the lower 32x8 block.
  // Dim the bank that is not active for the current frame.
  var previousDraw = TilePaletteDisplay.prototype.draw;
  TilePaletteDisplay.prototype.draw = function(args) {
    var result = previousDraw.apply(this, arguments);

    if(isBanks32x8(this) && this.context && this.tileLocations &&
       this.tileLocations.length >= VIRTUAL_COUNT && this.tileLocations[BANK_SIZE] &&
       this.tileLocations[BANK_SIZE].length) {
      var ratio = UI.devicePixelRatio || 1;
      var splitY = this.tileLocations[BANK_SIZE][0].y - this.scrollY * ratio - Math.max(1, this.charMargin * ratio);
      var viewWidthPx = this.viewWidth * ratio;
      var viewHeightPx = this.viewHeight * ratio;
      var activeBank = getActiveBank(this.editor);

      splitY = Math.max(0, Math.min(viewHeightPx, splitY));
      this.context.save();
      this.context.fillStyle = 'rgba(0,0,0,0.58)';
      if(activeBank === 1) {
        this.context.fillRect(0, splitY, viewWidthPx, Math.max(0, viewHeightPx - splitY));
      } else {
        this.context.fillRect(0, 0, viewWidthPx, splitY);
      }
      this.context.restore();
    }
    return result;
  };

  // Same safety contract as TEST17/19: the inactive bank cannot be clicked.
  // Virtual BANK 2 indices are still translated back to screen code 0..255 by
  // the callbacks installed in TEST17.
  var previousXYToTile = TilePaletteDisplay.prototype.tilePaletteXYToTile;
  TilePaletteDisplay.prototype.tilePaletteXYToTile = function(x, y) {
    var tile = previousXYToTile.apply(this, arguments);
    if(!isBanks32x8(this) || tile === false) return tile;
    var bank = tile >= BANK_SIZE ? 2 : 1;
    if(bank !== getActiveBank(this.editor)) return false;
    return tile;
  };

  // LVLLVL rebuilds the select when a tileset changes. Re-add our view after
  // each refresh without modifying James' original source.
  if(typeof TileSetManager !== 'undefined') {
    var originalUpdateSortMethods = TileSetManager.prototype.updateSortMethods;
    TileSetManager.prototype.updateSortMethods = function() {
      var result = originalUpdateSortMethods.apply(this, arguments);
      appendLayoutOption();
      return result;
    };
  }

  UI.on('ready', function() {
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      if(appendLayoutOption() || tries >= 80) clearInterval(timer);
    }, 50);
  });

  window.RICO_TEST21_SIDE_BANK_LAYOUT = true;
  console.log('[RICO TEST21] 32x8-per-bank palette view loaded.');
})();