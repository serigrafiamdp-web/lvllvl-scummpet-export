# TEST171 — Switch Bank 1 / Bank 2 by Group Animate

**Date:** 20 October 2026. **Status:** ASM/CPU checks PASS, visual VICE test pending.

Base: TEST170 PASS. Protected MASTER LVL RICO 20 October unchanged; branch main unchanged.

## Purpose
Add Group Animate option `Switch Bank 1 / Bank 2` and configurable Ticks/Frame.
Use already resident $3000 (BANK 1) and $3800 (BANK 2) charsets.
Every N PAL IRQs, toggle charset bits with `EOR #$02` and call existing `update_d018`;
preserve screen-pointer bits, don't copy or mutate glyphs.

**Hardware constraint:** VIC-II has one active charset per screen. A Group Animate selection
configures the timer; the visible change affects ALL on-screen character codes
whose graphics differ between the two banks. Unaffected characters need the same shape in both banks.
This is **not** a local group-only hardware effect. No fabricated local-bank support.

## Preview
- PAL clock 20 ms / tick, with bank phases alternating every N ticks.
- Temporary `__ricoSwitchBankPreview171` changes screen renderer without editing original
  tile data, tile palette, frame charsetBank, or source charset metadata.
- Side bank palette remains static; optimized redrawing avoids full side palette on each tick.

## Tests
- Assembler PASS: BANK 1 and BANK 2 starting phase, at 1/2/8/255 ticks.
- IRQ generated code contains `EOR #$02` and calls existing `update_d018`.
- PRG demos for BANK1 1-tick and 8-tick included in local ZIP.
- Preview tests PASS: BANK1->BANK2->BANK1 transitions and removal reverts.
- Regression: legacy Scroll Up and hardware Map Scroll PRG outputs byte-for-byte identical to TEST170.
- **Not yet tested visually**: VICE C64 display, real browser UI, concurrent mixed animations or Map Scroll.
- Do not promote until user PASS.

## File
`LVLLVL_TEST171_SWITCH_BANK1_BANK2_WEB_LOCAL.zip`

SHA256 `76c9a6d0317e8481bb71abb3feae1937837de070110fc620b2d6786f0b0232b4`

Protected recovery branch: `release/master-lvl-rico-20-oct-2026`.
