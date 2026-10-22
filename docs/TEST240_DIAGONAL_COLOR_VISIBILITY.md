# TEST240 — Diagonal Color RAM visibility optimization

Base: TEST239 from TEST236. Experimental. No promotion to MASTER. Does not adopt TEST238 full-page IRQ copy.

## Observation
One foreground color skips per-frame Color RAM entirely and is very fast. Multicolor invokes shadow preparation + sparse compare/commit, or an export-time RLE phase planner.

## Optimization
- Visible cell = active charset glyph has at least one lit pixel AND foreground color differs from $D021 background.
- Black is not inherently invisible when background is nonblack.
- If the destination glyph is invisible, its Color RAM value can remain stale: changing it will not affect visible pixels.
- When destination becomes visible, verify/write desired color even if prior logical color matches (the RAM might be stale).
- Never replace any visual glyph or reduce the 16-color palette.

Tier 1: if classic TEST221B RLE does not fit, try the existing TEST236 deduplicated RLE table builder with only the required visible writes. Keep 6502 RLE executor and address ranges as-is.

Tier 2: if RLE still cannot fit and at least 50% of all source-map cells are invisible, put an invisibility flag (bit 7) in world_color_data while keeping its low color nibble unchanged. Prepend `LDA shadow / BMI next` to existing per-page sparse comparisons. Original sparse writes in IRQ remain intact; no full IRQ 1000-color copy. Source color data is modified **only** in the fallback path.

All other routes, uniform-color fast mode, Group Animate, SID, the horizontal and vertical engines, and the diagonal screen copy are unchanged. With fewer than 50% invisible cells and no RLE fit, the older fallback remains exactly unchanged.

## Checks
- 64 synthesized source generation checks (four diagonals × BANK1/2 × two backgrounds × four visibility densities): 64/64 generated without exceptions, existing fast path source stays unchanged; 48 visibility-sparse fallback cases and 16 untouched old fallback cases.
- 24 Color RAM RLE cases, 8 fitting tables; 8/8 pixel-visibility simulations stayed correct through the full repeating camera cycle (4 diagonals, two backgrounds); no discrepancies. Cases without fitting tables still need VICE observation.
- JavaScript syntax PASS. 6502 assembly and speed/flicker in VICE NOT YET VALIDATED.

## Test conditions
Same 40x25+ scroll artwork with background black, two or more foreground colors, Ticks/Step 1, Pixels/Step 8, and all four diagonals. Re-export from isolated test page, watch possible top-row seam, charset bank, and color transition correctness. Compare with TEST239 (mono baseline) and TEST236 (multicolor baseline).

Browser: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test240/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test240-diagonal-invisible-color-rle.zip

Inspect `window.RICO_TEST236_LAST_BUILD`:
- `visibility-sparse-fallback`: invisible positions skipped in 1000-cell color scan; visible colors still compare and commit.
- `deduplicated-RLE-fast` with `visibilityAware:true`: optimized RLE plan fits.
- `RLE-optimized-executor`: original known-fast RLE retained.
- `original fallback`: map not eligible, no change expected.

If any visual problem, use TEST239 or TEST236 and report FAIL; preserve MASTER.
