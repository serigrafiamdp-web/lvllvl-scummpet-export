(function() {
  'use strict';

  if(typeof Editor === 'undefined') {
    console.error('[RICO TEST31] Editor not found.');
    return;
  }

  var previousMenuClick31 = Editor.prototype.menuClick;
  var BANK_SIZE = 256;
  var MODULE_COUNT = 64;

  // 16x16 source glyph -> four native C64 8x8 characters laid out as a real 2x2 block.
  // The normal C64 tile palette has 16 columns, so a module cursor spans two columns
  // and two rows. 64 modules (8 x 8) consume exactly the 256 slots of one bank.
  //
  // module 0  =>  0  1
  //              16 17
  // module 1  =>  2  3
  //              18 19
  // ...
  function moduleSlots31(moduleIndex) {
    moduleIndex = Math.max(0, Math.min(MODULE_COUNT - 1, moduleIndex | 0));
    var moduleCol = moduleIndex % 8;
    var moduleRow = Math.floor(moduleIndex / 8);
    var topLeft = moduleRow * 32 + moduleCol * 2;
    return {
      tl: topLeft,
      tr: topLeft + 1,
      bl: topLeft + 16,
      br: topLeft + 17
    };
  }

  function moduleIndexFromTile31(tileIndex) {
    tileIndex = Math.max(0, Math.min(BANK_SIZE - 1, tileIndex | 0));
    var col = tileIndex % 16;
    var row = Math.floor(tileIndex / 16);
    var moduleCol = Math.floor(col / 2);
    var moduleRow = Math.floor(row / 2);
    return moduleRow * 8 + moduleCol;
  }

  function getActiveBank31(instance) {
    try {
      var textModeEditor = instance && instance.editor ? instance.editor.textModeEditor : null;
      var graphic = textModeEditor && textModeEditor.graphic ? textModeEditor.graphic : null;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var frameIndex = typeof graphic.getCurrentFrame === 'function' ? graphic.getCurrentFrame() : graphic.currentFrame;
      var frame = graphic.frames[frameIndex];
      return frame && parseInt(frame.charsetBank, 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function escapeHTML31(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function add16x16Defs31(instance) {
    if(instance.__rico31DefsAdded) return;
    instance.__rico31DefsAdded = true;
    instance.sourceGroups['16x16'] = instance.sourceGroups['16x16'] || [];

    if(typeof CharacterSetPresets === 'undefined') return;

    for(var c = 0; c < CharacterSetPresets.length; c++) {
      var category = CharacterSetPresets[c];
      if(!category || category.category !== '16x16') continue;
      var sets = category.characterSets || [];

      for(var s = 0; s < sets.length; s++) {
        var set = sets[s];
        var width = parseInt(set.width, 10) || 16;
        var height = parseInt(set.height, 10) || 16;
        var options = set.options && set.options.length ? set.options : null;

        if(options) {
          for(var o = 0; o < options.length; o++) {
            var opt = options[o];
            var defOpt = {
              id: 'quad16:' + opt.id,
              label: set.name + ' · ' + opt.name,
              category: '16x16',
              width: width,
              height: height,
              pair: false,
              quad16: true,
              charsetId: opt.id
            };
            instance.sourceGroups['16x16'].push(defOpt);
            instance.sourceDefsById[defOpt.id] = defOpt;
          }
        } else {
          var def = {
            id: 'quad16:' + set.id,
            label: set.name,
            category: '16x16',
            width: width,
            height: height,
            pair: false,
            quad16: true,
            charsetId: set.id
          };
          instance.sourceGroups['16x16'].push(def);
          instance.sourceDefsById[def.id] = def;
        }
      }
    }
  }

  function load16Source31(instance, def) {
    var img = new Image();
    var serial = (instance.__rico31SourceSerial || 0) + 1;
    instance.__rico31SourceSerial = serial;
    instance.__rico31Source = null;

    img.onload = function() {
      if(instance.__rico31SourceSerial !== serial || instance.currentSourceId !== def.id) return;
      var temp = document.createElement('canvas');
      temp.width = img.naturalWidth;
      temp.height = img.naturalHeight;
      var ctx = temp.getContext('2d');
      ctx.clearRect(0, 0, temp.width, temp.height);
      ctx.drawImage(img, 0, 0);
      var across = Math.floor(img.naturalWidth / def.width);
      var down = Math.floor(img.naturalHeight / def.height);
      instance.__rico31Source = {
        def: def,
        imageData: ctx.getImageData(0, 0, temp.width, temp.height),
        across: across,
        down: down,
        count: across * down
      };
      instance.renderSource();
      instance.setStatus(def.label + ': ' + (across * down) + ' modules 16x16. Click one source module and it is imported immediately as FOUR C64 8x8 characters in a 2x2 block. Click CUSTOM first only to move the insertion cursor.');
    };

    img.onerror = function() {
      if(instance.__rico31SourceSerial === serial) instance.setStatus('Could not load 16x16 source charset: ' + def.charsetId);
    };

    img.src = 'charsets/' + def.charsetId + '.png?ricoRemix31=' + serial;
  }

  function sourceGlyphPixels31(instance, sourceIndex) {
    var source = instance.__rico31Source;
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

  function split16ToC64Quad31(instance, sourceIndex) {
    var source = instance.__rico31Source;
    if(!source) return null;
    var def = source.def;
    var src = sourceGlyphPixels31(instance, sourceIndex);
    if(!src) return null;

    var tl = new Array(64), tr = new Array(64), bl = new Array(64), br = new Array(64);
    for(var i = 0; i < 64; i++) { tl[i] = 0; tr[i] = 0; bl[i] = 0; br[i] = 0; }

    // This category is 16x16 today. Keep bounds checks so the converter remains safe.
    for(var y = 0; y < 8; y++) {
      for(var x = 0; x < 8; x++) {
        if(x < def.width && y < def.height) tl[x + y * 8] = src[x + y * def.width] || 0;
        if((x + 8) < def.width && y < def.height) tr[x + y * 8] = src[(x + 8) + y * def.width] || 0;
        if(x < def.width && (y + 8) < def.height) bl[x + y * 8] = src[x + (y + 8) * def.width] || 0;
        if((x + 8) < def.width && (y + 8) < def.height) br[x + y * 8] = src[(x + 8) + (y + 8) * def.width] || 0;
      }
    }

    return { tl: tl, tr: tr, bl: bl, br: br };
  }

  function setQuadDraft31(instance, bank, moduleIndex, sourceIndex) {
    if(moduleIndex < 0 || moduleIndex >= MODULE_COUNT) return false;
    if(instance.tileWidth !== 8 || instance.tileHeight !== 8 || instance.snapshotCount !== 256) {
      instance.setStatus('16x16 MODULE mode requires an 8x8 C64 project tile set with exactly 256 slots per bank.');
      return false;
    }

    var split = split16ToC64Quad31(instance, sourceIndex);
    var source = instance.__rico31Source;
    if(!split || !source) return false;

    var slots = moduleSlots31(moduleIndex);
    var drafts = instance.draftByBank[bank];
    var slotList = [slots.tl, slots.tr, slots.bl, slots.br];
    var dataList = [split.tl, split.tr, split.bl, split.br];
    var partList = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    for(var i = 0; i < 4; i++) {
      var slot = slotList[i];
      if(!drafts[slot]) instance.draftCountByBank[bank]++;
      drafts[slot] = {
        sourceKey: source.def.id,
        charsetId: source.def.charsetId,
        sourceIndex: sourceIndex,
        tileIndex: slot,
        quad16: true,
        moduleIndex: moduleIndex,
        part: partList[i],
        data: dataList[i].slice(0)
      };
    }

    instance.setStatus('Imported 16x16 module ' + sourceIndex + ' into BANK ' + bank + ' as 2x2 C64 block: [' + slots.tl + ', ' + slots.tr + '] / [' + slots.bl + ', ' + slots.br + '].');
    instance.renderProject();
    instance.renderCustomInfo();
    return true;
  }

  function importAtCursor31(instance, sourceIndex) {
    if(!instance.__rico31QuadMode) return false;
    if(!instance.__rico31SelectedModule) {
      instance.__rico31SelectedModule = { bank: getActiveBank31(instance), moduleIndex: 0 };
    }
    var cursor = instance.__rico31SelectedModule;
    var imported = cursor.moduleIndex;
    if(!setQuadDraft31(instance, cursor.bank, imported, sourceIndex)) return false;

    // Append module-by-module through the 8x8 module grid.
    cursor.moduleIndex = (imported + 1) % MODULE_COUNT;
    instance.__rico31SelectedModule = cursor;
    instance.renderProject();
    return true;
  }

  function customCanvasClick31(instance, event) {
    if(!instance.__rico31QuadMode) return;
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
    var moduleIndex = moduleIndexFromTile31(tileIndex);
    var slots = moduleSlots31(moduleIndex);

    instance.__rico31SelectedModule = { bank: bank, moduleIndex: moduleIndex };
    instance.renderProject();
    instance.setStatus('Insertion cursor: BANK ' + bank + ', 2x2 block [' + slots.tl + ', ' + slots.tr + '] / [' + slots.bl + ', ' + slots.br + ']. Click a 16x16 source module to import all FOUR C64 chars automatically.');
  }

  function bindCustomCanvas31(instance) {
    var canvas = document.getElementById('ricoRemix24ProjectCanvas');
    if(!canvas || canvas.getAttribute('data-rico31-bound')) return;
    canvas.setAttribute('data-rico31-bound', '1');
    canvas.addEventListener('click', function(event) { customCanvasClick31(instance, event); });
  }

  function enhanceInstance31(instance) {
    if(!instance || instance.__rico31Enhanced) return;
    instance.__rico31Enhanced = true;
    add16x16Defs31(instance);
    instance.__rico31QuadMode = false;
    instance.__rico31SelectedSource = null;
    instance.__rico31SelectedModule = null;
    instance.__rico31Source = null;

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
      var order = ['8x8', '7x8', '8x14', '8x16', '16x16'];
      var html = '';

      for(var ci = 0; ci < order.length; ci++) {
        var cat = order[ci];
        var list = this.sourceGroups[cat] || [];
        if(!list.length) continue;
        var heading = cat;
        if(cat === '8x14' || cat === '8x16') heading = 'DOUBLE HEIGHT · ' + cat;
        if(cat === '16x16') heading = 'MODULE 2x2 · 16x16';
        html += '<div class="rico24Category">' + escapeHTML31(heading) + '</div>';

        for(var i = 0; i < list.length; i++) {
          var def = list[i];
          html += '<button type="button" class="rico24SourceItem' + (def.id === this.currentSourceId ? ' selected' : '') + '" data-rico-source="' + escapeHTML31(def.id) + '">' + escapeHTML31(def.label);
          if(def.quad16) html += '<span class="rico24Adapted"> · 4 SLOTS</span>';
          else if(def.doubleHeight) html += '<span class="rico24Adapted"> · 2 SLOTS</span>';
          else if(def.width !== 8 || def.height !== 8) html += '<span class="rico24Adapted">→ 8×8</span>';
          html += '</button>';
        }
      }
      holder.innerHTML = html;
    };

    instance.selectSource = function(sourceId) {
      var def = this.sourceDefsById[sourceId];
      if(def && def.quad16) {
        this.currentSourceId = def.id;
        this.__rico31QuadMode = true;
        this.__rico31SelectedSource = null;
        this.__rico30DoubleHeight = false;
        this.__rico30SelectedSource = null;
        this.__rico30TallSource = null;
        if(!this.__rico31SelectedModule) this.__rico31SelectedModule = { bank: getActiveBank31(this), moduleIndex: 0 };
        this.renderSidebar();
        var title = document.getElementById('ricoRemix24SourceTitle');
        if(title) title.textContent = 'SOURCE · 16x16 MODULE · ' + def.label;
        load16Source31(this, def);
        this.renderProject();
        this.renderCustomInfo();
        bindCustomCanvas31(this);
        return;
      }

      this.__rico31QuadMode = false;
      this.__rico31SelectedSource = null;
      this.__rico31SelectedModule = null;
      this.__rico31Source = null;
      return originalSelectSource.apply(this, arguments);
    };

    instance.renderSource = function() {
      if(!this.__rico31QuadMode) return originalRenderSource.apply(this, arguments);
      var source = this.__rico31Source;
      var canvas = document.getElementById('ricoRemix24SourceCanvas');
      if(!canvas) return;
      if(!source || !source.imageData) {
        canvas.width = 1;
        canvas.height = 1;
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
        var pixels = sourceGlyphPixels31(this, index);
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

        // Crosshair makes the four 8x8 C64 quadrants explicit.
        ctx.fillStyle = '#555';
        ctx.fillRect(baseX + 8 * scale, baseY, 1, def.height * scale);
        ctx.fillRect(baseX, baseY + 8 * scale, def.width * scale, 1);

        if(this.__rico31SelectedSource === index) {
          ctx.strokeStyle = '#2d80ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, def.width * scale + 2, def.height * scale + 2);
        }
      }
    };

    instance.sourceCanvasClick = function(event) {
      if(!this.__rico31QuadMode) return originalSourceCanvasClick.apply(this, arguments);
      var source = this.__rico31Source;
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
      x -= spacing;
      y -= spacing;
      if(x < 0 || y < 0) return;

      var col = Math.floor(x / cellW);
      var row = Math.floor(y / cellH);
      var localX = x - col * cellW;
      var localY = y - row * cellH;
      if(col < 0 || col >= 16 || row < 0) return;
      if(localX >= def.width * scale || localY >= def.height * scale) return;
      var index = row * 16 + col;
      if(index < 0 || index >= source.count) return;

      this.__rico31SelectedSource = index;
      this.renderSource();
      importAtCursor31(this, index);
    };

    instance.renderProject = function() {
      var result = originalRenderProject.apply(this, arguments);
      if(!this.__rico31QuadMode || !this.__rico31SelectedModule) return result;
      var canvas = document.getElementById('ricoRemix24ProjectCanvas');
      if(!canvas) return result;
      var ctx = canvas.getContext('2d');
      var cursor = this.__rico31SelectedModule;
      var scale = this.scale;
      var spacing = this.spacing;
      var cellW = 8 * scale + spacing;
      var cellH = 8 * scale + spacing;
      var slots = moduleSlots31(cursor.moduleIndex);
      var list = [slots.tl, slots.tr, slots.bl, slots.br];

      ctx.save();
      ctx.strokeStyle = '#ffd84d';
      ctx.lineWidth = 2;
      for(var i = 0; i < 4; i++) {
        var combined = (cursor.bank === 2 ? 256 : 0) + list[i];
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
      if(!this.__rico31QuadMode) return;
      var info = document.getElementById('ricoRemix24CustomInfo');
      if(!info) return;
      info.innerHTML += ' · <b>16x16 MODULE</b> · AUTO 2x2 BLOCK · 4 slots/module · 64 modules/bank';
    };

    instance.initEvents = function() {
      var result = originalInitEvents.apply(this, arguments);
      bindCustomCanvas31(this);
      return result;
    };

    instance.refreshUI = function() {
      add16x16Defs31(this);
      var result = originalRefreshUI.apply(this, arguments);
      bindCustomCanvas31(this);
      return result;
    };

    console.log('[RICO TEST31] 16x16 Remix installed: one source module -> automatic 2x2 C64 block (4 slots).');
  }

  Editor.prototype.menuClick = function(menuItem) {
    if(menuItem === 'rico-tileset-remix') {
      var result = previousMenuClick31.apply(this, arguments);
      if(this.ricoRemixTileSetDialog24) enhanceInstance31(this.ricoRemixTileSetDialog24);
      return result;
    }
    return previousMenuClick31.apply(this, arguments);
  };

  if(typeof UI !== 'undefined') {
    UI.on('ready', function() {
      setTimeout(function() {
        try {
          var editor = window.g_app && g_app.textModeEditor ? g_app.textModeEditor : null;
          if(editor && editor.ricoRemixTileSetDialog24) enhanceInstance31(editor.ricoRemixTileSetDialog24);
        } catch(e) {}
      }, 100);
    });
  }

  window.RICO_TEST31_REMIX_16X16 = true;
  console.log('[RICO TEST31] 16x16 -> four C64 8x8 chars / 2x2 module selector loaded.');
})();
