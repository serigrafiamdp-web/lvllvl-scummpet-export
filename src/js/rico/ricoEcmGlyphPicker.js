(function() {
  'use strict';

  if(typeof LayerGrid === 'undefined' || typeof TextModeEditor === 'undefined') {
    console.error('[LVLLVL TEST04] Required editor classes not found.');
    return;
  }

  var originalSetMode = LayerGrid.prototype.setMode;

  function isLayerEmpty(layer) {
    var tileSet = layer.getTileSet();
    if(!tileSet) return false;

    var blank = tileSet.getBlankCharacter();
    var noColor = layer.editor.colorPaletteManager.noColor;

    for(var fi = 0; fi < layer.frames.length; fi++) {
      var frame = layer.frames[fi];
      if(!frame || !frame.data) continue;

      for(var y = 0; y < layer.getGridHeight(); y++) {
        for(var x = 0; x < layer.getGridWidth(); x++) {
          var cell = frame.data[y][x];
          if(!cell) continue;

          if(cell.t !== blank) return false;

          // Per-cell background work also counts as authored content.
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

  function drawGlyph(canvas, tileSet, tileIndex, selected) {
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var w = tileSet.getTileWidth ? tileSet.getTileWidth() : 8;
    var h = tileSet.getTileHeight ? tileSet.getTileHeight() : 8;
    var scale = 3;

    canvas.width = w * scale;
    canvas.height = h * scale;
    canvas.style.width = (w * scale) + 'px';
    canvas.style.height = (h * scale) + 'px';

    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    var data = null;
    if(tileSet.tileData[tileIndex] && tileSet.tileData[tileIndex].data) {
      data = tileSet.tileData[tileIndex].data[0];
    }

    if(data) {
      ctx.fillStyle = '#ddd';
      for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
          if(data[x + y*w]) {
            ctx.fillRect(x*scale,y*scale,scale,scale);
          }
        }
      }
    }

    if(selected) {
      ctx.strokeStyle = '#59d15f';
      ctx.lineWidth = 2;
      ctx.strokeRect(1,1,canvas.width-2,canvas.height-2);
    }
  }

  function makeGlyphCell(tileSet, tileIndex, selected, onClick) {
    var cell = document.createElement('div');
    cell.style.cssText =
      'display:inline-flex;flex-direction:column;align-items:center;' +
      'margin:2px;padding:2px;border:1px solid #333;background:#181818;' +
      'cursor:pointer;user-select:none;';

    var cv = document.createElement('canvas');
    drawGlyph(cv,tileSet,tileIndex,selected);
    cell.appendChild(cv);

    var label = document.createElement('div');
    label.textContent = tileIndex.toString(16).toUpperCase().padStart(2,'0');
    label.style.cssText='font:10px monospace;color:#aaa;margin-top:1px;';
    cell.appendChild(label);

    cell.onclick=function(){ onClick(tileIndex); };
    return cell;
  }

  function applyManualSelection(layer, selected) {
    var tileSet = layer.getTileSet();
    var oldTileData = [];
    for(var i=0;i<tileSet.tileData.length;i++) {
      oldTileData[i] = JSON.parse(JSON.stringify(tileSet.tileData[i]));
    }

    var map = {};
    for(var slot=0; slot<64; slot++) {
      var logical = selected[slot];
      map[logical] = slot;
      tileSet.tileData[slot] = JSON.parse(JSON.stringify(oldTileData[logical]));
      if(typeof tileSet.updateCharacterCurrentData === 'function') {
        tileSet.updateCharacterCurrentData(slot);
      }
    }

    // Empty frames must still point at the repacked blank glyph.
    var oldBlank = tileSet.getBlankCharacter();
    var newBlank = (typeof map[oldBlank] !== 'undefined') ? map[oldBlank] : 0;

    for(var fi=0; fi<layer.frames.length; fi++) {
      var frame=layer.frames[fi];
      if(!frame || !frame.data) continue;
      for(var y=0;y<layer.getGridHeight();y++) {
        for(var x=0;x<layer.getGridWidth();x++) {
          var cell=frame.data[y][x];
          if(cell) cell.t=newBlank;
        }
      }
    }

    layer.setBlankTileId(newBlank, false);

    // Avoid stale animation flags in ECM alias banks.
    for(var i=64;i<Math.min(256,tileSet.tileData.length);i++) {
      if(tileSet.tileData[i] && tileSet.tileData[i].props) {
        tileSet.tileData[i].props.animated=false;
      }
    }

    // Save explicit selection map for later inspection/debug.
    tileSet.docRecord.data.scummECMSelection = selected.slice(0);

    layer.editor.modified();
    layer._scummManualECMReady = true;
  }

  function showPicker(layer, done) {
    var tileSet = layer.getTileSet();
    var count = Math.min(256, tileSet.getTileCount());
    var selected = [];

    var overlay=document.createElement('div');
    overlay.style.cssText=
      'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.78);' +
      'display:flex;align-items:center;justify-content:center;';

    var box=document.createElement('div');
    box.style.cssText=
      'width:1180px;max-width:96vw;height:760px;max-height:94vh;' +
      'background:#202020;border:1px solid #555;box-shadow:0 8px 40px #000;' +
      'display:flex;flex-direction:column;color:#ddd;font-family:Arial,sans-serif;';
    overlay.appendChild(box);

    var header=document.createElement('div');
    header.style.cssText='padding:12px 16px;border-bottom:1px solid #444;';
    header.innerHTML=
      '<div style="font-size:20px;margin-bottom:6px">Choose 64 glyphs for C64 ECM</div>' +
      '<div style="color:#f0c36a">Only 64 physical glyphs can be kept in ECM. ' +
      'This project has no painted frame content, so you can choose them before converting.</div>';
    box.appendChild(header);

    var main=document.createElement('div');
    main.style.cssText='flex:1;display:grid;grid-template-columns:1fr 390px;gap:12px;padding:12px;min-height:0;';
    box.appendChild(main);

    var left=document.createElement('div');
    left.style.cssText='display:flex;flex-direction:column;min-height:0;';
    main.appendChild(left);

    var leftTitle=document.createElement('div');
    leftTitle.textContent='Tile set (click to add)';
    leftTitle.style.cssText='font-weight:bold;margin-bottom:6px;';
    left.appendChild(leftTitle);

    var allGrid=document.createElement('div');
    allGrid.style.cssText='flex:1;overflow:auto;border:1px solid #3c3c3c;padding:6px;background:#151515;';
    left.appendChild(allGrid);

    var right=document.createElement('div');
    right.style.cssText='display:flex;flex-direction:column;min-height:0;';
    main.appendChild(right);

    var keepTitle=document.createElement('div');
    keepTitle.style.cssText='font-weight:bold;margin-bottom:6px;';
    right.appendChild(keepTitle);

    var keepGrid=document.createElement('div');
    keepGrid.style.cssText='border:1px solid #3c3c3c;padding:6px;background:#151515;height:290px;overflow:auto;';
    right.appendChild(keepGrid);

    var outTitle=document.createElement('div');
    outTitle.style.cssText='font-weight:bold;margin:12px 0 6px;';
    outTitle.textContent='Outside the 64';
    right.appendChild(outTitle);

    var outGrid=document.createElement('div');
    outGrid.style.cssText='flex:1;border:1px solid #3c3c3c;padding:6px;background:#151515;overflow:auto;';
    right.appendChild(outGrid);

    var footer=document.createElement('div');
    footer.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid #444;';
    box.appendChild(footer);

    var status=document.createElement('div');
    footer.appendChild(status);

    var buttons=document.createElement('div');
    footer.appendChild(buttons);

    function button(text, primary, click) {
      var b=document.createElement('button');
      b.textContent=text;
      b.style.cssText='margin-left:8px;padding:7px 16px;background:'+(primary?'#3b78c8':'#444')+';color:white;border:1px solid #666;cursor:pointer;';
      b.onclick=click;
      buttons.appendChild(b);
      return b;
    }

    var applyBtn;
    button('Cancel',false,function(){
      document.body.removeChild(overlay);
      done(false);
    });
    applyBtn=button('Convert to ECM',true,function(){
      if(selected.length !== 64) return;
      applyManualSelection(layer, selected);
      document.body.removeChild(overlay);
      done(true);
    });

    function render() {
      keepTitle.textContent='ECM physical glyphs: '+selected.length+' / 64';
      status.textContent=selected.length===64
        ? 'Ready: exactly 64 glyphs selected.'
        : 'Select '+(64-selected.length)+' more glyph(s).';
      applyBtn.disabled=selected.length!==64;
      applyBtn.style.opacity=selected.length===64?'1':'0.45';

      allGrid.innerHTML='';
      keepGrid.innerHTML='';
      outGrid.innerHTML='';

      var selectedSet={};
      for(var i=0;i<selected.length;i++) selectedSet[selected[i]]=true;

      for(var t=0;t<count;t++) {
        allGrid.appendChild(makeGlyphCell(tileSet,t,!!selectedSet[t],function(tile){
          if(selected.indexOf(tile)!==-1) return;
          if(selected.length>=64) return;
          selected.push(tile);
          render();
        }));
      }

      for(var s=0;s<selected.length;s++) {
        (function(slot,tile){
          var holder=document.createElement('div');
          holder.style.cssText='display:inline-block;position:relative;';
          var c=makeGlyphCell(tileSet,tile,true,function(){
            selected.splice(slot,1);
            render();
          });
          var n=document.createElement('div');
          n.textContent=slot.toString(16).toUpperCase().padStart(2,'0');
          n.style.cssText='position:absolute;left:3px;top:3px;background:#284d28;color:#fff;font:9px monospace;padding:1px 2px;';
          holder.appendChild(c);
          holder.appendChild(n);
          keepGrid.appendChild(holder);
        })(s,selected[s]);
      }

      for(var t=0;t<count;t++) {
        if(!selectedSet[t]) {
          outGrid.appendChild(makeGlyphCell(tileSet,t,false,function(tile){
            if(selected.length>=64) return;
            selected.push(tile);
            render();
          }));
        }
      }
    }

    document.body.appendChild(overlay);
    render();
  }

  LayerGrid.prototype.setMode = function(screenMode, callback) {
    if(screenMode == TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode != TextModeEditor.Mode.C64ECM &&
       this.doc.screenMode != 'vector' &&
       !this._scummManualECMReady &&
       isLayerEmpty(this)) {

      var layer=this;
      showPicker(this,function(ok){
        if(!ok) {
          if(typeof callback!=='undefined') callback(false);
          return;
        }
        originalSetMode.call(layer,screenMode,function(result){
          layer._scummManualECMReady=false;
          if(typeof callback!=='undefined') callback(result);
        });
      });
      return;
    }

    return originalSetMode.call(this,screenMode,callback);
  };

  window.LVLLVL_TEST04_ECM_GLYPH_PICKER=true;
  console.log('[LVLLVL TEST04] Empty-project ECM glyph picker installed.');
})();