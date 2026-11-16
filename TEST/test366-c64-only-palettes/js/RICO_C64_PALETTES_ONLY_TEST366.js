/* TEST366 — Commodore 64 palettes only in the chooser.
 * Hide non-C64 preset entries and the Custom/Load tabs at the UI layer only.
 * Preserve the original palette registry, import code, existing projects,
 * TEST364 image reading and TEST365 C64 variant-selection memory.
 */
(function () {
  'use strict';
  if (typeof ColorPaletteChoosePreset === 'undefined' || typeof $ !== 'function') return;
  var proto = ColorPaletteChoosePreset.prototype;
  var originalShow = proto.show;
  if (typeof originalShow !== 'function' ||
      typeof proto.colorPaletteDialogSelect !== 'function') return;

  var state = { version: 366, last: 'READY', visiblePresets: ['c64_colodore'], renders: 0, opens: 0 };

  proto.showSystemColorPalettes = function () {
    // The only system choice exposed is C64.  The three RGB variants are
    // already implemented as radio buttons by colorPaletteDialogSelect().
    // Calling that method also lets TEST365 restore Pepto/VICE on reopen.
    this.colorPalettes = ['c64_colodore'];
    $('#chooseColorPaletteList').html(
      '<div class="colorPaletteListEntry colorPaletteListEntrySelected" value="c64_colodore">Commodore 64</div>'
    );
    this.colorPaletteDialogSelect('c64_colodore');
    state.last = 'C64 ONLY';
    state.renders++;
  };

  function hideOtherTabs(chooser) {
    var tabs = chooser.tabPanel;
    if (!tabs || typeof tabs.getTabIndex !== 'function') return;
    var unwanted = ['custom', 'load'];
    for (var i = 0; i < unwanted.length; i++) {
      var key = unwanted[i];
      var index = tabs.getTabIndex(key);
      if (index === -1) continue;
      // visible=false also applies if the header has not yet been rendered.
      var tab = typeof tabs.getTabData === 'function' ? tabs.getTabData(index) : null;
      if (tab) tab.visible = false;
      if (typeof tabs.setTabVisible === 'function') tabs.setTabVisible(key, false);
    }
    var system = tabs.getTabIndex('system');
    if (system !== -1 && typeof tabs.setTabLabel === 'function') {
      tabs.setTabLabel(system, 'C64 Palettes');
    }
  }

  proto.show = function (args) {
    // Keep callbacks and creation options, but never reopen on a hidden tab.
    // Do not mutate caller-supplied options.
    var options = args;
    if (args && (args.tab === 'load' || args.tab === 'custom')) {
      options = Object.assign({}, args, { tab: 'system' });
    }
    var result = originalShow.call(this, options);
    hideOtherTabs(this);
    state.opens++;
    return result;
  };

  if (typeof window !== 'undefined') window.RICO_TEST366_PALETTES = state;
  console.log('[TEST366] Palette chooser shows C64 only; Custom and Load tabs hidden.');
})();