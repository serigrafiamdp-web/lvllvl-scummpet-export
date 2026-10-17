# FEATURES RICO

Validated state: **17 October 2026**

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


## RICO-ANIM-120 — Isolated Animated Chars renderer

**PASS — 17 October 2026**

The editor-side Animated Chars path no longer invalidates or repaints the whole UI on every character phase.

Validated behavior:

- character pixel data continues advancing at its configured `ticksPerFrame`;
- `currentTile.canvasDrawCharacters()` is muted during the animation tick;
- main and side tile-palette redraws are muted during the animation tick;
- `Graphic.invalidateAllCells()` is not allowed to dirty the whole grid from that tick;
- `Graphic.redraw()` is not called globally from that tick;
- the wrapper snapshots `currentTileData` before/after the update, detects the glyph IDs that actually changed, and redraws only map cells that use those IDs;
- general canvas/UI flicker disappears while character motion remains visible.

This was validated by the downloadable TEST120 ZIP. TEST118 was the diagnostic proof: disabling `TileSet.update()` removed both flicker and character motion. TEST119 restored movement but still allowed UI repaint. TEST120 isolates the visual update correctly.

### C64 native animation memory map

For the exported PRG path, native James `animate_chars` writes at `$3800`. The validated dual-bank mapping is therefore:

- BANK 1: `$3800-$3FFF`
- BANK 2: `$3000-$37FF`

Frame bank selection still updates `$D018`.

### MASTER identity

- MASTER: `MASTER_LVL-RICO_17_OCTUBRE_2026.zip`
- SHA256: `7b98cb59532394b99410a9d26c5b90259b04ec21666f0c7ec6006479c96f709d`
- Source validation base: `LVLLVL_TEST120_ISOLATED_CHAR_RENDER.zip`
- Pages exact-payload commit: `725930f44f3beb84ffee8fe07c771e438ee0546a`

