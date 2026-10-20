(function() {
  'use strict';

  if(typeof TileSet === 'undefined' || typeof TileEditor === 'undefined') {
    console.error('[RICO TEST25] TileSet/TileEditor not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;

  var PING_TYPES = {
    'pingpong-left':  { axis: 'x', sign:  1, label: 'Ping Pong Left' },
    'pingpong-right': { axis: 'x', sign: -1, label: 'Ping Pong Right' },
    'pingpong-up':    { axis: 'y', sign:  1, label: 'Ping Pong Up' },
    'pingpong-down':  { axis: 'y', sign: -1, label: 'Ping Pong Down' }
  };

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

  function isDual8x8(tileSet) {
    try {
      return !!(tileSet && tileSet.getTileWidth() === 8 && tileSet.getTileHeight() === 8 && getBank2Record(tileSet));
    } catch(e) { return false; }
  }

  function ensureProps(tile) {
    if(!tile) return null;
    if(!tile.props) tile.props = {};
    if(typeof tile.props.animated === 'undefined') tile.props.animated = false;
    if(typeof tile.props.ticksPerFrame === 'undefined' || !tile.props.ticksPerFrame) tile.props.ticksPerFrame = 6;
    if(typeof tile.props.frame === 'undefined') tile.props.frame = 0;
    if(typeof tile.props.lastTick === 'undefined') tile.props.lastTick = 0;
    if(typeof tile.props.frameCount === 'undefined') tile.props.frameCount = 1;
    return tile.props;
  }

  function getBankTile(tileSet, character, bank) {
    if(character === false || character < 0 || character >= BANK_SIZE) return null;
    if(bank === 2) {
      var stored = getBank2Record(tileSet);
      return stored && stored.tileData ? stored.tileData[character] : null;
    }
    return tileSet && tileSet.tileData ? tileSet.tileData[character] : null;
  }

  function getActiveTile(tileSet, character) {
    return getBankTile(tileSet, character, getActiveBank(tileSet));
  }

  function markModified(tileSet) {
    try { if(tileSet && typeof tileSet.modified === 'function') tileSet.modified(); } catch(e) {}
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

  // Deliberate new effect based on the useful visual discovered in the bug:
  // the glyph travels toward the selected edge, nearly/fully exits the cell,
  // then returns along the same path. Pixels do NOT wrap around the opposite edge.
  function pingPongShift(base, width, height, sx, sy) {
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

  function getFrameCountFor(tileSet, tile, type) {
    if(!tile) return 0;
    var width = tileSet.getTileWidth();
    var height = tileSet.getTileHeight();
    switch(type) {
      case 'right':
      case 'left':
        return width;
      case 'up':
      case 'down':
        return height;
      case 'pingpong-left':
      case 'pingpong-right':
        return Math.max(1, width * 2 - 2);
      case 'pingpong-up':
      case 'pingpong-down':
        return Math.max(1, height * 2 - 2);
      case 'blink':
        return 2;
      case 'frames':
        return ensureProps(tile).frameCount || (tile.data ? tile.data.length : 1);
    }
    return 0;
  }

  function pingDisplacement(phase, size) {
    if(size <= 1) return 0;
    var cycle = size * 2 - 2;
    phase = ((phase % cycle) + cycle) % cycle;
    return phase < size ? phase : cycle - phase;
  }

  function renderTileFrame(tileSet, tile, type, frame) {
    if(!tile || !tile.data || !tile.data.length) return [];
    var width = tileSet.getTileWidth();
    var height = tileSet.getTileHeight();
    var base = tile.data[0] || [];

    switch(type) {
      case 'left':  return wrappedShift(base, width, height,  frame, 0);
      case 'right': return wrappedShift(base, width, height, -frame, 0);
      case 'up':    return wrappedShift(base, width, height, 0,  frame);
      case 'down':  return wrappedShift(base, width, height, 0, -frame);
      case 'pingpong-left': {
        var dl = pingDisplacement(frame, width);
        return pingPongShift(base, width, height, dl, 0);
      }
      case 'pingpong-right': {
        var dr = pingDisplacement(frame, width);
        return pingPongShift(base, width, height, -dr, 0);
      }
      case 'pingpong-up': {
        var du = pingDisplacement(frame, height);
        return pingPongShift(base, width, height, 0, du);
      }
      case 'pingpong-down': {
        var dd = pingDisplacement(frame, height);
        return pingPongShift(base, width, height, 0, -dd);
      }
      case 'blink': {
        var out = copyPixels(base);
        if(frame & 1) {
          for(var b = 0; b < out.length; b++) out[b] = out[b] ? 0 : 1;
        }
        return out;
      }
      case 'frames': {
        var fi = Math.max(0, Math.min(frame, tile.data.length - 1));
        return copyPixels(tile.data[fi] || base);
      }
      default:
        return copyPixels(base);
    }
  }

  function refreshEditor(tileSet) {
    var editor = tileSet && tileSet.editor;
    if(!editor) return;
    try {
      if(editor.currentTile && typeof editor.currentTile.canvasDrawCharacters === 'function') editor.currentTile.canvasDrawCharacters();
      if(editor.graphic) {
        if(typeof editor.graphic.invalidateAllCells === 'function') editor.graphic.invalidateAllCells();
        if(typeof editor.graphic.redraw === 'function') editor.graphic.redraw({ animatedTilesOnly: true });
      }
    } catch(e) {}
  }

  // ---------------------------------------------------------------------------
  // BANK-AWARE TILE PROPERTIES
  // ---------------------------------------------------------------------------
  var originalGetTileProperties = TileSet.prototype.getTileProperties;
  TileSet.prototype.getTileProperties = function(character) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      return tile ? ensureProps(tile) : false;
    }
    return originalGetTileProperties.apply(this, arguments);
  };

  var originalSetAnimated = TileSet.prototype.setAnimated;
  TileSet.prototype.setAnimated = function(character, animated) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile) return;
      var props = ensureProps(tile);
      props.animated = animated;
      props.lastTick = 0;
      props.frame = 0;
      if(animated === false) {
        var base = tile.data && tile.data[0] ? tile.data[0] : [];
        this.currentTileData[character] = copyPixels(base);
      }
      markModified(this);
      return;
    }
    return originalSetAnimated.apply(this, arguments);
  };

  var originalSetAnimatedType = TileSet.prototype.setAnimatedType;
  TileSet.prototype.setAnimatedType = function(character, type) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile) return;
      var props = ensureProps(tile);
      props.animated = type;
      props.frame = 0;
      props.frameCount = type === 'frames' ? (tile.data ? tile.data.length : 1) : getFrameCountFor(this, tile, type);
      markModified(this);
      return;
    }
    originalSetAnimatedType.apply(this, arguments);
    // Native LVLLVL does not know the new ping-pong names, so correct frameCount.
    if(PING_TYPES[type]) {
      var nativeTile = getBankTile(this, character, 1);
      if(nativeTile) ensureProps(nativeTile).frameCount = getFrameCountFor(this, nativeTile, type);
    }
  };

  var originalSetAnimatedTicks = TileSet.prototype.setAnimatedTicksPerFrame;
  TileSet.prototype.setAnimatedTicksPerFrame = function(character, ticksPerFrame) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile) return;
      ensureProps(tile).ticksPerFrame = ticksPerFrame;
      markModified(this);
      return;
    }
    return originalSetAnimatedTicks.apply(this, arguments);
  };

  var originalGetAnimatedType = TileSet.prototype.getAnimatedType;
  TileSet.prototype.getAnimatedType = function(character) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      return tile ? ensureProps(tile).animated : false;
    }
    return originalGetAnimatedType.apply(this, arguments);
  };

  var originalGetCharacterFrame = TileSet.prototype.getCharacterFrame;
  TileSet.prototype.getCharacterFrame = function(character) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      return tile ? ensureProps(tile).frame : 0;
    }
    return originalGetCharacterFrame.apply(this, arguments);
  };

  var originalGetFrameCount = TileSet.prototype.getFrameCount;
  TileSet.prototype.getFrameCount = function(character, type) {
    if(isDual8x8(this)) {
      var bank = getActiveBank(this);
      var tile = getBankTile(this, character, bank);
      if(tile && (PING_TYPES[type] || bank === 2)) return getFrameCountFor(this, tile, type);
    }
    if(PING_TYPES[type]) {
      var tile1 = getBankTile(this, character, 1);
      return tile1 ? getFrameCountFor(this, tile1, type) : 0;
    }
    return originalGetFrameCount.apply(this, arguments);
  };

  var originalUpdateCurrentData = TileSet.prototype.updateCharacterCurrentData;
  TileSet.prototype.updateCharacterCurrentData = function(character) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile || !tile.data || !tile.data.length) return;
      while(this.currentTileData.length <= character) this.currentTileData.push([]);
      this.currentTileData[character] = copyPixels(tile.data[0]);
      return;
    }
    return originalUpdateCurrentData.apply(this, arguments);
  };

  // Frames animation editing is independent too.
  var originalInsertFrame = TileSet.prototype.insertFrame;
  TileSet.prototype.insertFrame = function(character, insertAfter) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile || !tile.data || !tile.data.length) return;
      var src = tile.data[Math.max(0, Math.min(insertAfter, tile.data.length - 1))];
      tile.data.splice(insertAfter + 1, 0, copyPixels(src));
      ensureProps(tile).frameCount = tile.data.length;
      markModified(this);
      return;
    }
    return originalInsertFrame.apply(this, arguments);
  };

  var originalDeleteFrame = TileSet.prototype.deleteFrame;
  TileSet.prototype.deleteFrame = function(character, frame) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile || !tile.data || tile.data.length <= 1) return;
      tile.data.splice(frame, 1);
      ensureProps(tile).frameCount = tile.data.length;
      markModified(this);
      return;
    }
    return originalDeleteFrame.apply(this, arguments);
  };

  var originalSetCharacterFrame = TileSet.prototype.setCharacterFrame;
  TileSet.prototype.setCharacterFrame = function(character, frame) {
    if(isDual8x8(this) && getActiveBank(this) === 2) {
      var tile = getBankTile(this, character, 2);
      if(!tile || !tile.data || frame < 0 || frame >= tile.data.length) return;
      this.currentTileData[character] = copyPixels(tile.data[frame]);
      try { this.updateCharacter(character); } catch(e) {}
      return;
    }
    return originalSetCharacterFrame.apply(this, arguments);
  };

  // ---------------------------------------------------------------------------
  // FIXED SCROLL + NEW PING-PONG RUNTIME
  // ---------------------------------------------------------------------------
  var originalUpdate = TileSet.prototype.update;
  TileSet.prototype.update = function(tick) {
    if(!isDual8x8(this)) return originalUpdate.apply(this, arguments);

    // TEST172: edit controls still follow the selected FRAME BANK, but the
    // animated working canvas follows the bank currently visible through
    // hardware Switch Bank. TEST33 separately advances both preview phases.
    var bank = (this.__ricoSwitchBankPreview171===1 || this.__ricoSwitchBankPreview171===2)
      ? this.__ricoSwitchBankPreview171 : getActiveBank(this);
    var updated = [];
    var bankChanged = this.__ricoAnimationBank25 !== bank;
    this.__ricoAnimationBank25 = bank;

    for(var i = 0; i < BANK_SIZE; i++) {
      var tile = getBankTile(this, i, bank);
      if(!tile || !tile.data || !tile.data.length) continue;
      var props = ensureProps(tile);
      var type = props.animated;
      var pixels;

      if(type === false || type === '' || type === 'none' || typeof type === 'undefined') {
        if(bankChanged || !this.currentTileData[i] || this.currentTileData[i] === tile.data[0]) {
          this.currentTileData[i] = copyPixels(tile.data[0]);
          updated.push(i);
        }
        props.frame = 0;
        continue;
      }

      var count = getFrameCountFor(this, tile, type);
      if(count <= 0) count = 1;
      var ticks = parseInt(props.ticksPerFrame, 10);
      if(isNaN(ticks) || ticks < 1) ticks = 6;
      var frame = Math.floor(tick / ticks) % count;

      if(bankChanged || props.frame !== frame || !this.currentTileData[i]) {
        props.frame = frame;
        props.lastTick = tick;
        pixels = renderTileFrame(this, tile, type, frame);
        this.currentTileData[i] = pixels;
        updated.push(i);
      }
    }

    if(updated.length) {
      var editor = this.editor;
      try {
        if(editor && editor.currentTile && typeof editor.currentTile.canvasDrawCharacters === 'function') editor.currentTile.canvasDrawCharacters();
        if(editor && editor.graphic) {
          if(typeof editor.graphic.invalidateAllCells === 'function') editor.graphic.invalidateAllCells();
          if(typeof editor.graphic.redraw === 'function') editor.graphic.redraw({ animatedTilesOnly: true });
        }
      } catch(e) {}
      return true;
    }
    return false;
  };

  // ---------------------------------------------------------------------------
  // TILE EDITOR UI: preserve normal Scroll modes and expose Ping Pong variants.
  // ---------------------------------------------------------------------------
  TileEditor.prototype.updateAnimationOptions = function(args) {
    args = args || {};
    var hasMixed = !!args.hasMixed;
    var selected = typeof args.selected !== 'undefined' ? args.selected : '';
    var animationOptions = [
      { value: '', label: 'No' },
      { value: 'mixed', label: 'Mixed' },
      { value: 'left', label: 'Scroll Left' },
      { value: 'right', label: 'Scroll Right' },
      { value: 'up', label: 'Scroll Up' },
      { value: 'down', label: 'Scroll Down' },
      { value: 'pingpong-left', label: 'Ping Pong Left' },
      { value: 'pingpong-right', label: 'Ping Pong Right' },
      { value: 'pingpong-up', label: 'Ping Pong Up' },
      { value: 'pingpong-down', label: 'Ping Pong Down' },
      { value: 'blink', label: 'Blink' },
      { value: 'frames', label: 'Frames' }
    ];

    var html = '';
    for(var i = 0; i < animationOptions.length; i++) {
      var option = animationOptions[i];
      if(option.value === 'mixed' && !hasMixed) continue;
      html += '<option value="' + option.value + '"' + (option.value === selected ? ' selected="selected"' : '') + '>' + option.label + '</option>';
    }
    $('#tileEditorAnimatedType').html(html);
  };

  function refreshActiveBankUI(editor) {
    try {
      var tileSet = editor && editor.tileSetManager ? editor.tileSetManager.getCurrentTileSet() : null;
      if(!tileSet || !isDual8x8(tileSet)) return;
      tileSet.__ricoAnimationBank25 = 0;
      tileSet.update(typeof g_tick !== 'undefined' ? g_tick : 0);
      if(editor.tileEditor && editor.tileEditor.characters && editor.tileEditor.characters.length) {
        var chars = editor.tileEditor.characters;
        editor.tileEditor.characters = [];
        editor.tileEditor.setCharacters(chars);
      }
    } catch(e) { console.error('[RICO TEST25] Bank refresh failed.', e); }
  }

  // When the active frame changes banks, force Tile Editor properties to be
  // re-read from that bank even if the selected screen code did not change.
  if(typeof Frames !== 'undefined') {
    var previousGotoFrame25 = Frames.prototype.gotoFrame;
    Frames.prototype.gotoFrame = function(frame) {
      var result = previousGotoFrame25.apply(this, arguments);
      refreshActiveBankUI(this.editor);
      return result;
    };

    var previousInitEvents25 = Frames.prototype.initEvents;
    Frames.prototype.initEvents = function() {
      var result = previousInitEvents25.apply(this, arguments);
      var editor = this.editor;
      $('#ricoCharsetBank').off('change.rico25').on('change.rico25', function() {
        setTimeout(function() { refreshActiveBankUI(editor); }, 0);
      });
      $('#ricoCharsetBank').off('keyup.rico25').on('keyup.rico25', function() {
        var v = parseInt(this.value, 10);
        if(v === 1 || v === 2) setTimeout(function() { refreshActiveBankUI(editor); }, 0);
      });
      return result;
    };
  }

  UI.on('ready', function() {
    // Ensure the new choices are visible even before a character selection causes
    // TileEditor.setCharacters() to rebuild the menu.
    setTimeout(function() {
      try {
        var editor = window.g_app && g_app.textModeEditor ? g_app.textModeEditor : null;
        if(editor && editor.tileEditor) editor.tileEditor.updateAnimationOptions({ hasMixed: false });
      } catch(e) {}
    }, 100);
  });

  window.RICO_TEST25_DUAL_BANK_ANIMATION = true;
  console.log('[RICO TEST25] Independent BANK 1/BANK 2 animation + fixed Scroll + Ping Pong modes loaded.');
})();
