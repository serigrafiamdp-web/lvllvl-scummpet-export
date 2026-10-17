(function() {
  'use strict';

  if (typeof LayerGrid === 'undefined' || typeof TextModeEditor === 'undefined') {
    alert('LVLLVL TEST01: no se pudo instalar el parche ECM.');
    return;
  }

  var originalSetMode = LayerGrid.prototype.setMode;

  LayerGrid.prototype.prepareTextModeToC64ECM = function() {
    var tileSet = this.getTileSet();
    if(!tileSet) return false;

    var tileCount = tileSet.getTileCount();
    if(tileCount <= 0) return true;

    var noColor = this.editor.colorPaletteManager.noColor;
    var usage = [];
    var usedCount = 0;
    var i, frameIndex, y, x;

    for(i = 0; i < tileCount; i++) usage.push({ c: i, timesUsed: 0 });

    // Count logical tiles across ALL frames while the layer is still Text Mode.
    for(frameIndex = 0; frameIndex < this.frames.length; frameIndex++) {
      var frameData = this.frames[frameIndex].data;
      if(!frameData) continue;
      for(y = 0; y < this.getGridHeight(); y++) {
        for(x = 0; x < this.getGridWidth(); x++) {
          var cell = frameData[y][x];
          if(!cell) continue;
          var ch = cell.t;
          if(ch >= 0 && ch < tileCount) {
            if(usage[ch].timesUsed === 0) usedCount++;
            usage[ch].timesUsed++;
          }
        }
      }
    }

    if(usedCount > 64) {
      alert(
        'LVLLVL TEST01 - ECM REPACK\n\n' +
        'No se puede convertir sin perdida.\n' +
        'Se usan ' + usedCount + ' caracteres diferentes entre todas las frames y ECM admite 64 glifos fisicos.\n\n' +
        'No se hizo ningun cambio.'
      );
      return false;
    }

    // Same priority idea as the original C64 exporter: most used first.
    usage.sort(function(a, b) {
      if(b.timesUsed != a.timesUsed) return b.timesUsed - a.timesUsed;
      return a.c - b.c;
    });

    var charsetMap = [];
    for(i = 0; i < tileCount; i++) charsetMap[i] = -1;
    for(i = 0; i < usage.length; i++) charsetMap[usage[i].c] = i;

    // Validate all frame background requirements before mutating anything.
    var frameBGInfo = [];
    for(frameIndex = 0; frameIndex < this.frames.length; frameIndex++) {
      var frame = this.frames[frameIndex];
      var frameData2 = frame.data;
      if(!frameData2) {
        frameBGInfo[frameIndex] = null;
        continue;
      }

      var fallbackBG = this.getBackgroundColor(frameIndex);
      var counts = {};
      var colors = [];
      var distinct = 0;

      for(y = 0; y < this.getGridHeight(); y++) {
        for(x = 0; x < this.getGridWidth(); x++) {
          var cell2 = frameData2[y][x];
          if(!cell2) continue;
          var bg = cell2.bc;
          if(typeof bg == 'undefined' || bg === false || bg === noColor) bg = fallbackBG;
          if(typeof counts[bg] == 'undefined') {
            counts[bg] = 0;
            colors.push(bg);
            distinct++;
          }
          counts[bg]++;
        }
      }

      if(distinct > 4) {
        alert(
          'LVLLVL TEST01 - ECM REPACK\n\n' +
          'La Frame ' + (frameIndex + 1) + ' usa ' + distinct +
          ' fondos efectivos y ECM admite 4.\n\nNo se hizo ningun cambio.'
        );
        return false;
      }

      colors.sort(function(a, b) {
        if(counts[b] != counts[a]) return counts[b] - counts[a];
        return a - b;
      });

      if(colors.length === 0) colors.push(fallbackBG);
      while(colors.length < 4) colors.push(colors[colors.length - 1]);

      var bgMap = {};
      for(i = 0; i < 4; i++) bgMap[colors[i]] = i;

      frameBGInfo[frameIndex] = {
        fallbackBG: fallbackBG,
        colors: colors,
        map: bgMap
      };
    }

    // Snapshot and repack the first 64 ranked logical tile records.
    // Full records are copied, so pixels + Animated Char properties stay together.
    var packedTiles = [];
    var physicalCount = Math.min(64, usage.length);
    for(i = 0; i < physicalCount; i++) {
      packedTiles[i] = JSON.parse(JSON.stringify(tileSet.tileData[usage[i].c]));
    }
    for(i = 0; i < physicalCount; i++) {
      tileSet.tileData[i] = packedTiles[i];
      if(typeof tileSet.updateCharacterCurrentData == 'function') {
        tileSet.updateCharacterCurrentData(i);
      }
    }

    // ECM banks 64..255 become aliases. Remove stale animation metadata there.
    for(i = 64; i < Math.min(256, tileCount); i++) {
      if(tileSet.tileData[i] && tileSet.tileData[i].props) {
        tileSet.tileData[i].props.animated = false;
      }
    }

    // Rewrite cells as physical glyph (bits 0..5) + BG selector (bits 6..7).
    for(frameIndex = 0; frameIndex < this.frames.length; frameIndex++) {
      var frame3 = this.frames[frameIndex];
      var frameData3 = frame3.data;
      var bgInfo = frameBGInfo[frameIndex];
      if(!frameData3 || !bgInfo) continue;

      frame3.bgColor = bgInfo.colors[0];
      frame3.c64ECMColor1 = bgInfo.colors[1];
      frame3.c64ECMColor2 = bgInfo.colors[2];
      frame3.c64ECMColor3 = bgInfo.colors[3];

      for(y = 0; y < this.getGridHeight(); y++) {
        for(x = 0; x < this.getGridWidth(); x++) {
          var cell3 = frameData3[y][x];
          if(!cell3) continue;

          var oldChar = cell3.t;
          if(oldChar < 0 || oldChar >= charsetMap.length) oldChar = 0;
          var physicalChar = charsetMap[oldChar];

          if(physicalChar < 0 || physicalChar >= 64) {
            alert('LVLLVL TEST01: error interno de repaqueo de caracter ' + oldChar + '.');
            return false;
          }

          var oldBG = cell3.bc;
          if(typeof oldBG == 'undefined' || oldBG === false || oldBG === noColor) {
            oldBG = bgInfo.fallbackBG;
          }

          var bgIndex = bgInfo.map[oldBG];
          if(typeof bgIndex == 'undefined') {
            alert('LVLLVL TEST01: error interno de repaqueo de color.');
            return false;
          }

          cell3.t = (physicalChar & 0x3f) | ((bgIndex & 3) << 6);
          cell3.bc = bgIndex;
        }
      }
    }

    this.editor.modified();
    console.log('[LVLLVL TEST01] ECM repack PASS interno: ' + usedCount + ' glyphs usados.');
    return true;
  };

  LayerGrid.prototype.setMode = function(screenMode, callback) {
    if(
      screenMode == TextModeEditor.Mode.C64ECM &&
      this.doc.screenMode != TextModeEditor.Mode.C64ECM &&
      this.doc.screenMode != 'vector' &&
      !this._scummManualECMReady
    ) {
      if(!this.prepareTextModeToC64ECM()) {
        if(typeof callback != 'undefined') callback(false);
        return;
      }
    }
    return originalSetMode.call(this, screenMode, callback);
  };

  window.LVLLVL_TEST01_ECM_LIVE_REPACK = true;

  window.addEventListener('load', function() {
    var badge = document.createElement('div');
    badge.textContent = 'TEST01 · ECM LIVE REPACK';
    badge.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:999999;padding:6px 9px;background:rgba(0,0,0,.78);color:#fff;font:12px monospace;border:1px solid #888;pointer-events:none';
    document.body.appendChild(badge);
  });

  console.log('[LVLLVL TEST01] ECM LIVE REPACK instalado.');
})();