# TEST182 — Map Scroll + Native Individual + Group Scroll Up + Switch Bank

**2026-10-21. TEST181 visual PASS confirmed by user; TEST180 visual PASS.**
**TEST182**: actual LVLLVL 6502 assembler PASS, user VICE visual test PENDING. MASTER 20 October preserved.

## Diagnosis
TEST181's large-map runtime only discovered native char animation when it also found a Group Switch Bank. Ordinary individual animated glyphs were silently ignored. Group Scroll Up had no runtime in the large-map exporter at all. Map Scroll worked, but both sorts of character animation stopped.

## Implementation
- Detect independent individual-character animation settings for all visible codes across both stored banks (if available), even without Switch Bank.
- Detect one explicit Group Animate Scroll Up (BANK1 or BANK2); validate each cell is unique and rectangular. It never infers a group from empty index slots.
- Use the original immutable two-copy group source for pixel-continuous cyclic Group Scroll Up. Empty characters stay protected if Animate Empty Characters is false.
- Runtime group clock: 1px/tick for legacy 2x8 1T; otherwise 2px per group tick consistent with TEST165.
- IRQ gives priority to Map Scroll and optionally ticks individual records, group countdown, and hardware $D018 bank switch. Character updates take place in the main loop **one native record or one group column at a time**, yielding to pending map preparation.
- Protected RAM: existing character bank 1 $3000, bank 2 $3800; group source+small routine dynamically allocated >=$A000 with independent ZP pointers $35..$38. No clash with map $4000 or colors $7000 and no code/data overlap.
- If no animations are configured: exactly the same generated ASM as TEST181.
- Source wide map (TERRY 45x32) still projects Window X2..41 vertically without changing user's artwork.

## Validated
Real LVLLVL JavaScript 6502 assembler with TERRY original 45x32 map and synthetic animation metadata:
- PASS 8 combos: Map only; native only; Group only; Switch only; native+Group; native+Switch; Group+Switch; all three+Map.
- PASS group sizes 1x32, 2x8 legacy 1T, 3x5 in Bank2, 16x16 (256 tiles).
- PASS charset/mutable group pointers memory layout, no group source overlaps.
- PASS no-animation exact ASM regression vs TEST181, 45x32 Window projection, no silent legacy fallback.
- PASS original TERRY JSON unchanged.
- 3 compiled PRG demos under `DEMOS_VICE/TEST182_TERRY45X32_*.prg`.
- **NOT YET VICE PASS**: actual IRQ timing, ghost bytes under high load, and visible step rates require PAL playback and >30 sec continuous tests.

## Scope
- Large-map **vertical Up/Down** Map Scroll, including editable Screen width >40 and 40-wide Rico's Window. The existing horizontal wide-map player is not implemented and remains explicitly rejected.
- Single Group Scroll Up with optional single Switch Bank. Group directions other than Up are not silently exported (need their own future runtime).
- Individual and group animations cannot write the **same glyph in the same bank**: clear error instead of producing corrupt or contradictory results. Independent codes and banks work in parallel.
- This test doesn't change existing TEST77 small-map exporter or preview.

ZIP: `LVLLVL_TEST182_MAP_SCROLL_INDIVIDUAL_GROUP_SWITCH_WEB_LOCAL.zip`
SHA256: `7c7d72d84a8f0889f1202d96297e9e8e852b3a99d83acd434cc548348450cba0`
Protect original MASTER: `release/master-lvl-rico-20-oct-2026`.
