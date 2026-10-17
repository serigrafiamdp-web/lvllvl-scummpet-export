(function() {
  'use strict';

  if(typeof ToPRGAdv === 'undefined') {
    console.error('[RICO TEST104] ToPRGAdv not found.');
    return;
  }

  var BANK2_FIELD = 'ricoCharsetBank2';
  var FRAME_BANK_FIELD = 'charsetBank';
  var BANK_SIZE = 256;
  var CHAR_BYTES = 8;

  // CPU helper routine lives immediately before the two charsets.
  // Keep the whole region reserved so the stock frame allocator cannot use it.
  var SWITCH_ROUTINE_ADDR = 0x2fe0;
  var BANK1_ADDR = 0x3800;
  var BANK2_ADDR = 0x3000;
  var BANK_END_ADDR = 0x4000;

  var CONFIG_CUSTOM_CHARS_ADDR = 0x0812;
  var CONFIG_FRAME_PTR_LOW_ADDR = 0x0819;
  var CONFIG_FRAME_PTR_HIGH_ADDR = 0x081a;
  var FRAME_CORE_BYTES = 11;

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
          if(pixels[y * 8 + x]) b |= (1 << (7 - x));
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
    var p = recordIndex + FRAME_CORE_BYTES;
    while(p < bytes.length) {
      var effect = bytes[p++];
      if(effect === 0) return p;
      if(effect === 1 || effect === 3) p += 2;
      else if(effect === 2 || effect === 4) {}
      else return p;
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
      console.error('[RICO TEST104] Invalid frame table pointer $' + tableAddress.toString(16));
      return 0;
    }

    var patched = 0;
    for(var i = 0; i < playbackFrames.length && p < bytes.length; i++) {
      if(bytes[p] === 0) break;
      var bank = getFrameBank(editor, playbackFrames[i]);
      if(p + 10 >= bytes.length) break;
      bytes[p + 10] = bank; // Standard mode only: BG4 byte carries BANK 1/2.
      patched++;
      p = frameRecordNext(bytes, p);
    }
    return patched;
  }

  function findPattern(bytes, pattern, fromIndex) {
    var start = typeof fromIndex === 'number' ? fromIndex : 0;
    outer: for(var i = start; i <= bytes.length - pattern.length; i++) {
      for(var j = 0; j < pattern.length; j++) {
        if(pattern[j] !== null && bytes[i + j] !== pattern[j]) continue outer;
      }
      return i;
    }
    return -1;
  }

  function installSwitchRoutine(bytes) {
    // Entry: A = 1 (BANK 1) or 2 (BANK 2).
    // Only A/flags are changed; the caller immediately reloads A afterwards.
    //
    // cmp #$02
    // beq bank2
    // lda $d018 / and #$f1 / ora #$0c / sta $d018 / rts
    // bank2:
    // lda $d018 / and #$f1 / ora #$0e / sta $d018 / rts
    var routine = new Uint8Array([
      0xc9,0x02,
      0xf0,0x0b,
      0xad,0x18,0xd0,
      0x29,0xf1,
      0x09,0x0e,
      0x8d,0x18,0xd0,
      0x60,
      0xad,0x18,0xd0,
      0x29,0xf1,
      0x09,0x0c,
      0x8d,0x18,0xd0,
      0x60
    ]);
    var idx = addressToIndex(bytes, SWITCH_ROUTINE_ADDR);
    bytes.set(routine, idx);
  }

  function patchDisplayHook(bytes) {
    // Stock player sequence:
    // lda next_color_frame_bg1 / sta $d021
    // lda next_color_frame_bg2 / sta $d022
    // lda next_color_frame_bg3 / sta $d023
    // lda next_color_frame_bg4 / sta $d024
    //
    // In Standard Character Mode $d024 is not used. Replace only the final
    // STA (3 bytes) with JSR $2fe0 (also 3 bytes), so the stock player does
    // NOT grow and the fixed frame table near $1000 remains safe.
    var pattern = [
      0xad,null,0x0b, 0x8d,0x21,0xd0,
      0xad,null,0x0b, 0x8d,0x22,0xd0,
      0xad,null,0x0b, 0x8d,0x23,0xd0,
      0xad,null,0x0b, 0x8d,0x24,0xd0
    ];
    var p = findPattern(bytes, pattern, 0);
    if(p < 0) {
      console.error('[RICO TEST104] Could not locate display_next_frame color sequence.');
      return false;
    }
    var staD024 = p + 21;
    bytes[staD024] = 0x20; // JSR abs
    bytes[staD024 + 1] = SWITCH_ROUTINE_ADDR & 0xff;
    bytes[staD024 + 2] = SWITCH_ROUTINE_ADDR >> 8;
    return true;
  }

  function patchPRG(bytes, editor, args) {
    if(!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    bytes = ensureAddress(bytes, BANK_END_ADDR);

    var tileSet = getTileSet(editor);
    if(!tileSet || !tileSet.tileData || tileSet.tileData.length < BANK_SIZE) {
      console.error('[RICO TEST104] Active tileset does not contain 256 BANK 1 glyphs.');
      return bytes;
    }

    var bank1 = snapshotToCharsetBytes(tileSet.tileData, tileSet.tileData);
    var bank2Data = getBank2(tileSet);
    var bank2 = snapshotToCharsetBytes(bank2Data || tileSet.tileData, tileSet.tileData);

    bytes.set(bank1, addressToIndex(bytes, BANK1_ADDR));
    bytes.set(bank2, addressToIndex(bytes, BANK2_ADDR));

    installSwitchRoutine(bytes);
    if(!patchDisplayHook(bytes)) return bytes;

    // Enable RAM charset. The first displayed frame selects its own bank.
    writeByteAt(bytes, CONFIG_CUSTOM_CHARS_ADDR, 1);

    var count = patchFrameBanks(bytes, editor, args.entries);
    console.log('[RICO TEST104] PRG patched without growing player code: BANK1 $3800, BANK2 $3000, markers=' + count + '.');
    return bytes;
  }

  // Critical difference from TEST22:
  // do NOT modify C64ASMSource. TEST22 grew the stock player enough to cross
  // the exporter's fixed frame-table area around $0fff/$1000, so frame data
  // overwrote executable code. Here the assembled player stays byte-for-byte
  // stock size; we only reserve RAM and patch equal-length instructions later.
  var previousAssembleCode = ToPRGAdv.prototype.assembleCode;
  ToPRGAdv.prototype.assembleCode = function(code) {
    var result = previousAssembleCode.apply(this, arguments);
    if(this.__ricoDualBankExportActive && this.blocks) {
      this.blocks.push({
        start: SWITCH_ROUTINE_ADDR,
        end: BANK_END_ADDR,
        label: 'RICO BANK SWITCH + CHARSET BANK 1@3800 + BANK 2@3000'
      });
    }
    return result;
  };

  var previousCreatePRG = ToPRGAdv.prototype.createPRG;
  ToPRGAdv.prototype.createPRG = function(args) {
    args = args || {};

    var safeArgs = {};
    for(var key in args) if(args.hasOwnProperty(key)) safeArgs[key] = args[key];

    // TEST23 remains intentionally narrow.
    safeArgs.mode = 'standard';
    safeArgs.music = 'no';
    safeArgs.type = 'prg';
    safeArgs.sidData = null;
    safeArgs.keyTriggers = [];
    safeArgs.instrTriggers = [];

    var self = this;
    var originalDownload = window.download;
    if(typeof originalDownload !== 'function') {
      console.error('[RICO TEST104] Global download() not found.');
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
        console.error('[RICO TEST104] PRG patch failed.', e);
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

  window.RICO_TEST104_PRG_DUAL_BANK_ANIM_MEM_SWAP = true;
  console.log('[RICO TEST104] TEST104 memory probe loaded: BANK1 at $3800 for native James animate_chars; BANK2 at $3000.');
})();
