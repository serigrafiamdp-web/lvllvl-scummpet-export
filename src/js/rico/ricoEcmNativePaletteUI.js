(function() {
  'use strict';

  if(typeof LayerGrid === 'undefined' || typeof TextModeEditor === 'undefined') {
    console.error('[LVLLVL TEST06] Required editor classes not found.');
    return;
  }

  // TEST06 is a UI layer above TEST04/TEST05.
  // It intercepts only:
  //   - empty TEXTMODE -> ECM
  //   - ECM -> ECM reselection
  // All non-empty conversions continue through the already-PASS automatic path.
  var previousSetMode = LayerGrid.prototype.setMode;

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function isLayerEmpty(layer) {
    var tileSet = layer.getTileSet();
    if(!tileSet) return false;

    var blank = tileSet.getBlankCharacter();
    var noColor = layer.editor.colorPaletteManager.noColor;

    for(var fi=0; fi<layer.frames.length; fi++) {
      var frame=layer.frames[fi];
      if(!frame || !frame.data) continue;

      for(var y=0; y<layer.getGridHeight(); y++) {
        for(var x=0; x<layer.getGridWidth(); x++) {
          var cell=frame.data[y][x];
          if(!cell) continue;

          if(cell.t !== blank) return false;

          if(typeof cell.bc !== 'undefined' &&
             cell.bc !== false &&
             cell.bc !== noColor) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function saveSourceBank(layer) {
    var tileSet=layer.getTileSet();
    if(!tileSet || !tileSet.docRecord || !tileSet.docRecord.data) return null;

    if(!tileSet.docRecord.data.scummECMSourceTileData) {
      tileSet.docRecord.data.scummECMSourceTileData=clone(tileSet.tileData);
      layer.editor.modified();
    }
    return tileSet.docRecord.data.scummECMSourceTileData;
  }

  function getSourceBank(layer) {
    var tileSet=layer.getTileSet();
    if(!tileSet || !tileSet.docRecord || !tileSet.docRecord.data) return null;
    return tileSet.docRecord.data.scummECMSourceTileData || null;
  }

  function getUsedPhysicalSlots(layer) {
    var used={};
    for(var fi=0; fi<layer.frames.length; fi++) {
      var frame=layer.frames[fi];
      if(!frame || !frame.data) continue;

      for(var y=0; y<layer.getGridHeight(); y++) {
        for(var x=0; x<layer.getGridWidth(); x++) {
          var cell=frame.data[y][x];
          if(!cell || typeof cell.t === 'undefined') continue;
          used[cell.t & 0x3f]=true;
        }
      }
    }
    return used;
  }

  function cssHex(n) {
    if(typeof n === 'string') {
      if(n.charAt(0)==='#') return n;
      return '#'+n;
    }
    n = Number(n) >>> 0;
    var s=(n & 0xffffff).toString(16);
    while(s.length<6) s='0'+s;
    return '#'+s;
  }

  function getDrawColors(layer) {
    var editor=layer.editor;
    var palette=editor.colorPaletteManager.getCurrentColorPalette();

    var fg=styles.textMode.tilePaletteFg;
    var bg=styles.textMode.tilePaletteBg;

    if(palette) {
      var fgIndex=editor.currentTile.getColor();
      var bgIndex=editor.currentTile.getBGColor();

      if(fgIndex !== editor.colorPaletteManager.noColor) {
        fg=cssHex(palette.getHex(fgIndex));
      }

      if(bgIndex !== editor.colorPaletteManager.noColor) {
        bg=cssHex(palette.getHex(bgIndex));
      } else {
        var frameBG=editor.graphic.getBackgroundColor();
        if(frameBG !== -1 && frameBG !== editor.colorPaletteManager.noColor) {
          bg=cssHex(palette.getHex(frameBG));
        }
      }
    }

    return { fg:fg, bg:bg };
  }

  function drawGlyph(ctx, record, dx, dy, tileW, tileH, scale, fg, bg) {
    var drawW=tileW*scale;
    var drawH=tileH*scale;

    ctx.fillStyle=bg;
    ctx.fillRect(dx,dy,drawW,drawH);

    if(!record || !record.data || !record.data.length) return;

    var data=record.data[0];
    ctx.fillStyle=fg;

    for(var y=0; y<tileH; y++) {
      for(var x=0; x<tileW; x++) {
        if(data[x+y*tileW]) {
          ctx.fillRect(dx+x*scale,dy+y*scale,scale,scale);
        }
      }
    }
  }

  var picker={
    dialog:null,
    panel:null,
    okButton:null,
    cancelButton:null,
    leftCanvas:null,
    rightCanvas:null,
    layer:null,
    sourceBank:null,
    slots:null,
    lockedSlots:null,
    mode:'initial',
    callback:null,
    scale:2,
    margin:1,
    leftCols:16,
    rightCols:8,

    ensureUI:function() {
      if(this.dialog) return;

      var html='';
      html += '<div class="panelFill" style="background:#1a1a1a;">';
      html +=   '<canvas id="scummECMNativeLeft" style="position:absolute;left:0;top:0;cursor:pointer;"></canvas>';
      html +=   '<canvas id="scummECMNativeRight" style="position:absolute;left:360px;top:0;cursor:pointer;"></canvas>';
      html += '</div>';

      this.panel=UI.create('UI.HTMLPanel',{
        id:'scummECMNativePalettePanel',
        html:html
      });

      this.dialog=UI.create('UI.Dialog',{
        id:'scummECMNativePaletteDialog',
        title:'Edit Tile Palette',
        width:600,
        height:600
      });

      this.dialog.add(this.panel);

      var self=this;

      this.okButton=UI.create('UI.Button',{
        text:'OK',
        color:'primary'
      });
      this.dialog.addButton(this.okButton);
      this.okButton.on('click',function() {
        if(!self.has64()) return;

        var ok=false;
        if(self.mode==='initial') {
          ok=self.applyInitial();
        } else {
          ok=self.applyReselection();
        }

        if(ok) {
          UI.closeDialog();
          var cb=self.callback;
          self.callback=null;
          if(cb) cb(true);
        }
      });

      this.cancelButton=UI.create('UI.Button',{
        text:'Cancel',
        color:'secondary'
      });
      this.dialog.addButton(this.cancelButton);
      this.cancelButton.on('click',function() {
        UI.closeDialog();
        var cb=self.callback;
        self.callback=null;
        if(cb) cb(false);
      });
    },

    bindCanvases:function() {
      var self=this;
      this.leftCanvas=document.getElementById('scummECMNativeLeft');
      this.rightCanvas=document.getElementById('scummECMNativeRight');

      if(!this.leftCanvas || !this.rightCanvas) {
        setTimeout(function(){ self.bindCanvases(); },0);
        return;
      }

      if(!this.leftCanvas._scummBound) {
        this.leftCanvas._scummBound=true;
        this.leftCanvas.addEventListener('click',function(e) {
          self.leftClick(e);
        });
      }

      if(!this.rightCanvas._scummBound) {
        this.rightCanvas._scummBound=true;
        this.rightCanvas.addEventListener('click',function(e) {
          self.rightClick(e);
        });
      }

      this.draw();
    },

    show:function(args) {
      this.ensureUI();

      this.layer=args.layer;
      this.sourceBank=args.sourceBank;
      this.mode=args.mode || 'initial';
      this.callback=args.callback || function(){};
      this.lockedSlots=args.lockedSlots || {};

      if(args.slots) {
        this.slots=args.slots.slice(0);
      } else {
        this.slots=[];
        for(var i=0;i<64;i++) this.slots.push(null);
      }

      UI.showDialog('scummECMNativePaletteDialog');
      this.bindCanvases();
    },

    has64:function() {
      for(var i=0;i<64;i++) {
        if(this.slots[i]===null || typeof this.slots[i]==='undefined') return false;
      }
      return true;
    },

    findEmpty:function() {
      for(var i=0;i<64;i++) {
        if(this.slots[i]===null || typeof this.slots[i]==='undefined') return i;
      }
      return -1;
    },

    isSelected:function(sourceIndex) {
      return this.slots.indexOf(sourceIndex)!==-1;
    },

    draw:function() {
      if(!this.leftCanvas || !this.rightCanvas || !this.layer || !this.sourceBank) return;

      var tileSet=this.layer.getTileSet();
      var tileW=tileSet.getTileWidth();
      var tileH=tileSet.getTileHeight();
      var cellW=tileW*this.scale+this.margin;
      var cellH=tileH*this.scale+this.margin;
      var colors=getDrawColors(this.layer);

      // LEFT: actual loaded source tile set, max 256.
      var sourceCount=Math.min(256,this.sourceBank.length);
      var leftRows=Math.ceil(sourceCount/this.leftCols);
      this.leftCanvas.width=this.leftCols*cellW;
      this.leftCanvas.height=leftRows*cellH;
      this.leftCanvas.style.width=this.leftCanvas.width+'px';
      this.leftCanvas.style.height=this.leftCanvas.height+'px';

      var lctx=this.leftCanvas.getContext('2d');
      lctx.imageSmoothingEnabled=false;
      lctx.fillStyle='#000';
      lctx.fillRect(0,0,this.leftCanvas.width,this.leftCanvas.height);

      for(var i=0;i<sourceCount;i++) {
        var col=i%this.leftCols;
        var row=Math.floor(i/this.leftCols);
        drawGlyph(
          lctx,
          this.sourceBank[i],
          col*cellW,
          row*cellH,
          tileW,
          tileH,
          this.scale,
          colors.fg,
          colors.bg
        );
      }

      // RIGHT: only the physical 64 ECM glyphs.
      var rightRows=8;
      this.rightCanvas.width=this.rightCols*cellW;
      this.rightCanvas.height=rightRows*cellH;
      this.rightCanvas.style.width=this.rightCanvas.width+'px';
      this.rightCanvas.style.height=this.rightCanvas.height+'px';

      var rctx=this.rightCanvas.getContext('2d');
      rctx.imageSmoothingEnabled=false;
      rctx.fillStyle='#000';
      rctx.fillRect(0,0,this.rightCanvas.width,this.rightCanvas.height);

      for(var slot=0;slot<64;slot++) {
        var src=this.slots[slot];
        if(src===null || typeof src==='undefined' || !this.sourceBank[src]) continue;

        var col=slot%this.rightCols;
        var row=Math.floor(slot/this.rightCols);

        drawGlyph(
          rctx,
          this.sourceBank[src],
          col*cellW,
          row*cellH,
          tileW,
          tileH,
          this.scale,
          colors.fg,
          colors.bg
        );
      }

      this.okButton.setEnabled(this.has64());
    },

    leftClick:function(event) {
      var tileSet=this.layer.getTileSet();
      var tileW=tileSet.getTileWidth();
      var tileH=tileSet.getTileHeight();
      var cellW=tileW*this.scale+this.margin;
      var cellH=tileH*this.scale+this.margin;

      var rect=this.leftCanvas.getBoundingClientRect();
      var x=event.clientX-rect.left;
      var y=event.clientY-rect.top;

      var col=Math.floor(x/cellW);
      var row=Math.floor(y/cellH);
      var sourceIndex=row*this.leftCols+col;

      if(sourceIndex<0 || sourceIndex>=Math.min(256,this.sourceBank.length)) return;
      if(this.isSelected(sourceIndex)) return;

      var empty=this.findEmpty();
      if(empty<0) return;

      this.slots[empty]=sourceIndex;
      this.draw();
    },

    rightClick:function(event) {
      var tileSet=this.layer.getTileSet();
      var tileW=tileSet.getTileWidth();
      var tileH=tileSet.getTileHeight();
      var cellW=tileW*this.scale+this.margin;
      var cellH=tileH*this.scale+this.margin;

      var rect=this.rightCanvas.getBoundingClientRect();
      var x=event.clientX-rect.left;
      var y=event.clientY-rect.top;

      var col=Math.floor(x/cellW);
      var row=Math.floor(y/cellH);
      var slot=row*this.rightCols+col;

      if(slot<0 || slot>=64) return;

      if(this.mode==='reselect' && this.lockedSlots[slot]) {
        alert('This glyph is already used in the frames and cannot be removed.');
        return;
      }

      this.slots[slot]=null;
      this.draw();
    },

    applyInitial:function() {
      var layer=this.layer;
      var tileSet=layer.getTileSet();

      if(!tileSet.docRecord || !tileSet.docRecord.data) return false;

      if(!tileSet.docRecord.data.scummECMSourceTileData) {
        tileSet.docRecord.data.scummECMSourceTileData=clone(this.sourceBank);
      }

      var oldBlank=tileSet.getBlankCharacter();
      var logicalToPhysical={};

      for(var slot=0;slot<64;slot++) {
        var sourceIndex=this.slots[slot];
        logicalToPhysical[sourceIndex]=slot;
        tileSet.tileData[slot]=clone(this.sourceBank[sourceIndex]);

        if(typeof tileSet.updateCharacterCurrentData==='function') {
          tileSet.updateCharacterCurrentData(slot);
        }
      }

      var newBlank=
        typeof logicalToPhysical[oldBlank]!=='undefined'
        ? logicalToPhysical[oldBlank]
        : 0;

      for(var fi=0;fi<layer.frames.length;fi++) {
        var frame=layer.frames[fi];
        if(!frame || !frame.data) continue;

        for(var y=0;y<layer.getGridHeight();y++) {
          for(var x=0;x<layer.getGridWidth();x++) {
            var cell=frame.data[y][x];
            if(cell) cell.t=newBlank;
          }
        }
      }

      layer.setBlankTileId(newBlank,false);

      for(var i=64;i<Math.min(256,tileSet.tileData.length);i++) {
        if(tileSet.tileData[i] && tileSet.tileData[i].props) {
          tileSet.tileData[i].props.animated=false;
        }
      }

      tileSet.docRecord.data.scummECMSelection=this.slots.slice(0);
      layer.editor.modified();
      return true;
    },

    applyReselection:function() {
      var layer=this.layer;
      var tileSet=layer.getTileSet();
      if(!tileSet.docRecord || !tileSet.docRecord.data) return false;

      var previous=tileSet.docRecord.data.scummECMSelection || [];

      for(var slot=0;slot<64;slot++) {
        if(this.lockedSlots[slot] && previous[slot]!==this.slots[slot]) {
          return false;
        }
      }

      for(var slot=0;slot<64;slot++) {
        var sourceIndex=this.slots[slot];
        if(sourceIndex===null || typeof sourceIndex==='undefined') return false;
        if(!this.sourceBank[sourceIndex]) return false;

        tileSet.tileData[slot]=clone(this.sourceBank[sourceIndex]);
        if(typeof tileSet.updateCharacterCurrentData==='function') {
          tileSet.updateCharacterCurrentData(slot);
        }
      }

      tileSet.docRecord.data.scummECMSelection=this.slots.slice(0);
      layer.editor.modified();

      layer.editor.tools.drawTools.tilePalette.drawTilePalette({redrawTiles:true});
      layer.editor.sideTilePalette.drawTilePalette({redrawTiles:true});
      layer.editor.graphic.redraw({allCells:true});

      if(layer.editor.type==='2d') {
        layer.editor.layers.updateAllLayerPreviews();
      }

      return true;
    }
  };

  LayerGrid.prototype.setMode=function(screenMode,callback) {
    var requestedMode=screenMode;
    if(requestedMode && typeof requestedMode==='object' &&
       typeof requestedMode.mode!=='undefined') {
      requestedMode=requestedMode.mode;
    }

    // Empty TEXTMODE -> ECM: native-looking two-column palette.
    if(requestedMode===TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode!==TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode!=='vector' &&
       isLayerEmpty(this)) {

      var layer=this;
      var source=saveSourceBank(this);
      if(!source) {
        return previousSetMode.call(this,screenMode,callback);
      }

      picker.show({
        layer:this,
        sourceBank:source,
        mode:'initial',
        callback:function(ok) {
          if(!ok) {
            if(typeof callback!=='undefined') callback(false);
            return;
          }

          // TEST01/TEST04 understand this flag and will not repack again.
          layer._scummManualECMReady=true;

          previousSetMode.call(layer,screenMode,function(result) {
            layer._scummManualECMReady=false;
            if(typeof callback!=='undefined') callback(result);
          });
        }
      });
      return;
    }

    // ECM -> ECM: reopen the same minimal palette with current 64.
    if(requestedMode===TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode===TextModeEditor.Mode.C64ECM) {

      var tileSet=this.getTileSet();
      var source=getSourceBank(this);
      var selection=
        tileSet && tileSet.docRecord && tileSet.docRecord.data
        ? tileSet.docRecord.data.scummECMSelection
        : null;

      if(source && selection && selection.length===64) {
        picker.show({
          layer:this,
          sourceBank:source,
          slots:selection,
          lockedSlots:getUsedPhysicalSlots(this),
          mode:'reselect',
          callback:function(ok) {
            if(typeof callback!=='undefined') callback(ok);
          }
        });
        return;
      }
    }

    return previousSetMode.call(this,screenMode,callback);
  };

  window.LVLLVL_TEST06_ECM_NATIVE_PALETTE_UI=true;
  console.log('[LVLLVL TEST06] Native-style ECM 64-glyph palette installed.');
})();