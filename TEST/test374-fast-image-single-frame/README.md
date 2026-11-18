# TEST374 — One-frame C64 artwork scroll optimization

**18 November 2026.** Published for testing. **VICE PASS not yet confirmed.**

## Input and cause
The user provided `SCROLL UNA FRAME MUY LENTO.json` (not committed). It has a single 40×25 image, BANK 1, 33×25 Window (x=3,y=0), matching Scroll Area, and Right at **8 pixels/step, 1 tick/step**. No native glyph or Group animations. The sample has roughly **278 Color RAM changes per horizontal character shift**. The prior engine applied **40 color changes per IRQ** and could therefore need at least **7 IRQ batches**, even with speed set to 8px/1tick.

## Isolated change
Copied the existing single-frame exporter `js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` with only two conditional changes for this **exact image route**:
1. One-pass color delta builder rather than the two-pass visible/blank scans.
2. Up to **144** Color RAM patches per IRQ rather than 40, only for this route. The rest remain 40.
The engine continues to use its double buffer, bitmap/color tables, frame renderer, original state/Window/Scroll Area, no data deletion or speed change. The expected minimum IRQ color patch count drops from 7 to 2. Preparation and PAL frame budget can still introduce stalls — **no claim of 50fps or PASS before VICE**.

The C64 PAL IRQ budget is approximately 19.7k CPU cycles per 50Hz frame; 144 color writes are deliberately bounded. Probe for flicker/tearing and raster overrun.

## Test
Export the same JSON through the normal C64 PRG export, run in VICE PAL, compare speed/continuity/color against the previous PRG. Verify only the intended 33 columns move and the surrounding scene stays unchanged. Also test a 1px/1tick project and an unrelated Group/SID project to verify no regression.

## Rollback
The original `js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` is unchanged; restore that script reference in `gh-pages/index.html` if needed.
Debug: `window.RICO_TEST374_IMAGE_SCROLL.last`.
