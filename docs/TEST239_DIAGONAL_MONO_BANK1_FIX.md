# TEST239 — Diagonal monocolor: fix charset selector BANK1

**Base:** `release/test236-diagonal-dual-fast-color-only` (not TEST237/238).
**Status:** source-level PASS, VICE visual pending. Do not promote to MASTER until user PASS.

## Verified root cause

In `js/RICO_PRG_DIAGONAL_TEST196.js`, `build(d)` creates the startup code `lda #$0c / sta charset_bits` for BANK 1 (`$3000`), or `lda #$0e` for BANK 2 (`$3800`). The uniform-color optimizer used `oldColorLines` to globally delete all lines exactly equal to `lda #$0c`. That also removed BANK1's selector, leaving `sta charset_bits` using the previous accumulator value (e.g. `#$07` for an UP LEFT direction), so `$D018` pointed at the wrong memory instead of the custom glyphs. A uniform foreground color `$0c` was also vulnerable to the same deletion.

## Exact fix

Keep the original monocolor fast path, no performance changes. During the color-only removal, delete `lda #$0c` **only** if immediately followed by the obsolete `sta color_dst_hi`, not globally. Bank 1 initialization and solid color 12 remain intact.

No changes to `diag_shift221`, new edges, Color RAM, IRQ, SID, Group Animate, Ticks/Step, Pixels/Step or the fast multicolor TEST236 builder.

## Tests

64 synthetic ASM-generation combinations: 4 diagonals × 2 banks × 2 solid-color values (4 and 12) × uniform/multicolor × fastRows/fallback:
- 64/64 expected startup charset selectors correctly preserved.
- For nonuniform maps: generated ASM remains byte-for-byte identical.
- For uniform cases BANK1, required `lda #$0c` is preserved.
- For uniform cases BANK2 with solid color 4, generated ASM remains identical.
- For solid color 12, the instruction is also preserved to retain correct foreground color.
- VICE visual and PRG assembly: **not yet confirmed**.

## Test

Test browser: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test239/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test239-diagonal-uniform-bank1-fix.zip

Use the SAME project as before; check frame Charset Bank=1, one foreground color, diagonal up-left, 8 px/tick, 1 tick. Compare custom glyphs in VICE; confirm performance remains fast.
