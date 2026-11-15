/* TEST364 — C64 16-swatch PNG reader for TEST356.
 * The original generic image importer can return a non-16-color list; TEST356
 * correctly refuses to replace the C64 palette in that situation, but this
 * leaves New Project unfinished. For the three bundled C64 preset images only,
 * sample the documented 8 x 2 grid (8x8 pixels per swatch) directly.
 * No map indexes, export paths, or other palette formats are changed.
 */
(function () {
  'use strict';
  if (typeof ColorPaletteManager === 'undefined') return;
  var oldReader = ColorPaletteManager.prototype.colorPaletteFromPaletteImg;
  if (typeof oldReader !== 'function') return;
  var state = {
    version: 364, last: 'READY', preset: null, count: 0,
    grid: '8x2', loads: 0, errors: 0
  };

  function c64Preset(img) {
    var src = String(img && (img.currentSrc || img.src) || '');
    var match = /(?:^|\/)palettes\/(c64_(?:colodore|pepto|vice))\.png(?:[?#]|$)/i.exec(src);
    return match ? match[1].toLowerCase() : null;
  }

  ColorPaletteManager.prototype.colorPaletteFromPaletteImg = function (img, args) {
    var preset = c64Preset(img);
    if (!preset) return oldReader.apply(this, arguments);
    state.preset = preset;
    try {
      // These three bundled files are 64 x 16 px, with exactly 16 solid 8x8
      // blocks. Never deduplicate C64 color slots even if an adjustment causes
      // multiple slots to have the same RGB value.
      if (img.naturalWidth !== 64 || img.naturalHeight !== 16) {
        throw Error('Invalid ' + preset + ' palette grid: expected 64x16 PNG');
      }
      var canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 16;
      var ctx = canvas.getContext('2d');
      if (!ctx) throw Error('Canvas 2D unavailable while loading ' + preset);
      ctx.drawImage(img, 0, 0);
      var pixels = ctx.getImageData(0, 0, 64, 16);
      if (args && typeof ImageUtils !== 'undefined') {
        if (args.brightness) ImageUtils.adjustBrightness(pixels, args.brightness);
        if (args.saturation) ImageUtils.adjustSaturation(pixels, args.saturation);
        if (args.contrast) ImageUtils.adjustContrast(pixels, args.contrast);
      }
      var colors = [], map = [[], []];
      for (var row = 0; row < 2; row++) {
        for (var col = 0; col < 8; col++) {
          // Sample the center of each 8 x 8 swatch. Keep all 16 C64 indices.
          var offset = ((row * 8 + 4) * 64 + col * 8 + 4) * 4;
          var rgba = pixels.data;
          var a = rgba[offset + 3];
          if (!a) throw Error('Transparent ' + preset + ' swatch at C64 index ' + (row * 8 + col));
          var argb = ((a << 24) | (rgba[offset] << 16) |
                      (rgba[offset + 1] << 8) | rgba[offset + 2]) >>> 0;
          colors.push(argb);
          map[row].push(row * 8 + col);
        }
      }
      state.last = '16 COLORS LOADED';
      state.count = colors.length;
      state.loads++;
      return { colors: colors, colorsAcross: 8, map: map };
    } catch (err) {
      state.last = 'ERROR: ' + String(err && err.message || err);
      state.errors++;
      throw err;
    }
  };
  if (typeof window !== 'undefined') window.RICO_TEST364_PALETTE = state;
  console.log('[TEST364] Fixed-grid C64 palette reader active; TEST356 index preservation retained.');
})();