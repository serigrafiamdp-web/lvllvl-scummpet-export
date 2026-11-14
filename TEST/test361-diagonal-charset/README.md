# TEST361 — Diagonal MAP SCROLL charset integrity (non-blocking)

## Regression fixture
Original user-provided file: **LVLLVL TEST.json** (retained in the project conversation, **not published** to this public repository).
SHA-256: `7bb596aca29df423c0d010b640bfda174e63ca0106f572ce8eadbdfa4f9a841e`.
JSON v1, charset **C64 PETSCII**, 256 tiles (8×8), textmode map **50×35**, 74 unique tile indices in map (0–97), all cells foreground color 14. Single frame, **BANK 1**.
- Window: x=0, y=0, width=40, height=25
- Scroll Area: x=0, y=0, width=50, height=35
- MAP SCROLL: `diag-up-left`, 1 tick/step, 8 pixels/step, diagonalEdgeMask=true

Expected exported glyph data (BANK 1):
- Tile 1: eight bytes `7E 7E 7E 7E 7E 7E 7E 7E`
- Tile 7: eight bytes `07 07 07 07 07 07 07 07`
- Tile 8: eight bytes `E0 E0 E0 E0 E0 E0 E0 E0`

The official TEST196 native route emits font BANK 1 at **$3000–$37FF**, BANK 2 at **$3800–$3FFF**, screen RAM at **$0400/$0800**, in VIC bank 0 (CIA2 `$DD00 & 3 = 3`).
At runtime, standard BANK1 video pointers should be `$D018 = $1C / $2C` (low bit may read as 1); BANK2 should be `$1E / $2E`. The font bits alone (`$D018 & $0E`) should be **$0C** for BANK1, **$0E** for BANK2.

## Known defect (not yet confirmed fixed)
User observed repeated alphabet-like glyphs instead of edited custom font in VICE while running exported diagonal PRG. The JSON indices and generated TEST196 assembly font bytes are correct in the isolated JS test, **but compiled PRG and VIC runtime need further verification**. Never claim PASS until VICE confirms.

## Passive instrumentation
The page loads `RICO_DIAGONAL_CHARSET_AUDIT_TEST361.js` after existing export wrappers, capturing the returned PRG.
In browser DevTools: `window.RICO_TEST361_DIAG.last` (after export).
- `FONT BYTES MATCH PRG`: exported PRG contains 2 KB font bytes at both specified addresses. Next inspect VICE runtime `$D018`, `$DD00`, `$3008` versus PRG bytes.
- `CHECK EXPORT ROUTE / FONT ADDRESS`: the PRG has different bytes at fixed TEST196 addresses. The route may use another font layout, or data may be overwritten; investigate before altering exports.
- `NO BINARY RETURN`: exporter returned no byte array; this audit is not a restriction.
The audit **never changes exporter args, output, address assignments, memory, or any choice of scroll/frame/SID/group/bank**, and does not add any export eligibility check.

## Regression matrix
Preserve export paths for static, vertical, horizontal, diagonal (all four directions), all speeds 1–8 px, 1-frame and multiframe, BANK 1/BANK 2, group/individual animation, SID enabled/disabled, standard text, multicolor text, EBCM and bitmap where their native engine supports the mode. No blanket restrictions or forced fallback to static output.

## VICE confirmation
After running a generated PRG, inspect with VICE monitor (`Alt+H`, or via monitor menu):
`io d018` and `io dd00`; `m 3008 300f`.
Compare to expected tile 1 bytes `7E`; verify VIC bank/pointers and whether changes occur after scrolling.
Do not conflate a runtime VIC pointer error with incorrect charset bytes in PRG.
