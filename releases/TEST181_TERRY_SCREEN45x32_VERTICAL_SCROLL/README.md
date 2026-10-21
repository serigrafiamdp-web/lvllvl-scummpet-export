# TEST181 — Wide TERRY Screen 45x32 → Vertical Map Scroll 40x25

**2026-10-20 / 21. Status: Node smoke PASS, VICE visual pending.**
Base TEST180 visually approved. MASTER of 20 October remains unchanged.

## Definitive source diagnosis
The user's `NUEVO TERRY(1).json` defines:
- Screen 45×32
- Window X=2,Y=0, 40×25
- Scroll Area X=0,Y=0, 45×32
- Map Scroll type `up`, 1 pixel per 1 tick, frame duration 128
- First index column is blank (glyph codes 0,16,...,240 — 16 empty glyphs)

The supplied `TERRY NUEVO 2 (5).prg` starts with SYS 2080 from classic LVLLVL, **not the large map driver**, which uses SYS 8192. Source cause: TEST168's `isLargeCandidate` only accepted Screen width===40, so Screen width45 bypassed Map Scroll and silently fell through to the legacy exporter.

## Fix (new TEST181)
- Select wrapper for source map Screen width !=40 or height >25; if Map Scroll off, use the existing Rico Window static export (TEST173).
- For **vertical Up/Down** with source width≥40, preserve original Screen and its geometry, project only the **40 columns of the Window** onto a temporary 40×N dataset (TERRY: real source X=2..41, Y=0..31); preserve full row height and Scroll Area Y/H; keep original per-cell colors, bank charset data and config.
- Invoke existing 40×N TEST168 runtime from this temporary editor; always restore source/editor on exit. No forced change to imported JSON or project data.
- For **horizontal movement on a source wider than 40**, do not silently return an unscrolled classic PRG: display explicit message that a variable-width horizontal player is still required. Horizontal wider-than-40 is **not yet implemented**.
- Existing exact 40-column PRG generation byte-for-byte unchanged (source regression).
- No adjustments to preview, interface, IRQ, tilesets, BANK1/2 or TEST180 border.

## Automated checks
`node TEST181_TERRY_REAL_JSON_NODE_TEST.js` PASS:
- real TERRY 45×32 source map, 40×32 projection at X2, all **1,280 cell codes** match source exactly;
- Up and Down dispatch to correct large-map runtime (not classic);
- static Window export unaffected;
- horizontal wide-source fails clearly, never creates a fake static PRG;
- existing 40×32 vertical output source EXACT to TEST180;
- no edits to original TERRY JSON.
- JS syntax check PASS.
These tests use mock assembler to capture generated source; **they do NOT prove real PRG assembly or VICE playback.**

## Artifacts
`LVLLVL_TEST181_TERRY_SCREEN45x32_WINDOW40x25_WEB_LOCAL.zip`
SHA256 `231c44a5f1ace0b38167b7e52eabbc35ef2272fd7d9fc45352734a7f1d9d5e4e`
ZIP includes unmodified TERRY JSON under `REPRO_TERRY/`, a Node test and notes for local QA. Do not commit this user file to public GitHub.

MASTER backup `release/master-lvl-rico-20-oct-2026`. Pending VICE PASS from the user and separate previously identified TEST176 ghost-byte issue.
