(function() {
  'use strict';

  if(typeof TileSet === 'undefined' || typeof TilePaletteDisplay === 'undefined') {
    console.error('[RICO TEST33] TileSet/TilePaletteDisplay not found.');
    return;
  }

  var BANK_SIZE = 256;
  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';

  function getBank2(tileSet) {
    try {
      var record = tileSet && tileSet.getDocRecord ? tileSet.getDocRecord() : null;
      var stored = record && record.data ? record.data[BANK2_FIELD] : null;
      if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) return stored;
    } catch(e) {}
    return null;
  }

  function isDual8x8(tileSet) {
    try {
      return !!(tileSet && tileSet.getTileWidth() === 8 && tileSet.getTileHeight() === 8 && getBank2(tileSet));
    } catch(e) { return false; }
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

  function getTile(tileSet, bank, index) {
    if(bank === 2) {
      var stored = getBank2(tileSet);
      return stored && stored.tileData ? stored.tileData[index] : null;
    }
    return tileSet && tileSet.tileData ? tileSet.tileData[index] : null;
  }

  function copyPixels(src) {
    if(!src) return [];
    return src.slice ? src.slice(0) : Array.prototype.slice.call(src);
  }

  function wrappedShift(base, width, height, sx, sy) {
    var out = new Array(width * height);
    for(var y = 0; y < height; y++) {
      for(var x = 0; x < width; x++) {
        var srcX = (x + sx) % width;
        var srcY = (y + sy) % height;
        if(srcX < 0) srcX += width;
        if(srcY < 0) srcY += height;
        out[x + y * width] = base[srcX + srcY * width] || 0;
      }
    }
    return out;
  }

  function clippedShift(base, width, height, sx, sy) {
    var out = new Array(width * height);
    for(var i = 0; i < out.length; i++) out[i] = 0;
    for(var y = 0; y < height; y++) {
      for(var x = 0; x < width; x++) {
        var srcX = x + sx;
        var srcY = y + sy;
        if(srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          out[x + y * width] = base[srcX + srcY * width] || 0;
        }
      }
    }
    return out;
  }

  function pingDisplacement(phase, size) {
    if(size <= 1) return 0;
    var cycle = size * 2 - 2;
    phase = ((phase % cycle) + cycle) % cycle;
    return phase < size ? phase : cycle - phase;
  }

  function getFrameCount(tileSet, tile, type) {
    if(!tile) return 1;
    var width = tileSet.getTileWidth();
    var height = tileSet.getTileHeight();
    switch(type) {
      case 'left':
      case 'right': return width;
      case 'up':
      case 'down': return height;
      case 'pingpong-left':
      case 'pingpong-right': return Math.max(1, width * 2 - 2);
      case 'pingpong-up':
      case 'pingpong-down': return Math.max(1, height * 2 - 2);
      case 'blink': return 2;
      case 'frames':
        if(tile.data && tile.data.length) return tile.data.length;
        if(tile.props && tile.props.frameCount) return tile.props.frameCount;
        return 1;
    }
    return 1;
  }

  function renderFrame(tileSet, tile, type, frame) {
    if(!tile || !tile.data || !tile.data.length) return [];
    var width = tileSet.getTileWidth();
    var height = tileSet.getTileHeight();
    var base = tile.data[0] || [];

    switch(type) {
      case 'left': return wrappedShift(base, width, height, frame, 0);
      case 'right': return wrappedShift(base, width, height, -frame, 0);
      case 'up': return wrappedShift(base, width, height, 0, frame);
      case 'down': return wrappedShift(base, width, height, 0, -frame);
      case 'pingpong-left': return clippedShift(base, width, height, pingDisplacement(frame, width), 0);
      case 'pingpong-right': return clippedShift(base, width, height, -pingDisplacement(frame, width), 0);
      case 'pingpong-up': return clippedShift(base, width, height, 0, pingDisplacement(frame, height));
      case 'pingpong-down': return clippedShift(base, width, height, 0, -pingDisplacement(frame, height));
      case 'blink': {
        var blink = copyPixels(base);
        if(frame & 1) for(var b = 0; b < blink.length; b++) blink[b] = blink[b] ? 0 : 1;
        return blink;
      }
      case 'frames': {
        var fi = Math.max(0, Math.min(frame, tile.data.length - 1));
        return copyPixels(tile.data[fi] || base);
      }
    }
    return copyPixels(base);
  }

  function isAnimated(tile) {
    var type = tile && tile.props ? tile.props.animated : false;
    return !(type === false || type === '' || type === 'none' || typeof type === 'undefined');
  }

  function ensurePreviewState(tileSet) {
    if(!tileSet.__ricoPalettePreview33) {
      tileSet.__ricoPalettePreview33 = {
        pixels: { 1: new Array(BANK_SIZE), 2: new Array(BANK_SIZE) },
        phase: { 1: new Array(BANK_SIZE), 2: new Array(BANK_SIZE) }
      };
    }
    return tileSet.__ricoPalettePreview33;
  }

  function updatePreviewBank(tileSet, bank, tick) {
    var state = ensurePreviewState(tileSet);
    var changed = [];

    for(var i = 0; i < BANK_SIZE; i++) {
      var tile = getTile(tileSet, bank, i);
      if(!tile || !tile.data || !tile.data.length) continue;
      var props = tile.props || {};
      var type = props.animated;

      if(!isAnimated(tile)) {
        if(typeof state.phase[bank][i] !== 'undefined') {
          state.phase[bank][i] = undefined;
          state.pixels[bank][i] = copyPixels(tile.data[0]);
          changed.push(i);
        } else if(!state.pixels[bank][i]) {
          state.pixels[bank][i] = copyPixels(tile.data[0]);
        }
        continue;
      }

      var ticks = parseInt(props.ticksPerFrame, 10);
      if(isNaN(ticks) || ticks < 1) ticks = 6;
      var count = getFrameCount(tileSet, tile, type);
      if(count < 1) count = 1;
      var phase = Math.floor(tick / ticks) % count;

      if(state.phase[bank][i] !== phase || !state.pixels[bank][i]) {
        state.phase[bank][i] = phase;
        state.pixels[bank][i] = renderFrame(tileSet, tile, type, phase);
        changed.push(i);
      }
    }
    return changed;
  }

  function redrawPalette(tilePalette, tiles) {
    try {
      if(!tilePalette || !tilePalette.tilePaletteDisplay || !tiles || !tiles.length) return;
      tilePalette.tilePaletteDisplay.draw({ redrawTiles: true, tiles: tiles });
    } catch(e) {
      console.error('[RICO TEST33] Palette redraw failed.', e);
    }
  }

  function refreshAnimatedPalettes(tileSet, changed1, changed2) {
    var editor = tileSet && tileSet.editor;
    if(!editor) return;

    var activeBank = getActiveBank(tileSet);
    var activeChanged = activeBank === 2 ? changed2 : changed1;
    redrawPalette(editor.tools && editor.tools.drawTools ? editor.tools.drawTools.tilePalette : null, activeChanged);

    var sideChanged = [];
    for(var i = 0; i < changed1.length; i++) sideChanged.push(changed1[i]);
    for(var j = 0; j < changed2.length; j++) sideChanged.push(BANK_SIZE + changed2[j]);
    redrawPalette(editor.sideTilePalette, sideChanged);
  }

  // TEST17/19/21 intentionally virtualise the side palette using the static
  // frame-0 arrays. During PALETTE rendering only, lend those wrappers our
  // animated preview arrays. The real tile data is restored immediately.
  var previousPaletteDraw33 = TilePaletteDisplay.prototype.drawTilePalette;
  TilePaletteDisplay.prototype.drawTilePalette = function(args) {
    var isSide = this.canvasElementId === 'sidecharPaletteCanvas';
    var tileSet = this.editor && this.editor.tileSetManager ? this.editor.tileSetManager.getCurrentTileSet() : null;
    if(!isSide || !isDual8x8(tileSet) || !tileSet.__ricoPalettePreview33) {
      return previousPaletteDraw33.apply(this, arguments);
    }

    var stored = getBank2(tileSet);
    var state = tileSet.__ricoPalettePreview33;
    var saved1 = new Array(BANK_SIZE);
    var saved2 = new Array(BANK_SIZE);

    try {
      for(var i = 0; i < BANK_SIZE; i++) {
        var tile1 = tileSet.tileData[i];
        if(tile1 && tile1.data && tile1.data.length && state.pixels[1][i]) {
          saved1[i] = tile1.data[0];
          tile1.data[0] = state.pixels[1][i];
        }
        var tile2 = stored && stored.tileData ? stored.tileData[i] : null;
        if(tile2 && tile2.data && tile2.data.length && state.pixels[2][i]) {
          saved2[i] = tile2.data[0];
          tile2.data[0] = state.pixels[2][i];
        }
      }
      return previousPaletteDraw33.apply(this, arguments);
    } finally {
      for(var j = 0; j < BANK_SIZE; j++) {
        var restore1 = tileSet.tileData[j];
        if(restore1 && restore1.data && restore1.data.length && saved1[j]) restore1.data[0] = saved1[j];
        var restore2 = stored && stored.tileData ? stored.tileData[j] : null;
        if(restore2 && restore2.data && restore2.data.length && saved2[j]) restore2.data[0] = saved2[j];
      }
    }
  };

  // TEST25 updates only the active bank because that is what the main screen
  // renderer needs. TEST33 additionally advances BOTH banks for palette-only
  // previews, so an unused animated glyph stays visibly animated in the palette.
  var previousUpdate33 = TileSet.prototype.update;
  TileSet.prototype.update = function(tick) {
    var result = previousUpdate33.apply(this, arguments);
    if(!isDual8x8(this)) return result;

    var changed1 = updatePreviewBank(this, 1, tick);
    var changed2 = updatePreviewBank(this, 2, tick);
    if(changed1.length || changed2.length) refreshAnimatedPalettes(this, changed1, changed2);
    return result || changed1.length > 0 || changed2.length > 0;
  };

  // Force one initial preview pass after loading / switching projects.
  UI.on('ready', function() {
    setTimeout(function() {
      try {
        var editor = window.g_app && g_app.textModeEditor ? g_app.textModeEditor : null;
        var tileSet = editor && editor.tileSetManager ? editor.tileSetManager.getCurrentTileSet() : null;
        if(tileSet && isDual8x8(tileSet)) {
          tileSet.__ricoPalettePreview33 = null;
          tileSet.update(typeof g_tick !== 'undefined' ? g_tick : 0);
        }
      } catch(e) {}
    }, 150);
  });

  window.RICO_TEST33_ANIMATED_PALETTE_PREVIEW = true;
  console.log('[RICO TEST33] Animated character previews restored in palettes (BANK 1 + BANK 2).');
})();
