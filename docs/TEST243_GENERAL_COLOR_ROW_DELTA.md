## RESULTADO REAL EN VICE — FAIL (22/10/2026)

El usuario confirmó: **"aun sigue lento y a tirones"**. TEST243 NO supera la versión lenta anterior y no debe promoverse al MASTER. Solo lo simulamos funcionalmente; los tests de color no sustituyeron medición de ciclos reales.

### Diagnóstico de presupuesto 6510 (estimación estática, NO profiler VICE)
Para el mapa 45×32 en diagonal: 180 diferencias de color a nivel de mundo; entre **117 y 159 candidatas por ventana** (media 140,625). Para la rutina de TEST243, cada candidato visible requiere aproximadamente **132 ciclos** de cálculo, direccionamiento y armado de buffers; además se copian 1000 códigos de pantalla con un costo aproximado de **11.904 ciclos** solo para el bucle de desplazamiento `diag_shift221`. La fase multicolor puede superar con facilidad los **30.000 ciclos** sin incluir reconstrucción de bordes ni la escritura final de Color RAM.

Un cuadro PAL completo permite **19.656 ciclos nominales** (312 líneas × 63 ciclos, con robos por VIC-II durante badlines). Por tanto no es viable garantizar un paso diagonal multicolor de 8 píxeles *cada cuadro* con el diseño actual.

**Origen de los tirones:** En el IRQ, `main_busy` y `prep_ready` bloquean la confirmación/contador del movimiento mientras se preparan los buffers. El costo variable por posición del mapa altera cuántos cuadros se requieren entre avances. Las pequeñas diferencias entre filas/columnas cambian la fluidez.

**No repetir:** nuevas tablas de color con un bucle que calcula los punteros de pantalla/Color RAM por cada celda, ni forzar escrituras completas en IRQ (TEST238). La siguiente propuesta general debe fusionar planificación de pantalla y color, o preindexar de forma mucho más agresiva los destinos para bajar el costo por celda; primero validar el presupuesto de ciclos, no solo exactitud de colores. Usar raster estable y mantener BANK1/2 y SID.

---
# TEST243 — General diagonal row-color deltas (no shapes, no phase limit)

**Baseline:** `release/test239-diagonal-uniform-bank1-fix` (TEST236 compatible). **Experimental.** No edits to MASTER and no changes to the production root page. TEST242 stays FAIL.

## Actual user's two PRGs

- `TERRY NUEVO 2 (12).prg`: one foreground color, fast.
- `TERRY COLORES LENTO.prg`: six colors, slow.
- Both contain the same full 45×32 glyph map and 256-slot charset banks. Colors are the key difference.
- World color delta comparisons on **every** cell against the previous diagonal camera position yield 180 differing world cells for this 45×32 map, regardless of the direction. The worst 25-row window requires visiting 159 precomputed candidates, many fewer than a 1000/1024-cell scan. The geometric color-block shape is NOT used in TEST243.

## Generic algorithm

At PRG export, inspect the full actual world colors, regardless of pattern or palette. For each world row, save only `(world_column, new_color)` pairs where the new color differs from the previous world's diagonal neighbor (with full X/Y wrapping). Store row pointers, counts and pairs in available RAM at `$A100..` (up to `$AFFF`), never the SID's `$B000-$B7FF`.

On each diagonal character step:
1. For the 25 visible world rows, read only their precompiled delta pairs.
2. Calculate each changed world column's position relative to the next camera X. Skip entries outside the visible 40-character window.
3. Append `(visible screen position,color)` to the original TEST203 per-page sparse buffers `$1000..$17FF`. Overflows set the full-page flag as the original encoding requires.
4. Keep `commit_sparse_colors203` inside the same approved raster IRQ. Keep `diag_shift221` (character double-buffer) unchanged. Eliminate both `diag_colors221` (shadow recomputation) and `prepare_sparse_colors203` (full comparison scan) when eligible.

No shape, rectangle, periodicity, special color, charset density or <=255 phase counter assumption. No 1000-byte Color RAM copy in IRQ. No requirement to edit or simplify the artwork.

## Safety and fallback

The generic algorithm automatically falls back to the untouched TEST239/236 pipeline on dense maps (>96 world deltas per row, >210 candidate entries in the worst 25-row window), insufficient memory, lack of double-width map data, Group Animate, or uniform-color maps. Older RLE fast-mode code retains priority and is unchanged. All four diagonal directions and both charset banks are supported.

## Source verification (not a VICE PASS)

- 216 generated-source configurations: no errors.
- 64 full integration configurations: 8 selected; 56 correctly retained byte-for-byte old ASM.
- 4 diagonals × 1440 frames = 5,760 simulated frames for the real 45×32 six-color layout: no wrong Color RAM values.
- Additional synthetic arbitrary sparse-art simulation in all four diagonals: no mismatched color.
- 45×32 tables contain 180 delta pairs and consume 456 bytes; binary row pointer offsets/bytes decoded and verified.
- New routine assembler branch offsets checked, no out-of-range local branches.
- **Actual PRG compilation and VICE frame-time measurement not completed; no assertion that 1 tick per frame is attainable.** If worse, report FAIL.

## Test paths

Web isolated: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test243/

ZIP branch: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test243-diagonal-general-row-deltas.zip

Use the *exact* original multicolor art, Bank1, Diagonal Up Left (then other diagonals), Pixels/Step 8, Ticks/Step 1. Compare the generated PRG in VICE with `TERRY COLORES LENTO.prg`.

After export, inspect `window.RICO_TEST243_LAST_BUILD`. Expected for 45×32 TERRY: `selected:true`, `worldDifferences:180`, `maximumRowCandidates:159`, `deltaTableBytes:456`, `mode:'general-world-row-deltas'`.

Check for incorrect colors after wrapping the map, top-row seams, charset Bank1 correct and real fluidity. Preserve MASTER until the user marks PASS.
