(function() {
  'use strict';

  if(typeof Editor === 'undefined') {
    console.error('[RICO TEST30] Editor not found.');
    return;
  }

  var previousMenuClick30 = Editor.prototype.menuClick;
  var BANK_SIZE = 256;
  var PAIR_COUNT = 128;

  // TEST30 vertical-pair contract for the normal 16-column C64 palette:
  // pair 0 => slots 0 (TOP) + 16 (BOTTOM), pair 1 => 1 + 17, etc.
  // This consumes all 256 slots as 128 visually adjacent 8x8 pairs.
  function pairSlots30(pairIndex) {
    pairIndex = Math.max(0, Math.min(PAIR_COUNT - 1, pairIndex | 0));
    var col = pairIndex % 16;
    var pairRow = Math.floor(pairIndex / 16);
    var top = pairRow * 32 + col;
    return { top: top, bottom: top + 16 };
  }

  function pairIndexFromTile30(tileIndex) {
    tileIndex = Math.max(0, Math.min(BANK_SIZE - 1, tileIndex | 0));
    var col = tileIndex % 16;
    var row = Math.floor(tileIndex / 16);
    return Math.floor(row / 2) * 16 + col;
  }

  function getActiveBank30(instance) {
    try {
      var textModeEditor = instance && instance.editor ? instance.editor.textModeEditor : null;
      var graphic = textModeEditor && textModeEditor.graphic ? textModeEditor.graphic : null;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var frameIndex = typeof graphic.getCurrentFrame === 'function' ? graphic.getCurrentFrame() : graphic.currentFrame;
      var frame = graphic.frames[frameIndex];
      return frame && parseInt(frame.charsetBank, 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function escapeHTML30(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function addDoubleHeightDefs(instance) {
    if(instance.__rico30DefsAdded) return;
    instance.__rico30DefsAdded = true;
    instance.sourceGroups['8x14'] = instance.sourceGroups['8x14'] || [];
    instance.sourceGroups['8x16'] = instance.sourceGroups['8x16'] || [];

    if(typeof CharacterSetPresets === 'undefined') return;

    for(var c = 0; c < CharacterSetPresets.length; c++) {
      var category = CharacterSetPresets[c];
      if(!category || (category.category !== '8x14' && category.category !== '8x16')) continue;
      var sets = category.characterSets || [];

      for(var s = 0; s < sets.length; s++) {
        var set = sets[s];
        var width = parseInt(set.width, 10) || 8;
        var height = parseInt(set.height, 10) || (category.category === '8x14' ? 14 : 16);
        var options = set.options && set.options.length ? set.options : null;

        if(options) {
          for(var o = 0; o < options.length; o++) {
            var opt = options[o];
            var defOpt = {
              id: 'double:' + opt.id,
              label: set.name + ' · ' + opt.name,
              category: category.category,
              width: width,
              height: height,
              pair: false,
              doubleHeight: true,
              charsetId: opt.id
            };
            instance.sourceGroups[category.category].push(defOpt);
            instance.sourceDefsById[defOpt.id] = defOpt;
          }
        } else {
          var def = {
            id: 'double:' + set.id,
            label: set.name,
            category: category.category,
            width: width,
            height: height,
            pair: false,
            doubleHeight: true,
            charsetId: set.id
          };
          instance.sourceGroups[category.category].push(def);
          instance.sourceDefsById[def.id] = def;
        }
      }
    }
  }

  function loadDoubleSource(instance, def) {
    var img = new Image();
    var serial = (instance.__rico30SourceSerial || 0) + 1;
    instance.__rico30SourceSerial = serial;
    instance.__rico30TallSource = null;

    img.onload = function() {
      if(instance.__rico30SourceSerial !== serial || instance.currentSourceId !== def.id) return;
      var temp = document.createElement('canvas');
      temp.width = img.naturalWidth;
      temp.height = img.naturalHeight;
      var ctx = temp.getContext('2d');
      ctx.clearRect(0, 0, temp.width, temp.height);
      ctx.drawImage(img, 0, 0);
      var across = Math.floor(img.naturalWidth / def.width);
      var down = Math.floor(img.naturalHeight / def.height);
      instance.__rico30TallSource = {
        def: def,
        imageData: ctx.getImageData(0, 0, temp.width, temp.height),
        across: across,
        down: down,
        count: across * down
      };
      instance.renderSource();
      instance.setStatus(def.label + ': ' + (across * down) + ' glyphs source. Click a tall glyph and it is imported immediately as TWO vertically paired C64 characters. Click CUSTOM first only if you want to move the insertion cursor.');
    };

    img.onerror = function() {
      if(instance.__rico30SourceSerial === serial) instance.setStatus('Could not load double-height source charset: ' + def.charsetId);
    };

    img.src = 'charsets/' + def.charsetId + '.png?ricoRemix29=' + serial;
  }

  function sourceGlyphPixels(instance, sourceIndex) {
    var source = instance.__rico30TallSource;
    if(!source || !source.imageData || sourceIndex < 0 || sourceIndex >= source.count) return null;
    var def = source.def;
    var col = sourceIndex % source.across;
    var row = Math.floor(sourceIndex / source.across);
    var pixels = new Array(def.width * def.height);

    for(var y = 0; y < def.height; y++) {
      for(var x = 0; x < def.width; x++) {
        var sx = col * def.width + x;
        var sy = row * def.height + y;
        var pos = (sx + sy * source.imageData.width) * 4;
        pixels[x + y * def.width] = source.imageData.data[pos] > 100 ? 1 : 0;
      }
    }
    return pixels;
  }

  function splitGlyphToC64(instance, sourceIndex) {
    var source = instance.__rico30TallSource;
    if(!source) return null;
    var def = source.def;
    var src = sourceGlyphPixels(instance, sourceIndex);
    if(!src) return null;

    var top = new Array(64);
    var bottom = new Array(64);
    var i;
    for(i = 0; i < 64; i++) { top[i] = 0; bottom[i] = 0; }

    for(var y = 0; y < 8; y++) {
      for(var x = 0; x < 8; x++) {
        if(x < def.width && y < def.height) top[x + y * 8] = src[x + y * def.width] || 0;
      }
    }

    for(var by = 0; by < 8; by++) {
      var sy = 8 + by;
      for(var bx = 0; bx < 8; bx++) {
        if(bx < def.width && sy < def.height) bottom[bx + by * 8] = src[bx + sy * def.width] || 0;
      }
    }

    return { top: top, bottom: bottom };
  }

  function setPairDraft(instance, bank, pairIndex, sourceIndex) {
    if(pairIndex < 0 || pairIndex >= PAIR_COUNT) return false;
    if(instance.tileWidth !== 8 || instance.tileHeight !== 8 || instance.snapshotCount !== 256) {
      instance.setStatus('DOUBLE HEIGHT requires an 8x8 C64 project tile set with exactly 256 slots per bank.');
      return false;
    }

    var split = splitGlyphToC64(instance, sourceIndex);
    var source = instance.__rico30TallSource;
    if(!split || !source) return false;

    var pair = pairSlots30(pairIndex);
    var topSlot = pair.top;
    var bottomSlot = pair.bottom;
    var drafts = instance.draftByBank[bank];
    var slots = [topSlot, bottomSlot];
    var data = [split.top, split.bottom];
    var parts = ['top', 'bottom'];

    for(var i = 0; i < 2; i++) {
      var slot = slots[i];
      if(!drafts[slot]) instance.draftCountByBank[bank]++;
      drafts[slot] = {
        sourceKey: source.def.id,
        charsetId: source.def.charsetId,
        sourceIndex: sourceIndex,
        tileIndex: slot,
        doubleHeight: true,
        pairIndex: pairIndex,
        part: parts[i],
        data: data[i].slice(0)
      };
    }

    var padding = source.def.height === 14 ? ' BOTTOM = 6 source rows + 2 black padding rows.' : ' 8x16 split = exact 8 + 8.';
    instance.setStatus('Imported glyph ' + sourceIndex + ' into BANK ' + bank + ': TOP slot ' + topSlot + ' directly above BOTTOM slot ' + bottomSlot + '.' + padding);
    instance.renderProject();
    instance.renderCustomInfo();
    return true;
  }

  function importAtCursor30(instance, sourceIndex) {
    if(!instance.__rico30DoubleHeight) return false;
    if(!instance.__rico30SelectedPair) {
      instance.__rico30SelectedPair = { bank: getActiveBank30(instance), pairIndex: 0 };
    }
    var cursor = instance.__rico30SelectedPair;
    var importedPair = cursor.pairIndex;
    if(!setPairDraft(instance, cursor.bank, importedPair, sourceIndex)) return false;

    // Advance automatically so repeated source clicks append pair after pair.
    cursor.pairIndex = (importedPair + 1) % PAIR_COUNT;
    instance.__rico30SelectedPair = cursor;
    instance.renderProject();
    return true;
  }

  function customCanvasClick(instance, event) {
    if(!instance.__rico30DoubleHeight) return;
    var canvas = document.getElementById('ricoRemix24ProjectCanvas');
    if(!canvas) return;

    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * canvas.width / rect.width;
    var y = (event.clientY - rect.top) * canvas.height / rect.height;
    var scale = instance.scale;
    var spacing = instance.spacing;
    var cellW = 8 * scale + spacing;
    var cellH = 8 * scale + spacing;
    x -= spacing;
    y -= spacing;
    if(x < 0 || y < 0) return;

    var col = Math.floor(x / cellW);
    var row = Math.floor(y / cellH);
    var localX = x - col * cellW;
    var localY = y - row * cellH;
    if(col < 0 || col >= 16 || row < 0 || row >= 32) return;
    if(localX >= 8 * scale || localY >= 8 * scale) return;

    var combined = row * 16 + col;
    if(combined < 0 || combined >= 512) return;
    var bank = combined < 256 ? 1 : 2;
    var tileIndex = combined & 255;
    var pairIndex = pairIndexFromTile30(tileIndex);
    var pair = pairSlots30(pairIndex);

    instance.__rico30SelectedPair = { bank: bank, pairIndex: pairIndex };
    instance.renderProject();
    instance.setStatus('Insertion cursor: BANK ' + bank + ', vertical pair TOP ' + pair.top + ' / BOTTOM ' + pair.bottom + '. Click a DOUBLE HEIGHT source glyph to import both halves automatically.');
  }

  function bindCustomCanvas(instance) {
    var canvas = document.getElementById('ricoRemix24ProjectCanvas');
    if(!canvas || canvas.getAttribute('data-rico30-bound')) return;
    canvas.setAttribute('data-rico30-bound', '1');
    canvas.addEventListener('click', function(event) { customCanvasClick(instance, event); });
  }

  function enhanceInstance(instance) {
    if(!instance || instance.__rico30Enhanced) return;
    instance.__rico30Enhanced = true;
    addDoubleHeightDefs(instance);
    instance.__rico30DoubleHeight = false;
    instance.__rico30SelectedSource = null;
    instance.__rico30SelectedPair = null;
    instance.__rico30TallSource = null;

    var originalRenderSidebar = instance.renderSidebar;
    var originalSelectSource = instance.selectSource;
    var originalRenderSource = instance.renderSource;
    var originalSourceCanvasClick = instance.sourceCanvasClick;
    var originalRenderProject = instance.renderProject;
    var originalRenderCustomInfo = instance.renderCustomInfo;
    var originalRefreshUI = instance.refreshUI;
    var originalInitEvents = instance.initEvents;

    instance.renderSidebar = function() {
      var holder = document.getElementById('ricoRemix24Sidebar');
      if(!holder) return;
      var order = ['8x8', '7x8', '8x14', '8x16'];
      var html = '';

      for(var ci = 0; ci < order.length; ci++) {
        var cat = order[ci];
        var list = this.sourceGroups[cat] || [];
        if(!list.length) continue;
        var heading = cat;
        if(cat === '8x14' || cat === '8x16') heading = 'DOUBLE HEIGHT · ' + cat;
        html += '<div class="rico24Category">' + escapeHTML30(heading) + '</div>';

        for(var i = 0; i < list.length; i++) {
          var def = list[i];
          html += '<button type="button" class="rico24SourceItem' + (def.id === this.currentSourceId ? ' selected' : '') + '" data-rico-source="' + escapeHTML30(def.id) + '">' + escapeHTML30(def.label);
          if(def.doubleHeight) html += '<span class="rico24Adapted"> · 2 SLOTS</span>';
          else if(def.width !== 8 || def.height !== 8) html += '<span class="rico24Adapted">→ 8×8</span>';
          html += '</button>';
        }
      }
      holder.innerHTML = html;
    };

    instance.selectSource = function(sourceId) {
      var def = this.sourceDefsById[sourceId];
      if(def && def.doubleHeight) {
        this.currentSourceId = def.id;
        this.__rico30DoubleHeight = true;
        this.__rico30SelectedSource = null;
        if(!this.__rico30SelectedPair) this.__rico30SelectedPair = { bank: getActiveBank30(this), pairIndex: 0 };
        this.renderSidebar();
        var title = document.getElementById('ricoRemix24SourceTitle');
        if(title) title.textContent = 'SOURCE · DOUBLE HEIGHT ' + def.category + ' · ' + def.label;
        loadDoubleSource(this, def);
        this.renderProject();
        this.renderCustomInfo();
        bindCustomCanvas(this);
        return;
      }

      this.__rico30DoubleHeight = false;
      this.__rico30SelectedSource = null;
      this.__rico30SelectedPair = null;
      this.__rico30TallSource = null;
      return originalSelectSource.apply(this, arguments);
    };

    instance.renderSource = function() {
      if(!this.__rico30DoubleHeight) return originalRenderSource.apply(this, arguments);
      var source = this.__rico30TallSource;
      var canvas = document.getElementById('ricoRemix24SourceCanvas');
      if(!canvas) return;
      if(!source || !source.imageData) {
        canvas.width = 1; canvas.height = 1;
        return;
      }

      var def = source.def;
      var scale = this.scale;
      var spacing = this.spacing;
      var across = 16;
      var down = Math.ceil(source.count / across);
      var cellW = def.width * scale + spacing;
      var cellH = def.height * scale + spacing;
      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var index = 0; index < source.count; index++) {
        var pixels = sourceGlyphPixels(this, index);
        if(!pixels) continue;
        var col = index % across;
        var row = Math.floor(index / across);
        var baseX = spacing + col * cellW;
        var baseY = spacing + row * cellH;

        ctx.fillStyle = '#fff';
        for(var y = 0; y < def.height; y++) {
          for(var x = 0; x < def.width; x++) {
            if(pixels[x + y * def.width]) ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);
          }
        }

        // Visual guide: one source glyph becomes two 8x8 C64 characters.
        ctx.fillStyle = '#555';
        ctx.fillRect(baseX, baseY + 8 * scale, def.width * scale, 1);

        if(this.__rico30SelectedSource === index) {
          ctx.strokeStyle = '#2d80ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, def.width * scale + 2, def.height * scale + 2);
        }
      }
    };

    instance.sourceCanvasClick = function(event) {
      if(!this.__rico30DoubleHeight) return originalSourceCanvasClick.apply(this, arguments);
      var source = this.__rico30TallSource;
      var canvas = document.getElementById('ricoRemix24SourceCanvas');
      if(!source || !canvas) return;

      var def = source.def;
      var rect = canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * canvas.width / rect.width;
      var y = (event.clientY - rect.top) * canvas.height / rect.height;
      var scale = this.scale;
      var spacing = this.spacing;
      var cellW = def.width * scale + spacing;
      var cellH = def.height * scale + spacing;
      x -= spacing; y -= spacing;
      if(x < 0 || y < 0) return;

      var col = Math.floor(x / cellW);
      var row = Math.floor(y / cellH);
      var localX = x - col * cellW;
      var localY = y - row * cellH;
      if(col < 0 || col >= 16 || row < 0) return;
      if(localX >= def.width * scale || localY >= def.height * scale) return;
      var index = row * 16 + col;
      if(index < 0 || index >= source.count) return;

      this.__rico30SelectedSource = index;
      this.renderSource();
      importAtCursor30(this, index);
    };

    instance.renderProject = function() {
      var result = originalRenderProject.apply(this, arguments);
      if(!this.__rico30DoubleHeight || !this.__rico30SelectedPair) return result;
      var canvas = document.getElementById('ricoRemix24ProjectCanvas');
      if(!canvas) return result;
      var ctx = canvas.getContext('2d');
      var pair = this.__rico30SelectedPair;
      var scale = this.scale;
      var spacing = this.spacing;
      var cellW = 8 * scale + spacing;
      var cellH = 8 * scale + spacing;
      var mappedPair = pairSlots30(pair.pairIndex);
      var slots = [mappedPair.top, mappedPair.bottom];

      ctx.save();
      ctx.strokeStyle = '#ffd84d';
      ctx.lineWidth = 2;
      for(var i = 0; i < 2; i++) {
        var combined = (pair.bank === 2 ? 256 : 0) + slots[i];
        var col = combined % 16;
        var row = Math.floor(combined / 16);
        var baseX = spacing + col * cellW;
        var baseY = spacing + row * cellH;
        ctx.strokeRect(baseX - 1, baseY - 1, 8 * scale + 2, 8 * scale + 2);
      }
      ctx.restore();
      return result;
    };

    instance.renderCustomInfo = function() {
      originalRenderCustomInfo.apply(this, arguments);
      if(!this.__rico30DoubleHeight) return;
      var info = document.getElementById('ricoRemix24CustomInfo');
      if(!info) return;
      info.innerHTML += ' · <b>DOUBLE HEIGHT</b> · AUTO VERTICAL PAIRS · 2 slots/glyph · 128 pairs/bank';
    };

    instance.initEvents = function() {
      var result = originalInitEvents.apply(this, arguments);
      bindCustomCanvas(this);
      return result;
    };

    instance.refreshUI = function() {
      addDoubleHeightDefs(this);
      var result = originalRefreshUI.apply(this, arguments);
      bindCustomCanvas(this);
      return result;
    };

    console.log('[RICO TEST30] DOUBLE HEIGHT Remix installed: 8x14/8x16 -> automatic vertical C64 pairs (TOP + slot below).');
  }

  Editor.prototype.menuClick = function(menuItem) {
    if(menuItem === 'rico-tileset-remix') {
      var result = previousMenuClick30.apply(this, arguments);
      if(this.ricoRemixTileSetDialog24) enhanceInstance(this.ricoRemixTileSetDialog24);
      return result;
    }
    return previousMenuClick30.apply(this, arguments);
  };

  if(typeof UI !== 'undefined') {
    UI.on('ready', function() {
      setTimeout(function() {
        try {
          var editor = window.g_app && g_app.textModeEditor ? g_app.textModeEditor : null;
          if(editor && editor.ricoRemixTileSetDialog24) enhanceInstance(editor.ricoRemixTileSetDialog24);
        } catch(e) {}
      }, 100);
    });
  }

  window.RICO_TEST30_REMIX_DOUBLE_HEIGHT_VERTICAL = true;
  console.log('[RICO TEST30] Double-height automatic vertical-pair selector loaded.');
})();
