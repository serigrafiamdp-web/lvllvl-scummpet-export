# TEST366 — C64-only palette chooser

**Scope:** Cosmetic UI narrowing of the **Choose A Colour Palette** window only; no changes to palette data, image assets, import/export engines, C64 indices, canvas state, existing files, master branches or other screens.

## Change
The original LVLLVL chooser lists every platform in \`ColorPalettePresets\` and exposes three tabs: **System Palettes**, **Custom Palettes**, and **Load/Import Palette**. This C64-focused fork only needs:
- One visible list entry: **Commodore 64**.
- Its existing three option buttons: **Colodore / Pepto / VICE**.
- The remaining tab renamed **C64 Palettes**, with the other two tabs hidden in the UI.

The script overrides only \`ColorPaletteChoosePreset.showSystemColorPalettes\` and wraps \`show\` to hide unrelated tabs. It deliberately does **not** mutate the global presets registry or remove image files, does not disable internal import code, and does not change any renderer or PRG export path.

**Compatibility:** TEST356 index preservation, TEST364 fixed 16-swatch C64 reader (user PASS), and TEST365 restore selected RGB variant continue to handle the options and preview.

## Test matrix
1. Open the regular project URL, choose **Colour Palette**, confirm there are no platforms besides C64 and no Custom or Load/Import tab.
2. Confirm Colodore, Pepto, and VICE buttons and previews remain operable.
3. Choose VICE -> OK -> reopen chooser: VICE stays selected (TEST365).
4. New Project with Pepto: no 16-colors alert (TEST364).
5. Load a previous JSON and export a static and animated PRG, checking for regressions.

**Verification:** Local syntax and mocked desktop selector tested PASS. Real-browser acceptance **pending**. Changes were published to the normal GitHub Pages root at the user's request; rollback is possible using the preceding commit.