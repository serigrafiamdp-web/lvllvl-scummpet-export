/* TEST365 — Remember Commodore 64 palette option in chooser preview.
 * Original ColorPaletteChoosePreset.showSystemColorPalettes() calls
 * colorPaletteDialogSelect('c64_colodore') on every open, forcing the first
 * option even if the user last selected Pepto or VICE.
 * Affect the C64 option alone, without changing project colors, other presets,
 * 16-index protection (TEST356) or PNG extraction (TEST364).
 */
(function () {
  'use strict';
  if (typeof ColorPaletteChoosePreset === 'undefined') return;
  var proto = ColorPaletteChoosePreset.prototype;
  var originalSelect = proto.colorPaletteDialogSelect;
  if (typeof originalSelect !== 'function') return;

  var isC64Option = function (id) {
    return id === 'c64_colodore' || id === 'c64_pepto' || id === 'c64_vice';
  };
  var state = { version: 365, last: 'READY', option: null, restorations: 0 };

  proto.colorPaletteDialogSelect = function (preset) {
    // The currently displayed preset still holds the radio choice when this
    // dialog is about to rebuild its HTML or navigate to another system entry.
    var current = this.previewColorPalette;
    if (current && current.id === 'c64_colodore' && isC64Option(current.selectedPaletteId)) {
      this._ricoC64LastOption365 = current.selectedPaletteId;
    }

    var option = preset === 'c64_colodore' && isC64Option(this._ricoC64LastOption365)
      ? this._ricoC64LastOption365 : null;
    var originalPreview = this.previewFromPaletteImage;

    // Avoid briefly loading Colodore and then loading VICE/Pepto. The original
    // chooser builds the controls and makes one preview request.
    if (option && option !== 'c64_colodore' && typeof originalPreview === 'function') {
      this.previewFromPaletteImage = function (url) {
        if (url === 'palettes/c64_colodore.png') url = 'palettes/' + option + '.png';
        return originalPreview.call(this, url);
      };
    }
    var result;
    try {
      result = originalSelect.apply(this, arguments);
    } finally {
      this.previewFromPaletteImage = originalPreview;
    }

    if (preset === 'c64_colodore' && this.previewColorPalette && this.previewColorPalette.id === 'c64_colodore') {
      var chosen = option || 'c64_colodore';
      // Original code marks the first radio; align it with the actual preview.
      this.previewColorPalette.selectedPaletteId = chosen;
      if (typeof $ === 'function') {
        $('input[type=radio][name=colorPaletteOption]')
          .filter(function () { return this.value === chosen; })
          .prop('checked', true);
      }
      this._ricoC64LastOption365 = chosen;
      state.last = 'C64 OPTION RESTORED';
      state.option = chosen;
      if (option) state.restorations++;
    }
    return result;
  };
  if (typeof window !== 'undefined') window.RICO_TEST365_PALETTE = state;
  console.log('[TEST365] C64 preset option retained on chooser reopen.');
})();