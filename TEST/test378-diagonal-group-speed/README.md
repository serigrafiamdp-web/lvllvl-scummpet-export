# TEST378 — Recover diagonal multiframe speed and visible Group Animate

**19 November 2026. Integrated for VICE validation.**

## Regression after TEST377
The native diagonal multiframe path preserved frame changes but deliberately disabled the source-row fast path. It rendered all 40x25 C64 screen cells using per-character modulo wrap, causing slow PRG playback. The main loop also prioritized a new map preparation request ahead of pending Group Animate work. The group and the frame scheduler existed in the ASM, but expensive repeated screen rendering could starve visible character updates.

## Fix
1. **Padded source rows in RAM:** duplicate each row enough times that 40 consecutive character/color bytes can be copied from *any* camera X. Examples: 40-column map = 2 copies/row; 38-column map = 3 copies/row. Automatically use the fast compositor **only when all frame maps and all frame colors fit within their respective 12-KiB safe areas** (maps $4000-$6FFF, colors $7000-$9FFF). Otherwise, keep the full generic renderer with no data discarded or new export veto.
2. **Fast per-row copy** in 6502: prepare a source pointer once per screen row and copy 40 character/color pairs contiguously, avoiding the modulo logic at every cell. Frame clocks, per-frame directions/speeds, map data and colors are unchanged.
3. **Fair Group Animate scheduling**: check group182_pending and run group182_step before a new map buffer render, not only after the map work. Keep group182_irq_tick in the raster interrupt and the normal deferred group work in the main loop.
4. Retain previous group runtime, bank switching, non-group narrow source routes, experimental/standalone exporters and user data untouched.

## JS+ASM source checks
- Two diagonal frames / 40x25 / Group: source rows packed, both frame342_tick and group182_step present, group work scheduled before heavy map rendering.
- Four diagonal frames / 38x25 / Group: padded stride 114, each map/color bank ends below $7000/$A000.
- Eight frames / 38x25 / Group: automatically uses original generic renderer because packed rows exceed available RAM; no frame or group discarded.
- No-group narrow projects still delegate to the existing exporter.

**Do not mark PASS until VICE PAL playback confirms:** frame changes, diagonal scroll speed, group character motion, colors, and no flicker/tearing. Compare against the previous PRG. Group settings must be active in the live editor (JSON exports do not always include Group Animate metadata).

**Rollback:** restore TEST377 script in the sole script reference of gh-pages/index.html.
