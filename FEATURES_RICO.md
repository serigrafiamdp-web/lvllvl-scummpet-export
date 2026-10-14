# FEATURES RICO

Validated state: **14 October 2026**

## RICO-ECM-01 — Live repack TEXTMODE -> C64 ECM

**PASS**

When artwork already exists in frames, changing from TEXTMODE to C64 Extended BG
Colour Mode no longer blindly aliases the 0..255 logical character space.

RICO:

- scans every frame before ECM is enabled;
- counts the logical characters actually used;
- prioritizes and packs those used glyphs into the 64 physical ECM slots;
- rewrites screen codes while preserving the ECM background selector in bits 6-7;
- aborts if a lossless conversion is not possible.

Validated result:

**Characters are reorganized without losing the artwork.**

## RICO-ECM-02 — Manual 64-glyph selection before drawing

**PASS**

When all frames are still empty, RICO opens `Edit Tile Palette` before entering ECM.

The user can choose which 64 glyphs from the currently loaded tileset will become the
physical ECM charset.

Supported source:

- normal/default tileset;
- custom loaded tileset;
- up to 256 source glyphs.

The selected glyphs become physical slots `$00-$3F`.

If artwork already exists, this manual path is skipped and RICO-ECM-01 handles the
conversion instead.

## RICO-ECM-03 — ECM -> ECM glyph reselection

**PASS in current milestone**

On the first manual conversion, RICO preserves the original source tileset.

While already in C64 ECM, choosing C64 Extended BG Colour Mode again reopens the same
palette selector.

This allows the user to:

- remove a glyph that was selected but is no longer needed;
- add a glyph that was left outside the original 64;
- keep already-used physical slots protected so existing screen codes are not silently
  broken.

## RICO-ECM-04 — Native-style Edit Tile Palette UI

**PASS**

The selector deliberately follows LVLLVL's own visual language instead of adding a new
diagnostic interface.

Validated UI:

- dialog title: `Edit Tile Palette`;
- left: current loaded source tileset;
- right: the 64 physical ECM glyphs only;
- no hexadecimal labels;
- no explanatory panels;
- no added diagnostic colours/borders;
- only `OK` and `Cancel`.

Interaction:

- click left glyph -> add to first free ECM slot;
- click right glyph -> remove it when safe;
- OK becomes valid once all 64 slots are filled.

## ECM contract kept by RICO

C64 ECM screen code:

- bits 0-5 = physical glyph 0..63;
- bits 6-7 = BG0..BG3 selector.

RICO does not change the C64 runtime engine to solve editor-side charset organization.

Glyph identity remains significant, especially for Animated Chars; visually identical
glyphs must not be silently deduplicated.

## Source layout

Promoted RICO modules:

- `src/js/rico/ricoEcmLiveRepack.js`
- `src/js/rico/ricoEcmGlyphPicker.js`
- `src/js/rico/ricoEcmGlyphReselect.js`
- `src/js/rico/ricoEcmNativePaletteUI.js`

Pages equivalents:

- `dist/js/rico/ricoEcmLiveRepack.js`
- `dist/js/rico/ricoEcmGlyphPicker.js`
- `dist/js/rico/ricoEcmGlyphReselect.js`
- `dist/js/rico/ricoEcmNativePaletteUI.js`

## Reference

Upstream baseline:

`jaammees/lvllvl @ b528e4c1d38faeadb0e24eb619705e4f0b8ab899`

## Deferred

Google Drive / OAuth is intentionally not part of this milestone.
Local file loading remains available and was sufficient for current testing.
