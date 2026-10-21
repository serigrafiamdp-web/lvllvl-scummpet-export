# TEST183 — MAP SCROLL VERTICAL + GROUP SCROLL HORIZONTAL

**21/10/2026 · Assembler / source tests PASS; real VICE validation PENDING.**

## Why TEST182 warned
Its large-map exporter included Group Scroll Up ONLY. The user's design combines vertical map Up/Down with horizontal Group Scroll Left/Right. These are independent operations, but VIC-II has no hardware per-glyph shift: all character pixels must be updated in RAM. This change adds a true horizontal pixel compositor, not a silent conversion to Up.

## Implementation
- Retain existing large Map Scroll Up/Down, including TERRY Screen 45x32, Rico's Window X2 40x25.
- Group Animate **Left** and **Right** with independent ticks (1 pixel per group tick, matching horizontal LVLLVL preview).
- Horizontal source raster bytes are laid out in duplicated horizontal scanlines, preserving wrap between neighboring 8×8 glyphs.
- Separate CPU compositor executes **one tile per main-loop iteration**, yielding to Map Scroll before each step; group IRQ only schedules due times.
- Uses bank-specific destination charset RAM $3000 or $3800. Optional individual animation and Switch Bank coexist if they target other glyphs. Same glyph in same bank cannot be simultaneously written by Group and native without conflict.
- Existing Group Scroll Up path is unchanged (byte-identical ASM for Up on TEST182). Existing Map Scroll-only exports remain unchanged.
- Not implemented: horizontal **Ping Pong** or group Move In/Out, or real horizontally wider-than-40 Map Scroll. Never claim their support.

## Validation
- **Real LVLLVL 6502 assembler PASS** on TERRY 45x32, Map Scroll Up, group Left and Right, with or without individual animation and Switch Bank, 9 combinations.
- **Shapes**: 1x32, 2x8, 3x5 in BANK2, 16x16, 32x8; compile PASS.
- Assembled immutable source bytes reproduce exact horizontally wrapped pixel shifts for phases 0,1,2,7,8,9,15,last (including both directions via signed phase); automatic tests PASS.
- TEST182 group Up regression and all its original cases remain PASS.
- Test does not run VICE; actual IRQ timing, continuous movement and ghost bytes require user visual PASS. Do not promote to MASTER based on assembler only.

## Artifacts
ZIP: `LVLLVL_TEST183_MAP_VERTICAL_GROUP_HORIZONTAL_LEFT_RIGHT_WEB_LOCAL.zip`
SHA256: `e31fcabee944b030620a1fc3919eb79df486cfbad9ea211bef1c87c823d97743`
Demos under `DEMOS_VICE/TEST183_TERRY45X32_MAP_UP_*.prg`.
Protected stable checkpoints: TEST181 PASS, TEST180 PASS, and `release/master-lvl-rico-20-oct-2026`.
