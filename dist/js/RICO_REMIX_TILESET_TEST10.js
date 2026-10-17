(function() {
  'use strict';

  if(typeof Editor === 'undefined' || typeof UI === 'undefined') {
    console.error('[RICO TEST10] Editor/UI not found.');
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
    this.snapshot = [];
    this.snapshotCount = 0;
    this.tileWidth = 8;
    this.tileHeight = 8;

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

    // Draft replacements are indexed by destination slot.
    // The project keeps exactly its original 256 slots.
    this.draftBySlot = {};
    this.draftCount = 0;

    this.sourceScale = 2;
    this.sourceSpacing = 2;
    this.projectScale = 2;
    this.projectSpacing = 2;
  }

  RicoRemixTileSetDialog.prototype = {
    buildHTML: function() {
      return '' +
        '<div id="ricoRemixRoot" style="position:absolute;left:0;right:0;top:0;bottom:0;background:#090909;color:#ddd;display:flex;flex-direction:column;overflow:hidden;">' +
          '<div style="height:40px;box-sizing:border-box;padding:10px 12px;border-bottom:1px solid #333;display:flex;align-items:center;gap:20px;">' +
            '<span style="color:#fff;font-weight:bold;">Character Sets</span>' +
            '<span style="color:#999;">Click a library tile to replace the same slot in the 256-tile project set. Click it again to restore the original slot.</span>' +
          '</div>' +
          '<div style="flex:1;min-height:0;display:flex;">' +
            '<div id="ricoRemixLibraryList" style="width:205px;min-width:205px;overflow:auto;border-right:1px solid #333;padding:8px 0;"></div>' +
            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;border-right:1px solid #333;">' +
              '<div style="padding:10px 12px 6px 12px;border-bottom:1px solid #222;">' +
                '<div id="ricoRemixLibraryHeading" style="font-size:21px;color:#eee;min-height:26px;"></div>' +
                '<div id="ricoRemixLibraryOptions" style="padding-top:6px;min-height:20px;"></div>' +
              '</div>' +
              '<div id="ricoRemixSourceHolder" style="flex:1;min-height:0;overflow:auto;background:#050505;padding:8px;text-align:center;">' +
                '<canvas id="ricoRemixSourceCanvas" style="display:inline-block;background:#050505;image-rendering:pixelated;cursor:pointer;"></canvas>' +
              '</div>' +
            '</div>' +
            '<div style="flex:1;min-width:0;display:flex;flex-direction:column;">' +
              '<div style="padding:10px 12px 6px 12px;border-bottom:1px solid #222;">' +
                '<div style="font-size:21px;color:#eee;">Current Project Tile Set</div>' +
                '<div id="ricoRemixProjectInfo" style="padding-top:6px;color:#aaa;min-height:20px;"></div>' +
              '</div>' +
              '<div id="ricoRemixProjectHolder" style="flex:1;min-height:0;overflow:auto;background:#050505;padding:8px;text-align:center;">' +
                '<canvas id="ricoRemixProjectCanvas" style="display:inline-block;background:#050505;image-rendering:pixelated;"></canvas>' +
              '</div>' +
              '<div id="ricoRemixStatus" style="min-height:34px;box-sizing:border-box;padding:8px 12px;border-top:1px solid #222;color:#aaa;"></div>' +
            '</div>' +
          '</div>' +
        '</div>';
    },

    createUI: function() {
      var self = this;

      this.dialog = UI.create('UI.Dialog', {
        id: 'ricoRemixTileSetDialog',
        title: "Rico's Remix a Tileset",
        width: 1180,
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
      this.snapshot = cloneTileSnapshot(tileSet);
      this.snapshotCount = tileSet.getTileCount();
      this.tileWidth = tileSet.getTileWidth();
      this.tileHeight = tileSet.getTileHeight();
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
      this.draftBySlot = {};
      this.draftCount = 0;
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
        this.setStatus('Draft: ' + this.draftCount + ' slot' + (this.draftCount === 1 ? '' : 's') + ' remixed. Tile count stays at 256. Nothing changes in the project until OK.');
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

        var draft = this.draftBySlot[t];
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

      // RICO TEST10 is deliberately a C64-style 256-slot remix.
      // A source tile always targets the same numeric slot in the project.
      if(this.snapshotCount !== 256) {
        this.setStatus('Rico Remix 256 needs the current project tile set to contain exactly 256 tiles.');
        return;
      }

      if(tileIndex < 0 || tileIndex >= 256) {
        this.setStatus('Only source tiles 0-255 can be used in this 256-slot remix.');
        return;
      }

      var currentDraft = this.draftBySlot[tileIndex];

      // Clicking the exact same source again restores the snapshot slot.
      if(currentDraft &&
         currentDraft.charsetId === this.currentCharsetId &&
         currentDraft.tileIndex === tileIndex) {
        delete this.draftBySlot[tileIndex];
        this.draftCount--;
        if(this.draftCount < 0) this.draftCount = 0;
        this.setStatus('Slot ' + tileIndex + ' restored to the state it had before opening Rico Remix.');
      } else {
        var data = this.getSourceTileData(tileIndex);
        if(!data) return;

        // Another variant can replace the draft already occupying this slot.
        if(!currentDraft) this.draftCount++;
        this.draftBySlot[tileIndex] = {
          charsetId: this.currentCharsetId,
          tileIndex: tileIndex,
          data: data.slice(0)
        };
        this.setStatus('Slot ' + tileIndex + ' now uses ' + this.currentCharsetId + '. Project remains 256 tiles. Click the same source tile again to restore it.');
      }

      this.renderSource();
      this.renderProject();
    },

    renderProject: function() {
      var canvas = document.getElementById('ricoRemixProjectCanvas');
      var info = document.getElementById('ricoRemixProjectInfo');
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

      canvas.width = spacing + across * cellW;
      canvas.height = spacing + down * cellH;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(var t = 0; t < count; t++) {
        var draft = this.draftBySlot[t];
        var pixels = null;
        if(draft) {
          pixels = draft.data;
        } else if(this.snapshot[t] && this.snapshot[t].data.length) {
          pixels = this.snapshot[t].data[0];
        }
        if(!pixels) continue;

        var col = t % across;
        var row = Math.floor(t / across);
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

        if(draft) {
          ctx.strokeStyle = '#2d80ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(baseX - 1, baseY - 1, width * scale + 2, height * scale + 2);
        }
      }

      if(info) {
        var name = '';
        try { name = this.currentTileSet.getName(); } catch(e) { name = 'Current Tile Set'; }
        info.innerHTML = escapeHTML(name) + ': <b>' + count + '</b> tiles fixed · ' + this.draftCount + ' slot' + (this.draftCount === 1 ? '' : 's') + ' remixed';
      }
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
        this.setStatus('Rico Remix 256 needs the current project tile set to contain exactly 256 tiles.');
        return false;
      }

      if(this.draftCount === 0) {
        return true;
      }

      for(var slotKey in this.draftBySlot) {
        if(!this.draftBySlot.hasOwnProperty(slotKey)) continue;
        var slot = parseInt(slotKey, 10);
        var draft = this.draftBySlot[slotKey];
        if(slot >= 0 && slot < 256 && draft) {
          liveTileSet.setTileData(slot, draft.data);
        }
      }

      liveTileSet.customCharacterset = true;
      if(typeof liveTileSet.setSortMethods === 'function') {
        liveTileSet.setSortMethods();
      }
      manager.tileSetUpdated({ updateBlankCells: false, updateSortMethods: true });

      console.log('[RICO TEST10] Remix committed:', this.draftCount, 'slot(s), tile count remains 256.');
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

    console.log('[RICO TEST10] Remix Tile Set menu installed.');
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
      if(!this.ricoRemixTileSetDialog10) {
        this.ricoRemixTileSetDialog10 = new RicoRemixTileSetDialog(this);
      }
      this.ricoRemixTileSetDialog10.show();
      return;
    }

    return originalMenuClick.call(this, menuItem);
  };

  window.RICO_TEST10_REMIX_TILESET = true;
  console.log('[RICO TEST10] Remix Tile Set add/toggle hook loaded.');
})();
