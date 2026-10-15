(function() {
  'use strict';

  if(typeof TileSet === 'undefined' || typeof TileEditor === 'undefined') {
    console.error('[RICO TEST34] TileSet/TileEditor not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var GROUP_FIELD = 'ricoGroupAnimationsV1';
  var BANK_SIZE = 256;
  var TILE_W = 8;
  var TILE_H = 8;

  var OPTIONS = [
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

  function copyPixels(src) {
    if(!src) return [];
    return src.slice ? src.slice(0) : Array.prototype.slice.call(src);
  }

  function getRecord(tileSet) {
    try { return tileSet && tileSet.getDocRecord ? tileSet.getDocRecord() : null; } catch(e) { return null; }
  }

  function getBank2Record(tileSet) {
    var record = getRecord(tileSet);
    var stored = record && record.data ? record.data[BANK2_FIELD] : null;
    if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) return stored;
    return null;
  }

  function isDual8x8(tileSet) {
    try {
      return !!(tileSet && tileSet.getTileWidth() === 8 && tileSet.getTileHeight() === 8 && getBank2Record(tileSet));
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
    if(index === false || index < 0 || index >= BANK_SIZE) return null;
    if(bank === 2) {
      var stored = getBank2Record(tileSet);
      return stored && stored.tileData ? stored.tileData[index] : null;
    }
    return tileSet && tileSet.tileData ? tileSet.tileData[index] : null;
  }

  function ensureTileProps(tile) {
    if(!tile) return null;
    if(!tile.props) tile.props = {};
    if(typeof tile.props.animated === 'undefined') tile.props.animated = false;
    if(typeof tile.props.ticksPerFrame === 'undefined') tile.props.ticksPerFrame = 6;
    if(typeof tile.props.frame === 'undefined') tile.props.frame = 0;
    if(typeof tile.props.lastTick === 'undefined') tile.props.lastTick = 0;
    if(typeof tile.props.frameCount === 'undefined') tile.props.frameCount = 1;
    return tile.props;
  }

  function getStore(tileSet, create) {
    var record = getRecord(tileSet);
    if(!record || !record.data) return null;
    var store = record.data[GROUP_FIELD];
    if((!store || store.version !== 1) && create) {
      store = { version: 1, nextId: 1, bank1: [], bank2: [] };
      record.data[GROUP_FIELD] = store;
    }
    if(store) {
      if(!store.bank1) store.bank1 = [];
      if(!store.bank2) store.bank2 = [];
      if(!store.nextId) store.nextId = 1;
    }
    return store || null;
  }

  function getGroups(tileSet, bank, create) {
    var store = getStore(tileSet, create);
    if(!store) return [];
    return bank === 2 ? store.bank2 : store.bank1;
  }

  function markModified(tileSet) {
    try { if(tileSet && typeof tileSet.modified === 'function') tileSet.modified(); } catch(e) {}
  }

  function selectionDescriptor(tileEditor) {
    if(!tileEditor || !tileEditor.tileSet || !tileEditor.characters || !tileEditor.characters.length) return null;
    var chars = tileEditor.characters;
    var width = 0;
    for(var y = 0; y < chars.length; y++) width = Math.max(width, chars[y] ? chars[y].length : 0);
    var height = chars.length;
    var cells = [];
    var matrix = [];
    var seen = {};
    var duplicate = false;
    var noTile = tileEditor.editor && tileEditor.editor.tileSetManager ? tileEditor.editor.tileSetManager.noTile : -1;

    for(var yy = 0; yy < height; yy++) {
      var row = [];
      for(var xx = 0; xx < width; xx++) {
        var tile = (chars[yy] && typeof chars[yy][xx] !== 'undefined') ? chars[yy][xx] : false;
        if(tile === false || tile === noTile || tile < 0 || tile >= BANK_SIZE) {
          row.push(-1);
          continue;
        }
        tile = parseInt(tile, 10);
        row.push(tile);
        if(seen[tile]) duplicate = true;
        seen[tile] = true;
        cells.push({ tile: tile, x: xx, y: yy });
      }
      matrix.push(row);
    }

    return {
      bank: getActiveBank(tileEditor.tileSet),
      widthTiles: width,
      heightTiles: height,
      cells: cells,
      matrix: matrix,
      key: width + 'x' + height + ':' + matrix.map(function(r) { return r.join(','); }).join('/'),
      duplicate: duplicate
    };
  }

  function groupTileMap(group) {
    var map = {};
    if(!group || !group.cells) return map;
    for(var i = 0; i < group.cells.length; i++) map[group.cells[i].tile] = true;
    return map;
  }

  function findExactGroup(tileSet, desc) {
    if(!desc) return null;
    var groups = getGroups(tileSet, desc.bank, false);
    for(var i = 0; i < groups.length; i++) {
      if(groups[i].selectionKey === desc.key) return groups[i];
    }
    return null;
  }

  function findIntersectingGroup(tileSet, desc) {
    if(!desc) return null;
    var wanted = {};
    for(var i = 0; i < desc.cells.length; i++) wanted[desc.cells[i].tile] = true;
    var groups = getGroups(tileSet, desc.bank, false);
    for(var g = 0; g < groups.length; g++) {
      var cells = groups[g].cells || [];
      for(var c = 0; c < cells.length; c++) if(wanted[cells[c].tile]) return groups[g];
    }
    return null;
  }

  function resetTilesToBase(tileSet, bank, tileIds) {
    var preview = tileSet.__ricoPalettePreview33;
    var changed = [];
    for(var i = 0; i < tileIds.length; i++) {
      var id = tileIds[i];
      var tile = getTile(tileSet, bank, id);
      if(!tile || !tile.data || !tile.data.length) continue;
      var base = copyPixels(tile.data[0]);
      if(bank === getActiveBank(tileSet)) tileSet.currentTileData[id] = base;
      if(preview && preview.pixels && preview.pixels[bank]) {
        preview.pixels[bank][id] = copyPixels(base);
        if(preview.phase && preview.phase[bank]) preview.phase[bank][id] = undefined;
      }
      changed.push(id);
    }
    return changed;
  }

  function removeIntersectingGroups(tileSet, desc) {
    if(!desc) return [];
    var groups = getGroups(tileSet, desc.bank, true);
    var selected = {};
    for(var i = 0; i < desc.cells.length; i++) selected[desc.cells[i].tile] = true;
    var kept = [];
    var resetMap = {};

    for(var g = 0; g < groups.length; g++) {
      var hit = false;
      var cells = groups[g].cells || [];
      for(var c = 0; c < cells.length; c++) {
        if(selected[cells[c].tile]) { hit = true; break; }
      }
      if(hit) {
        for(var r = 0; r < cells.length; r++) resetMap[cells[r].tile] = true;
      } else {
        kept.push(groups[g]);
      }
    }

    var store = getStore(tileSet, true);
    if(desc.bank === 2) store.bank2 = kept; else store.bank1 = kept;
    var ids = Object.keys(resetMap).map(function(v) { return parseInt(v, 10); });
    resetTilesToBase(tileSet, desc.bank, ids);
    return ids;
  }

  function disableIndividualAnimation(tileSet, bank, cells) {
    for(var i = 0; i < cells.length; i++) {
      var tile = getTile(tileSet, bank, cells[i].tile);
      if(!tile) continue;
      var props = ensureTileProps(tile);
      props.animated = false;
      props.frame = 0;
      props.lastTick = 0;
    }
  }

  function createGroup(tileSet, desc, type, ticks) {
    var store = getStore(tileSet, true);
    removeIntersectingGroups(tileSet, desc);
    if(!type || type === 'mixed') {
      markModified(tileSet);
      return null;
    }

    disableIndividualAnimation(tileSet, desc.bank, desc.cells);
    var group = {
      id: 'g' + (store.nextId++),
      selectionKey: desc.key,
      widthTiles: desc.widthTiles,
      heightTiles: desc.heightTiles,
      cells: desc.cells.map(function(c) { return { tile: c.tile, x: c.x, y: c.y }; }),
      type: type,
      ticksPerFrame: ticks,
      version: 1
    };
    getGroups(tileSet, desc.bank, true).push(group);
    markModified(tileSet);
    tileSet.__ricoGroupPhase34 = null;
    return group;
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

  function groupFrameCount(tileSet, bank, group) {
    var width = Math.max(1, group.widthTiles * TILE_W);
    var height = Math.max(1, group.heightTiles * TILE_H);
    switch(group.type) {
      case 'left':
      case 'right': return width;
      case 'up':
      case 'down': return height;
      case 'pingpong-left':
      case 'pingpong-right': return Math.max(1, width * 2 - 2);
      case 'pingpong-up':
      case 'pingpong-down': return Math.max(1, height * 2 - 2);
      case 'blink': return 2;
      case 'frames': {
        var maxFrames = 1;
        for(var i = 0; i < group.cells.length; i++) {
          var tile = getTile(tileSet, bank, group.cells[i].tile);
          if(tile && tile.data && tile.data.length > maxFrames) maxFrames = tile.data.length;
        }
        return maxFrames;
      }
    }
    return 1;
  }

  function buildComposite(tileSet, bank, group, frameForTileData) {
    var width = group.widthTiles * TILE_W;
    var height = group.heightTiles * TILE_H;
    var out = new Array(width * height);
    for(var i = 0; i < out.length; i++) out[i] = 0;

    for(var c = 0; c < group.cells.length; c++) {
      var cell = group.cells[c];
      var tile = getTile(tileSet, bank, cell.tile);
      if(!tile || !tile.data || !tile.data.length) continue;
      var fi = frameForTileData || 0;
      if(fi >= tile.data.length) fi = tile.data.length - 1;
      if(fi < 0) fi = 0;
      var pixels = tile.data[fi] || tile.data[0];
      for(var y = 0; y < TILE_H; y++) {
        for(var x = 0; x < TILE_W; x++) {
          var dx = cell.x * TILE_W + x;
          var dy = cell.y * TILE_H + y;
          if(dx >= 0 && dx < width && dy >= 0 && dy < height) {
            out[dx + dy * width] = pixels[x + y * TILE_W] || 0;
          }
        }
      }
    }
    return out;
  }

  function renderGroup(tileSet, bank, group, frame) {
    var width = group.widthTiles * TILE_W;
    var height = group.heightTiles * TILE_H;
    var base;
    if(group.type === 'frames') return buildComposite(tileSet, bank, group, frame);
    base = buildComposite(tileSet, bank, group, 0);

    switch(group.type) {
      case 'left': return wrappedShift(base, width, height, frame, 0);
      case 'right': return wrappedShift(base, width, height, -frame, 0);
      case 'up': return wrappedShift(base, width, height, 0, frame);
      case 'down': return wrappedShift(base, width, height, 0, -frame);
      case 'pingpong-left': return clippedShift(base, width, height, pingDisplacement(frame, width), 0);
      case 'pingpong-right': return clippedShift(base, width, height, -pingDisplacement(frame, width), 0);
      case 'pingpong-up': return clippedShift(base, width, height, 0, pingDisplacement(frame, height));
      case 'pingpong-down': return clippedShift(base, width, height, 0, -pingDisplacement(frame, height));
      case 'blink': {
        if(frame & 1) {
          for(var i = 0; i < base.length; i++) base[i] = base[i] ? 0 : 1;
        }
        return base;
      }
    }
    return base;
  }

  function splitComposite(tileSet, bank, group, composite, writeCurrent, writePreview) {
    var width = group.widthTiles * TILE_W;
    var preview = tileSet.__ricoPalettePreview33;
    var changed = [];

    for(var c = 0; c < group.cells.length; c++) {
      var cell = group.cells[c];
      var pixels = new Array(TILE_W * TILE_H);
      for(var y = 0; y < TILE_H; y++) {
        for(var x = 0; x < TILE_W; x++) {
          var sx = cell.x * TILE_W + x;
          var sy = cell.y * TILE_H + y;
          pixels[x + y * TILE_W] = composite[sx + sy * width] || 0;
        }
      }
      if(writeCurrent) tileSet.currentTileData[cell.tile] = pixels;
      if(writePreview && preview && preview.pixels && preview.pixels[bank]) {
        preview.pixels[bank][cell.tile] = copyPixels(pixels);
        // Keep TEST33's phase undefined so it does not replace group pixels with
        // static frame 0 on the next palette-preview pass.
        if(preview.phase && preview.phase[bank]) preview.phase[bank][cell.tile] = undefined;
      }
      changed.push(cell.tile);
    }
    return changed;
  }

  function unique(list) {
    var seen = {}, out = [];
    for(var i = 0; i < list.length; i++) {
      var v = list[i];
      if(!seen[v]) { seen[v] = true; out.push(v); }
    }
    return out;
  }

  function redrawPalette(tilePalette, tiles) {
    try {
      if(!tilePalette || !tilePalette.tilePaletteDisplay || !tiles.length) return;
      tilePalette.tilePaletteDisplay.draw({ redrawTiles: true, tiles: tiles });
    } catch(e) { console.error('[RICO TEST34] Palette redraw failed.', e); }
  }

  function refreshGroupVisuals(tileSet, activeChanged, changed1, changed2) {
    var editor = tileSet && tileSet.editor;
    if(!editor) return;
    activeChanged = unique(activeChanged);
    changed1 = unique(changed1);
    changed2 = unique(changed2);

    if(activeChanged.length) {
      try {
        if(editor.currentTile && typeof editor.currentTile.canvasDrawCharacters === 'function') editor.currentTile.canvasDrawCharacters();
        if(editor.graphic) {
          if(typeof editor.graphic.invalidateAllCells === 'function') editor.graphic.invalidateAllCells();
          if(typeof editor.graphic.redraw === 'function') editor.graphic.redraw({ animatedTilesOnly: true });
        }
      } catch(e) {}
      redrawPalette(editor.tools && editor.tools.drawTools ? editor.tools.drawTools.tilePalette : null, activeChanged);
    }

    var side = [];
    for(var i = 0; i < changed1.length; i++) side.push(changed1[i]);
    for(var j = 0; j < changed2.length; j++) side.push(BANK_SIZE + changed2[j]);
    redrawPalette(editor.sideTilePalette, side);
  }

  function ensurePhaseState(tileSet) {
    if(!tileSet.__ricoGroupPhase34) tileSet.__ricoGroupPhase34 = { 1: {}, 2: {} };
    return tileSet.__ricoGroupPhase34;
  }

  function updateGroupBank(tileSet, bank, tick, writeCurrent, force) {
    var groups = getGroups(tileSet, bank, false);
    var phaseState = ensurePhaseState(tileSet);
    var changed = [];
    if(!groups || !groups.length) return changed;

    for(var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var ticks = parseInt(group.ticksPerFrame, 10);
      if(isNaN(ticks) || ticks < 1) ticks = 6;
      var count = groupFrameCount(tileSet, bank, group);
      if(count < 1) count = 1;
      var frame = Math.floor(tick / ticks) % count;
      if(force || phaseState[bank][group.id] !== frame) {
        phaseState[bank][group.id] = frame;
        var composite = renderGroup(tileSet, bank, group, frame);
        changed = changed.concat(splitComposite(tileSet, bank, group, composite, writeCurrent, true));
      }
    }
    return changed;
  }

  // -------------------------------------------------------------------------
  // Runtime: after TEST25/TEST33 have updated ordinary per-character animation,
  // overwrite group members with slices of ONE shared composite bitmap.
  // -------------------------------------------------------------------------
  var previousUpdate34 = TileSet.prototype.update;
  TileSet.prototype.update = function(tick) {
    var result = previousUpdate34.apply(this, arguments);
    if(!isDual8x8(this)) return result;

    var activeBank = getActiveBank(this);
    var bankChanged = this.__ricoGroupActiveBank34 !== activeBank;
    this.__ricoGroupActiveBank34 = activeBank;

    var changed1 = updateGroupBank(this, 1, tick, activeBank === 1, bankChanged && activeBank === 1);
    var changed2 = updateGroupBank(this, 2, tick, activeBank === 2, bankChanged && activeBank === 2);
    var activeChanged = activeBank === 2 ? changed2 : changed1;

    if(changed1.length || changed2.length) {
      refreshGroupVisuals(this, activeChanged, changed1, changed2);
      return true;
    }
    return result;
  };

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  function optionsHtml(selected, allowMixed) {
    var html = '';
    for(var i = 0; i < OPTIONS.length; i++) {
      var option = OPTIONS[i];
      if(option.value === 'mixed' && !allowMixed) continue;
      html += '<option value="' + option.value + '"' + (option.value === selected ? ' selected="selected"' : '') + '>' + option.label + '</option>';
    }
    return html;
  }

  function injectGroupUI(tileEditor) {
    if($('#ricoGroupAnimate34').length) return;
    var normalSelect = $('#tileEditorAnimatedType');
    if(!normalSelect.length) return;
    var outer = normalSelect.parent().parent();
    var html = '' +
      '<div id="ricoGroupAnimate34" style="margin: 12px 0 0 10px; padding-top: 8px; border-top: 1px solid #333;">' +
        '<div><label for="ricoGroupAnimatedType34">Group Animate:</label></div>' +
        '<div style="margin-top: 2px">' +
          '<select id="ricoGroupAnimatedType34" style="margin-right: 6px; margin-top: 6px;">' + optionsHtml('', false) + '</select>' +
          '<div style="display:inline-block; margin-top:6px" id="ricoGroupTicksRow34">' +
            '<label for="ricoGroupTicks34">Ticks/Frame:</label> ' +
            '<input size="2" class="number" min="1" max="64" value="6" id="ricoGroupTicks34"/>' +
          '</div>' +
        '</div>' +
        '<div id="ricoGroupInfo34" style="margin-top:5px; font-size:11px; color:#aaa;"></div>' +
      '</div>';
    outer.after(html);

    $('#ricoGroupAnimatedType34').off('change.rico34').on('change.rico34', function() {
      applyGroupFromUI(tileEditor);
    });
    $('#ricoGroupTicks34').off('change.rico34 keyup.rico34').on('change.rico34 keyup.rico34', function() {
      updateGroupTicksFromUI(tileEditor);
    });
  }

  function syncGroupUI(tileEditor) {
    injectGroupUI(tileEditor);
    var select = $('#ricoGroupAnimatedType34');
    if(!select.length || !tileEditor || !tileEditor.tileSet) return;
    var desc = selectionDescriptor(tileEditor);
    if(!desc || desc.cells.length < 2) {
      select.html(optionsHtml('', false)).val('').prop('disabled', true);
      $('#ricoGroupTicks34').prop('disabled', true);
      $('#ricoGroupInfo34').text('Select 2 or more tiles to animate them as one bitmap.');
      return;
    }

    select.prop('disabled', false);
    $('#ricoGroupTicks34').prop('disabled', false);
    var exact = findExactGroup(tileEditor.tileSet, desc);
    var intersect = exact ? exact : findIntersectingGroup(tileEditor.tileSet, desc);
    var selected = exact ? exact.type : (intersect ? 'mixed' : '');
    select.html(optionsHtml(selected, !!intersect && !exact)).val(selected);
    if(exact) $('#ricoGroupTicks34').val(exact.ticksPerFrame || 6);

    var pxW = desc.widthTiles * TILE_W;
    var pxH = desc.heightTiles * TILE_H;
    var msg = desc.cells.length + ' tiles = one ' + pxW + 'x' + pxH + ' px animation surface';
    if(desc.duplicate) msg += ' · duplicate tile IDs detected';
    $('#ricoGroupInfo34').text(msg);
  }

  function applyGroupFromUI(tileEditor) {
    if(!tileEditor || !tileEditor.tileSet) return;
    var desc = selectionDescriptor(tileEditor);
    if(!desc || desc.cells.length < 2) return;
    var type = $('#ricoGroupAnimatedType34').val();
    if(type === 'mixed') return;
    var ticks = parseInt($('#ricoGroupTicks34').val(), 10);
    if(isNaN(ticks) || ticks < 1) ticks = 6;

    createGroup(tileEditor.tileSet, desc, type, ticks);
    tileEditor.tileSet.__ricoGroupPhase34 = null;
    tileEditor.tileSet.__ricoGroupActiveBank34 = 0;
    tileEditor.tileSet.update(typeof g_tick !== 'undefined' ? g_tick : 0);
    syncGroupUI(tileEditor);
    try {
      if(tileEditor.tileEditorGrid) tileEditor.tileEditorGrid.updateCharacter();
      if(tileEditor.editor && tileEditor.editor.currentTile) tileEditor.editor.currentTile.refresh();
    } catch(e) {}
  }

  function updateGroupTicksFromUI(tileEditor) {
    if(!tileEditor || !tileEditor.tileSet) return;
    var desc = selectionDescriptor(tileEditor);
    var group = findExactGroup(tileEditor.tileSet, desc);
    if(!group) return;
    var ticks = parseInt($('#ricoGroupTicks34').val(), 10);
    if(isNaN(ticks) || ticks < 1) return;
    group.ticksPerFrame = ticks;
    markModified(tileEditor.tileSet);
    tileEditor.tileSet.__ricoGroupPhase34 = null;
  }

  var previousInitEvents34 = TileEditor.prototype.initEvents;
  TileEditor.prototype.initEvents = function() {
    var result = previousInitEvents34.apply(this, arguments);
    injectGroupUI(this);
    syncGroupUI(this);
    return result;
  };

  var previousSetCharacters34 = TileEditor.prototype.setCharacters;
  TileEditor.prototype.setCharacters = function(characters) {
    var result = previousSetCharacters34.apply(this, arguments);
    syncGroupUI(this);
    return result;
  };

  // Normal Animated and Group Animate are mutually exclusive. Choosing a normal
  // per-character animation removes any group containing those selected tiles.
  var previousSetAnimatedType34 = TileEditor.prototype.setAnimatedType;
  TileEditor.prototype.setAnimatedType = function(type) {
    if(this.tileSet && this.characters && this.characters.length) {
      var desc = selectionDescriptor(this);
      if(desc && desc.cells.length) {
        var reset = removeIntersectingGroups(this.tileSet, desc);
        if(reset.length) {
          this.tileSet.__ricoGroupPhase34 = null;
          this.tileSet.__ricoGroupActiveBank34 = 0;
        }
      }
    }
    var result = previousSetAnimatedType34.apply(this, arguments);
    syncGroupUI(this);
    return result;
  };

  UI.on('ready', function() {
    setTimeout(function() {
      try {
        var editor = window.g_app && g_app.textModeEditor ? g_app.textModeEditor : null;
        if(editor && editor.tileEditor) {
          injectGroupUI(editor.tileEditor);
          syncGroupUI(editor.tileEditor);
        }
      } catch(e) { console.error('[RICO TEST34] UI init failed.', e); }
    }, 160);
  });

  window.RICO_TEST34_GROUP_ANIMATE = true;
  console.log('[RICO TEST34] Group Animate loaded: selected tiles animate as one composite bitmap.');
})();