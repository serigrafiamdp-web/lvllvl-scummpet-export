# TEST244 — DEMOSCENE / DIRECT COLOR RAM + TWO RASTER PHASES

**Status:** Synthetic ASM / source checks PASS; **VICE PRG export not yet confirmed**. Branch only, no MASTER promotion. TEST242/TEST243 remain FAIL.

## Baseline

Starts at `release/test239-diagonal-uniform-bank1-fix` (including TEST236 existing faster RLE path), not the progressively slower TEST240/241/242/243.

## Core experiment

VIC-II cannot page-swap $D800 Color RAM, unlike double-buffered character screen $0400/$0800. The previous tests spent cycles re-building shadow colors, scanning 1000 cells, constructing sparse lists, and committing IRQ deltas.

TEST244 instead moves Color RAM **directly, behind the raster**, following known C64 smooth-scrolling practice; no color comparisons or sparse update preparation:

1. Main loop uses untouched `diag_shift221` to prepare the *character screen* back buffer. It sets `prep_ready`.
2. New IRQ at raster **$A0 (160)**: after upper rows have already been drawn, generate 480 direct absolute **LDA $Dxxx / STA $Dyyy** copies to shift the top 12 rows of Color RAM (source stride **+39 or +41**). Fill the new column colors of rows 0..9. This is ordered ascending so it cannot overwrite the source of subsequent copies.
3. New IRQ at raster **$FA (250)**: write the remaining 480 colors, fill column rows 10..24, and fill the entire incoming last row. Then swap the completed character screen and apply fine scroll, while the raster is inside the lower border/next frame pre-display. Timer proceeds only when no update is pending, maintaining previous safety guards.
4. Costs of the generated 480 cell shifts are exactly **3,840 cycles per half** plus RTS; code resides in unused **$A100-$AC40** and **$B800-$C340**; the SID reserve **$B000-$B7FF** remains untouched. The entering edge loops add further cycles; their split 10/15 balances raster deadlines.

Code bank 1 (custom glyphs), bank 2, world map and original char scroll remain intact. Single-color route and previous TEST236 RLE route are not changed.

## Eligibility

This initial conservative test enables for *upward* diagonal scroll only (**Up Left, Up Right**, direction property `dir.y=-1`), where a positive source stride makes ascending in-place Color RAM shifts safe. Requires fast doubled row map, multicolor, no Group Animate, areaHeight<=231 and no previously selected TEST236 RLE route.

**Down Left / Down Right** and all ineligible maps use the unchanged TEST239/236 fallback; improvements are not expected there yet. Raster timing is PAL-oriented and needs testing on NTSC before any use outside PAL.

## Preliminary validation — NOT VICE

- 24 simulated arbitrary-color map cases across multiple widths, both upward diagonals and four content patterns: **36,352 full 1000-cell frames** with no wrong colors.
- 32 generated-source configurations across four directions, both banks, monochrome/multicolor and two color distributions: exactly 8 selected and 24 unchanged original fallback, no JS exceptions.
- Generated Color RAM absolute-copy instructions: **480 stores upper + 480 stores lower**, source/destination ordering validated for positive strides +39/+41.
- Static local branch-offset checks passed (not a machine-code assembly).
- Code bank footprints: upper $A100-$AC40 (2881 bytes), lower $B800-$C340 (2881 bytes). Sid code bank B000-B7FF untouched.
- 6502 estimated cycle budget: 3,846 cycles each absolute unrolled transfer including RTS, plus upper 10 edge cells / lower 15 edge cells and full final 40-char row. Must verify that ISR meets actual raster deadline on VICE x64sc, including badlines and any SID time.
- **No assertion of speed increase or raster-perfect rendering yet.** If striped colors, upper-line bug, jitter or worse FPS appear, TEST244 is FAIL.

## Test instructions

Isolated TEST244 web:
https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test244/

Full ZIP:
https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test244-direct-color-raster.zip

Use exact map from `TERRY COLORES LENTO.prg`, Bank1, `Diagonal Up Left`, Pixels/Step 8, Ticks/Step 1. Export and run in VICE PAL. In browser console after export:

`window.RICO_TEST244_LAST_BUILD`

Expected: `selected:true, mode:'two-stage-raster-direct-color', unrolledCyclesPerHalf:3846`.

Check (1) all original color transitions, (2) no seam/top-line break, (3) no shifted Bank2 glyphs, (4) smoother and stable camera pace, (5) SID still sounds correct if used.

Do not update main gh-pages root or MASTER until user's actual PASS.
