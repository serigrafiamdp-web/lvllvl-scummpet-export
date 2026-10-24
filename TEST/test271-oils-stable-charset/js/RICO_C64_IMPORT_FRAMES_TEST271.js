/* RICO TEST271 — Stable shared charset for Oil's Well 8-level C64 capture.
 * TEST269 PASS is unchanged. Capture only the active 40x25 VIC character
 * screen; preserve existing frames and shared charset, per-frame colors.
 * Native Import button remains open while importing .PRG/.D64/.CRT.
 * Other C64 import formats keep original handlers and close behaviour.
 */
(function () {
  'use strict';
  if (typeof ImportC64Formats === 'undefined' ||
      typeof UI === 'undefined' ||
      !window.RICO_TEST269_OILS_WARP) {
    console.error('[TEST270] TEST269 dependency absent, no changes made');
    return;
  }

  var originalStart = ImportC64Formats.prototype.start;
  var originalInit = ImportC64Formats.prototype.initContent;
  var originalImportPrg = ImportC64Formats.prototype.importPrg;
  var originalLoadPrg = ImportC64Formats.prototype.loadPrg;

  // Reference game only: the user's original PRG supplies its common
  // 128-glyph atlas. Never embed game graphics into the public repository.
  function oilOffset(addr) { return 257 + addr - 0x8000; }
  function identifyOils(bytes) {
    if (!bytes || bytes.length !== 38405 ||
        bytes[0] !== 1 || bytes[1] !== 8) return false;
    var off=oilOffset(0x8004), sig=[0xc3,0xc2,0xcd,0x38,0x30];
    for (var i=0;i<sig.length;i++) if (bytes[off+i] !== sig[i]) return false;
    for (var level=0;level<8;level++) {
      var mapOff=oilOffset(0xa000+level*1024);
      if (mapOff+1000 > bytes.length) return false;
      for (var j=0;j<1000;j++) if (bytes[mapOff+j] >= 128) return false;
    }
    return true;
  }
  ImportC64Formats.prototype.loadPrg=function(file) {
    var self=this;
    this._ricoTest271Source=null;
    this._ricoTest271SourcePending=!!(file && typeof file.arrayBuffer==='function');
    this._ricoTest270History=null;
    if (this._ricoTest271SourcePending) {
      file.arrayBuffer().then(function(buffer) {
        var bytes=new Uint8Array(buffer);
        self._ricoTest271Source=identifyOils(bytes)?bytes:null;
        self._ricoTest271SourcePending=false;
      }).catch(function(err) {
        self._ricoTest271Source=null;
        self._ricoTest271SourcePending=false;
        console.warn('[TEST271] Could not read original PRG',err);
      });
    }
    return originalLoadPrg.apply(this,arguments);
  };

  function captureOilsOriginal(source) {
    // Oil's Well uses raster switches: D018 can point to a different
    // bank/mode at different scanlines. This fallback uses the original
    // game's eight static maps and a single known charset, not VIC noise.
    var stage=c64_cpuReadNS(0x22)&255;
    if (stage > 7) throw Error("Oil's Well level index out of range: "+stage);
    var color=new Uint8Array(1000);
    var main=oilOffset(0x963d+stage*4);
    var bands=oilOffset(0x965d+stage*4);
    var extras=oilOffset(0x967d+stage*4);
    var charBin=new Uint8Array(2048);
    charBin.set(source.slice(oilOffset(0x9a00),oilOffset(0x9a00)+1024));
    var map=source.slice(oilOffset(0xa000+stage*1024),oilOffset(0xa000+stage*1024)+1000);
    color.fill(source[bands+2]&15,0,280);
    color.fill(source[bands+3]&15,280);
    for(var y=1;y<=3;y++)color[0xda+y]=source[extras+1]&15;
    var shift=(stage===7)?0:40;
    [0x12,0x14,0x16].forEach(function(x){color[x+shift]=source[extras+2]&15;});
    [0x3a,0x3c,0x3e].forEach(function(x){color[x+shift]=source[extras+3]&15;});
    return {
      screen:map,colors:color,chars:charBin,
      bg:source[main+1]&15,border:source[main]&15,
      mc1:source[main+2]&15,mc2:source[main+3]&15,
      multicolor:true,bitmap:false,ecm:false,
      sourceMode:"Oil's Well original: single 128-glyph charset, 8 maps",
      level:stage+1
    };
  }

  var css = document.createElement('style');
  css.id = 'rico-test270-capture-css';
  css.textContent = [
    '#ricoTest270Capture{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;',
    'padding-left:9px;border-left:1px solid #464646;font-size:12px;}',
    '#ricoTest270Button{padding:4px 9px;border:1px solid #65895e;',
    'border-radius:3px;background:#345931;color:white;cursor:pointer;font:12px system-ui;}',
    '#ricoTest270Button:hover{background:#467942;}',
    '#ricoTest270Status{font-size:11px;max-width:360px;color:#adbac6;}'
  ].join('');
  document.head.appendChild(css);

  function status(message, failed) {
    var el = document.getElementById('ricoTest270Status');
    if (el) {
      el.textContent = message;
      el.style.color = failed ? '#ffaba2' : '#9ee1b6';
    }
    console[failed ? 'warn' : 'log']('[TEST270] ' + message);
  }

  function captureVic() {
    if (typeof c64_ready === 'undefined' || !c64_ready ||
        typeof c64_cpuReadNS !== 'function' ||
        typeof c64_vicRead !== 'function' ||
        typeof c64_cpuRead !== 'function' ||
        typeof c64_vicReadRegister !== 'function') {
      throw Error('El emulador C64 todavía no está preparado');
    }
    // Verified against original file: 73 used indices in 8 maps.
    // Raster-phase D018 and char RAM can falsely indicate new glyphs.
    if (this && this._ricoTest271Source &&
        window.RICO_TEST269_OILS_WARP &&
        typeof window.RICO_TEST269_OILS_WARP.isOils==='function' &&
        window.RICO_TEST269_OILS_WARP.isOils()) {
      return captureOilsOriginal(this._ricoTest271Source);
    }
    // Same VIC bank-relative address decoding as the original importPrg,
    // but read a full charset (2048, rather than 2000 bytes).
    var d011 = c64_cpuReadNS(0xd011) & 255;
    var d016 = c64_cpuReadNS(0xd016) & 255;
    var d018 = c64_cpuReadNS(0xd018) & 255;
    var screenBase = (d018 & 0xf0) << 6;
    var charBase = (d018 & 0x0e) << 10;
    var screen = new Uint8Array(1000);
    var color = new Uint8Array(1000);
    var chars = new Uint8Array(2048);
    for (var i = 0; i < 1000; i++) {
      screen[i] = c64_vicRead(screenBase + i) & 255;
      color[i] = c64_cpuRead(0xd800 + i) & 15;
    }
    for (var c = 0; c < 2048; c++) chars[c] = c64_vicRead(charBase + c) & 255;
    return {
      screen:screen, colors:color, chars:chars,
      bg:c64_vicReadRegister(0x21)&15,
      border:c64_vicReadRegister(0x20)&15,
      mc1:c64_vicReadRegister(0x22)&15,
      mc2:c64_vicReadRegister(0x23)&15,
      multicolor:!!(d016 & 0x10),
      bitmap:!!(d011 & 0x20),
      ecm:!!(d011 & 0x40),
      d018:d018
    };
  }

  // Verify that no glyph already needed by the new screen would be
  // reinterpreted through the layer's existing shared tileset.
  function charsetMatches(charset, capture) {
    var data = charset && typeof charset.getData === 'function' ? charset.getData() : null;
    if (!data || data.length < 256) return false;
    var referenced = new Uint8Array(256);
    for (var i=0;i<1000;i++) referenced[capture.screen[i]] = 1;
    for (var n=0;n<256;n++) {
      if (!referenced[n]) continue;
      var tile = data[n];
      if (!tile || tile.length < 64) return false;
      for (var y=0;y<8;y++) {
        var bits=0;
        for (var x=0;x<8;x++) if(tile[y*8+x]) bits |= (128>>x);
        if (bits !== capture.chars[n*8+y]) return false;
      }
    }
    return true;
  }

  function blankFirstFrame(editor, layer, graphic) {
    if (graphic.getFrameCount() !== 1 || graphic.getCurrentFrame() !== 0 ||
        !layer || typeof layer.getFrameData !== 'function') return false;
    var frame = layer.getFrameData(0);
    if (!frame || !frame.data) return true;
    var data = frame.data;
    var blank = layer.blankTileId;
    for (var y=0; y<data.length; y++) {
      if (!data[y]) continue;
      for (var x=0; x<data[y].length; x++) {
        var cell = data[y][x];
        if (cell && cell.t !== blank) return false;
      }
    }
    return true;
  }

  function doCapture() {
    var editor = this.editor;
    var graphic = editor && editor.graphic;
    var framesUI = editor && editor.frames;
    var layer = editor && editor.layers && editor.layers.getSelectedLayerObject();
    if (!graphic || !framesUI || !layer || layer.getType() !== 'grid') {
      status('Seleccioná una capa de grilla para capturar.', true);
      return false;
    }
    if (this.importType !== 'prg') {
      status('Cargá primero un PRG, D64 o CRT en el mini emulador.', true);
      return false;
    }
    if (editor.tools && editor.tools.drawTools && editor.tools.drawTools.select
        && editor.tools.drawTools.select.isActive()) {
      status('Desactivá la selección antes de capturar la pantalla completa.', true);
      return false;
    }

    if (this._ricoTest271SourcePending) {
      status('Leyendo el PRG original para verificar el charset; intentá de nuevo.', true);
      return false;
    }
    var pausedByUs = false;
    var wasRunning = false;
    var snap;
    try {
      if (typeof debugger_isRunning === 'function' &&
          typeof debugger_pause === 'function') {
        wasRunning = !!debugger_isRunning();
        if (wasRunning) {
          debugger_pause();
          pausedByUs = true;
        }
      }
      snap = captureVic.call(this);
    } catch(e) {
      status('Error leyendo la C64: ' + (e.message || e), true);
      return false;
    } finally {
      if (pausedByUs && typeof debugger_play === 'function') {
        try { debugger_play(); } catch(e) {}
      }
    }

    // The LVLLVL layer has one global charset and one screen mode across
    // all its frames. Never corrupt previously imported maps silently.
    var mode = snap.multicolor ? TextModeEditor.Mode.C64MULTICOLOR :
                                 TextModeEditor.Mode.TEXTMODE;
    var old = this._ricoTest270History || null;
    var initial = !old;
    var blank = blankFirstFrame(editor, layer, graphic);
    var reuseBlank = initial && blank;

    if (old && old.tileSet !== layer.getTileSet()) {
      status('Cambió el tileset del editor; iniciá otra sesión de importación.', true);
      return false;
    }
    if (old && old.mode !== mode) {
      status('Modo VIC diferente. Esta prueba no mezcla HiRes y Multicolor en una capa.', true);
      return false;
    }
    if (old && !charsetMatches(layer.getTileSet(), snap)) {
      status('El juego cambió caracteres usados. No sobrescribo el tileset de las frames anteriores.', true);
      return false;
    }
    if (!old && !blank) {
      if (!charsetMatches(layer.getTileSet(), snap)) {
        status('Este documento ya tiene gráficos y otro charset. Probá con un proyecto vacío para protegerlos.', true);
        return false;
      }
      if (layer.getScreenMode && layer.getScreenMode() !== mode) {
        status('La capa existente usa otro modo de pantalla. Abrí un proyecto nuevo.', true);
        return false;
      }
    }

    var gw = graphic.getGridWidth ? graphic.getGridWidth() : graphic.gridWidth;
    var gh = graphic.getGridHeight ? graphic.getGridHeight() : graphic.gridHeight;
    if ((gw !== 40 || gh !== 25) && !reuseBlank) {
      status('Para no modificar otros mapas, esta captura requiere una grilla 40×25.', true);
      return false;
    }

    var countBefore = graphic.getFrameCount();
    var target;
    try {
      if (gw !== 40 || gh !== 25) {
        graphic.setGridDimensions({width:40, height:25});
      }
      if (reuseBlank) {
        target = 0;
        framesUI.gotoFrame(0);
        layer.setScreenMode(mode);
        layer.getTileSet().readBinaryData({
          tileData:Array.from(snap.chars),
          characterWidth:8,characterHeight:8
        });
        editor.tileSetManager.tileSetUpdated({
          updateBlankCells:false,updateSortMethods:true
        });
      } else {
        // Insert explicitly after the FINAL frame, never in the middle.
        target = graphic.insertFrame(countBefore - 1);
        framesUI.gotoFrame(target);
      }
      layer.setBackgroundColor(snap.bg);
      layer.setBorderColor(snap.border);
      layer.setC64Multi1Color(snap.mc1, false);
      layer.setC64Multi2Color(snap.mc2, false);

      var args = {x:0,y:0,t:0,fc:0,bc:editor.colorPaletteManager.noColor,update:false};
      for (var y=0;y<25;y++) {
        for (var x=0;x<40;x++) {
          var idx=y*40+x, t=snap.screen[idx];
          args.x=x;args.y=y;args.t=t;args.fc=snap.colors[idx];
          args.bc=editor.colorPaletteManager.noColor;
          if (snap.ecm) {
            args.bc=[snap.bg,snap.mc1,snap.mc2,
              c64_vicReadRegister(0x24)&15][(t>>6)&3];
            args.t=t&63;
          }
          layer.setCell(args);
        }
      }
      graphic.invalidateAllCells();
      graphic.redraw({allCells:true});
      if (editor.gridView2d && editor.gridView2d.findViewBounds)
        editor.gridView2d.findViewBounds();

      this._ricoTest270History = {
        tileSet:layer.getTileSet(),mode:mode,captures:(old ? old.captures : 0)+1
      };
      this._ricoTest270LastCapture = {
        frame:target, bg:snap.bg, border:snap.border,
        mc1:snap.mc1,mc2:snap.mc2,
        multicolor:snap.multicolor,bitmap:snap.bitmap
      };
      status('Frame ' + (target+1) + '/' + graphic.getFrameCount() +
        ' capturada (' + this._ricoTest270History.captures +
        ' capturas). Warp y volvé a importar otro nivel.' +
        (snap.sourceMode ? ' Fuente: '+snap.sourceMode+', nivel '+snap.level+'.' : '') +
        (snap.bitmap ? ' Nota: VIC bitmap/raster activo; verificar el resultado.' : ''), false);
      return true;
    } catch(err) {
      status('Error durante importación: ' + (err.message || err), true);
      console.error('[TEST270] capture failure',err);
      return false;
    }
  }

  function installCaptureButton(instance) {
    if (document.getElementById('ricoTest270Capture')) return;
    var footer = document.getElementById('ricoTest268Footer');
    if (!footer) return;
    var widget=document.createElement('div');
    widget.id='ricoTest270Capture';
    var button=document.createElement('button');
    button.type='button';
    button.id='ricoTest270Button';
    button.textContent='Capture → New Frame';
    button.addEventListener('click',function(){instance.doImport();});
    var indicator=document.createElement('span');
    indicator.id='ricoTest270Status';
    indicator.textContent='Capture cada nivel como frame. La ventana queda abierta.';
    widget.appendChild(button);
    widget.appendChild(indicator);
    footer.appendChild(widget);
  }

  ImportC64Formats.prototype.initContent = function() {
    var result=originalInit.apply(this,arguments);
    installCaptureButton(this);
    return result;
  };
  ImportC64Formats.prototype.importPrg = function() {
    return doCapture.call(this);
  };

  ImportC64Formats.prototype.start = function() {
    var result=originalStart.apply(this,arguments);
    // The original OK button executes doImport(), then UI.closeDialog().
    // Replace ONLY that handler, and ONLY while the emulator PRG is active.
    if (this.okButton && !this._ricoTest270OKHandler) {
      var nativeClick=this.okButton.uievent_click;
      var self=this;
      this.okButton.on('click',function() {
        if (self.importType==='prg') return self.doImport();
        return nativeClick.apply(this,arguments);
      });
      this._ricoTest270OKHandler=true;
    }
    return result;
  };

  window.RICO_TEST270_CAPTURE = {
    version:'TEST271',
    last:function(instance){return instance && instance._ricoTest270LastCapture;},
    capture:function(instance){return doCapture.call(instance);}
  };
  console.log('[TEST271] Oil\'s Well reference captured from local PRG; other C64 imports unchanged.');
})();