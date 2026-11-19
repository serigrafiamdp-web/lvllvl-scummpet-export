# TEST380 — Remix Tileset: choose destination first

**Date:** 2026-11-19 · **Branch:** `gh-pages` · **Execution status:** JS unit checks PASS; browser UI verification pending.

## New workflow (8x8 and 7x8 sources)

1. Open **Rico's Remix a Tileset**.
2. Click any slot in **CUSTOM TILESET** (right), including BANK 1 or BANK 2.
3. The destination receives a yellow/orange cursor, matching Double Height/16x16.
4. Click any glyph in **SOURCE** (left). It is copied into that selected CUSTOM slot.
5. The destination cursor advances by one slot **within the same bank**, to make consecutive insertion easy.
6. Click any other CUSTOM slot to reposition the cursor and continue.

Existing same-index import/toggle is preserved when no right-side destination was chosen. The source and destination bank can differ, without modifying other slots. Both banks remain 256 C64 8x8 glyphs. No PRG exporter or JSON representation is changed.

## Implementation

- `js/RICO_REMIX_TILESET_TEST24.js`: adds `selectedTargetCombined` and `selectedSourceCombined`, destination hit testing, orange outline, single-glyph draft creation using target bank/slot, and next-slot cursor.
- Leaves `RICO_REMIX_DOUBLE_HEIGHT_TEST30.js` and `RICO_REMIX_16X16_TEST31.js` unchanged and delegates cursor behavior to those modes.
- `gh-pages/index.html`: cache-busted the changed script.

## Local code checks

JavaScript syntax compilation: **PASS**.

Eight method-level checks: **PASS**, including source-to-arbitrary-destination, advancing BANK 1, BANK 1 source copied to BANK 2, BANK 2 advancing, wrapping inside BANK 2, draft counters, and legacy same-slot insertion/toggle.

**Not yet verified in a real browser:** placement and colors of the rectangle, accurate hit testing with real canvas dimensions, switching between 8x8 / 7x8 / Double Height / 16x16, Cancel/OK, and persistence after reopen. User visual PASS still required.

No changes to Group Animate or Map Scroll from TEST379.
