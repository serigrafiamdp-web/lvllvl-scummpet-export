(function() {
  'use strict';

  if(typeof Editor === 'undefined' || typeof UI === 'undefined') {
    console.error('[RICO TEST11] Editor/UI not found.');
    return;
  }

  var originalBuildInterface = Editor.prototype.buildInterface;
  var originalMenuClick = Editor.prototype.menuClick;

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
      for(var f = 0; f < source.data.length; f++) {
        frames.push(source.data[f].slice(0));
      }

      var props = {};
      for(var key in source.props) {
        if(source.props.hasOwnProperty(key)) {
          props[key] = source.props[key];
        }
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
    this.activeBank = 1;
    this.bank2ExistedOnOpen = false;

    this.entries = [];
    this.entryById = {};
    this.currentEntry = null;
    this.currentCharsetId = null;

    this.sourceImage = null;
    this.sourceCanvas = null;
    this.sourceImageData = null;
    this.sourceAcross = 0;
    this.sourceDown = 0;
    this.sourceTileCount = 0;
    this.imageSerial = 0;

    // Each charset bank has its own independent 0-255 slot space.
    this.draftByBank = { 1: {}, 2: {} };
    this.draftCountByBank = { 1: 0, 2: 0 };

    this.sourceScale = 2;
    this.sourceSpacing = 2;
    this.projectScale = 2;
    this.projectSpacing = 2;
  }

  RicoRemixTileSetDialog.prototype = {
    buildHTML: function() {
      var headerHeight = 96;
      return '' +
        '<div id="ricoRemixRoot" style="position:absolute;left:0;right:0;top:0;bottom:0;background:#090909;color:#ddd;display:flex;flex-direction:column;overflow:hidden;">' +
          '<div style="height:40px;min-height:40px;box-sizing:border-box;padding:10px 12px;border-bottom:1px solid #333;display:flex;align-items:center;gap:20px;">' +
            '<span style="color:#fff;font-weight:bold;">Character Sets</span>' +
            '<span style="color:#999;">Library tile N replaces slot N in the selected CHARSET BANK. BANK 1 and BANK 2 are both visible and stay fixed at 256 slots.</span>' +
          '</div>' +
          '<div style="flex:1;min-height:0;display:flex;">' +
            '<div id="ricoRemixLibraryList" style="width:205px;min-width:205px;overflow:auto;border-right:1px solid #333;padding:8px 0;"></div>' +

            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;border-right:1px solid #333;">' +
              '<div style="height:' + headerHeight + 'px;min-height:' + headerHeight + 'px;box-sizing:border-box;padding:10px 12px 6px 12px;border-bottom:1px solid #222;overflow:hidden;">' +
                '<div id="ricoRemixLibraryHeading" style="font-size:21px;color:#eee;min-height:26px;"></div>' +
                '<div id="ricoRemixLibraryOptions" style="padding-top:6px;min-height:20px;line-height:24px;"></div>' +
              '</div>' +
              '<div id="ricoRemixSourceHolder" style="flex:1;min-height:0;overflow:auto;background:#050505;padding:8px;text-align:center;">' +
                '<canvas id="ricoRemixSourceCanvas" style="display:inline-block;background:#050505;image-rendering:pixelated;cursor:pointer;"></canvas>' +
              '</div>' +
            '</div>' +

            '<div id="ricoRemixBankPanel1" data-rico-bank-panel="1" style="flex:1;min-width:0;display:flex;flex-direction:column;border-right:1px solid #333;">' +
              '<div style="height:' + headerHeight + 'px;min-height:' + headerHeight + 'px;box-sizing:border-box;padding:10px 12px 6px 12px;border-bottom:1px solid #222;overflow:hidden;">' +
                '<button id="ricoRemixBank1" data-rico-bank="1" type="button" style="font-size:18px;padding:5px 10px;border:1px solid #555;background:#222;color:#ddd;cursor:pointer;">CHARSET BANK 1</button>' +
                '<div id="ricoRemixProjectInfo1" style="padding-top:8px;color:#aaa;min-height:20px;"></div>' +
              '</div>' +
              '<div id="ricoRemixProjectHolder1" style="flex:1;min-height:0;overflow:auto;background:#050505;padding:8px;text-align:center;">' +
                '<canvas id="ricoRemixProjectCanvas1" style="display:inline-block;background:#050505;image-rendering:pixelated;"></canvas>' +
              '</div>' +
            '</div>' +

            '<div id="ricoRemixBankPanel2" data-rico-bank-panel="2" style="flex:1;min-width:0;display:flex;flex-direction:column;">' +
              '<div style="height:' + headerHeight + 'px;min-height:' + headerHeight + 'px;box-sizing:border-box;padding:10px 12px 6px 12px;border-bottom:1px solid #222;overflow:hidden;">' +
                '<button id="ricoRemixBank2" data-rico-bank="2" type="button" style="font-size:18px;padding:5px 10px;border:1px solid #555;background:#222;color:#ddd;cursor:pointer;">CHARSET BANK 2</button>' +
                '<div id="ricoRemixProjectInfo2" style="padding-top:8px;color:#aaa;min-height:20px;"></div>' +
              '</div>' +
              '<div id="ricoRemixProjectHolder2" style="flex:1;min-height:0;overflow:auto;background:#050505;padding:8px;text-align:center;">' +
                '<canvas id="ricoRemixProjectCanvas2" style="display:inline-block;background:#050505;image-rendering:pixelated;"></canvas>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="ricoRemixStatus" style="height:36px;min-height:36px;box-sizing:border-box;padding:8px 12px;border-top:1px solid #333;color:#aaa;"></div>' +
        '</div>';
    },

    createUI: function() {
      var self = this;

      this.dialog = UI.create('UI.Dialog', {
        id: 'ricoRemixTileSetDialog',
        title: "Rico's Remix a Tileset",
        width: 1520,
        height: 820
      });

      this.htmlPanel = UI.create('UI.HTMLPanel', {
        id: 'ricoRemixTileSetPanel',
        html: this.buildHTML()
      });
      this.dialog.add(this.htmlPanel);

      this.okButton = UI.create('UI.Button', { text: 'OK', color: 'primary' });
      this.dialog.addButton(this.okButton);
      this.okButton.on('click', function() {
        if(self.commit()) {
          UI.closeDialog();
        }
      });

      this.cancelButton = UI.create('UI.Button', { text: 'Cancel', color: 'secondary' });
      this.dialog.addButton(this.cancelButton);
      this.cancelButton.on('click', function() {
        // TEST10 is draft-only until OK, so Cancel leaves the original tile set untouched.
        self.clearDraft();
        UI.closeDialog();
      });

      this.dialog.on('close', function() {
        self.sourceImage = null;
        self.sourceImageData = null;
      });

      UI.showDialog('ricoRemixTileSetDialog');
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
      this.activeBank = 1;
      this.clearDraft();
      this.collectEntries();

      if(this.dialog === null) {
        this.createUI();
      } else {
        UI.showDialog('ricoRemixTileSetDialog');
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

      // First use: BANK 2 begins as an exact copy of BANK 1. It becomes independent on OK.
      return this.cloneSnapshotArray(this.snapshotBank1);
    },

    setActiveBank: function(bank) {
      bank = parseInt(bank, 10);
      if(bank !== 1 && bank !== 2) return;
      this.activeBank = bank;
      this.renderBankButtons();
      this.renderSource();
      this.renderProject();
      this.setStatus('Editing CHARSET BANK ' + bank + '. Library tile N targets slot N only in this bank.');
    },

    renderBankButtons: function() {
      for(var bank = 1; bank <= 2; bank++) {
        var button = document.getElementById('ricoRemixBank' + bank);
        var panel = document.getElementById('ricoRemixBankPanel' + bank);
        var selected = bank === this.activeBank;
        if(button) {
          button.style.background = selected ? '#315ae6' : '#222';
          button.style.borderColor = selected ? '#6f8cff' : '#555';
          button.style.color = '#fff';
          button.style.fontWeight = selected ? 'bold' : 'normal';
        }
        if(panel) {
          panel.style.boxShadow = selected ? 'inset 0 0 0 2px #315ae6' : 'none';
        }
      }
    },

    collectEntries: function() {
      this.entries = [];
      this.entryById = {};

      if(typeof CharacterSetPresets === 'undefined') {
        return;
      }

      for(var categoryKey in CharacterSetPresets) {
        if(!CharacterSetPresets.hasOwnProperty(categoryKey)) continue;
        var category = CharacterSetPresets[categoryKey];
        var sets = category.characterSets || [];

        for(var i = 0; i < sets.length; i++) {
          var set = sets[i];
          var entry = {
            id: set.id,
            name: set.name || set.id,
            category: category.category || categoryKey,
            width: set.width || 8,
            height: set.height || 8,
            type: typeof set.type === 'undefined' ? 'ascii' : set.type,
            options: set.options || null,
            raw: set
          };
          this.entries.push(entry);
          this.entryById[entry.id] = entry;
        }
      }
    },

    refreshUI: function() {
      if(!document.getElementById('ricoRemixLibraryList')) return;
      this.renderList();
      this.renderBankButtons();
      this.renderProject();

      var firstCompatible = null;
      var preferred = null;
      for(var i = 0; i < this.entries.length; i++) {
        if(this.entries[i].id === 'petscii') preferred = this.entries[i];
        if(!firstCompatible && this.entries[i].width === this.tileWidth && this.entries[i].height === this.tileHeight) {
          firstCompatible = this.entries[i];
        }
      }

      if(preferred && preferred.width === this.tileWidth && preferred.height === this.tileHeight) {
        this.selectEntry(preferred.id);
      } else if(firstCompatible) {
        this.selectEntry(firstCompatible.id);
      } else if(this.entries.length) {
        this.selectEntry(this.entries[0].id);
      }
    },

    initEvents: function() {
      var self = this;
      var list = document.getElementById('ricoRemixLibraryList');
      var sourceCanvas = document.getElementById('ricoRemixSourceCanvas');
      var options = document.getElementById('ricoRemixLibraryOptions');
      var root = document.getElementById('ricoRemixRoot');

      if(list && !list.getAttribute('data-rico-bound')) {
        list.setAttribute('data-rico-bound', '1');
        list.addEventListener('click', function(event) {
          var target = event.target;
          while(target && target !== list && !target.getAttribute('data-rico-entry')) {
            target = target.parentNode;
          }
          if(target && target !== list) {
            self.selectEntry(target.getAttribute('data-rico-entry'));
          }
        });
      }

      if(options && !options.getAttribute('data-rico-bound')) {
        options.setAttribute('data-rico-bound', '1');
        options.addEventListener('change', function(event) {
          var target = event.target;
          if(target && target.getAttribute('data-rico-option')) {
            self.loadCharset(target.getAttribute('data-rico-option'));
          }
        });
      }

      if(sourceCanvas && !sourceCanvas.getAttribute('data-rico-bound')) {
        sourceCanvas.setAttribute('data-rico-bound', '1');
        sourceCanvas.addEventListener('click', function(event) {
          self.sourceCanvasClick(event);
        });
      }


      if(root && !root.getAttribute('data-rico-bank-bound')) {
        root.setAttribute('data-rico-bank-bound', '1');
        root.addEventListener('click', function(event) {
          var target = event.target;
          if(target && target.getAttribute && target.getAttribute('data-rico-bank')) {
            self.setActiveBank(target.getAttribute('data-rico-bank'));
          }
        });
      }
    },

    renderList: function() {
      var list = document.getElementById('ricoRemixLibraryList');
      if(!list) return;

      var html = '';
      var lastCategory = null;
      for(var i = 0; i < this.entries.length; i++) {
        var entry = this.entries[i];
        if(entry.category !== lastCategory) {
          lastCategory = entry.category;
          html += '<div style="padding:8px 12px 4px 12px;color:#fff;font-weight:bold;">' + escapeHTML(lastCategory) + '</div>';
        }

        var compatible = entry.width === this.tileWidth && entry.height === this.tileHeight;
        html += '<div class="ricoRemixEntry" data-rico-entry="' + escapeHTML(entry.id) + '" ' +
          'style="padding:6px 12px 6px 18px;cursor:pointer;' + (compatible ? 'color:#ddd;' : 'color:#666;') + '">' +
          escapeHTML(entry.name) +
        '</div>';
      }
      list.innerHTML = html;
    },

    selectEntry: function(entryId) {
      var entry = this.entryById[entryId];
      if(!entry) return;
      this.currentEntry = entry;

      var nodes = document.querySelectorAll('#ricoRemixLibraryList .ricoRemixEntry');
      for(var i = 0; i < nodes.length; i++) {
        var selected = nodes[i].getAttribute('data-rico-entry') === entryId;
        nodes[i].style.background = selected ? '#315ae6' : 'transparent';
        if(selected) nodes[i].style.color = '#fff';
      }

      var heading = document.getElementById('ricoRemixLibraryHeading');
      if(heading) {
        heading.innerHTML = escapeHTML(entry.name) + ' <span style="font-size:13px;color:#777;">' + entry.width + 'x' + entry.height + '</span>';
      }

      var optionsHolder = document.getElementById('ricoRemixLibraryOptions');
      var effectiveId = entry.id;
      if(optionsHolder) {
        if(entry.options && entry.options.length) {
          var optionHTML = '';
          for(var o = 0; o < entry.options.length; o++) {
            var opt = entry.options[o];
            if(o === 0) effectiveId = opt.id;
            optionHTML += '<label style="display:inline-block;margin-right:12px;white-space:nowrap;">' +
              '<input type="radio" name="ricoRemixCharsetOption" data-rico-option="' + escapeHTML(opt.id) + '" value="' + escapeHTML(opt.id) + '" ' + (o === 0 ? 'checked' : '') + '> ' +
              escapeHTML(opt.name || opt.id) + '</label>';
          }
          optionsHolder.innerHTML = optionHTML;
        } else {
          optionsHolder.innerHTML = '';
        }
      }

      if(entry.width !== this.tileWidth || entry.height !== this.tileHeight) {
        this.setStatus('This library set is ' + entry.width + 'x' + entry.height + '. Current project tiles are ' + this.tileWidth + 'x' + this.tileHeight + '. It can be previewed but not added.');
      } else {
        var activeDrafts = this.draftCountByBank[this.activeBank] || 0;
        this.setStatus('CHARSET BANK ' + this.activeBank + ': ' + activeDrafts + ' remixed slot' + (activeDrafts === 1 ? '' : 's') + '. Each bank stays at 256. Nothing changes until OK.');
      }

      this.loadCharset(effectiveId);
    },

    loadCharset: function(charsetId) {
      if(!this.currentEntry) return;
      this.currentCharsetId = charsetId;
      this.sourceImageData = null;
      this.sourceAcross = 0;
      this.sourceDown = 0;
      this.sourceTileCount = 0;

      var serial = ++this.imageSerial;
      var self = this;
      var img = new Image();
      this.sourceImage = img;

      img.onload = function() {
        if(self.sourceImage !== img || serial !== self.imageSerial) return;
        self.prepareSourceImage(img);
        self.renderSource();
      };

      img.onerror = function() {
        if(self.sourceImage !== img || serial !== self.imageSerial) return;
        self.setStatus('Could not load library set: ' + charsetId);
      };

      img.src = 'charsets/' + charsetId + '.png?ricoRemix=' + serial;
    },

    prepareSourceImage: function(img) {
      if(!this.currentEntry) return;
      if(!this.sourceCanvas) this.sourceCanvas = document.createElement('canvas');
      this.sourceCanvas.width = img.naturalWidth;
      this.sourceCanvas.height = img.naturalHeight;
      var ctx = this.sourceCanvas.getContext('2d');
      ctx.clearRect(0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
      ctx.drawImage(img, 0, 0);
      this.sourceImageData = ctx.getImageData(0, 0, this.sourceCanvas.width, this.sourceCanvas.height);

      this.sourceAcross = Math.floor(img.naturalWidth / this.currentEntry.width);
      this.sourceDown = Math.floor(img.naturalHeight / this.currentEntry.height);
      this.sourceTileCount = this.sourceAcross * this.sourceDown;
    },

    getSourceTileData: function(tileIndex) {
      if(!this.sourceImageData || !this.currentEntry) return null;
      if(tileIndex < 0 || tileIndex >= this.sourceTileCount) return null;

      var width = this.currentEntry.width;
      var height = this.currentEntry.height;
      var col = tileIndex % this.sourceAcross;
      var row = Math.floor(tileIndex / this.sourceAcross);
      var pixels = [];

      for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
          var sx = col * width + x;
          var sy = row * height + y;
          var pos = (sx + sy * this.sourceImageData.width) * 4;
          pixels.push(this.sourceImageData.data[pos] > 100 ? 1 : 0);
        }
      }
      return pixels;
    },

    renderSource: function() {
      var canvas = document.getElementById('ricoRemixSourceCanvas');
      if(!canvas || !this.sourceImageData || !this.currentEntry) return;

      var width = this.currentEntry.width;
      var height = this.currentEntry.height;
      var scale = this.sourceScale;
      var spacing = this.sourceSpacing;
      var cellW = width * scale + spacing;
      var cellH = height * scale + spacing;

      canvas.width = spacing + this.sourceAcross * cellW;
      canvas.height = spacing + this.sourceDown * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var t = 0; t < this.sourceTileCount; t++) {
        var pixels = this.getSourceTileData(t);
        var col = t % this.sourceAcross;
        var row = Math.floor(t / this.sourceAcross);
        var baseX = spacing + col * cellW;
        var baseY = spacing + row * cellH;

        ctx.fillStyle = '#fff';
        for(var y = 0; y < height; y++) {
          for(var x = 0; x < width; x++) {
            if(pixels[x + y * width]) {
              ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);
            }
          }
        }

        var draft = this.draftByBank[this.activeBank][t];
        if(draft && draft.charsetId === this.currentCharsetId && draft.tileIndex === t) {
          ctx.strokeStyle = '#2d80ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, width * scale + 2, height * scale + 2);
        }
      }
    },

    sourceCanvasClick: function(event) {
      if(!this.sourceImageData || !this.currentEntry) return;
      var canvas = document.getElementById('ricoRemixSourceCanvas');
      if(!canvas) return;

      var rect = canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * canvas.width / rect.width;
      var y = (event.clientY - rect.top) * canvas.height / rect.height;
      var width = this.currentEntry.width;
      var height = this.currentEntry.height;
      var scale = this.sourceScale;
      var spacing = this.sourceSpacing;
      var cellW = width * scale + spacing;
      var cellH = height * scale + spacing;

      x -= spacing;
      y -= spacing;
      if(x < 0 || y < 0) return;

      var col = Math.floor(x / cellW);
      var row = Math.floor(y / cellH);
      var localX = x - col * cellW;
      var localY = y - row * cellH;
      if(col < 0 || col >= this.sourceAcross || row < 0 || row >= this.sourceDown) return;
      if(localX >= width * scale || localY >= height * scale) return;

      var tileIndex = row * this.sourceAcross + col;
      this.toggleSourceTile(tileIndex);
    },

    toggleSourceTile: function(tileIndex) {
      if(this.currentEntry.width !== this.tileWidth || this.currentEntry.height !== this.tileHeight) {
        this.setStatus('Cannot use this tile: dimensions do not match the current project tile set.');
        return;
      }

      // RICO TEST11 uses two independent 256-slot charset banks.
      // A source tile always targets the same numeric slot in the active bank.
      if(this.snapshotCount !== 256) {
        this.setStatus('Rico Remix dual-bank mode needs BANK 1 to contain exactly 256 tiles.');
        return;
      }

      if(tileIndex < 0 || tileIndex >= 256) {
        this.setStatus('Only source tiles 0-255 can be used in the 256-slot charset banks.');
        return;
      }

      var bank = this.activeBank;
      var drafts = this.draftByBank[bank];
      var currentDraft = drafts[tileIndex];

      // Clicking the exact same source again restores this bank's pre-dialog slot.
      if(currentDraft &&
         currentDraft.charsetId === this.currentCharsetId &&
         currentDraft.tileIndex === tileIndex) {
        delete drafts[tileIndex];
        this.draftCountByBank[bank]--;
        if(this.draftCountByBank[bank] < 0) this.draftCountByBank[bank] = 0;
        this.setStatus('CHARSET BANK ' + bank + ' / slot ' + tileIndex + ' restored to its pre-dialog state.');
      } else {
        var data = this.getSourceTileData(tileIndex);
        if(!data) return;

        if(!currentDraft) this.draftCountByBank[bank]++;
        drafts[tileIndex] = {
          charsetId: this.currentCharsetId,
          tileIndex: tileIndex,
          data: data.slice(0)
        };
        this.setStatus('CHARSET BANK ' + bank + ' / slot ' + tileIndex + ' now uses ' + this.currentCharsetId + '. Click the same source again to restore it.');
      }

      this.renderSource();
      this.renderProject();
    },

    renderProjectBank: function(bank) {
      var canvas = document.getElementById('ricoRemixProjectCanvas' + bank);
      var info = document.getElementById('ricoRemixProjectInfo' + bank);
      if(!canvas || !this.currentTileSet) return;

      var width = this.tileWidth;
      var height = this.tileHeight;
      var scale = this.projectScale;
      var spacing = this.projectSpacing;
      var across = 16;
      var count = this.snapshotCount;
      var down = Math.max(1, Math.ceil(count / across));
      var cellW = width * scale + spacing;
      var cellH = height * scale + spacing;
      var snapshot = bank === 1 ? this.snapshotBank1 : this.snapshotBank2;
      var drafts = this.draftByBank[bank];

      // Source and both destination banks intentionally share the same
      // 16-column geometry and the same top/header height. Slot N therefore
      // sits at the same vertical height in all three grids.
      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var t = 0; t < count; t++) {
        var draft = drafts[t];
        var pixels = null;
        if(draft) pixels = draft.data;
        else if(snapshot[t] && snapshot[t].data.length) pixels = snapshot[t].data[0];
        if(!pixels) continue;

        var col = t % across;
        var row = Math.floor(t / across);
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

      if(info) {
        var countDraft = this.draftCountByBank[bank] || 0;
        if(bank === 1) {
          info.innerHTML = 'Native project charset · 256 slots · <b>' + countDraft + '</b> remixed';
        } else {
          var bank2State = this.bank2ExistedOnOpen ? 'saved independent bank' : 'starts as a copy of BANK 1';
          info.innerHTML = '256 slots · <b>' + countDraft + '</b> remixed · ' + bank2State;
        }
      }
    },

    renderProject: function() {
      this.renderProjectBank(1);
      this.renderProjectBank(2);
      this.renderBankButtons();
    },

    setStatus: function(message) {
      var status = document.getElementById('ricoRemixStatus');
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

      if(liveTileSet.getTileCount() !== this.snapshotCount) {
        this.setStatus('The tile set changed while Rico Remix was open. Close and reopen the dialog.');
        return false;
      }

      if(this.snapshotCount !== 256) {
        this.setStatus('Rico Remix dual-bank mode needs the current project tile set to contain exactly 256 tiles.');
        return false;
      }

      var changedBank1 = this.draftCountByBank[1] || 0;
      var changedBank2 = this.draftCountByBank[2] || 0;

      // BANK 1 is the native LVLLVL tile set.
      for(var slotKey1 in this.draftByBank[1]) {
        if(!this.draftByBank[1].hasOwnProperty(slotKey1)) continue;
        var slot1 = parseInt(slotKey1, 10);
        var draft1 = this.draftByBank[1][slotKey1];
        if(slot1 >= 0 && slot1 < 256 && draft1) liveTileSet.setTileData(slot1, draft1.data);
      }

      // BANK 2 is persisted beside the native tile set as a full independent
      // 256-tile snapshot. This is intentionally separate from VIC-bank terminology.
      var finalBank2 = this.cloneSnapshotArray(this.snapshotBank2);
      for(var slotKey2 in this.draftByBank[2]) {
        if(!this.draftByBank[2].hasOwnProperty(slotKey2)) continue;
        var slot2 = parseInt(slotKey2, 10);
        var draft2 = this.draftByBank[2][slotKey2];
        if(slot2 >= 0 && slot2 < 256 && draft2 && finalBank2[slot2]) {
          finalBank2[slot2].data[0] = draft2.data.slice(0);
        }
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

      console.log('[RICO TEST11] Dual charset banks committed. BANK1 drafts:', changedBank1, 'BANK2 drafts:', changedBank2);
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

    var item = menu.addItem({
      label: "Rico's Remix a Tileset...",
      id: 'rico-tileset-remix'
    });

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
    if(targetEl && itemEl && targetEl.parentNode === itemEl.parentNode) {
      targetEl.parentNode.insertBefore(itemEl, targetEl.nextSibling);
    }

    console.log('[RICO TEST11] Remix Tile Set menu installed.');
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
        if(installRemixMenu(editor) || tries >= 20) {
          clearInterval(timer);
        }
      }, 50);
    });

    return result;
  };

  Editor.prototype.menuClick = function(menuItem) {
    if(menuItem === 'rico-tileset-remix') {
      if(!this.ricoRemixTileSetDialog11) {
        this.ricoRemixTileSetDialog11 = new RicoRemixTileSetDialog(this);
      }
      this.ricoRemixTileSetDialog11.show();
      return;
    }

    return originalMenuClick.call(this, menuItem);
  };

  window.RICO_TEST11_REMIX_TILESET = true;
  console.log('[RICO TEST11] Remix Tile Set add/toggle hook loaded.');
})();
