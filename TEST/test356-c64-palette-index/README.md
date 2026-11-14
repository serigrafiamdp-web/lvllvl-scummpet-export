# TEST356 — C64 palette switching preserves color indices

**Live:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test356-c64-palette-index/

**Base:** isolated TEST355 on gh-pages. Only one additional JavaScript patch runs last. Main root, MASTER versions, .c importer and PRG exporter have NOT been edited.

## Root cause (from original LVLLVL source)

The .c importer reads character and C64 color indices directly. The palette selector calls ColorPalette.setColors(), which does a nearest-RGB matching pass and invokes layer.replaceColor(oldIndex,newIndex) on all layers. On Colodore -> VICE -> Pepto, this can rearrange C64 indices, even though all three palettes represent the same 16 hardware colors with different RGB values. This matches the tester's and user's screenshots.

The three C64 palette PNG assets are unchanged from upstream (matching SHA values in jaammees/lvllvl).

## TEST356 code change

- Covers both ColorPaletteChoosePreset.choosePreset (Colours > Choose a Colour Palette) and ColorPaletteManager.choosePreset (internal preset loading).
- For built-in presets c64_colodore, c64_pepto, c64_vice only: verifies exactly 16 colors; calls the original setColors to retain rendering/cache/UI work while temporarily suppressing only per-layer replaceColor during that synchronous call; then restores original replaceColor in finally.
- Keeps each cell foreground/background and frame background/border color index unchanged.
- Preserves the existing full 8x2 indexed palette map for the UI selector.
- All non-C64 palettes and preview-only paths delegate to the untouched original methods.
- Does not change export logic, character data, or Map Scroll / Group Animate / SID code.

## Tests already executed locally

A Node.js synthetic harness passed: internal route, UI route, repeated switches, 16 indexed palette cells, preservation of foreground/background/border, non-C64 delegate paths, preview-only delegate and restoration of the original replaceColor function.

This is **not yet a browser PASS or VICE PASS**. Those require actual user confirmation with the same .c art.

## Browser test

1. Open TEST356 and load the 40x25 file LVLLVL_TEST356_16_COLORES_MARQ.c.
2. Use Colours > Choose a Colour Palette: Colodore -> VICE -> Pepto -> Colodore.
3. All 16 color blocks should keep their fixed places/indices. Only the RGB shades should change. Border and background indices must stay fixed.
4. Optional debug in the console: window.RICO_TEST356_PALETTE.state should report last "INDEX PRESERVED", source "UI", colorCount 16.
5. If it passes, verify non-C64 palette behavior and a PRG in VICE for regression.

No MASTER/root promotion without explicit user PASS.