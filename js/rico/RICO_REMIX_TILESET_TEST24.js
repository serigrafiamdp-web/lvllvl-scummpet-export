(function() {
  'use strict';

  if(typeof Editor === 'undefined' || typeof UI === 'undefined') {
    console.error('[RICO TEST24] Editor/UI not found.');
    return;
  }

  var previousMenuClick = Editor.prototype.menuClick;
  var BANK_SIZE = 256;
  var CATEGORY_ORDER = ['8x8', '7x8'];

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cloneTileSnapshot(tileSet) {
    var snapshot = [];
    var count = tileSet.getTileCount();
    for(var i = 0; i < count; i++) {
      var source = tileSet.tileData[i];
      var frames = [];
      for(var f = 0; f < source.data.length; f++) frames.push(source.data[f].slice(0));
      var props = {};
      for(var key in source.props) if(source.props.hasOwnProperty(key)) props[key] = source.props[key];
      snapshot.push({ data: frames, props: props });
    }
    return snapshot;
  }

  function addDef(groups, category, def) {
    if(!groups[category]) groups[category] = [];
    groups[category].push(def);
  }

  function buildSourceGroups() {
    var groups = { '8x8': [], '7x8': [] };

    // Preserve the three dual-C64 source families already validated by TEST14.
    addDef(groups, '8x8', {
      id: 'pair:c64', label: 'C64 · Normal + Shifted', category: '8x8', width: 8, height: 8,
      pair: true, bank1Id: 'petscii', bank2Id: 'petscii_shifted'
    });
    addDef(groups, '8x8', {
      id: 'pair:c64_swedish', label: 'C64 Swedish · Normal + Shifted', category: '8x8', width: 8, height: 8,
      pair: true, bank1Id: 'c64_swedish', bank2Id: 'c64_swedish_shifted'
    });
    addDef(groups, '8x8', {
      id: 'pair:c64_japanese', label: 'C64 Japanese · Normal + Shifted', category: '8x8', width: 8, height: 8,
      pair: true, bank1Id: 'c64_japanese', bank2Id: 'c64_shifted_japanese'
    });

    var skipC64 = {
      petscii: true, petscii_shifted: true,
      c64_swedish: true, c64_swedish_shifted: true,
      c64_japanese: true, c64_shifted_japanese: true
    };

    if(typeof CharacterSetPresets === 'undefined') return groups;

    for(var c = 0; c < CharacterSetPresets.length; c++) {
      var category = CharacterSetPresets[c];
      if(!category || CATEGORY_ORDER.indexOf(category.category) === -1) continue;
      var sets = category.characterSets || [];

      for(var s = 0; s < sets.length; s++) {
        var set = sets[s];
        var width = parseInt(set.width, 10) || 8;
        var height = parseInt(set.height, 10) || 8;
        var options = set.options && set.options.length ? set.options : null;

        if(options) {
          for(var o = 0; o < options.length; o++) {
            var opt = options[o];
            if(category.category === '8x8' && skipC64[opt.id]) continue;
            addDef(groups, category.category, {
              id: 'single:' + opt.id,
              label: set.name + ' · ' + opt.name,
              category: category.category,
              width: width,
              height: height,
              pair: false,
              charsetId: opt.id
            });
          }
        } else {
          if(category.category === '8x8' && skipC64[set.id]) continue;
          addDef(groups, category.category, {
            id: 'single:' + set.id,
            label: set.name,
            category: category.category,
            width: width,
            height: height,
            pair: false,
            charsetId: set.id
          });
        }
      }
    }

    return groups;
  }

  function RicoRemix24(editor) {
    this.editor = editor;
    this.dialog = null;
    this.htmlPanel = null;
    this.okButton = null;
    this.cancelButton = null;

    this.currentTileSet = null;
    this.currentTileSetId = null;
    this.snapshotBank1 = [];
    this.snapshotBank2 = [];
    this.snapshotCount = 0;
    this.tileWidth = 8;
    this.tileHeight = 8;
    this.bank2ExistedOnOpen = false;

    this.sourceGroups = buildSourceGroups();
    this.sourceDefsById = {};
    for(var gi = 0; gi < CATEGORY_ORDER.length; gi++) {
      var list = this.sourceGroups[CATEGORY_ORDER[gi]] || [];
      for(var li = 0; li < list.length; li++) this.sourceDefsById[list[li].id] = list[li];
    }
    this.currentSourceId = 'pair:c64';

    this.sourceBanks = {
      1: { key: null, charsetId: null, imageData: null, across: 0, down: 0, totalCount: 0, start: 0, count: 0, sourceWidth: 8, sourceHeight: 8, serial: 0 },
      2: { key: null, charsetId: null, imageData: null, across: 0, down: 0, totalCount: 0, start: 0, count: 0, sourceWidth: 8, sourceHeight: 8, serial: 0 }
    };

    this.draftByBank = { 1: {}, 2: {} };
    this.draftCountByBank = { 1: 0, 2: 0 };
    this.scale = 2;
    this.spacing = 2;
    this.across = 16;
  }

  RicoRemix24.prototype = {
    buildHTML: function() {
      return '' +
        '<div id="ricoRemix24Root" style="position:absolute;left:0;right:0;top:0;bottom:0;background:#050505;color:#ddd;display:flex;flex-direction:column;overflow:hidden;">' +
          '<div style="flex:1;min-height:0;display:flex;background:#050505;">' +
            '<div id="ricoRemix24Sidebar" style="width:235px;min-width:235px;border-right:1px solid #333;background:#151515;overflow-y:auto;overflow-x:hidden;padding:6px 0;box-sizing:border-box;"></div>' +

            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;background:#050505;">' +
              '<div style="height:38px;min-height:38px;box-sizing:border-box;padding:3px 8px;display:flex;align-items:center;gap:10px;background:#050505;">' +
                '<div id="ricoRemix24SourceTitle" style="font-size:16px;color:#fff;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">SOURCE · 512</div>' +
              '</div>' +
              '<div id="ricoRemix24SourceArea" style="flex:1;min-height:0;overflow:hidden;background:#050505;padding:0 8px 2px 8px;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-start;">' +
                '<canvas id="ricoRemix24SourceCanvas" style="display:block;background:#050505;image-rendering:pixelated;cursor:pointer;"></canvas>' +
              '</div>' +
            '</div>' +

            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;background:#050505;">' +
              '<div style="height:38px;min-height:38px;box-sizing:border-box;padding:3px 8px;display:flex;align-items:center;gap:10px;background:#050505;">' +
                '<div style="font-size:17px;color:#fff;font-weight:bold;white-space:nowrap;">CUSTOM TILESET · 512</div>' +
                '<div id="ricoRemix24CustomInfo" style="color:#999;white-space:nowrap;"></div>' +
              '</div>' +
              '<div id="ricoRemix24CustomArea" style="flex:1;min-height:0;overflow:hidden;background:#050505;padding:0 8px 2px 8px;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-start;">' +
                '<canvas id="ricoRemix24ProjectCanvas" style="display:block;background:#050505;image-rendering:pixelated;"></canvas>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="ricoRemix24Status" style="height:22px;min-height:22px;box-sizing:border-box;padding:3px 8px;color:#888;background:#050505;"></div>' +
          '<style>' +
            '#ricoRemix24Root .rico24Category{padding:8px 10px 4px;color:#f0f0f0;font-size:13px;font-weight:bold;border-top:1px solid #2a2a2a;}' +
            '#ricoRemix24Root .rico24Category:first-child{border-top:0;}' +
            '#ricoRemix24Root .rico24SourceItem{display:block;width:100%;box-sizing:border-box;border:0;background:transparent;color:#bbb;text-align:left;padding:4px 10px 4px 18px;font-size:11px;line-height:16px;cursor:pointer;white-space:normal;}' +
            '#ricoRemix24Root .rico24SourceItem:hover{background:#262626;color:#fff;}' +
            '#ricoRemix24Root .rico24SourceItem.selected{background:#315ae6;color:#fff;font-weight:bold;}' +
            '#ricoRemix24Root .rico24Adapted{color:#7ec8ff;font-size:10px;margin-left:4px;}' +
          '</style>' +
        '</div>';
    },

    createUI: function() {
      var self = this;
      this.dialog = UI.create('UI.Dialog', {
        id: 'ricoRemixTileSetDialog24',
        title: "Rico's Remix a Tileset",
        width: 1320,
        height: 820
      });
      this.htmlPanel = UI.create('UI.HTMLPanel', { id: 'ricoRemixTileSetPanel24', html: this.buildHTML() });
      this.dialog.add(this.htmlPanel);

      this.okButton = UI.create('UI.Button', { text: 'OK', color: 'primary' });
      this.dialog.addButton(this.okButton);
      this.okButton.on('click', function() { if(self.commit()) UI.closeDialog(); });

      this.cancelButton = UI.create('UI.Button', { text: 'Cancel', color: 'secondary' });
      this.dialog.addButton(this.cancelButton);
      this.cancelButton.on('click', function() { self.clearDraft(); UI.closeDialog(); });

      this.dialog.on('close', function() {
        self.sourceBanks[1].imageData = null;
        self.sourceBanks[2].imageData = null;
      });

      UI.showDialog('ricoRemixTileSetDialog24');
      setTimeout(function() { self.initEvents(); self.refreshUI(); }, 0);
    },

    show: function() {
      var tileSetManager = this.editor.textModeEditor.tileSetManager;
      var tileSet = tileSetManager.getCurrentTileSet();
      if(!tileSet) { alert('Rico Remix needs an active tile set.'); return; }

      this.currentTileSet = tileSet;
      this.currentTileSetId = tileSet.getId();
      this.snapshotBank1 = cloneTileSnapshot(tileSet);
      this.snapshotCount = tileSet.getTileCount();
      this.tileWidth = tileSet.getTileWidth();
      this.tileHeight = tileSet.getTileHeight();
      this.snapshotBank2 = this.loadBank2Snapshot(tileSet);
      this.currentSourceId = 'pair:c64';
      this.clearDraft();

      if(this.dialog === null) this.createUI();
      else { UI.showDialog('ricoRemixTileSetDialog24'); this.refreshUI(); }
    },

    clearDraft: function() {
      this.draftByBank = { 1: {}, 2: {} };
      this.draftCountByBank = { 1: 0, 2: 0 };
    },

    cloneSnapshotArray: function(snapshot) {
      var out = [];
      for(var i = 0; i < snapshot.length; i++) {
        var source = snapshot[i];
        var frames = [];
        for(var f = 0; f < source.data.length; f++) frames.push(source.data[f].slice(0));
        var props = {};
        for(var key in source.props) if(source.props.hasOwnProperty(key)) props[key] = source.props[key];
        out.push({ data: frames, props: props });
      }
      return out;
    },

    loadBank2Snapshot: function(tileSet) {
      var record = null;
      try { record = tileSet.getDocRecord(); } catch(e) {}
      var stored = record && record.data ? record.data.ricoCharsetBank2 : null;
      this.bank2ExistedOnOpen = false;
      if(stored && stored.version === 1 && stored.width === this.tileWidth && stored.height === this.tileHeight &&
         stored.tileData && stored.tileData.length === this.snapshotCount) {
        this.bank2ExistedOnOpen = true;
        return this.cloneSnapshotArray(stored.tileData);
      }
      return this.cloneSnapshotArray(this.snapshotBank1);
    },

    refreshUI: function() {
      if(!document.getElementById('ricoRemix24Root')) return;
      this.renderSidebar();
      this.renderProject();
      this.selectSource(this.currentSourceId || 'pair:c64');
    },

    initEvents: function() {
      var self = this;
      var root = document.getElementById('ricoRemix24Root');
      var canvas = document.getElementById('ricoRemix24SourceCanvas');

      if(root && !root.getAttribute('data-rico24-bound')) {
        root.setAttribute('data-rico24-bound', '1');
        root.addEventListener('click', function(event) {
          var target = event.target;
          if(target && target.getAttribute && target.getAttribute('data-rico-source')) {
            self.selectSource(target.getAttribute('data-rico-source'));
          }
        });
      }

      if(canvas && !canvas.getAttribute('data-rico24-bound')) {
        canvas.setAttribute('data-rico24-bound', '1');
        canvas.addEventListener('click', function(event) { self.sourceCanvasClick(event); });
      }
    },

    renderSidebar: function() {
      var holder = document.getElementById('ricoRemix24Sidebar');
      if(!holder) return;
      var html = '';
      for(var ci = 0; ci < CATEGORY_ORDER.length; ci++) {
        var cat = CATEGORY_ORDER[ci];
        var list = this.sourceGroups[cat] || [];
        html += '<div class="rico24Category">' + escapeHTML(cat) + '</div>';
        for(var i = 0; i < list.length; i++) {
          var def = list[i];
          html += '<button type="button" class="rico24SourceItem' + (def.id === this.currentSourceId ? ' selected' : '') + '" data-rico-source="' + escapeHTML(def.id) + '">' + escapeHTML(def.label);
          if(def.width !== 8 || def.height !== 8) html += '<span class="rico24Adapted">→ 8×8</span>';
          html += '</button>';
        }
      }
      holder.innerHTML = html;
    },

    selectSource: function(sourceId) {
      var def = this.sourceDefsById[sourceId];
      if(!def) def = this.sourceDefsById['pair:c64'];
      if(!def) return;
      this.currentSourceId = def.id;
      this.renderSidebar();

      var title = document.getElementById('ricoRemix24SourceTitle');
      if(title) title.textContent = 'SOURCE · ' + def.category + ' · ' + def.label;

      if(def.pair) {
        this.loadSourceBank(1, { key: def.id + ':1', charsetId: def.bank1Id, width: def.width, height: def.height, start: 0, split512: false });
        this.loadSourceBank(2, { key: def.id + ':2', charsetId: def.bank2Id, width: def.width, height: def.height, start: 0, split512: false });
      } else {
        this.loadSingleSourceIntoBothBanks(def);
      }

      if(def.width === 7 && def.height === 8) {
        this.setStatus(def.label + ': source 7x8 adapted to C64 8x8 by adding one blank column on the right.');
      } else {
        this.setStatus(def.label + ': source loaded. Click a glyph in either half to replace the same slot in BANK 1 or BANK 2.');
      }
    },

    loadSingleSourceIntoBothBanks: function(def) {
      var self = this;
      var probe = new Image();
      var token = def.id + ':' + Date.now();
      this.__rico24ProbeToken = token;

      probe.onload = function() {
        if(self.__rico24ProbeToken !== token || self.currentSourceId !== def.id) return;
        var across = Math.floor(probe.naturalWidth / def.width);
        var down = Math.floor(probe.naturalHeight / def.height);
        var total = across * down;
        var secondStart = total > BANK_SIZE ? BANK_SIZE : 0;
        self.loadSourceBank(1, { key: def.id + ':1', charsetId: def.charsetId, width: def.width, height: def.height, start: 0, split512: total > BANK_SIZE });
        self.loadSourceBank(2, { key: def.id + ':2', charsetId: def.charsetId, width: def.width, height: def.height, start: secondStart, split512: total > BANK_SIZE });
      };
      probe.onerror = function() {
        if(self.__rico24ProbeToken === token) self.setStatus('Could not load source charset: ' + def.charsetId);
      };
      probe.src = 'charsets/' + def.charsetId + '.png?ricoRemix24probe=' + encodeURIComponent(token);
    },

    loadSourceBank: function(bank, spec) {
      var state = this.sourceBanks[bank];
      state.key = spec.key;
      state.charsetId = spec.charsetId;
      state.sourceWidth = spec.width;
      state.sourceHeight = spec.height;
      state.start = spec.start || 0;
      state.imageData = null;
      state.across = 0;
      state.down = 0;
      state.totalCount = 0;
      state.count = 0;
      var serial = ++state.serial;
      var self = this;
      var img = new Image();

      img.onload = function() {
        if(serial !== state.serial || state.charsetId !== spec.charsetId || state.key !== spec.key) return;
        var temp = document.createElement('canvas');
        temp.width = img.naturalWidth;
        temp.height = img.naturalHeight;
        var ctx = temp.getContext('2d');
        ctx.clearRect(0, 0, temp.width, temp.height);
        ctx.drawImage(img, 0, 0);
        state.imageData = ctx.getImageData(0, 0, temp.width, temp.height);
        state.across = Math.floor(img.naturalWidth / state.sourceWidth);
        state.down = Math.floor(img.naturalHeight / state.sourceHeight);
        state.totalCount = state.across * state.down;
        state.count = Math.max(0, Math.min(BANK_SIZE, state.totalCount - state.start));
        self.renderSource();
      };

      img.onerror = function() {
        if(serial !== state.serial) return;
        self.setStatus('Could not load source charset: ' + spec.charsetId);
      };

      img.src = 'charsets/' + spec.charsetId + '.png?ricoRemix24=' + serial;
    },

    getSourceTileData: function(bank, tileIndex) {
      var state = this.sourceBanks[bank];
      if(!state || !state.imageData || tileIndex < 0 || tileIndex >= state.count) return null;
      var sourceIndex = state.start + tileIndex;
      var col = sourceIndex % state.across;
      var row = Math.floor(sourceIndex / state.across);
      var pixels = [];

      // Destination contract is always real C64 8x8. For 7x8 sources the
      // eighth column (x=7) is left blank; no source pixels are stretched.
      for(var y = 0; y < 8; y++) {
        for(var x = 0; x < 8; x++) {
          var on = 0;
          if(x < state.sourceWidth && y < state.sourceHeight) {
            var sx = col * state.sourceWidth + x;
            var sy = row * state.sourceHeight + y;
            var pos = (sx + sy * state.imageData.width) * 4;
            on = state.imageData.data[pos] > 100 ? 1 : 0;
          }
          pixels.push(on);
        }
      }
      return pixels;
    },

    renderSource: function() {
      var canvas = document.getElementById('ricoRemix24SourceCanvas');
      if(!canvas) return;
      var width = 8, height = 8;
      var scale = this.scale, spacing = this.spacing, across = this.across;
      var count = 512, down = 32;
      var cellW = width * scale + spacing, cellH = height * scale + spacing;
      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var combined = 0; combined < count; combined++) {
        var bank = combined < 256 ? 1 : 2;
        var tileIndex = combined & 255;
        var state = this.sourceBanks[bank];
        if(!state || !state.imageData || tileIndex >= state.count) continue;
        var pixels = this.getSourceTileData(bank, tileIndex);
        if(!pixels) continue;
        var col = combined % across;
        var row = Math.floor(combined / across);
        var baseX = spacing + col * cellW;
        var baseY = spacing + row * cellH;
        ctx.fillStyle = '#fff';
        for(var y = 0; y < 8; y++) for(var x = 0; x < 8; x++) if(pixels[x + y * 8]) ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);

        var draft = this.draftByBank[bank][tileIndex];
        var sourceIndex = state.start + tileIndex;
        if(draft && draft.sourceKey === state.key && draft.sourceIndex === sourceIndex) {
          ctx.strokeStyle = '#2d80ff'; ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, 8 * scale + 2, 8 * scale + 2);
        }
      }
    },

    sourceCanvasClick: function(event) {
      var canvas = document.getElementById('ricoRemix24SourceCanvas');
      if(!canvas) return;
      var rect = canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * canvas.width / rect.width;
      var y = (event.clientY - rect.top) * canvas.height / rect.height;
      var scale = this.scale, spacing = this.spacing;
      var cellW = 8 * scale + spacing, cellH = 8 * scale + spacing;
      x -= spacing; y -= spacing;
      if(x < 0 || y < 0) return;
      var col = Math.floor(x / cellW), row = Math.floor(y / cellH);
      var localX = x - col * cellW, localY = y - row * cellH;
      if(col < 0 || col >= 16 || row < 0 || row >= 32) return;
      if(localX >= 8 * scale || localY >= 8 * scale) return;
      var combined = row * 16 + col;
      var bank = combined < 256 ? 1 : 2;
      var tileIndex = combined & 255;
      var state = this.sourceBanks[bank];
      if(!state || !state.imageData || tileIndex >= state.count) return;
      this.toggleSourceTile(bank, tileIndex);
    },

    toggleSourceTile: function(bank, tileIndex) {
      if(this.tileWidth !== 8 || this.tileHeight !== 8) {
        this.setStatus('Rico Remix source conversion targets an 8x8 C64 project tile set.');
        return;
      }
      if(this.snapshotCount !== 256) {
        this.setStatus('Rico Remix dual-bank mode requires CHARSET BANK 1 to contain exactly 256 tiles.');
        return;
      }

      var state = this.sourceBanks[bank];
      var drafts = this.draftByBank[bank];
      var currentDraft = drafts[tileIndex];
      var sourceIndex = state.start + tileIndex;

      if(currentDraft && currentDraft.sourceKey === state.key && currentDraft.sourceIndex === sourceIndex) {
        delete drafts[tileIndex];
        this.draftCountByBank[bank]--;
        if(this.draftCountByBank[bank] < 0) this.draftCountByBank[bank] = 0;
        this.setStatus('CHARSET BANK ' + bank + ' / slot ' + tileIndex + ' restored to its pre-dialog state.');
      } else {
        var data = this.getSourceTileData(bank, tileIndex);
        if(!data) return;
        if(!currentDraft) this.draftCountByBank[bank]++;
        drafts[tileIndex] = {
          sourceKey: state.key,
          charsetId: state.charsetId,
          sourceIndex: sourceIndex,
          tileIndex: tileIndex,
          data: data.slice(0)
        };
        var combined = bank === 1 ? tileIndex : 256 + tileIndex;
        this.setStatus('Source glyph ' + sourceIndex + ' -> CUSTOM position ' + combined + ' (BANK ' + bank + ', slot ' + tileIndex + ').');
      }

      this.renderSource();
      this.renderProject();
      this.renderCustomInfo();
    },

    renderProject: function() {
      var canvas = document.getElementById('ricoRemix24ProjectCanvas');
      if(!canvas || !this.currentTileSet) return;
      var width = 8, height = 8;
      var scale = this.scale, spacing = this.spacing, across = this.across;
      var count = 512, down = 32;
      var cellW = width * scale + spacing, cellH = height * scale + spacing;
      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var combined = 0; combined < count; combined++) {
        var bank = combined < 256 ? 1 : 2;
        var tileIndex = combined & 255;
        var snapshot = bank === 1 ? this.snapshotBank1 : this.snapshotBank2;
        var draft = this.draftByBank[bank][tileIndex];
        var pixels = draft ? draft.data : (snapshot[tileIndex] && snapshot[tileIndex].data.length ? snapshot[tileIndex].data[0] : null);
        if(!pixels) continue;
        var col = combined % across;
        var row = Math.floor(combined / across);
        var baseX = spacing + col * cellW;
        var baseY = spacing + row * cellH;
        ctx.fillStyle = '#fff';
        for(var y = 0; y < 8; y++) for(var x = 0; x < 8; x++) if(pixels[x + y * 8]) ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);
        if(draft) {
          ctx.strokeStyle = '#2d80ff'; ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, 8 * scale + 2, 8 * scale + 2);
        }
      }
      this.renderCustomInfo();
    },

    renderCustomInfo: function() {
      var info = document.getElementById('ricoRemix24CustomInfo');
      if(!info) return;
      var b1 = this.draftCountByBank[1] || 0, b2 = this.draftCountByBank[2] || 0;
      info.innerHTML = '<b>' + (b1 + b2) + '</b> modified slots';
    },

    setStatus: function(message) {
      var status = document.getElementById('ricoRemix24Status');
      if(status) status.innerHTML = escapeHTML(message);
    },

    commit: function() {
      if(!this.currentTileSet) return false;
      var manager = this.editor.textModeEditor.tileSetManager;
      var liveTileSet = manager.getCurrentTileSet();
      if(!liveTileSet || liveTileSet.getId() !== this.currentTileSetId) {
        this.setStatus('The active tile set changed while Rico Remix was open. Close and reopen the dialog.');
        return false;
      }
      if(liveTileSet.getTileCount() !== this.snapshotCount || this.snapshotCount !== 256) {
        this.setStatus('Rico Remix dual-bank mode needs the current project tile set to contain exactly 256 tiles.');
        return false;
      }

      var changedBank1 = this.draftCountByBank[1] || 0;
      var changedBank2 = this.draftCountByBank[2] || 0;

      for(var slotKey1 in this.draftByBank[1]) {
        if(!this.draftByBank[1].hasOwnProperty(slotKey1)) continue;
        var slot1 = parseInt(slotKey1, 10);
        var draft1 = this.draftByBank[1][slotKey1];
        if(slot1 >= 0 && slot1 < 256 && draft1) liveTileSet.setTileData(slot1, draft1.data);
      }

      var finalBank2 = this.cloneSnapshotArray(this.snapshotBank2);
      for(var slotKey2 in this.draftByBank[2]) {
        if(!this.draftByBank[2].hasOwnProperty(slotKey2)) continue;
        var slot2 = parseInt(slotKey2, 10);
        var draft2 = this.draftByBank[2][slotKey2];
        if(slot2 >= 0 && slot2 < 256 && draft2 && finalBank2[slot2]) finalBank2[slot2].data[0] = draft2.data.slice(0);
      }

      var record = null;
      try { record = liveTileSet.getDocRecord(); } catch(e) {}
      if(record && record.data) {
        record.data.ricoCharsetBank2 = { version: 1, width: 8, height: 8, tileData: finalBank2 };
        if(typeof liveTileSet.modified === 'function') liveTileSet.modified();
      } else {
        this.setStatus('Could not save CHARSET BANK 2 in the project document.');
        return false;
      }

      if(changedBank1 > 0) {
        liveTileSet.customCharacterset = true;
        if(typeof liveTileSet.setSortMethods === 'function') liveTileSet.setSortMethods();
        manager.tileSetUpdated({ updateBlankCells: false, updateSortMethods: true });
      }

      console.log('[RICO TEST24] Remix committed. BANK1 drafts:', changedBank1, 'BANK2 drafts:', changedBank2);
      this.bank2ExistedOnOpen = true;
      this.snapshotBank1 = cloneTileSnapshot(liveTileSet);
      this.snapshotBank2 = this.cloneSnapshotArray(finalBank2);
      this.clearDraft();
      return true;
    }
  };

  // TEST24 supersedes TEST14 only for the Rico Remix command. All other
  // Editor menu behaviour continues through the already-installed chain.
  Editor.prototype.menuClick = function(menuItem) {
    if(menuItem === 'rico-tileset-remix') {
      if(!this.ricoRemixTileSetDialog24) this.ricoRemixTileSetDialog24 = new RicoRemix24(this);
      this.ricoRemixTileSetDialog24.show();
      return;
    }
    return previousMenuClick.call(this, menuItem);
  };

  window.RICO_TEST24_REMIX_SOURCE_LIBRARY = true;
  console.log('[RICO TEST24] Remix source sidebar loaded: 8x8 + 7x8 -> C64 8x8.');
})();