(function() {
  'use strict';

  if(typeof UI === 'undefined') {
    console.error('[RICO TEST28] UI not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;
  var TILE_W = 8;
  var TILE_H = 8;

  function getEditor() {
    try { return g_app && g_app.textModeEditor ? g_app.textModeEditor : null; } catch(e) { return null; }
  }

  function getTileSet(editor) {
    try {
      return editor && editor.tileSetManager && editor.tileSetManager.getCurrentTileSet
        ? editor.tileSetManager.getCurrentTileSet() : null;
    } catch(e) { return null; }
  }

  function getActiveBank(editor) {
    try {
      var graphic = editor && editor.graphic;
      if(!graphic || !graphic.frames || !graphic.frames.length) return 1;
      var frame = graphic.getCurrentFrame();
      if(frame < 0 || frame >= graphic.frames.length) return 1;
      return parseInt(graphic.frames[frame][FRAME_BANK_FIELD], 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function getBank2Record(tileSet) {
    var record = null;
    try { record = tileSet && tileSet.getDocRecord ? tileSet.getDocRecord() : null; } catch(e) {}
    var stored = record && record.data ? record.data[BANK2_FIELD] : null;
    if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) return stored;
    return null;
  }

  function normalizeGrid(grid) {
    if(!grid || !grid.length) return [];
    var out = [];
    for(var y = 0; y < grid.length; y++) {
      out[y] = [];
      var row = grid[y] || [];
      for(var x = 0; x < row.length; x++) {
        var value = row[x];
        if(value === false || value === null || typeof value === 'undefined') {
          out[y][x] = false;
          continue;
        }
        var n = parseInt(value, 10);
        if(isNaN(n) || n < 0) out[y][x] = false;
        else out[y][x] = ((n % BANK_SIZE) + BANK_SIZE) % BANK_SIZE;
      }
    }
    return out;
  }

  function captureSelectedGrid(editor) {
    var grid = null;
    try {
      if(editor && editor.currentTile && typeof editor.currentTile.getCharacters === 'function') {
        grid = editor.currentTile.getCharacters();
      }
    } catch(e) {}

    if(!grid || !grid.length || !grid[0] || !grid[0].length) {
      try {
        var d = editor && editor.sideTilePalette && editor.sideTilePalette.tilePaletteDisplay;
        if(d && typeof d.getSelectedCharactersGrid === 'function') grid = d.getSelectedCharactersGrid();
      } catch(e2) {}
    }

    return normalizeGrid(grid);
  }

  function countChars(grid) {
    var seen = {};
    var count = 0;
    for(var y = 0; y < grid.length; y++) {
      for(var x = 0; x < grid[y].length; x++) {
        var ch = grid[y][x];
        if(ch === false) continue;
        if(!seen[ch]) {
          seen[ch] = true;
          count++;
        }
      }
    }
    return count;
  }

  function EditGroupCharsDialog(editor) {
    this.editor = editor;
    this.dialog = null;
    this.panel = null;
    this.canvas = null;
    this.ctx = null;
    this.selectionGrid = [];
    this.bank = 1;
    this.tileSet = null;
    this.scale = 6;
    this.minScale = 2;
    this.maxScale = 18;
    this.tool = 'pencil';
    this.mouseDown = false;
    this.paintValue = 1;
    this.lastPixel = null;
    this.selectStart = null;
    this.selection = null;
    this.clipboard = null;
    this.dirtyChars = {};
    this.bound = false;
  }

  EditGroupCharsDialog.prototype = {
    html: function() {
      return '' +
        '<div id="rico28Root" tabindex="0" style="position:absolute;left:0;right:0;top:0;bottom:0;background:#111;color:#ddd;display:flex;flex-direction:column;outline:none;">' +
          '<div style="height:38px;min-height:38px;background:#202020;display:flex;align-items:center;padding:0 8px;gap:6px;border-bottom:1px solid #333;">' +
            '<button class="ui-button rico28Tool" id="rico28Pencil" title="Pencil (N)">Pencil <b>N</b></button>' +
            '<button class="ui-button rico28Tool" id="rico28Select" title="Select (S)">Select <b>S</b></button>' +
            '<span style="width:1px;height:22px;background:#444;margin:0 3px;"></span>' +
            '<button class="ui-button" id="rico28Cut" title="Cut (Ctrl+X)">Cut</button>' +
            '<button class="ui-button" id="rico28Copy" title="Copy (Ctrl+C)">Copy</button>' +
            '<button class="ui-button" id="rico28Paste" title="Paste (Ctrl+V)">Paste</button>' +
            '<span style="width:1px;height:22px;background:#444;margin:0 3px;"></span>' +
            '<button class="ui-button" id="rico28ZoomOut" title="Zoom Out (Shift+Z / Ctrl+-)">−</button>' +
            '<span id="rico28ZoomLabel" style="min-width:52px;text-align:center;color:#bbb;">600%</span>' +
            '<button class="ui-button" id="rico28ZoomIn" title="Zoom In (Z / Ctrl++)">+</button>' +
            '<button class="ui-button" id="rico28Fit" title="Fit selected group">Fit</button>' +
            '<div style="margin-left:auto;color:#aaa;font-size:12px;white-space:nowrap;">Ctrl+A Select All · Del Clear · Esc Close</div>' +
          '</div>' +
          '<div id="rico28CanvasHolder" style="flex:1;min-height:0;overflow:auto;background:#0a0a0a;padding:18px;box-sizing:border-box;">' +
            '<canvas id="rico28Canvas" style="display:block;background:#000;image-rendering:pixelated;cursor:crosshair;"></canvas>' +
          '</div>' +
          '<div style="height:25px;min-height:25px;background:#181818;border-top:1px solid #333;display:flex;align-items:center;padding:0 8px;font-size:12px;">' +
            '<span id="rico28Status">EDIT GROUP CHARS</span>' +
          '</div>' +
          '<style>' +
            '#rico28Root .rico28Tool.active{background:#315ae6;color:white;border-color:#6f8cff;}' +
            '#rico28Canvas{touch-action:none;}' +
          '</style>' +
        '</div>';
    },

    ensureUI: function() {
      if(this.dialog) return;
      var self = this;
      this.dialog = UI.create('UI.Dialog', {
        id: 'ricoEditGroupCharsDialog28',
        title: 'EDIT GROUP CHARS',
        width: 1180,
        height: 820
      });
      this.panel = UI.create('UI.HTMLPanel', {
        id: 'ricoEditGroupCharsPanel28',
        html: this.html()
      });
      this.dialog.add(this.panel);

      var close = UI.create('UI.Button', { text: 'Close', color: 'primary' });
      this.dialog.addButton(close);
      close.on('click', function() { UI.closeDialog(self.dialog); });

      this.dialog.on('close', function() {
        self.flushMainEditor();
      });
    },

    show: function() {
      this.tileSet = getTileSet(this.editor);
      if(!this.tileSet) {
        alert('EDIT GROUP CHARS needs an active tile set.');
        return;
      }
      if(this.tileSet.getTileWidth() !== TILE_W || this.tileSet.getTileHeight() !== TILE_H) {
        alert('EDIT GROUP CHARS TEST28 currently supports 8x8 characters.');
        return;
      }

      this.selectionGrid = captureSelectedGrid(this.editor);
      if(!this.selectionGrid.length || !this.selectionGrid[0] || !this.selectionGrid[0].length || countChars(this.selectionGrid) === 0) {
        alert('Select one or more characters in the Tiles palette first.');
        return;
      }

      this.bank = getActiveBank(this.editor);
      if(this.bank === 2 && !getBank2Record(this.tileSet)) {
        alert('BANK 2 is not available in this project yet.');
        return;
      }

      this.selection = null;
      this.clipboard = null;
      this.dirtyChars = {};
      this.tool = 'pencil';
      this.ensureUI();
      UI.showDialog(this.dialog);

      var self = this;
      setTimeout(function() {
        self.bindEvents();
        self.canvas = document.getElementById('rico28Canvas');
        self.ctx = self.canvas ? self.canvas.getContext('2d') : null;
        self.autoFit();
        self.updateToolUI();
        self.draw();
        self.updateStatus();
        var root = document.getElementById('rico28Root');
        if(root) root.focus();
      }, 0);
    },

    bindEvents: function() {
      if(this.bound) return;
      var self = this;
      this.bound = true;

      $('#rico28Pencil').on('click', function() { self.setTool('pencil'); });
      $('#rico28Select').on('click', function() { self.setTool('select'); });
      $('#rico28Cut').on('click', function() { self.cut(); });
      $('#rico28Copy').on('click', function() { self.copy(); });
      $('#rico28Paste').on('click', function() { self.paste(); });
      $('#rico28ZoomOut').on('click', function() { self.setScale(self.scale - 1); });
      $('#rico28ZoomIn').on('click', function() { self.setScale(self.scale + 1); });
      $('#rico28Fit').on('click', function() { self.autoFit(); self.draw(); });

      var canvas = document.getElementById('rico28Canvas');
      if(canvas) {
        canvas.addEventListener('mousedown', function(e) { self.onMouseDown(e); });
        canvas.addEventListener('mousemove', function(e) { self.onMouseMove(e); });
        canvas.addEventListener('mouseup', function(e) { self.onMouseUp(e); });
        canvas.addEventListener('mouseleave', function(e) { self.onMouseUp(e); });
        canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        canvas.addEventListener('wheel', function(e) {
          if(e.ctrlKey || e.metaKey) {
            e.preventDefault();
            self.setScale(self.scale + (e.deltaY < 0 ? 1 : -1));
          }
        }, { passive: false });
      }

      var root = document.getElementById('rico28Root');
      if(root) {
        root.addEventListener('keydown', function(e) { self.onKeyDown(e); });
      }
    },

    setTool: function(tool) {
      this.tool = tool;
      this.updateToolUI();
      this.updateStatus();
    },

    updateToolUI: function() {
      $('#rico28Pencil').toggleClass('active', this.tool === 'pencil');
      $('#rico28Select').toggleClass('active', this.tool === 'select');
      if(this.canvas) this.canvas.style.cursor = this.tool === 'select' ? 'crosshair' : 'cell';
    },

    updateStatus: function(extra) {
      var count = countChars(this.selectionGrid);
      var msg = 'EDIT GROUP CHARS · BANK ' + this.bank + ' · ' + count + ' selected char' + (count === 1 ? '' : 's');
      if(this.selection) {
        msg += ' · selection ' + (this.selection.x2 - this.selection.x1 + 1) + '×' + (this.selection.y2 - this.selection.y1 + 1) + ' px';
      }
      if(extra) msg += ' · ' + extra;
      $('#rico28Status').text(msg);
    },

    rows: function() { return this.selectionGrid.length; },
    cols: function() {
      var max = 0;
      for(var y = 0; y < this.selectionGrid.length; y++) max = Math.max(max, this.selectionGrid[y].length);
      return max;
    },
    pixelWidth: function() { return this.cols() * TILE_W; },
    pixelHeight: function() { return this.rows() * TILE_H; },

    autoFit: function() {
      var holder = document.getElementById('rico28CanvasHolder');
      if(!holder) return;
      var availW = Math.max(80, holder.clientWidth - 42);
      var availH = Math.max(80, holder.clientHeight - 42);
      var sx = Math.floor(availW / Math.max(1, this.pixelWidth()));
      var sy = Math.floor(availH / Math.max(1, this.pixelHeight()));
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, Math.min(sx, sy)));
      $('#rico28ZoomLabel').text((this.scale * 100) + '%');
    },

    setScale: function(scale) {
      scale = Math.max(this.minScale, Math.min(this.maxScale, parseInt(scale, 10) || this.scale));
      if(scale === this.scale) return;
      this.scale = scale;
      $('#rico28ZoomLabel').text((this.scale * 100) + '%');
      this.draw();
    },

    charAtGlobalPixel: function(px, py) {
      if(px < 0 || py < 0 || px >= this.pixelWidth() || py >= this.pixelHeight()) return null;
      var gx = Math.floor(px / TILE_W);
      var gy = Math.floor(py / TILE_H);
      if(gy < 0 || gy >= this.selectionGrid.length) return null;
      if(gx < 0 || gx >= this.selectionGrid[gy].length) return null;
      var ch = this.selectionGrid[gy][gx];
      if(ch === false) return null;
      return { ch: ch, gx: gx, gy: gy, x: px % TILE_W, y: py % TILE_H };
    },

    getPixel: function(px, py) {
      var p = this.charAtGlobalPixel(px, py);
      if(!p) return null;
      try { return this.tileSet.getPixel(p.ch, p.x, p.y, 0) ? 1 : 0; } catch(e) { return 0; }
    },

    setPixel: function(px, py, value) {
      var p = this.charAtGlobalPixel(px, py);
      if(!p) return false;
      try {
        this.tileSet.setPixel(p.ch, p.x, p.y, value ? 1 : 0, false, 0);
        this.dirtyChars[p.ch] = true;
        return true;
      } catch(e) {
        console.error('[RICO TEST28] Pixel write failed.', e);
        return false;
      }
    },

    draw: function() {
      if(!this.canvas || !this.ctx) return;
      var w = this.pixelWidth();
      var h = this.pixelHeight();
      var s = this.scale;
      this.canvas.width = Math.max(1, w * s + 1);
      this.canvas.height = Math.max(1, h * s + 1);
      var ctx = this.ctx;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      for(var py = 0; py < h; py++) {
        for(var px = 0; px < w; px++) {
          var v = this.getPixel(px, py);
          if(v === null) continue;
          ctx.fillStyle = v ? '#e8e8e8' : '#000000';
          ctx.fillRect(px * s, py * s, s, s);
        }
      }

      // Pixel grid.
      if(s >= 4) {
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(var x = 0; x <= w; x++) {
          ctx.moveTo(x * s + 0.5, 0);
          ctx.lineTo(x * s + 0.5, h * s);
        }
        for(var y = 0; y <= h; y++) {
          ctx.moveTo(0, y * s + 0.5);
          ctx.lineTo(w * s, y * s + 0.5);
        }
        ctx.stroke();
      }

      // Character boundaries every 8 pixels.
      ctx.strokeStyle = '#727272';
      ctx.lineWidth = Math.max(1, Math.min(2, Math.floor(s / 4)));
      ctx.beginPath();
      for(var cx = 0; cx <= this.cols(); cx++) {
        ctx.moveTo(cx * TILE_W * s + 0.5, 0);
        ctx.lineTo(cx * TILE_W * s + 0.5, h * s);
      }
      for(var cy = 0; cy <= this.rows(); cy++) {
        ctx.moveTo(0, cy * TILE_H * s + 0.5);
        ctx.lineTo(w * s, cy * TILE_H * s + 0.5);
      }
      ctx.stroke();

      if(this.selection) {
        var sel = this.selection;
        ctx.save();
        ctx.fillStyle = 'rgba(45,128,255,0.18)';
        ctx.strokeStyle = '#2d80ff';
        ctx.lineWidth = 2;
        var rx = sel.x1 * s;
        var ry = sel.y1 * s;
        var rw = (sel.x2 - sel.x1 + 1) * s;
        var rh = (sel.y2 - sel.y1 + 1) * s;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx + 1, ry + 1, Math.max(0, rw - 2), Math.max(0, rh - 2));
        ctx.restore();
      }
    },

    eventPixel: function(e) {
      if(!this.canvas) return null;
      var r = this.canvas.getBoundingClientRect();
      var x = Math.floor((e.clientX - r.left) * this.canvas.width / Math.max(1, r.width) / this.scale);
      var y = Math.floor((e.clientY - r.top) * this.canvas.height / Math.max(1, r.height) / this.scale);
      if(x < 0 || y < 0 || x >= this.pixelWidth() || y >= this.pixelHeight()) return null;
      return { x: x, y: y };
    },

    onMouseDown: function(e) {
      if(e.button !== 0) return;
      var p = this.eventPixel(e);
      if(!p) return;
      this.mouseDown = true;
      this.lastPixel = null;
      if(this.tool === 'select') {
        this.selectStart = p;
        this.selection = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
        this.draw();
        this.updateStatus();
        return;
      }

      var current = this.getPixel(p.x, p.y);
      if(current === null) return;
      this.paintValue = current ? 0 : 1;
      this.paintAt(p.x, p.y);
    },

    onMouseMove: function(e) {
      if(!this.mouseDown) return;
      var p = this.eventPixel(e);
      if(!p) return;
      if(this.tool === 'select') {
        this.selection = {
          x1: Math.min(this.selectStart.x, p.x),
          y1: Math.min(this.selectStart.y, p.y),
          x2: Math.max(this.selectStart.x, p.x),
          y2: Math.max(this.selectStart.y, p.y)
        };
        this.draw();
        this.updateStatus();
      } else {
        this.paintAt(p.x, p.y);
      }
    },

    onMouseUp: function() {
      if(!this.mouseDown) return;
      this.mouseDown = false;
      this.selectStart = null;
      this.lastPixel = null;
      this.flushMainEditor();
    },

    paintAt: function(x, y) {
      var key = x + ',' + y;
      if(this.lastPixel === key) return;
      this.lastPixel = key;
      if(this.setPixel(x, y, this.paintValue)) {
        this.draw();
      }
    },

    getSelectionOrAll: function() {
      if(this.selection) return this.selection;
      return { x1: 0, y1: 0, x2: this.pixelWidth() - 1, y2: this.pixelHeight() - 1 };
    },

    copy: function() {
      var s = this.getSelectionOrAll();
      var data = [];
      for(var y = s.y1; y <= s.y2; y++) {
        var row = [];
        for(var x = s.x1; x <= s.x2; x++) row.push(this.getPixel(x, y));
        data.push(row);
      }
      this.clipboard = { width: s.x2 - s.x1 + 1, height: s.y2 - s.y1 + 1, data: data };
      this.updateStatus('copied ' + this.clipboard.width + '×' + this.clipboard.height + ' px');
    },

    cut: function() {
      var s = this.getSelectionOrAll();
      this.copy();
      for(var y = s.y1; y <= s.y2; y++) {
        for(var x = s.x1; x <= s.x2; x++) {
          if(this.getPixel(x, y) !== null) this.setPixel(x, y, 0);
        }
      }
      this.draw();
      this.flushMainEditor();
      this.updateStatus('cut');
    },

    paste: function() {
      if(!this.clipboard) {
        this.updateStatus('clipboard empty');
        return;
      }
      var originX = this.selection ? this.selection.x1 : 0;
      var originY = this.selection ? this.selection.y1 : 0;
      for(var y = 0; y < this.clipboard.height; y++) {
        for(var x = 0; x < this.clipboard.width; x++) {
          var v = this.clipboard.data[y][x];
          if(v === null) continue;
          var dx = originX + x;
          var dy = originY + y;
          if(dx >= this.pixelWidth() || dy >= this.pixelHeight()) continue;
          this.setPixel(dx, dy, v);
        }
      }
      this.draw();
      this.flushMainEditor();
      this.updateStatus('pasted');
    },

    clearSelection: function() {
      var s = this.getSelectionOrAll();
      for(var y = s.y1; y <= s.y2; y++) {
        for(var x = s.x1; x <= s.x2; x++) {
          if(this.getPixel(x, y) !== null) this.setPixel(x, y, 0);
        }
      }
      this.draw();
      this.flushMainEditor();
      this.updateStatus('cleared');
    },

    selectAll: function() {
      this.selection = { x1: 0, y1: 0, x2: this.pixelWidth() - 1, y2: this.pixelHeight() - 1 };
      this.setTool('select');
      this.draw();
      this.updateStatus();
    },

    onKeyDown: function(e) {
      var key = String(e.key || '').toLowerCase();
      var ctrl = e.ctrlKey || e.metaKey;

      if(ctrl && key === 'a') { e.preventDefault(); this.selectAll(); return; }
      if(ctrl && key === 'c') { e.preventDefault(); this.copy(); return; }
      if(ctrl && key === 'x') { e.preventDefault(); this.cut(); return; }
      if(ctrl && key === 'v') { e.preventDefault(); this.paste(); return; }
      if(ctrl && (key === '+' || key === '=')) { e.preventDefault(); this.setScale(this.scale + 1); return; }
      if(ctrl && key === '-') { e.preventDefault(); this.setScale(this.scale - 1); return; }
      if(key === 'delete' || key === 'backspace') { e.preventDefault(); this.clearSelection(); return; }
      if(key === 'escape') { e.preventDefault(); UI.closeDialog(this.dialog); return; }
      if(key === 'n') { e.preventDefault(); this.setTool('pencil'); return; }
      if(key === 's') { e.preventDefault(); this.setTool('select'); return; }
      if(key === 'z' && !ctrl) {
        e.preventDefault();
        this.setScale(this.scale + (e.shiftKey ? -1 : 1));
        return;
      }
    },

    flushMainEditor: function() {
      var dirty = Object.keys(this.dirtyChars);
      if(!dirty.length) return;

      try {
        for(var i = 0; i < dirty.length; i++) {
          var ch = parseInt(dirty[i], 10);
          if(this.bank === 1 && typeof this.tileSet.updateCharacterCurrentData === 'function') {
            this.tileSet.updateCharacterCurrentData(ch);
          }
        }

        if(typeof window.RICO_applyActiveCharsetBank === 'function') {
          window.RICO_applyActiveCharsetBank(true);
        } else {
          if(this.editor.graphic) {
            if(typeof this.editor.graphic.invalidateAllCells === 'function') this.editor.graphic.invalidateAllCells();
            if(typeof this.editor.graphic.redraw === 'function') this.editor.graphic.redraw({ allCells: true });
          }
        }

        if(this.editor.sideTilePalette && typeof this.editor.sideTilePalette.drawTilePalette === 'function') {
          this.editor.sideTilePalette.drawTilePalette({ redrawTiles: true });
        }
        if(this.editor.tools && this.editor.tools.drawTools && this.editor.tools.drawTools.tilePalette &&
           typeof this.editor.tools.drawTools.tilePalette.drawTilePalette === 'function') {
          this.editor.tools.drawTools.tilePalette.drawTilePalette({ redrawTiles: true });
        }
        if(this.editor.currentTile && typeof this.editor.currentTile.canvasDrawCharacters === 'function') {
          this.editor.currentTile.canvasDrawCharacters();
        }
      } catch(e) {
        console.error('[RICO TEST28] Main editor refresh failed.', e);
      }

      this.dirtyChars = {};
    }
  };

  function installEditCharsButton() {
    var editor = getEditor();
    var button = $('#sidetilePaletteChooseTileSet');
    if(!editor || !button.length) return false;

    button.html('Edit Chars<div class="rippleJS"></div>');
    button.attr('title', 'EDIT GROUP CHARS: edit the current tile selection in an independent pixel view');

    // Replace only the side-panel Choose Tile Set action. Choose Tile Set is
    // still available from the normal Tiles menu / other LVLLVL entry points.
    button.off('click');
    button.on('click.rico28', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if(!editor.ricoEditGroupCharsDialog28) editor.ricoEditGroupCharsDialog28 = new EditGroupCharsDialog(editor);
      editor.ricoEditGroupCharsDialog28.show();
      return false;
    });
    button.attr('data-rico28-edit-chars', '1');
    return true;
  }

  UI.on('ready', function() {
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      if(installEditCharsButton() || tries >= 100) clearInterval(timer);
    }, 50);
  });

  window.RICO_TEST28_EDIT_GROUP_CHARS = true;
  console.log('[RICO TEST28] EDIT GROUP CHARS independent selected-character pixel view loaded.');
})();