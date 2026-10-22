# TEST238 — Diagonal Map Scroll / direct full Color RAM fallback

Base: `release/test236-diagonal-dual-fast-color-only`. Independent experiment; not promoted to MASTER.

## Single change
After TEST236, if the optimized RLE stream is unavailable **and** the diagonal uses duplicated map rows, has more than one color, and does not use Group Animate:
- Keep `diag_shift221` and edge regeneration **unchanged**.
- Keep `diag_colors221` staging the 1000 colors in RAM at `$0C00`.
- Skip `prepare_sparse_colors203`, which scans and packs up to 1024 differences.
- Replace `commit_sparse_colors203` in the IRQ with the existing, previously used `commit_colors199` direct full page copy from `$0C00` to Color RAM `$D800`.

TEST236 RLE-selected fast path, uniform color, non-fast-row fallbacks, Group Animate, cardinal scroll, SID and controls are unchanged.

## Why test
For dense multicolor maps TEST236 can exhaust its RLE table memory and fall back to compare-and-index every cell, then indirect color writes in the IRQ. Direct copying costs more when few colors differ, but should save CPU when almost all differ. Raster/color artifacts are possible; only VICE inspection determines PASS.

## Validation
- JS parser: PASS.
- Source transformer mock: PASS for dense fallback, uniform unmodified, RLE selected unmodified.
- Assembled C64 PRG: not independently verified.
- Real VICE speed/visual: **PENDING USER TEST**.

## Test conditions
256 independent tile indexes, complete map, many different colors, 8 pixels/step, 1 tick, all four diagonal directions. Inspect flicker, color boundaries, and real cadence. Do not treat compilation or a smooth preview as PASS.

## Artifacts
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test238-diagonal-full-color-commit.zip
- Isolated web: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test238/
- Main `gh-pages/index.html` and frozen MASTER not modified for the test.
