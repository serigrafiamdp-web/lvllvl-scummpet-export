(function() {
  'use strict';

  if(typeof Editor === 'undefined' || typeof UI === 'undefined') {
    console.error('[RICO TEST14] Editor/UI not found.');
    return;
  }

  var originalBuildInterface = Editor.prototype.buildInterface;
  var originalMenuClick = Editor.prototype.menuClick;

  var FAMILY_DEFS = [
    {
      id: 'c64',
      name: 'C64',
      bank1: { id: 'petscii', name: 'C64' },
      bank2: { id: 'petscii_shifted', name: 'C64 Shifted' }
    },
    {
      id: 'c64_swedish',
      name: 'C64 SWEDISH',
      bank1: { id: 'c64_swedish', name: 'C64 Swedish' },
      bank2: { id: 'c64_swedish_shifted', name: 'C64 Swedish Shifted' }
    },
    {
      id: 'c64_japanese',
      name: 'C64 JAPANESE',
      bank1: { id: 'c64_japanese', name: 'C64 Japanese' },
      bank2: { id: 'c64_shifted_japanese', name: 'C64 Japanese Shifted' }
    }
  ];

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
      for(var key in source.props) {
        if(source.props.hasOwnProperty(key)) props[key] = source.props[key];
      }

      snapshot.push({ data: frames, props: props });
    }

    return snapshot;
  }

  function RicoRemixTileSetDialog(editor) {
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

    this.currentFamilyId = 'c64';
    this.sourceBanks = {
      1: { charsetId: null, imageData: null, across: 0, down: 0, count: 0, serial: 0 },
      2: { charsetId: null, imageData: null, across: 0, down: 0, count: 0, serial: 0 }
    };

    this.draftByBank = { 1: {}, 2: {} };
    this.draftCountByBank = { 1: 0, 2: 0 };

    this.scale = 2;
    this.spacing = 2;
    this.across = 16;
    this.syncingScroll = false;
  }

  RicoRemixTileSetDialog.prototype = {
    buildHTML: function() {
      return '' +
        '<div id="ricoRemix14Root" style="position:absolute;left:0;right:0;top:0;bottom:0;background:#050505;color:#ddd;display:flex;flex-direction:column;overflow:hidden;">' +
          '<div style="flex:1;min-height:0;display:flex;background:#050505;">' +

            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;background:#050505;">' +
              '<div style="height:38px;min-height:38px;box-sizing:border-box;padding:3px 8px;display:flex;align-items:center;gap:10px;background:#050505;">' +
                '<div style="font-size:17px;color:#fff;font-weight:bold;white-space:nowrap;">C64 SOURCE · 512</div>' +
                '<div id="ricoRemix14FamilyButtons" style="display:flex;gap:6px;flex-wrap:nowrap;"></div>' +
              '</div>' +
              '<div id="ricoRemix14SourceArea" style="flex:1;min-height:0;overflow:hidden;background:#050505;padding:0 8px 2px 8px;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-start;">' +
                '<canvas id="ricoRemix14SourceCanvas" style="display:block;background:#050505;image-rendering:pixelated;cursor:pointer;"></canvas>' +
              '</div>' +
            '</div>' +

            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;background:#050505;">' +
              '<div style="height:38px;min-height:38px;box-sizing:border-box;padding:3px 8px;display:flex;align-items:center;gap:10px;background:#050505;">' +
                '<div style="font-size:17px;color:#fff;font-weight:bold;white-space:nowrap;">CUSTOM TILESET · 512</div>' +
                '<div id="ricoRemix14CustomInfo" style="color:#999;white-space:nowrap;"></div>' +
              '</div>' +
              '<div id="ricoRemix14CustomArea" style="flex:1;min-height:0;overflow:hidden;background:#050505;padding:0 8px 2px 8px;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-start;">' +
                '<canvas id="ricoRemix14ProjectCanvas" style="display:block;background:#050505;image-rendering:pixelated;"></canvas>' +
              '</div>' +
            '</div>' +

          '</div>' +
          '<div id="ricoRemix14Status" style="height:22px;min-height:22px;box-sizing:border-box;padding:3px 8px;color:#888;background:#050505;"></div>' +
          '<style>' +
            '#ricoRemix14Root .rico14FamilyButton{padding:4px 10px;border:1px solid #555;background:#222;color:#ddd;cursor:pointer;font-size:12px;line-height:16px;white-space:nowrap;}' +
            '#ricoRemix14Root .rico14FamilyButton.selected{background:#315ae6;border-color:#6f8cff;color:#fff;font-weight:bold;}' +
          '</style>' +
        '</div>';
    },

    createUI: function() {
      var self = this;

      this.dialog = UI.create('UI.Dialog', {
        id: 'ricoRemixTileSetDialog14',
        title: "Rico's Remix a Tileset",
        width: 1180,
        height: 800
      });

      this.htmlPanel = UI.create('UI.HTMLPanel', {
        id: 'ricoRemixTileSetPanel14',
        html: this.buildHTML()
      });
      this.dialog.add(this.htmlPanel);

      this.okButton = UI.create('UI.Button', { text: 'OK', color: 'primary' });
      this.dialog.addButton(this.okButton);
      this.okButton.on('click', function() {
        if(self.commit()) UI.closeDialog();
      });

      this.cancelButton = UI.create('UI.Button', { text: 'Cancel', color: 'secondary' });
      this.dialog.addButton(this.cancelButton);
      this.cancelButton.on('click', function() {
        self.clearDraft();
        UI.closeDialog();
      });

      this.dialog.on('close', function() {
        self.sourceBanks[1].imageData = null;
        self.sourceBanks[2].imageData = null;
      });

      UI.showDialog('ricoRemixTileSetDialog14');
      setTimeout(function() {
        self.initEvents();
        self.refreshUI();
      }, 0);
    },

    show: function() {
      var tileSetManager = this.editor.textModeEditor.tileSetManager;
      var tileSet = tileSetManager.getCurrentTileSet();

      if(!tileSet) {
        alert('Rico Remix needs an active tile set.');
        return;
      }

      this.currentTileSet = tileSet;
      this.currentTileSetId = tileSet.getId();
      this.snapshotBank1 = cloneTileSnapshot(tileSet);
      this.snapshotCount = tileSet.getTileCount();
      this.tileWidth = tileSet.getTileWidth();
      this.tileHeight = tileSet.getTileHeight();
      this.snapshotBank2 = this.loadBank2Snapshot(tileSet);
      this.currentFamilyId = 'c64';
      this.clearDraft();

      if(this.dialog === null) {
        this.createUI();
      } else {
        UI.showDialog('ricoRemixTileSetDialog14');
        this.refreshUI();
      }
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

    getFamily: function() {
      for(var i = 0; i < FAMILY_DEFS.length; i++) {
        if(FAMILY_DEFS[i].id === this.currentFamilyId) return FAMILY_DEFS[i];
      }
      return FAMILY_DEFS[0];
    },

    refreshUI: function() {
      if(!document.getElementById('ricoRemix14Root')) return;
      this.renderFamilyButtons();
      this.renderProject();
      this.selectFamily(this.currentFamilyId || 'c64');
    },

    initEvents: function() {
      var self = this;
      var root = document.getElementById('ricoRemix14Root');
      var canvas = document.getElementById('ricoRemix14SourceCanvas');

      if(root && !root.getAttribute('data-rico14-bound')) {
        root.setAttribute('data-rico14-bound', '1');
        root.addEventListener('click', function(event) {
          var target = event.target;
          if(target && target.getAttribute && target.getAttribute('data-rico-family')) {
            self.selectFamily(target.getAttribute('data-rico-family'));
          }
        });
      }

      if(canvas && !canvas.getAttribute('data-rico14-bound')) {
        canvas.setAttribute('data-rico14-bound', '1');
        canvas.addEventListener('click', function(event) {
          self.sourceCanvasClick(event);
        });
      }
    },

    renderFamilyButtons: function() {
      var holder = document.getElementById('ricoRemix14FamilyButtons');
      if(!holder) return;
      var html = '';
      for(var i = 0; i < FAMILY_DEFS.length; i++) {
        var family = FAMILY_DEFS[i];
        html += '<button type="button" class="rico14FamilyButton' + (family.id === this.currentFamilyId ? ' selected' : '') + '" data-rico-family="' + escapeHTML(family.id) + '">' + escapeHTML(family.name) + '</button>';
      }
      holder.innerHTML = html;
    },

    selectFamily: function(familyId) {
      var found = false;
      for(var i = 0; i < FAMILY_DEFS.length; i++) if(FAMILY_DEFS[i].id === familyId) found = true;
      if(!found) familyId = 'c64';

      this.currentFamilyId = familyId;
      this.renderFamilyButtons();

      var family = this.getFamily();
      this.loadSourceBank(1, family.bank1.id);
      this.loadSourceBank(2, family.bank2.id);
      this.setStatus(family.name + ': 512 continuous source glyphs. Click one to replace the same position on the right.');
    },

    loadSourceBank: function(bank, charsetId) {
      var state = this.sourceBanks[bank];
      state.charsetId = charsetId;
      state.imageData = null;
      state.across = 0;
      state.down = 0;
      state.count = 0;
      var serial = ++state.serial;
      var self = this;
      var img = new Image();

      img.onload = function() {
        if(serial !== state.serial || state.charsetId !== charsetId) return;
        var temp = document.createElement('canvas');
        temp.width = img.naturalWidth;
        temp.height = img.naturalHeight;
        var ctx = temp.getContext('2d');
        ctx.clearRect(0, 0, temp.width, temp.height);
        ctx.drawImage(img, 0, 0);
        state.imageData = ctx.getImageData(0, 0, temp.width, temp.height);
        state.across = Math.floor(img.naturalWidth / 8);
        state.down = Math.floor(img.naturalHeight / 8);
        state.count = state.across * state.down;
        self.renderSource();
      };

      img.onerror = function() {
        if(serial !== state.serial) return;
        self.setStatus('Could not load source charset: ' + charsetId);
      };

      img.src = 'charsets/' + charsetId + '.png?ricoRemix14=' + serial;
    },

    getSourceTileData: function(bank, tileIndex) {
      var state = this.sourceBanks[bank];
      if(!state || !state.imageData || tileIndex < 0 || tileIndex >= state.count) return null;
      var col = tileIndex % state.across;
      var row = Math.floor(tileIndex / state.across);
      var pixels = [];

      for(var y = 0; y < 8; y++) {
        for(var x = 0; x < 8; x++) {
          var sx = col * 8 + x;
          var sy = row * 8 + y;
          var pos = (sx + sy * state.imageData.width) * 4;
          pixels.push(state.imageData.data[pos] > 100 ? 1 : 0);
        }
      }
      return pixels;
    },

    renderSource: function() {
      var canvas = document.getElementById('ricoRemix14SourceCanvas');
      if(!canvas) return;

      var width = this.tileWidth;
      var height = this.tileHeight;
      var scale = this.scale;
      var spacing = this.spacing;
      var across = this.across;
      var count = 512;
      var down = 32;
      var cellW = width * scale + spacing;
      var cellH = height * scale + spacing;

      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        for(var y = 0; y < height; y++) {
          for(var x = 0; x < width; x++) {
            if(pixels[x + y * width]) ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);
          }
        }

        var draft = this.draftByBank[bank][tileIndex];
        if(draft && draft.charsetId === state.charsetId && draft.tileIndex === tileIndex) {
          ctx.strokeStyle = '#2d80ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, width * scale + 2, height * scale + 2);
        }
      }
    },

    sourceCanvasClick: function(event) {
      var canvas = document.getElementById('ricoRemix14SourceCanvas');
      if(!canvas) return;

      var rect = canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * canvas.width / rect.width;
      var y = (event.clientY - rect.top) * canvas.height / rect.height;
      var scale = this.scale;
      var spacing = this.spacing;
      var cellW = this.tileWidth * scale + spacing;
      var cellH = this.tileHeight * scale + spacing;

      x -= spacing;
      y -= spacing;
      if(x < 0 || y < 0) return;
      var col = Math.floor(x / cellW);
      var row = Math.floor(y / cellH);
      var localX = x - col * cellW;
      var localY = y - row * cellH;
      if(col < 0 || col >= 16 || row < 0 || row >= 32) return;
      if(localX >= this.tileWidth * scale || localY >= this.tileHeight * scale) return;

      var combined = row * 16 + col;
      if(combined < 0 || combined >= 512) return;
      var bank = combined < 256 ? 1 : 2;
      var tileIndex = combined & 255;
      var state = this.sourceBanks[bank];
      if(!state || !state.imageData || tileIndex >= state.count) return;
      this.toggleSourceTile(bank, tileIndex);
    },

    toggleSourceTile: function(bank, tileIndex) {
      if(this.tileWidth !== 8 || this.tileHeight !== 8) {
        this.setStatus('Rico Remix C64 source mode requires an 8x8 project tile set.');
        return;
      }
      if(this.snapshotCount !== 256) {
        this.setStatus('Rico Remix dual-bank mode requires CHARSET BANK 1 to contain exactly 256 tiles.');
        return;
      }

      var state = this.sourceBanks[bank];
      var drafts = this.draftByBank[bank];
      var currentDraft = drafts[tileIndex];

      if(currentDraft && currentDraft.charsetId === state.charsetId && currentDraft.tileIndex === tileIndex) {
        delete drafts[tileIndex];
        this.draftCountByBank[bank]--;
        if(this.draftCountByBank[bank] < 0) this.draftCountByBank[bank] = 0;
        this.setStatus('CHARSET BANK ' + bank + ' / slot ' + tileIndex + ' restored to its pre-dialog state.');
      } else {
        var data = this.getSourceTileData(bank, tileIndex);
        if(!data) return;
        if(!currentDraft) this.draftCountByBank[bank]++;
        drafts[tileIndex] = {
          charsetId: state.charsetId,
          tileIndex: tileIndex,
          data: data.slice(0)
        };
        var combined = bank === 1 ? tileIndex : 256 + tileIndex;
        this.setStatus('Source position ' + combined + ' -> CUSTOM position ' + combined + ' (CHARSET BANK ' + bank + ', slot ' + tileIndex + ').');
      }

      this.renderSource();
      this.renderProject();
      this.renderCustomInfo();
    },

    renderProject: function() {
      var canvas = document.getElementById('ricoRemix14ProjectCanvas');
      if(!canvas || !this.currentTileSet) return;

      var width = this.tileWidth;
      var height = this.tileHeight;
      var scale = this.scale;
      var spacing = this.spacing;
      var across = this.across;
      var count = 512;
      var down = 32;
      var cellW = width * scale + spacing;
      var cellH = height * scale + spacing;

      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var combined = 0; combined < count; combined++) {
        var bank = combined < 256 ? 1 : 2;
        var tileIndex = combined & 255;
        var snapshot = bank === 1 ? this.snapshotBank1 : this.snapshotBank2;
        var draft = this.draftByBank[bank][tileIndex];
        var pixels = null;
        if(draft) pixels = draft.data;
        else if(snapshot[tileIndex] && snapshot[tileIndex].data.length) pixels = snapshot[tileIndex].data[0];
        if(!pixels) continue;

        var col = combined % across;
        var row = Math.floor(combined / across);
        var baseX = spacing + col * cellW;
        var baseY = spacing + row * cellH;

        ctx.fillStyle = '#fff';
        for(var y = 0; y < height; y++) {
          for(var x = 0; x < width; x++) {
            if(pixels[x + y * width]) ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);
          }
        }

        if(draft) {
          ctx.strokeStyle = '#2d80ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, width * scale + 2, height * scale + 2);
        }
      }

      this.renderCustomInfo();
    },

    renderCustomInfo: function() {
      var info = document.getElementById('ricoRemix14CustomInfo');
      if(!info) return;
      var b1 = this.draftCountByBank[1] || 0;
      var b2 = this.draftCountByBank[2] || 0;
      info.innerHTML = '<b>' + (b1 + b2) + '</b> modified slots';
    },

    setStatus: function(message) {
      var status = document.getElementById('ricoRemix14Status');
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
        record.data.ricoCharsetBank2 = {
          version: 1,
          width: this.tileWidth,
          height: this.tileHeight,
          tileData: finalBank2
        };
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

      console.log('[RICO TEST14] continuous-512 Remix committed. BANK1 drafts:', changedBank1, 'BANK2 drafts:', changedBank2);
      this.bank2ExistedOnOpen = true;
      this.snapshotBank1 = cloneTileSnapshot(liveTileSet);
      this.snapshotBank2 = this.cloneSnapshotArray(finalBank2);
      this.clearDraft();
      return true;
    }
  };

  function installRemixMenu(editor) {
    if(!editor || !editor.tileSetMenu) return false;

    var menu = editor.tileSetMenu;
    var existing = menu.getItem ? menu.getItem('rico-tileset-remix') : null;
    if(existing) return true;

    var target = menu.getItem ? menu.getItem('charactersets-preset') : null;
    if(!target) return false;

    var item = menu.addItem({ label: "Rico's Remix a Tileset...", id: 'rico-tileset-remix' });

    var items = menu.getItems ? menu.getItems() : menu.menuItems;
    if(items) {
      var newIndex = items.indexOf(item);
      var targetIndex = items.indexOf(target);
      if(newIndex >= 0 && targetIndex >= 0 && newIndex !== targetIndex + 1) {
        items.splice(newIndex, 1);
        targetIndex = items.indexOf(target);
        items.splice(targetIndex + 1, 0, item);
      }
    }

    var targetEl = document.getElementById(target.id);
    var itemEl = document.getElementById(item.id);
    if(targetEl && itemEl && targetEl.parentNode === itemEl.parentNode) targetEl.parentNode.insertBefore(itemEl, targetEl.nextSibling);

    console.log('[RICO TEST14] Remix Tile Set menu installed.');
    return true;
  }

  Editor.prototype.buildInterface = function() {
    var editor = this;
    var result = originalBuildInterface.apply(this, arguments);

    UI.on('ready', function() {
      if(installRemixMenu(editor)) return;
      var tries = 0;
      var timer = setInterval(function() {
        tries++;
        if(installRemixMenu(editor) || tries >= 20) clearInterval(timer);
      }, 50);
    });

    return result;
  };

  Editor.prototype.menuClick = function(menuItem) {
    if(menuItem === 'rico-tileset-remix') {
      if(!this.ricoRemixTileSetDialog14) this.ricoRemixTileSetDialog14 = new RicoRemixTileSetDialog(this);
      this.ricoRemixTileSetDialog14.show();
      return;
    }

    return originalMenuClick.call(this, menuItem);
  };

  window.RICO_TEST13_REMIX_TILESET = true;
  console.log('[RICO TEST14] continuous-512 Remix hook loaded.');
})();