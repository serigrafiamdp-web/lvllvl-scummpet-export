(function() {
  'use strict';

  if(typeof ToPRGAdv === 'undefined' || typeof C64ASMSource === 'undefined') {
    console.error('[RICO TEST22] ToPRGAdv/C64ASMSource not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;
  var CHAR_BYTES = 8;
  var BANK1_ADDR = 0x3000;
  var BANK2_ADDR = 0x3800;
  var BANK_END_ADDR = 0x4000;
  var CONFIG_CUSTOM_CHARS_ADDR = 0x0812;
  var CONFIG_FRAME_PTR_LOW_ADDR = 0x0819;
  var CONFIG_FRAME_PTR_HIGH_ADDR = 0x081a;
  var FRAME_CORE_BYTES = 11;

  function patchPlayerSource() {
    if(window.__RICO_TEST22_PLAYER_PATCHED) return true;

    var source = C64ASMSource;
    if(typeof source !== 'string' || !source.length) return false;

    // When custom chars are enabled, start from BANK 1 ($3000). The active
    // frame will then select BANK 1 or BANK 2 after every screen-buffer swap.
    var setupRegex = /        lda \$d018\s*\n        ora #\$0e\s*\n        sta \$d018/;
    if(setupRegex.test(source)) {
      source = source.replace(setupRegex,
        '        lda $d018\n' +
        '        and #$f1\n' +
        '        ora #$0c\n' +
        '        sta $d018');
    } else {
      console.warn('[RICO TEST22] Could not find stock setup_custom_chars sequence.');
    }

    var swapNeedle = '        jsr swap_buffers\n\n        ; update colors...';
    if(source.indexOf(swapNeedle) !== -1) {
      source = source.replace(swapNeedle,
        '        jsr swap_buffers\n\n' +
        '        ; RICO TEST22: charset bank is stored in the standard-mode\n' +
        '        ; frame BG4 byte (1=bank1, 2=bank2). Screen codes stay 0..255.\n' +
        '        lda next_color_frame_bg4\n' +
        '        cmp #$02\n' +
        '        beq rico_frame_bank2\n' +
        'rico_frame_bank1\n' +
        '        lda $d018\n' +
        '        and #$f1\n' +
        '        ora #$0c      ; charset at $3000\n' +
        '        sta $d018\n' +
        '        jmp rico_frame_bank_done\n' +
        'rico_frame_bank2\n' +
        '        lda $d018\n' +
        '        and #$f1\n' +
        '        ora #$0e      ; charset at $3800\n' +
        '        sta $d018\n' +
        'rico_frame_bank_done\n\n' +
        '        ; update colors...');
    } else {
      console.error('[RICO TEST22] Could not find display_next_frame swap hook.');
      return false;
    }

    C64ASMSource = source;
    window.__RICO_TEST22_PLAYER_PATCHED = true;
    console.log('[RICO TEST22] PRG player patched for per-frame CHARSET BANK 1/2.');
    return true;
  }

  function getTileSet(editor) {
    try {
      var layer = editor && editor.layers ? editor.layers.getSelectedLayerObject() : null;
      if(layer && layer.getType && layer.getType() === 'grid' && layer.getTileSet) {
        return layer.getTileSet();
      }
      return editor && editor.tileSetManager && editor.tileSetManager.getCurrentTileSet
        ? editor.tileSetManager.getCurrentTileSet() : null;
    } catch(e) { return null; }
  }

  function getBank2(tileSet) {
    try {
      var record = tileSet && tileSet.getDocRecord ? tileSet.getDocRecord() : null;
      var stored = record && record.data ? record.data[BANK2_FIELD] : null;
      if(stored && stored.version === 1 && stored.tileData && stored.tileData.length >= BANK_SIZE) {
        return stored.tileData;
      }
    } catch(e) {}
    return null;
  }

  function getPixels(tile) {
    if(tile && tile.data && tile.data.length && tile.data[0]) return tile.data[0];
    return null;
  }

  function snapshotToCharsetBytes(tileData, fallbackTileData) {
    var out = new Uint8Array(BANK_SIZE * CHAR_BYTES);
    for(var c = 0; c < BANK_SIZE; c++) {
      var pixels = getPixels(tileData && tileData[c]);
      if(!pixels) pixels = getPixels(fallbackTileData && fallbackTileData[c]);
      if(!pixels) continue;

      for(var y = 0; y < 8; y++) {
        var b = 0;
        for(var x = 0; x < 8; x++) {
          var p = pixels[y * 8 + x];
          if(p) b |= (1 << (7 - x));
        }
        out[c * 8 + y] = b;
      }
    }
    return out;
  }

  function getFrameBank(editor, frameNumber) {
    try {
      var frames = editor && editor.graphic ? editor.graphic.frames : null;
      var frame = frames && frames[frameNumber - 1];
      return frame && parseInt(frame[FRAME_BANK_FIELD], 10) === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }

  function expandPlaybackFrames(entries) {
    var result = [];
    entries = entries || [];
    for(var i = 0; i < entries.length; i++) {
      var entry = entries[i] || {};
      if(entry.type === 'frame') {
        result.push(parseInt(entry.frame, 10) || 1);
      } else if(entry.type === 'frameRange') {
        var from = parseInt(entry.from, 10) || 1;
        var to = parseInt(entry.to, 10) || from;
        var step = to >= from ? 1 : -1;
        for(var f = from; f !== to + step; f += step) result.push(f);
      }
      // frameJump/gotorow do not contain a frame record themselves.
    }
    return result;
  }

  function addressToIndex(bytes, address) {
    if(!bytes || bytes.length < 2) return -1;
    var load = bytes[0] | (bytes[1] << 8);
    return 2 + (address - load);
  }

  function readByteAt(bytes, address) {
    var i = addressToIndex(bytes, address);
    return i >= 0 && i < bytes.length ? bytes[i] : 0;
  }

  function writeByteAt(bytes, address, value) {
    var i = addressToIndex(bytes, address);
    if(i >= 0 && i < bytes.length) bytes[i] = value & 255;
  }

  function ensureAddress(bytes, endAddressExclusive) {
    var load = bytes[0] | (bytes[1] << 8);
    var needed = 2 + (endAddressExclusive - load);
    if(bytes.length >= needed) return bytes;
    var grown = new Uint8Array(needed);
    grown.set(bytes);
    return grown;
  }

  function frameRecordNext(bytes, recordIndex) {
    // 11 fixed bytes, then the effect stream terminated by $00.
    var p = recordIndex + FRAME_CORE_BYTES;
    while(p < bytes.length) {
      var effect = bytes[p++];
      if(effect === 0) return p;
      if(effect === 1 || effect === 3) p += 2; // enable key/instrument + pointer
      else if(effect === 2 || effect === 4) {} // disable key/instrument
      else return p; // unknown effect: safest stop
    }
    return p;
  }

  function patchFrameBanks(bytes, editor, entries) {
    var ptrLow = readByteAt(bytes, CONFIG_FRAME_PTR_LOW_ADDR);
    var ptrHigh = readByteAt(bytes, CONFIG_FRAME_PTR_HIGH_ADDR);
    var tableAddress = ptrLow | (ptrHigh << 8);
    var p = addressToIndex(bytes, tableAddress);
    var playbackFrames = expandPlaybackFrames(entries);

    if(p < 2 || p >= bytes.length) {
      console.error('[RICO TEST22] Invalid frame table pointer $' + tableAddress.toString(16));
      return 0;
    }

    var patched = 0;
    for(var i = 0; i < playbackFrames.length && p < bytes.length; i++) {
      // A zero at record start is a jump entry, not a frame record.
      if(bytes[p] === 0) break;
      var bank = getFrameBank(editor, playbackFrames[i]);
      if(p + 10 >= bytes.length) break;
      bytes[p + 10] = bank; // BG4 byte repurposed in standard mode only.
      patched++;
      p = frameRecordNext(bytes, p);
    }
    return patched;
  }

  function patchPRG(bytes, editor, args) {
    if(!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    bytes = ensureAddress(bytes, BANK_END_ADDR);

    var tileSet = getTileSet(editor);
    if(!tileSet || !tileSet.tileData || tileSet.tileData.length < BANK_SIZE) {
      console.error('[RICO TEST22] Active tileset does not contain 256 BANK 1 glyphs.');
      return bytes;
    }

    var bank1 = snapshotToCharsetBytes(tileSet.tileData, tileSet.tileData);
    var bank2Data = getBank2(tileSet);
    var bank2 = snapshotToCharsetBytes(bank2Data || tileSet.tileData, tileSet.tileData);

    var bank1Index = addressToIndex(bytes, BANK1_ADDR);
    var bank2Index = addressToIndex(bytes, BANK2_ADDR);
    bytes.set(bank1, bank1Index);
    bytes.set(bank2, bank2Index);

    // Force RAM charset usage. BANK 1 is selected initially; every displayed
    // frame then selects its own bank from the patched frame-table byte.
    writeByteAt(bytes, CONFIG_CUSTOM_CHARS_ADDR, 1);

    var count = patchFrameBanks(bytes, editor, args.entries);
    console.log('[RICO TEST22] PRG patched: BANK1 $3000, BANK2 $3800, frame bank markers=' + count + '.');
    return bytes;
  }

  // Reserve $3000-$3fff before the stock allocator places frame/color data.
  // This prevents our two 2K charsets from overwriting exported animation data.
  var previousAssembleCode = ToPRGAdv.prototype.assembleCode;
  ToPRGAdv.prototype.assembleCode = function(code) {
    var result = previousAssembleCode.apply(this, arguments);
    if(this.__ricoDualBankExportActive && this.blocks) {
      this.blocks.push({
        start: BANK1_ADDR,
        end: BANK_END_ADDR,
        label: 'RICO CHARSET BANK 1 + BANK 2'
      });
    }
    return result;
  };

  var previousCreatePRG = ToPRGAdv.prototype.createPRG;
  ToPRGAdv.prototype.createPRG = function(args) {
    args = args || {};

    // TEST22 scope: standard character mode, PRG, no SID/music, no ECM/multicolor.
    var safeArgs = {};
    for(var key in args) if(args.hasOwnProperty(key)) safeArgs[key] = args[key];
    safeArgs.mode = 'standard';
    safeArgs.music = 'no';
    safeArgs.type = 'prg';
    safeArgs.sidData = null;
    safeArgs.keyTriggers = [];
    safeArgs.instrTriggers = [];

    var self = this;
    var originalDownload = window.download;
    if(typeof originalDownload !== 'function') {
      console.error('[RICO TEST22] Global download() not found.');
      return previousCreatePRG.call(this, safeArgs);
    }

    this.__ricoDualBankExportActive = true;
    window.download = function(data, filename, mimeType) {
      var patched = data;
      try {
        if((mimeType === 'application/prg') || (filename && /\.prg$/i.test(filename))) {
          patched = patchPRG(data, self.editor, safeArgs);
        }
      } catch(e) {
        console.error('[RICO TEST22] PRG patch failed.', e);
      }
      return originalDownload.call(window, patched, filename, mimeType);
    };

    try {
      return previousCreatePRG.call(this, safeArgs);
    } finally {
      this.__ricoDualBankExportActive = false;
      window.download = originalDownload;
    }
  };

  patchPlayerSource();

  // If ToPRGAdv happened to be initialised before this hook, rebuild its in-memory
  // main.asm once the editor is ready so it also receives the patched player.
  if(typeof UI !== 'undefined' && UI.on) {
    UI.on('ready', function() {
      setTimeout(function() {
        try {
          var editor = g_app && g_app.textModeEditor;
          if(editor && editor.toPrgAdv && editor.toPrgAdv.c64Asm && editor.toPrgAdv.c64Asm.init) {
            editor.toPrgAdv.c64Asm.init(editor);
          }
        } catch(e) {
          console.warn('[RICO TEST22] Could not refresh in-memory C64 ASM source.', e);
        }
      }, 0);
    });
  }

  window.RICO_TEST22_PRG_DUAL_BANK = true;
  console.log('[RICO TEST22] Direct PRG dual-bank export hook loaded (standard mode / no music).');
})();
