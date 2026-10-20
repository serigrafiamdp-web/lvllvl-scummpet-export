# TEST176 — IRQ Map Scroll Priority + Background Dual Charset Animation

Date: 20 October 2026. Status: **ASM/REGRESSION/STRESS PASS; VICE VISUAL PENDING**.
Base: TEST175 (visual FAIL); TEST174 PASS protected, MASTER 20 October 2026 unchanged.

## Root cause
TEST175 performed every BANK1/BANK2 individual-character update in the raster IRQ **before** the Map Scroll tick, potentially processing up to 512 animations per PAL frame. This can starve the map-preparation/main-loop pipeline, stall scrolling and delay IRQ over the visible border.

## Correction
- Large maps 40×N with vertical Map Scroll: IRQ acknowledges VIC raster, processes map tick first, calls $D018 BANK1/2 switch at the independent switch tick, increments capped native-animation work counter. The main loop *prioritizes screen-buffer preparation* and then updates one native-character record (from BANK1 $3000 or BANK2 $3800) per iteration, yielding to the map between records.
- 40×25 maps and large-map horizontal projections: same principle in TEST77, with `anim176_pending` and `anim176_active`; Switch Bank remains IRQ synchronized.
- Both banks retain their independent individual-character directions, counters and pixels, including when one is invisible. No GUI setting disables another.
- Legacy paths without the combination are byte-for-byte identical to TEST175 in regression scenarios.

## Automated tests
- PASS assembler: mixed Map Up/Down 40×50; Map Up 40×25; Map Left 40×50.
- PASS byte-identical PRG regressions without Group Switch in those scenarios.
- PASS stress compilation at 4, 32, 64, 128 and **256 animated characters in EACH bank**, with 512 5-byte records ending at $2EC2, leaving >300 bytes before charset $3000.
- PASS small-map runtime code ends at $2EFC before $3000.
- NO visual VICE PASS yet; *ghost bytes* at the bottom border could be a separate VIC-II 25-row/fine-scroll issue and must be re-tested. No modification of 25-row viewport or last byte $3FFF of BANK2 charset.
- At very high counts, physics imposes throughput limits; the scheduler protects Map Scroll but may not animate 512 glyphs at 1 tick simultaneously.

## Artifact
`LVLLVL_TEST176_MAP_SCROLL_IRQ_PRIORITY_WEB_LOCAL.zip`
SHA256: `4e8aa445bb9b11e4be5176e7f97d8cb24d2006fab507b3397e3f3b8ac1c789a1`
4 PRGs under `DEMOS_VICE/TEST176_*.prg`.
Master unchanged: `release/master-lvl-rico-20-oct-2026`.

Request user to test >30 seconds in VICE: map progress, BANK1/BANK2 individual scroll, Switch Bank, last border row.
