# TEST364 — C64 Palette Recovery (New Project / preset switch)

**Status:** isolated test, not user PASS. The production root and frozen MASTER branches are unchanged.

## Reproduction
Artist Lobo: after **New Project**, choose a C64 palette (Pepto or another preset). The browser alerts:
"TEST356: C64 c64_colodore: expected exactly 16 palette entries" and interrupts the project/palette setup.

## Root of the alert and scope of fix
The alert is thrown in TEST356's \`preserveIndices\` validator when the generic \`ColorPaletteManager.colorPaletteFromPaletteImg\` does not deliver exactly 16 entries. The three repository PNGs (\`c64_colodore.png\`, \`c64_pepto.png\`, \`c64_vice.png\`) are all 64x16: 8 columns by 2 rows of 8x8 solid-color blocks. The actual browser condition that made the generic reader return a different count was not yet reproduced.

TEST364 overrides only this image-to-palette reader for those **three exact C64 PNG names**. It samples the center of all 16 cells in original C64 index order, without deduplication; passes through brightness, saturation and contrast adjustments; and returns the original {colors, colorsAcross, map} shape. Every other image and palette format goes through the original reader. Existing TEST356 logic remains responsible for preserving C64 indices and UI callbacks. No PRG/ASM/export/dock functionality changes.

## How to test
1. Open https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test364-c64-palette-reader/
2. Choose **New Project**, then choose **Colodore**, **Pepto** and **VICE** and finish creating the project each time. No browser alert should appear, all sixteen swatches should show.
3. In an existing drawing, mark several distinct color indices, switch between those three palettes, verify index positions stay fixed and only RGB display colors change.
4. Try a non-C64 palette to verify that the original importer still works.
5. Optional browser-console diagnostic: \`window.RICO_TEST364_PALETTE\`; expected \`last: '16 COLORS LOADED', count: 16, errors: 0\` after selecting a C64 palette.

## Verification
JavaScript syntax and mocked image/canvas test: PASS (16 positions, index order, other palette delegated). User browser New Project test: **pending**. No user PASS claimed.