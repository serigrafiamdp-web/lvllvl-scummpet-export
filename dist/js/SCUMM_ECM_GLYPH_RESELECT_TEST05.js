(function() {
  'use strict';

  if(typeof LayerGrid === 'undefined' || typeof TextModeEditor === 'undefined') {
    console.error('[LVLLVL TEST05] Required editor classes not found.');
    return;
  }

  // TEST04 is already installed. Keep it untouched and wrap its setMode.
  var test04SetMode = LayerGrid.prototype.setMode;

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function saveSourceBankBeforeFirstECM(layer) {
    var tileSet = layer.getTileSet();
    if(!tileSet || !tileSet.docRecord || !tileSet.docRecord.data) return;

    if(!tileSet.docRecord.data.scummECMSourceTileData) {
      tileSet.docRecord.data.scummECMSourceTileData = deepClone(tileSet.tileData);
      layer.editor.modified();
      console.log('[LVLLVL TEST05] Saved original source glyph bank: ' +
        tileSet.docRecord.data.scummECMSourceTileData.length + ' glyphs.');
    }
  }

  function getUsedPhysicalSlots(layer) {
    var used = {};
    for(var fi = 0; fi < layer.frames.length; fi++) {
      var frame = layer.frames[fi];
      if(!frame || !frame.data) continue;

      for(var y = 0; y < layer.getGridHeight(); y++) {
        for(var x = 0; x < layer.getGridWidth(); x++) {
          var cell = frame.data[y][x];
          if(!cell || typeof cell.t === 'undefined') continue;
          used[cell.t & 0x3f] = true;
        }
      }
    }
    return used;
  }

  function drawGlyph(canvas, tileSet, sourceBank, sourceIndex, state) {
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var w = tileSet.getTileWidth ? tileSet.getTileWidth() : 8;
    var h = tileSet.getTileHeight ? tileSet.getTileHeight() : 8;
    var scale = 3;

    canvas.width = w * scale;
    canvas.height = h * scale;
    canvas.style.width = (w * scale) + 'px';
    canvas.style.height = (h * scale) + 'px';

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var rec = sourceBank[sourceIndex];
    var data = rec && rec.data ? rec.data[0] : null;

    if(data) {
      ctx.fillStyle = '#ddd';
      for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
          if(data[x + y * w]) {
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
    }

    if(state === 'selected') {
      ctx.strokeStyle = '#59d15f';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
    if(state === 'locked') {
      ctx.strokeStyle = '#e6b84d';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
  }

  function createSourceCell(tileSet, sourceBank, sourceIndex, selected, onClick) {
    var cell = document.createElement('div');
    cell.style.cssText =
      'display:inline-flex;flex-direction:column;align-items:center;' +
      'margin:2px;padding:2px;border:1px solid #333;background:#181818;' +
      'cursor:pointer;user-select:none;';

    var cv = document.createElement('canvas');
    drawGlyph(cv, tileSet, sourceBank, sourceIndex, selected ? 'selected' : '');
    cell.appendChild(cv);

    var label = document.createElement('div');
    label.textContent = sourceIndex.toString(16).toUpperCase().padStart(2, '0');
    label.style.cssText = 'font:10px monospace;color:#aaa;margin-top:1px;';
    cell.appendChild(label);

    cell.onclick = function() {
      onClick(sourceIndex);
    };
    return cell;
  }

  function createSlotCell(tileSet, sourceBank, slot, sourceIndex, locked, onRemove) {
    var holder = document.createElement('div');
    holder.style.cssText =
      'display:inline-flex;position:relative;flex-direction:column;align-items:center;' +
      'margin:2px;padding:2px;border:1px solid #333;background:#181818;' +
      'width:34px;min-height:43px;box-sizing:border-box;user-select:none;';

    var slotLabel = document.createElement('div');
    slotLabel.textContent = '$' + slot.toString(16).toUpperCase().padStart(2, '0');
    slotLabel.style.cssText =
      'position:absolute;left:2px;top:2px;z-index:2;background:' +
      (locked ? '#705c22' : '#284d28') +
      ';color:#fff;font:8px monospace;padding:1px 2px;';
    holder.appendChild(slotLabel);

    if(sourceIndex === null || typeof sourceIndex === 'undefined') {
      holder.style.borderStyle = 'dashed';
      holder.style.opacity = '0.55';
      var empty = document.createElement('div');
      empty.textContent = 'EMPTY';
      empty.style.cssText = 'font:8px monospace;color:#777;margin-top:16px;';
      holder.appendChild(empty);
      return holder;
    }

    var cv = document.createElement('canvas');
    drawGlyph(cv, tileSet, sourceBank, sourceIndex, locked ? 'locked' : 'selected');
    holder.appendChild(cv);

    var logical = document.createElement('div');
    logical.textContent = 'src ' +
      sourceIndex.toString(16).toUpperCase().padStart(2, '0');
    logical.style.cssText = 'font:8px monospace;color:#aaa;margin-top:1px;';
    holder.appendChild(logical);

    if(locked) {
      holder.style.cursor = 'not-allowed';
      holder.title = 'This physical slot is already used in the frames and is protected.';
    } else {
      holder.style.cursor = 'pointer';
      holder.title = 'Click to remove this unused glyph from the 64.';
      holder.onclick = function() {
        onRemove(slot);
      };
    }

    return holder;
  }

  function applyReselection(layer, slots, sourceBank, lockedSlots) {
    var tileSet = layer.getTileSet();
    var previous = tileSet.docRecord.data.scummECMSelection || [];

    for(var slot = 0; slot < 64; slot++) {
      if(lockedSlots[slot] && previous[slot] !== slots[slot]) {
        alert(
          'LVLLVL TEST05: physical slot $' +
          slot.toString(16).toUpperCase().padStart(2, '0') +
          ' is already used and cannot be replaced.'
        );
        return false;
      }
    }

    for(var slot = 0; slot < 64; slot++) {
      var sourceIndex = slots[slot];
      if(sourceIndex === null || typeof sourceIndex === 'undefined') return false;
      if(!sourceBank[sourceIndex]) return false;

      tileSet.tileData[slot] = deepClone(sourceBank[sourceIndex]);
      if(typeof tileSet.updateCharacterCurrentData === 'function') {
        tileSet.updateCharacterCurrentData(slot);
      }
    }

    tileSet.docRecord.data.scummECMSelection = slots.slice(0);
    layer.editor.modified();

    layer.editor.tools.drawTools.tilePalette.drawTilePalette({ redrawTiles: true });
    layer.editor.sideTilePalette.drawTilePalette({ redrawTiles: true });
    layer.editor.graphic.redraw({ allCells: true });

    if(layer.editor.type === '2d') {
      layer.editor.layers.updateAllLayerPreviews();
    }

    console.log('[LVLLVL TEST05] ECM glyph reselection applied.');
    return true;
  }

  function showReselectPicker(layer, callback) {
    var tileSet = layer.getTileSet();
    if(!tileSet || !tileSet.docRecord || !tileSet.docRecord.data) {
      callback(false);
      return;
    }

    var sourceBank = tileSet.docRecord.data.scummECMSourceTileData;
    var previous = tileSet.docRecord.data.scummECMSelection;

    if(!sourceBank || !sourceBank.length || !previous || previous.length !== 64) {
      alert(
        'This ECM project does not contain the preserved 256-glyph source bank.\n\n' +
        'Create/convert a fresh copy using TEST05 first.'
      );
      callback(false);
      return;
    }

    var slots = previous.slice(0);
    var lockedSlots = getUsedPhysicalSlots(layer);
    var sourceCount = Math.min(256, sourceBank.length);

    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.78);' +
      'display:flex;align-items:center;justify-content:center;';

    var box = document.createElement('div');
    box.style.cssText =
      'width:1180px;max-width:96vw;height:760px;max-height:94vh;' +
      'background:#202020;border:1px solid #555;box-shadow:0 8px 40px #000;' +
      'display:flex;flex-direction:column;color:#ddd;font-family:Arial,sans-serif;';
    overlay.appendChild(box);

    var header = document.createElement('div');
    header.style.cssText = 'padding:12px 16px;border-bottom:1px solid #444;';
    header.innerHTML =
      '<div style="font-size:20px;margin-bottom:6px">Reselect 64 glyphs for C64 ECM</div>' +
      '<div style="color:#f0c36a">' +
      'Yellow slots are already used in the frames and are protected. ' +
      'Click an unused selected glyph to remove it, then choose a glyph from outside the 64.' +
      '</div>';
    box.appendChild(header);

    var main = document.createElement('div');
    main.style.cssText =
      'flex:1;display:grid;grid-template-columns:1fr 430px;gap:12px;' +
      'padding:12px;min-height:0;';
    box.appendChild(main);

    var left = document.createElement('div');
    left.style.cssText = 'display:flex;flex-direction:column;min-height:0;';
    main.appendChild(left);

    var leftTitle = document.createElement('div');
    leftTitle.textContent = 'Original 256-glyph source bank';
    leftTitle.style.cssText = 'font-weight:bold;margin-bottom:6px;';
    left.appendChild(leftTitle);

    var allGrid = document.createElement('div');
    allGrid.style.cssText =
      'flex:1;overflow:auto;border:1px solid #3c3c3c;padding:6px;background:#151515;';
    left.appendChild(allGrid);

    var right = document.createElement('div');
    right.style.cssText = 'display:flex;flex-direction:column;min-height:0;';
    main.appendChild(right);

    var keepTitle = document.createElement('div');
    keepTitle.style.cssText = 'font-weight:bold;margin-bottom:6px;';
    right.appendChild(keepTitle);

    var keepGrid = document.createElement('div');
    keepGrid.style.cssText =
      'border:1px solid #3c3c3c;padding:6px;background:#151515;' +
      'height:315px;overflow:auto;';
    right.appendChild(keepGrid);

    var outsideTitle = document.createElement('div');
    outsideTitle.textContent = 'Outside the 64';
    outsideTitle.style.cssText = 'font-weight:bold;margin:12px 0 6px;';
    right.appendChild(outsideTitle);

    var outsideGrid = document.createElement('div');
    outsideGrid.style.cssText =
      'flex:1;border:1px solid #3c3c3c;padding:6px;background:#151515;overflow:auto;';
    right.appendChild(outsideGrid);

    var footer = document.createElement('div');
    footer.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:10px 14px;border-top:1px solid #444;';
    box.appendChild(footer);

    var status = document.createElement('div');
    footer.appendChild(status);

    var buttons = document.createElement('div');
    footer.appendChild(buttons);

    function addButton(text, primary, fn) {
      var b = document.createElement('button');
      b.textContent = text;
      b.style.cssText =
        'margin-left:8px;padding:7px 16px;background:' +
        (primary ? '#3b78c8' : '#444') +
        ';color:white;border:1px solid #666;cursor:pointer;';
      b.onclick = fn;
      buttons.appendChild(b);
      return b;
    }

    addButton('Cancel', false, function() {
      document.body.removeChild(overlay);
      callback(false);
    });

    var applyButton = addButton('Apply glyph changes', true, function() {
      for(var i = 0; i < 64; i++) {
        if(slots[i] === null || typeof slots[i] === 'undefined') return;
      }

      if(applyReselection(layer, slots, sourceBank, lockedSlots)) {
        document.body.removeChild(overlay);
        callback(true);
      }
    });

    function findEmptySlot() {
      for(var i = 0; i < 64; i++) {
        if(slots[i] === null || typeof slots[i] === 'undefined') return i;
      }
      return -1;
    }

    function sourceIsSelected(sourceIndex) {
      return slots.indexOf(sourceIndex) !== -1;
    }

    function render() {
      var filled = 0;
      for(var i = 0; i < 64; i++) {
        if(slots[i] !== null && typeof slots[i] !== 'undefined') filled++;
      }

      keepTitle.textContent = 'ECM physical glyphs: ' + filled + ' / 64';
      status.textContent =
        filled === 64
        ? '64/64 selected. Remove an unused glyph to make a replacement.'
        : 'Choose ' + (64 - filled) + ' replacement glyph(s).';

      applyButton.disabled = filled !== 64;
      applyButton.style.opacity = filled === 64 ? '1' : '0.45';

      allGrid.innerHTML = '';
      keepGrid.innerHTML = '';
      outsideGrid.innerHTML = '';

      for(var source = 0; source < sourceCount; source++) {
        (function(sourceIndex) {
          allGrid.appendChild(
            createSourceCell(
              tileSet,
              sourceBank,
              sourceIndex,
              sourceIsSelected(sourceIndex),
              function(chosen) {
                if(sourceIsSelected(chosen)) return;
                var emptySlot = findEmptySlot();
                if(emptySlot < 0) return;
                slots[emptySlot] = chosen;
                render();
              }
            )
          );
        })(source);
      }

      for(var slot = 0; slot < 64; slot++) {
        (function(physicalSlot) {
          keepGrid.appendChild(
            createSlotCell(
              tileSet,
              sourceBank,
              physicalSlot,
              slots[physicalSlot],
              !!lockedSlots[physicalSlot],
              function(removeSlot) {
                slots[removeSlot] = null;
                render();
              }
            )
          );
        })(slot);
      }

      for(var source = 0; source < sourceCount; source++) {
        if(!sourceIsSelected(source)) {
          (function(sourceIndex) {
            outsideGrid.appendChild(
              createSourceCell(
                tileSet,
                sourceBank,
                sourceIndex,
                false,
                function(chosen) {
                  var emptySlot = findEmptySlot();
                  if(emptySlot < 0) return;
                  slots[emptySlot] = chosen;
                  render();
                }
              )
            );
          })(source);
        }
      }
    }

    document.body.appendChild(overlay);
    render();
  }

  LayerGrid.prototype.setMode = function(screenMode, callback) {
    var requestedMode = screenMode;
    if(requestedMode && typeof requestedMode === 'object' &&
       typeof requestedMode.mode !== 'undefined') {
      requestedMode = requestedMode.mode;
    }

    if(requestedMode == TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode != TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode != 'vector') {
      saveSourceBankBeforeFirstECM(this);
    }

    if(requestedMode == TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode == TextModeEditor.Mode.C64ECM) {
      showReselectPicker(this, callback || function(){});
      return;
    }

    return test04SetMode.call(this, screenMode, callback);
  };

  window.LVLLVL_TEST05_ECM_GLYPH_RESELECT = true;
  console.log('[LVLLVL TEST05] ECM glyph reselection installed.');
})();