# TEST354 — CALACA SCROLL, diagonal multiframe (experimental)

**Base:** TEST353 (isolated). The home page, frozen MASTER branches and previously approved export paths remain unchanged.

## Purpose
Export the provided CALACA SCROLL (2).json (imported by the user locally) without changing its project data:
- C64 Standard Text, 40×40 map, four 255-tick frames, BANK1.
- Window 40×25 at (0,0); source Scroll Area 33×25 at (3,0), same in all frames.
- Directions in order: Up-Left, Up-Right, Down-Right, Down-Left.
- Each direction uses 4 pixels per step, 1 tick per step.
- The four maps, colors and 256 glyphs are identical; only direction changes.
- Repeated source tiles wrap around in X/Y even when the Scroll Area is **smaller than** the 40×25 window, as in the editor.

## Implementation
- Dedicated opt-in `ToPRGAdv.createPRG` wrapper appended after TEST353; delegates all non-matching project configurations to the existing exporter.
- Uses the TEST196 native 40×25 diagonal generator **generic per-cell wrapping path**, not the fixed-direction TEST221 speed optimization.
- Supports a shared, unchanged 8×8 charset and identical frame maps. Doesn't edit the JSON, preview or existing export code.
- Dynamically reads the 4 direction signs from a 4-entry table and 16-bit frame durations from a 4-entry table; at change of frame, resets camera and fine-scroll phase just like preview.
- No automatic fallback to static PRG upon errors; `window.RICO_TEST354_DIAGONAL_FRAMES.state` records last result or error.
- Disables this new route **only** when unrelated requirements (different drawing, Bank2 changes, group/individual animation, SID, non-compatible geometry) require the existing exporter. These requirements have **not** been removed globally.

## Validation status
- JavaScript syntax: PASS.
- Synthetic collector with 40×40 and matching four 33×25 source frames: PASS; shared camera begins at (30,0) after wrapping the area origin (3,0).
- Native ASM source generation via the project TEST196 generator: PASS (four direction and duration tables present, no duplicate source labels in the synthetic case).
- **Original uploaded CALACA SCROLL (2).json analyzed end-to-end:** collector accepted all 4 identical frames and preserved 33×25 source area; the project's own native `Assembler` generated a 38,916-byte PRG without errors (load $0801, end $A003) using the unmodified user JSON. [Download independent compiled PRG](CALACA_SCROLL_TEST354.prg).
- **Export PRG button in the browser: user reported no download.** Investigating route differences in the UI. The test now shows an explicit rejection reason if the 4-frame diagonal configuration isn't selected, instead of silently delegating to the older exporter. Diagnostic: `window.RICO_TEST354_DIAGONAL_FRAMES.state`.
- **VICE execution: NOT YET TESTED.**
- Performance: unverified. This initial route favors geometry and frame correctness over diagonal acceleration. At 4 px/tick it may run below target speed while the 40×25 render finishes.

## User test
1. Open https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test354-calaca-diagonal-frames/
2. Hard refresh (Ctrl+F5), import `CALACA SCROLL (2).json`.
3. Choose C64 Standard Text and Export PRG (without SID on this first pass).
4. If a PRG downloads, run in VICE PAL. Check 33-column source looping over the 40-column viewport and four consecutive diagonal directions, **without** flicker or broken colors.
5. If export fails, copy the dialog and inspect `window.RICO_TEST354_DIAGONAL_FRAMES.state.lastError`; do not label PASS.

Do not promote to root, TEST352, MASTER or change the project's original source before **VICE PASS**.
