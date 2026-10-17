(function() {
  'use strict';

  var TEST = '[RICO TEST32]';
  var STORAGE_KEY = 'ricoLocalTileSetLibraryV1';
  var PRESET_PREFIX = 'rico-local:';
  var SOURCE_PREFIX = 'rico-local-source:';
  var FORMAT = 'RICO_TILESET_LIBRARY_V1';

  function nowISO() {
    try { return new Date().toISOString(); } catch(e) { return '' + Date.now(); }
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function slug(value) {
    value = String(value || 'tileset').toLowerCase();
    value = value.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return value || 'tileset';
  }

  function uid() {
    return 'rico-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xffffff).toString(36);
  }

  function emptyLibrary() {
    return { format: FORMAT, version: 1, updatedAt: nowISO(), tileSets: [] };
  }

  function normalizeLibrary(value) {
    if(!value || typeof value !== 'object') return emptyLibrary();
    var list = [];
    if(Array.isArray(value.tileSets)) list = value.tileSets;
    else if(value.tileSet && typeof value.tileSet === 'object') list = [value.tileSet];
    else if(value.width && value.height && value.tileData) list = [value];

    var out = emptyLibrary();
    for(var i = 0; i < list.length; i++) {
      var item = normalizeEntry(list[i]);
      if(item) out.tileSets.push(item);
    }
    return out;
  }

  function normalizeEntry(item) {
    if(!item || typeof item !== 'object') return null;
    var width = parseInt(item.width, 10);
    var height = parseInt(item.height, 10);
    var tileData = Array.isArray(item.tileData) ? item.tileData : null;
    if(!width || !height || !tileData || !tileData.length) return null;

    var cleanTiles = [];
    var expected = width * height;
    for(var i = 0; i < tileData.length; i++) {
      var src = tileData[i] || {};
      var srcFrames = Array.isArray(src.data) ? src.data : [];
      var frames = [];
      if(!srcFrames.length && Array.isArray(src)) srcFrames = [src];
      for(var f = 0; f < srcFrames.length; f++) {
        var frame = Array.isArray(srcFrames[f]) ? srcFrames[f].slice(0, expected) : [];
        while(frame.length < expected) frame.push(0);
        frames.push(frame);
      }
      if(!frames.length) {
        var blank = new Array(expected);
        for(var b = 0; b < expected; b++) blank[b] = 0;
        frames.push(blank);
      }
      var props = {};
      if(src.props && typeof src.props === 'object') {
        for(var key in src.props) if(src.props.hasOwnProperty(key)) props[key] = src.props[key];
      }
      cleanTiles.push({ data: frames, props: props });
    }

    return {
      id: item.id || uid(),
      name: String(item.name || item.label || 'RICO Local Tile Set'),
      width: width,
      height: height,
      tileCount: cleanTiles.length,
      type: item.type || 'ascii',
      source: item.source || 'local',
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || item.createdAt || nowISO(),
      tileData: cleanTiles
    };
  }

  function loadLibrary() {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
      if(!raw) return emptyLibrary();
      return normalizeLibrary(JSON.parse(raw));
    } catch(e) {
      console.error(TEST, 'Could not read local library.', e);
      return emptyLibrary();
    }
  }

  function writeLibrary(library) {
    library = normalizeLibrary(library);
    library.updatedAt = nowISO();
    try {
      if(!window.localStorage) throw new Error('localStorage unavailable');
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      window.dispatchEvent(new CustomEvent('ricoLocalTileSetLibraryChanged'));
      return true;
    } catch(e) {
      console.error(TEST, 'Could not save local library.', e);
      alert('RICO Local Library could not be saved. Browser storage may be full or disabled.');
      return false;
    }
  }

  function cloneTileData(tileSet) {
    var out = [];
    var count = tileSet && typeof tileSet.getTileCount === 'function' ? tileSet.getTileCount() : (tileSet.tileData ? tileSet.tileData.length : 0);
    for(var i = 0; i < count; i++) {
      var src = tileSet.tileData && tileSet.tileData[i] ? tileSet.tileData[i] : { data: [[]], props: {} };
      var frames = [];
      var srcFrames = src.data || [];
      for(var f = 0; f < srcFrames.length; f++) frames.push(Array.prototype.slice.call(srcFrames[f] || []));
      var props = {};
      var srcProps = src.props || {};
      for(var key in srcProps) if(srcProps.hasOwnProperty(key)) props[key] = srcProps[key];
      out.push({ data: frames, props: props });
    }
    return out;
  }

  function saveTileSetToLibrary(tileSet, requestedName, source) {
    if(!tileSet || !tileSet.tileData) return null;
    var width = typeof tileSet.getTileWidth === 'function' ? tileSet.getTileWidth() : tileSet.charWidth;
    var height = typeof tileSet.getTileHeight === 'function' ? tileSet.getTileHeight() : tileSet.charHeight;
    var name = String(requestedName || tileSet.label || tileSet.name || 'Imported Tile Set').trim();
    if(!name) name = 'Imported Tile Set';

    var library = loadLibrary();
    var existing = null;
    var lower = name.toLowerCase();
    for(var i = 0; i < library.tileSets.length; i++) {
      if(String(library.tileSets[i].name).toLowerCase() === lower) {
        existing = library.tileSets[i];
        break;
      }
    }

    var entry = {
      id: existing ? existing.id : uid(),
      name: name,
      width: width,
      height: height,
      tileCount: tileSet.tileData.length,
      type: typeof tileSet.getType === 'function' ? tileSet.getType() : (tileSet.type || 'ascii'),
      source: source || 'import',
      createdAt: existing ? existing.createdAt : nowISO(),
      updatedAt: nowISO(),
      tileData: cloneTileData(tileSet)
    };
    entry = normalizeEntry(entry);
    if(!entry) return null;

    if(existing) {
      for(var e = 0; e < library.tileSets.length; e++) {
        if(library.tileSets[e].id === existing.id) {
          library.tileSets[e] = entry;
          break;
        }
      }
    } else {
      library.tileSets.push(entry);
    }

    if(!writeLibrary(library)) return null;
    return entry;
  }

  function getEntryById(id) {
    var lib = loadLibrary();
    for(var i = 0; i < lib.tileSets.length; i++) if(lib.tileSets[i].id === id) return lib.tileSets[i];
    return null;
  }

  function idFromPreset(preset) {
    if(typeof preset !== 'string' || preset.indexOf(PRESET_PREFIX) !== 0) return null;
    return preset.substring(PRESET_PREFIX.length);
  }

  function idFromSource(sourceId) {
    if(typeof sourceId !== 'string' || sourceId.indexOf(SOURCE_PREFIX) !== 0) return null;
    return sourceId.substring(SOURCE_PREFIX.length);
  }

  function browserDownloadJSON(filename, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      try { document.body.removeChild(a); } catch(e) {}
      try { URL.revokeObjectURL(url); } catch(e) {}
    }, 0);
  }

  function exportLibrary() {
    var lib = loadLibrary();
    lib.format = FORMAT;
    lib.version = 1;
    lib.exportedAt = nowISO();
    browserDownloadJSON('RICO_TILESET_LIBRARY.json', lib);
  }

  function importLibraryFile(file, callback) {
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var incoming = normalizeLibrary(JSON.parse(e.target.result));
        var current = loadLibrary();
        var added = 0;
        for(var i = 0; i < incoming.tileSets.length; i++) {
          var item = incoming.tileSets[i];
          var replaced = false;
          for(var j = 0; j < current.tileSets.length; j++) {
            if(current.tileSets[j].id === item.id || String(current.tileSets[j].name).toLowerCase() === String(item.name).toLowerCase()) {
              item.id = current.tileSets[j].id;
              item.createdAt = current.tileSets[j].createdAt || item.createdAt;
              item.updatedAt = nowISO();
              current.tileSets[j] = item;
              replaced = true;
              break;
            }
          }
          if(!replaced) {
            if(!item.id) item.id = uid();
            current.tileSets.push(item);
          }
          added++;
        }
        if(writeLibrary(current)) {
          if(callback) callback(added);
        }
      } catch(err) {
        console.error(TEST, 'Invalid RICO library JSON.', err);
        alert('This JSON is not a valid RICO Tile Set Library.');
      }
    };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------------
  // IMPORT PANEL: normal LVLLVL import + optional save into RICO Local Library.
  // ---------------------------------------------------------------------------
  function injectImportControls(importer) {
    if(document.getElementById('ricoLocalLibrarySaveControls')) return;
    var form = document.getElementById('tileSetImportForm');
    if(!form) return;
    var box = document.createElement('div');
    box.id = 'ricoLocalLibrarySaveControls';
    box.style.marginTop = '10px';
    box.style.padding = '8px';
    box.style.background = '#1d1d1d';
    box.style.border = '1px solid #3a3a3a';
    box.innerHTML = '' +
      '<label style="display:block;margin-bottom:6px;cursor:pointer;">' +
        '<input type="checkbox" id="ricoSaveImportedTileSet" checked="checked"> <b>Save to RICO Local Library</b>' +
      '</label>' +
      '<label style="display:flex;align-items:center;gap:6px;">Name <input type="text" id="ricoLocalTileSetName" style="flex:1;min-width:90px;" placeholder="Imported Tile Set"></label>' +
      '<div id="ricoLocalLibraryImportStatus" style="margin-top:5px;color:#8fd18f;font-size:11px;"></div>';
    form.parentNode.insertBefore(box, form.nextSibling);
    if(importer && importer.label) document.getElementById('ricoLocalTileSetName').value = importer.label;
  }

  if(typeof TileSetImport !== 'undefined') {
    var originalImportInitEvents32 = TileSetImport.prototype.initEvents;
    TileSetImport.prototype.initEvents = function() {
      var result = originalImportInitEvents32.apply(this, arguments);
      injectImportControls(this);
      return result;
    };

    var originalChooseFile32 = TileSetImport.prototype.chooseTileSetFile;
    TileSetImport.prototype.chooseTileSetFile = function(file) {
      var result = originalChooseFile32.apply(this, arguments);
      var self = this;
      setTimeout(function() {
        injectImportControls(self);
        var input = document.getElementById('ricoLocalTileSetName');
        if(input && self.label) input.value = self.label;
      }, 0);
      return result;
    };

    var originalImportTileSet32 = TileSetImport.prototype.importTileSet;
    TileSetImport.prototype.importTileSet = function(args) {
      injectImportControls(this);
      var saveBox = document.getElementById('ricoSaveImportedTileSet');
      var shouldSave = !!(saveBox && saveBox.checked);
      var nameInput = document.getElementById('ricoLocalTileSetName');
      var saveName = nameInput && nameInput.value ? nameInput.value : this.label;
      var originalArgs = args || {};
      var callArgs = {};
      for(var key in originalArgs) if(originalArgs.hasOwnProperty(key)) callArgs[key] = originalArgs[key];
      var originalCallback = callArgs.callback;
      var savedViaCallback = false;
      var self = this;

      if(shouldSave && callArgs.createTileSet) {
        callArgs.callback = function(result) {
          if(result && result.tileSet) {
            var entry = saveTileSetToLibrary(result.tileSet, saveName, 'import:' + (self.loadFormat || 'unknown'));
            savedViaCallback = !!entry;
            var status = document.getElementById('ricoLocalLibraryImportStatus');
            if(status && entry) status.textContent = 'Saved locally: ' + entry.name + ' · ' + entry.width + 'x' + entry.height + ' · ' + entry.tileCount + ' tiles';
          }
          if(originalCallback) return originalCallback(result);
        };
      }

      var result = originalImportTileSet32.call(this, callArgs);

      if(shouldSave && !savedViaCallback && !callArgs.createTileSet) {
        try {
          var tileSet = this.editor && this.editor.tileSetManager ? this.editor.tileSetManager.getCurrentTileSet() : null;
          var entry = saveTileSetToLibrary(tileSet, saveName, 'import:' + (this.loadFormat || 'unknown'));
          var status = document.getElementById('ricoLocalLibraryImportStatus');
          if(status && entry) status.textContent = 'Saved locally: ' + entry.name + ' · ' + entry.width + 'x' + entry.height + ' · ' + entry.tileCount + ' tiles';
        } catch(e) { console.error(TEST, 'Could not snapshot imported tile set.', e); }
      }
      return result;
    };
  }

  // ---------------------------------------------------------------------------
  // CHOOSE TILE SET / CUSTOM TEXT MODE SETS: expose the local library.
  // ---------------------------------------------------------------------------
  function localDescription(entry) {
    return {
      id: PRESET_PREFIX + entry.id,
      name: entry.name,
      width: entry.width,
      height: entry.height,
      type: 'custom',
      author: 'RICO Local Library',
      notes: 'Stored locally in this browser. ' + entry.tileCount + ' tiles · ' + entry.width + 'x' + entry.height + '.'
    };
  }

  function drawLocalPreview(chooser, entry) {
    if(!chooser.previewCanvas) chooser.previewCanvas = document.getElementById('chooseCharacterSetPreview');
    var canvas = chooser.previewCanvas;
    if(!canvas) return;
    var count = entry.tileData.length;
    var across = Math.min(16, Math.max(1, count));
    var down = Math.ceil(count / across);
    var scale = entry.height > 10 || entry.width > 10 ? 1 : 2;
    var spacing = 2;
    canvas.width = spacing + across * (entry.width * scale + spacing);
    canvas.height = spacing + down * (entry.height * scale + spacing);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for(var i = 0; i < count; i++) {
      var tile = entry.tileData[i];
      var pixels = tile && tile.data && tile.data[0] ? tile.data[0] : [];
      var col = i % across;
      var row = Math.floor(i / across);
      var ox = spacing + col * (entry.width * scale + spacing);
      var oy = spacing + row * (entry.height * scale + spacing);
      for(var y = 0; y < entry.height; y++) {
        for(var x = 0; x < entry.width; x++) {
          if(pixels[x + y * entry.width]) ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
        }
      }
    }
  }

  function appendLocalChooser(chooser) {
    var holder = document.getElementById('chooseCharacterSetList');
    if(!holder) return;
    var lib = loadLibrary();
    var html = '<div class="characterSetListCategory" style="margin-top:10px;">RICO LOCAL LIBRARY</div>' +
      '<div id="ricoLocalChooserTools" style="padding:6px 8px;border-bottom:1px solid #333;">' +
        '<div class="ui-button ui-button-small" id="ricoLocalExportLibrary" style="margin-right:4px;">Export JSON</div>' +
        '<div class="ui-button ui-button-small" id="ricoLocalImportLibrary">Import JSON</div>' +
        '<input id="ricoLocalImportLibraryFile" type="file" accept="application/json,.json" style="display:none">' +
      '</div>';

    if(!lib.tileSets.length) {
      html += '<div style="padding:8px;color:#888;font-size:11px;">No local tile sets yet.</div>';
    } else {
      for(var i = 0; i < lib.tileSets.length; i++) {
        var item = lib.tileSets[i];
        var presetId = PRESET_PREFIX + item.id;
        chooser.tileSets.push(presetId);
        html += '<div class="characterSetListEntry" value="' + escapeHTML(presetId) + '">' + escapeHTML(item.name) + '<div style="font-size:10px;color:#999;">' + item.width + 'x' + item.height + ' · ' + item.tileCount + ' tiles</div></div>';
      }
    }
    holder.insertAdjacentHTML('beforeend', html);

    $('#ricoLocalExportLibrary').off('click.rico32').on('click.rico32', function(e) {
      e.preventDefault(); e.stopPropagation(); exportLibrary();
    });
    $('#ricoLocalImportLibrary').off('click.rico32').on('click.rico32', function(e) {
      e.preventDefault(); e.stopPropagation(); $('#ricoLocalImportLibraryFile').click();
    });
    $('#ricoLocalImportLibraryFile').off('change.rico32').on('change.rico32', function() {
      var file = this.files && this.files[0];
      if(!file) return;
      importLibraryFile(file, function(count) {
        alert('RICO Library imported: ' + count + ' tile set(s).');
        chooser.showCustomTextModePresets();
      });
      this.value = '';
    });
  }

  if(typeof TileSetChoosePreset !== 'undefined') {
    var originalShowCustom32 = TileSetChoosePreset.prototype.showCustomTextModePresets;
    TileSetChoosePreset.prototype.showCustomTextModePresets = function() {
      var result = originalShowCustom32.apply(this, arguments);
      appendLocalChooser(this);
      return result;
    };

    var originalGetDescription32 = TileSetChoosePreset.prototype.getCharacterSetDescription;
    TileSetChoosePreset.prototype.getCharacterSetDescription = function(preset) {
      var id = idFromPreset(preset);
      if(id) {
        var entry = getEntryById(id);
        return entry ? localDescription(entry) : null;
      }
      return originalGetDescription32.apply(this, arguments);
    };

    var originalPreview32 = TileSetChoosePreset.prototype.setPreviewCharacterset;
    TileSetChoosePreset.prototype.setPreviewCharacterset = function(charsetId) {
      var id = idFromPreset(charsetId);
      if(id) {
        var entry = getEntryById(id);
        if(!entry) return;
        this.previewCharsetId = charsetId;
        this.previewCharsetDescription = localDescription(entry);
        drawLocalPreview(this, entry);
        return;
      }
      return originalPreview32.apply(this, arguments);
    };
  }

  // Applying a local entry from Choose A Tile Set behaves like a normal preset.
  if(typeof TileSet !== 'undefined') {
    var originalSetToPreset32 = TileSet.prototype.setToPreset;
    TileSet.prototype.setToPreset = function(preset, callback) {
      var id = idFromPreset(preset);
      if(!id) return originalSetToPreset32.apply(this, arguments);
      var entry = getEntryById(id);
      if(!entry || !this.docRecord || !this.docRecord.data) return;

      var clone = normalizeEntry(entry);
      this.type = clone.type || 'ascii';
      this.label = clone.name;
      this.preset = preset;
      this.customCharacterset = true;
      this.charWidth = clone.width;
      this.charHeight = clone.height;
      this.docRecord.data.width = clone.width;
      this.docRecord.data.height = clone.height;
      this.docRecord.data.tileData = clone.tileData;
      this.tileData = this.docRecord.data.tileData;
      this.tileCount = this.tileData.length;
      if(typeof this.setSortMethods === 'function') this.setSortMethods();
      if(typeof this.updateAllCharacterCurrentData === 'function') this.updateAllCharacterCurrentData();
      if(typeof this.refreshFromImageData === 'function') this.refreshFromImageData();
      if(typeof this.modified === 'function') this.modified();
      if(callback) callback();
    };
  }

  // ---------------------------------------------------------------------------
  // RICO'S REMIX: local entries become source sets too.
  // Supported conversion contracts: 8x8, 7x8, 8x14, 8x16, 16x16.
  // ---------------------------------------------------------------------------
  function activeBank(instance) {
    try {
      var editor = instance && instance.editor ? instance.editor.textModeEditor : null;
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var n = typeof graphic.getCurrentFrame === 'function' ? graphic.getCurrentFrame() : graphic.currentFrame;
      return graphic.frames[n] && parseInt(graphic.frames[n].charsetBank, 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function pairSlots(pairIndex) {
    pairIndex = Math.max(0, Math.min(127, pairIndex | 0));
    var col = pairIndex % 16;
    var pairRow = Math.floor(pairIndex / 16);
    var top = pairRow * 32 + col;
    return { top: top, bottom: top + 16 };
  }

  function pairIndexFromTile(tileIndex) {
    var col = tileIndex % 16;
    var row = Math.floor(tileIndex / 16);
    return Math.floor(row / 2) * 16 + col;
  }

  function moduleSlots(moduleIndex) {
    moduleIndex = Math.max(0, Math.min(63, moduleIndex | 0));
    var col = moduleIndex % 8;
    var row = Math.floor(moduleIndex / 8);
    var tl = row * 32 + col * 2;
    return { tl: tl, tr: tl + 1, bl: tl + 16, br: tl + 17 };
  }

  function moduleIndexFromTile(tileIndex) {
    var col = tileIndex % 16;
    var row = Math.floor(tileIndex / 16);
    return Math.floor(row / 2) * 8 + Math.floor(col / 2);
  }

  function supportedRemixEntry(entry) {
    return (entry.width === 8 && entry.height === 8) ||
           (entry.width === 7 && entry.height === 8) ||
           (entry.width === 8 && (entry.height === 14 || entry.height === 16)) ||
           (entry.width === 16 && entry.height === 16);
  }

  function localModeFor(entry) {
    if(entry.width === 8 && entry.height === 8) return 'single';
    if(entry.width === 7 && entry.height === 8) return 'single';
    if(entry.width === 8 && (entry.height === 14 || entry.height === 16)) return 'double';
    if(entry.width === 16 && entry.height === 16) return 'quad';
    return false;
  }

  function syncLocalDefs(instance) {
    var lib = loadLibrary();
    instance.__rico32LocalDefs = [];
    for(var i = 0; i < lib.tileSets.length; i++) {
      var entry = lib.tileSets[i];
      if(!supportedRemixEntry(entry)) continue;
      var def = {
        id: SOURCE_PREFIX + entry.id,
        label: entry.name,
        category: entry.width + 'x' + entry.height,
        width: entry.width,
        height: entry.height,
        ricoLocal: true,
        localEntryId: entry.id,
        localMode: localModeFor(entry)
      };
      instance.sourceDefsById[def.id] = def;
      instance.__rico32LocalDefs.push(def);
    }
  }

  function sourcePixels(entry, index) {
    if(!entry || index < 0 || index >= entry.tileData.length) return null;
    var tile = entry.tileData[index];
    return tile && tile.data && tile.data[0] ? tile.data[0] : null;
  }

  function singleTo8x8(entry, index) {
    var src = sourcePixels(entry, index);
    if(!src) return null;
    var out = new Array(64);
    for(var i = 0; i < 64; i++) out[i] = 0;
    for(var y = 0; y < Math.min(8, entry.height); y++) {
      for(var x = 0; x < Math.min(8, entry.width); x++) out[x + y * 8] = src[x + y * entry.width] || 0;
    }
    return out;
  }

  function doubleTo8x8(entry, index) {
    var src = sourcePixels(entry, index);
    if(!src) return null;
    var top = new Array(64), bottom = new Array(64);
    for(var i = 0; i < 64; i++) { top[i] = 0; bottom[i] = 0; }
    for(var y = 0; y < 8; y++) for(var x = 0; x < 8; x++) {
      if(x < entry.width && y < entry.height) top[x + y * 8] = src[x + y * entry.width] || 0;
      var sy = y + 8;
      if(x < entry.width && sy < entry.height) bottom[x + y * 8] = src[x + sy * entry.width] || 0;
    }
    return { top: top, bottom: bottom };
  }

  function quadTo8x8(entry, index) {
    var src = sourcePixels(entry, index);
    if(!src) return null;
    var tl = new Array(64), tr = new Array(64), bl = new Array(64), br = new Array(64);
    for(var i = 0; i < 64; i++) { tl[i]=0; tr[i]=0; bl[i]=0; br[i]=0; }
    for(var y = 0; y < 8; y++) for(var x = 0; x < 8; x++) {
      tl[x+y*8] = src[x + y*entry.width] || 0;
      tr[x+y*8] = src[(x+8) + y*entry.width] || 0;
      bl[x+y*8] = src[x + (y+8)*entry.width] || 0;
      br[x+y*8] = src[(x+8) + (y+8)*entry.width] || 0;
    }
    return { tl:tl, tr:tr, bl:bl, br:br };
  }

  function putDraft(instance, bank, slot, data, meta) {
    if(slot < 0 || slot >= 256 || !data) return;
    var drafts = instance.draftByBank[bank];
    if(!drafts[slot]) instance.draftCountByBank[bank]++;
    var draft = { sourceKey: instance.currentSourceId, sourceIndex: meta.sourceIndex, tileIndex: slot, data: data.slice(0), ricoLocal: true };
    for(var key in meta) if(meta.hasOwnProperty(key)) draft[key] = meta[key];
    drafts[slot] = draft;
  }

  function importLocalAtCursor(instance, sourceIndex) {
    var state = instance.__rico32LocalSource;
    if(!state || !state.entry) return;
    var entry = state.entry;
    var mode = state.mode;
    var cursor = instance.__rico32Cursor;
    if(!cursor) return;

    if(instance.tileWidth !== 8 || instance.tileHeight !== 8 || instance.snapshotCount !== 256) {
      instance.setStatus('RICO Local Remix requires the destination project to be a C64 8x8 tile set with 256 slots per bank.');
      return;
    }

    if(mode === 'single') {
      var one = singleTo8x8(entry, sourceIndex);
      var slot = cursor.tileIndex;
      putDraft(instance, cursor.bank, slot, one, { sourceIndex: sourceIndex, localMode: 'single' });
      cursor.tileIndex = (slot + 1) & 255;
      instance.setStatus(entry.name + ' glyph ' + sourceIndex + ' -> BANK ' + cursor.bank + ' slot ' + slot + '.');
    } else if(mode === 'double') {
      var split = doubleTo8x8(entry, sourceIndex);
      var pair = pairSlots(cursor.pairIndex);
      putDraft(instance, cursor.bank, pair.top, split.top, { sourceIndex: sourceIndex, localMode: 'double', part: 'top' });
      putDraft(instance, cursor.bank, pair.bottom, split.bottom, { sourceIndex: sourceIndex, localMode: 'double', part: 'bottom' });
      var oldPair = cursor.pairIndex;
      cursor.pairIndex = (cursor.pairIndex + 1) % 128;
      instance.setStatus(entry.name + ' glyph ' + sourceIndex + ' -> BANK ' + cursor.bank + ' vertical pair ' + oldPair + ' (slots ' + pair.top + '/' + pair.bottom + ').');
    } else if(mode === 'quad') {
      var quad = quadTo8x8(entry, sourceIndex);
      var slots = moduleSlots(cursor.moduleIndex);
      putDraft(instance, cursor.bank, slots.tl, quad.tl, { sourceIndex: sourceIndex, localMode: 'quad', part: 'tl' });
      putDraft(instance, cursor.bank, slots.tr, quad.tr, { sourceIndex: sourceIndex, localMode: 'quad', part: 'tr' });
      putDraft(instance, cursor.bank, slots.bl, quad.bl, { sourceIndex: sourceIndex, localMode: 'quad', part: 'bl' });
      putDraft(instance, cursor.bank, slots.br, quad.br, { sourceIndex: sourceIndex, localMode: 'quad', part: 'br' });
      var oldModule = cursor.moduleIndex;
      cursor.moduleIndex = (cursor.moduleIndex + 1) % 64;
      instance.setStatus(entry.name + ' module ' + sourceIndex + ' -> BANK ' + cursor.bank + ' 2x2 module ' + oldModule + '.');
    }
    instance.__rico32Cursor = cursor;
    instance.renderProject();
    instance.renderCustomInfo();
  }

  function drawLocalSource(instance) {
    var source = instance.__rico32LocalSource;
    var canvas = document.getElementById('ricoRemix24SourceCanvas');
    if(!canvas || !source || !source.entry) return;
    var entry = source.entry;
    var count = entry.tileData.length;
    var across = 16;
    var down = Math.ceil(count / across);
    var scale = instance.scale;
    var spacing = instance.spacing;
    var cellW = entry.width * scale + spacing;
    var cellH = entry.height * scale + spacing;
    canvas.width = spacing + across * cellW;
    canvas.height = spacing + down * cellH;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';

    for(var index = 0; index < count; index++) {
      var pixels = sourcePixels(entry, index) || [];
      var col = index % across;
      var row = Math.floor(index / across);
      var ox = spacing + col * cellW;
      var oy = spacing + row * cellH;
      for(var y = 0; y < entry.height; y++) for(var x = 0; x < entry.width; x++) {
        if(pixels[x + y * entry.width]) ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
      ctx.fillStyle = '#555';
      if(source.mode === 'double') ctx.fillRect(ox, oy + 8 * scale, entry.width * scale, 1);
      if(source.mode === 'quad') {
        ctx.fillRect(ox + 8 * scale, oy, 1, entry.height * scale);
        ctx.fillRect(ox, oy + 8 * scale, entry.width * scale, 1);
      }
      ctx.fillStyle = '#fff';
      if(instance.__rico32SelectedSource === index) {
        ctx.strokeStyle = '#2d80ff'; ctx.lineWidth = 2;
        ctx.strokeRect(ox - 1, oy - 1, entry.width * scale + 2, entry.height * scale + 2);
      }
    }
  }

  function localSourceClick(instance, event) {
    var source = instance.__rico32LocalSource;
    var canvas = document.getElementById('ricoRemix24SourceCanvas');
    if(!source || !canvas) return;
    var entry = source.entry;
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * canvas.width / rect.width;
    var y = (event.clientY - rect.top) * canvas.height / rect.height;
    var scale = instance.scale, spacing = instance.spacing;
    var cellW = entry.width * scale + spacing, cellH = entry.height * scale + spacing;
    x -= spacing; y -= spacing;
    if(x < 0 || y < 0) return;
    var col = Math.floor(x / cellW), row = Math.floor(y / cellH);
    var lx = x - col * cellW, ly = y - row * cellH;
    if(col < 0 || col >= 16 || lx >= entry.width * scale || ly >= entry.height * scale) return;
    var index = row * 16 + col;
    if(index < 0 || index >= entry.tileData.length) return;
    instance.__rico32SelectedSource = index;
    drawLocalSource(instance);
    importLocalAtCursor(instance, index);
  }

  function localCustomClick(instance, event) {
    if(!instance.__rico32LocalMode) return;
    var canvas = document.getElementById('ricoRemix24ProjectCanvas');
    if(!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * canvas.width / rect.width;
    var y = (event.clientY - rect.top) * canvas.height / rect.height;
    var scale = instance.scale, spacing = instance.spacing;
    var cellW = 8 * scale + spacing, cellH = 8 * scale + spacing;
    x -= spacing; y -= spacing;
    if(x < 0 || y < 0) return;
    var col = Math.floor(x / cellW), row = Math.floor(y / cellH);
    var lx = x - col * cellW, ly = y - row * cellH;
    if(col < 0 || col >= 16 || row < 0 || row >= 32 || lx >= 8*scale || ly >= 8*scale) return;
    var combined = row * 16 + col;
    if(combined < 0 || combined >= 512) return;
    var bank = combined < 256 ? 1 : 2;
    var tileIndex = combined & 255;
    var mode = instance.__rico32LocalSource.mode;
    if(mode === 'single') instance.__rico32Cursor = { bank: bank, tileIndex: tileIndex };
    else if(mode === 'double') instance.__rico32Cursor = { bank: bank, pairIndex: pairIndexFromTile(tileIndex) };
    else if(mode === 'quad') instance.__rico32Cursor = { bank: bank, moduleIndex: moduleIndexFromTile(tileIndex) };
    instance.renderProject();
    instance.setStatus('RICO Local insertion cursor moved to BANK ' + bank + ' from slot ' + tileIndex + '.');
  }

  function drawCursor(instance) {
    if(!instance.__rico32LocalMode || !instance.__rico32Cursor) return;
    var canvas = document.getElementById('ricoRemix24ProjectCanvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var cursor = instance.__rico32Cursor;
    var mode = instance.__rico32LocalSource.mode;
    var slots = [];
    if(mode === 'single') slots = [cursor.tileIndex];
    else if(mode === 'double') { var p = pairSlots(cursor.pairIndex); slots = [p.top, p.bottom]; }
    else if(mode === 'quad') { var q = moduleSlots(cursor.moduleIndex); slots = [q.tl,q.tr,q.bl,q.br]; }
    var scale = instance.scale, spacing = instance.spacing;
    var cellW = 8*scale + spacing, cellH = 8*scale + spacing;
    ctx.save(); ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2;
    for(var i = 0; i < slots.length; i++) {
      var combined = (cursor.bank === 2 ? 256 : 0) + slots[i];
      var col = combined % 16, row = Math.floor(combined / 16);
      var ox = spacing + col*cellW, oy = spacing + row*cellH;
      ctx.strokeRect(ox-1, oy-1, 8*scale+2, 8*scale+2);
    }
    ctx.restore();
  }

  function bindRemixCanvas(instance) {
    var canvas = document.getElementById('ricoRemix24ProjectCanvas');
    if(canvas && !canvas.getAttribute('data-rico32-bound')) {
      canvas.setAttribute('data-rico32-bound','1');
      canvas.addEventListener('click', function(event) { localCustomClick(instance, event); });
    }
  }

  function enhanceRemix(instance) {
    if(!instance || instance.__rico32Enhanced) return;
    instance.__rico32Enhanced = true;
    syncLocalDefs(instance);
    instance.__rico32LocalMode = false;
    instance.__rico32LocalSource = null;
    instance.__rico32Cursor = null;
    instance.__rico32SelectedSource = null;

    var originalRenderSidebar = instance.renderSidebar;
    var originalSelectSource = instance.selectSource;
    var originalRenderSource = instance.renderSource;
    var originalSourceClick = instance.sourceCanvasClick;
    var originalRenderProject = instance.renderProject;
    var originalCustomInfo = instance.renderCustomInfo;
    var originalRefreshUI = instance.refreshUI;
    var originalInitEvents = instance.initEvents;

    instance.renderSidebar = function() {
      originalRenderSidebar.apply(this, arguments);
      syncLocalDefs(this);
      var holder = document.getElementById('ricoRemix24Sidebar');
      if(!holder || !this.__rico32LocalDefs.length) return;
      var html = '<div class="rico24Category">RICO LOCAL LIBRARY</div>';
      for(var i = 0; i < this.__rico32LocalDefs.length; i++) {
        var def = this.__rico32LocalDefs[i];
        var entry = getEntryById(def.localEntryId);
        html += '<button type="button" class="rico24SourceItem' + (def.id === this.currentSourceId ? ' selected' : '') + '" data-rico-source="' + escapeHTML(def.id) + '">' + escapeHTML(def.label);
        if(entry) html += '<span class="rico24Adapted"> · ' + entry.width + 'x' + entry.height + (def.localMode === 'double' ? ' · 2 SLOTS' : def.localMode === 'quad' ? ' · 4 SLOTS' : '') + '</span>';
        html += '</button>';
      }
      holder.insertAdjacentHTML('beforeend', html);
    };

    instance.selectSource = function(sourceId) {
      var localId = idFromSource(sourceId);
      if(localId) {
        var entry = getEntryById(localId);
        if(!entry || !supportedRemixEntry(entry)) return;
        this.currentSourceId = sourceId;
        this.__rico32LocalMode = true;
        this.__rico32LocalSource = { entry: entry, mode: localModeFor(entry) };
        this.__rico32SelectedSource = null;
        this.__rico30DoubleHeight = false;
        this.__rico31QuadMode = false;
        var bank = activeBank(this);
        if(this.__rico32LocalSource.mode === 'single') this.__rico32Cursor = { bank: bank, tileIndex: 0 };
        if(this.__rico32LocalSource.mode === 'double') this.__rico32Cursor = { bank: bank, pairIndex: 0 };
        if(this.__rico32LocalSource.mode === 'quad') this.__rico32Cursor = { bank: bank, moduleIndex: 0 };
        this.renderSidebar();
        var title = document.getElementById('ricoRemix24SourceTitle');
        if(title) title.textContent = 'SOURCE · RICO LOCAL · ' + entry.width + 'x' + entry.height + ' · ' + entry.name;
        this.renderSource();
        this.renderProject();
        this.renderCustomInfo();
        bindRemixCanvas(this);
        this.setStatus(entry.name + ' loaded from RICO Local Library. Click a source glyph/module to insert it; click CUSTOM to move the insertion cursor.');
        return;
      }
      this.__rico32LocalMode = false;
      this.__rico32LocalSource = null;
      this.__rico32Cursor = null;
      this.__rico32SelectedSource = null;
      return originalSelectSource.apply(this, arguments);
    };

    instance.renderSource = function() {
      if(this.__rico32LocalMode) return drawLocalSource(this);
      return originalRenderSource.apply(this, arguments);
    };

    instance.sourceCanvasClick = function(event) {
      if(this.__rico32LocalMode) return localSourceClick(this, event);
      return originalSourceClick.apply(this, arguments);
    };

    instance.renderProject = function() {
      var result = originalRenderProject.apply(this, arguments);
      if(this.__rico32LocalMode) drawCursor(this);
      return result;
    };

    instance.renderCustomInfo = function() {
      originalCustomInfo.apply(this, arguments);
      if(!this.__rico32LocalMode || !this.__rico32LocalSource) return;
      var info = document.getElementById('ricoRemix24CustomInfo');
      if(info) info.innerHTML += ' · <b>RICO LOCAL</b> · ' + escapeHTML(this.__rico32LocalSource.entry.name);
    };

    instance.initEvents = function() {
      var result = originalInitEvents.apply(this, arguments);
      bindRemixCanvas(this);
      return result;
    };

    instance.refreshUI = function() {
      syncLocalDefs(this);
      var result = originalRefreshUI.apply(this, arguments);
      bindRemixCanvas(this);
      return result;
    };

    window.addEventListener('ricoLocalTileSetLibraryChanged', function() {
      try {
        syncLocalDefs(instance);
        if(document.getElementById('ricoRemix24Sidebar')) instance.renderSidebar();
      } catch(e) {}
    });

    console.log(TEST, 'RICO Local Library connected to Rico Remix.');
  }

  if(typeof Editor !== 'undefined') {
    var previousMenuClick32 = Editor.prototype.menuClick;
    Editor.prototype.menuClick = function(menuItem) {
      var result = previousMenuClick32.apply(this, arguments);
      if(menuItem === 'rico-tileset-remix' && this.ricoRemixTileSetDialog24) enhanceRemix(this.ricoRemixTileSetDialog24);
      return result;
    };
  }

  if(typeof UI !== 'undefined') {
    UI.on('ready', function() {
      setTimeout(function() {
        try {
          var editor = window.g_app && g_app.textModeEditor ? g_app.textModeEditor : null;
          if(editor && editor.ricoRemixTileSetDialog24) enhanceRemix(editor.ricoRemixTileSetDialog24);
        } catch(e) {}
      }, 150);
    });
  }

  window.RICO_LOCAL_TILESET_LIBRARY = {
    load: loadLibrary,
    save: writeLibrary,
    saveTileSet: saveTileSetToLibrary,
    exportJSON: exportLibrary,
    get: getEntryById,
    format: FORMAT
  };

  console.log(TEST, 'Local Tile Set Library loaded. Import -> save locally -> Custom Text Mode Sets -> Rico Remix.');
})();