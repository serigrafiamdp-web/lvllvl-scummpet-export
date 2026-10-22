# Historial unificado de pruebas y mapa conceptual — LVLLVL RICO

> Archivo histórico íntegro, consolidado el 22/10/2026. Conserva la redacción original, los resultados PASS/FAIL y las hipótesis de cada momento. **No debe interpretarse cada MASTER histórico como vigente.** El estado aprobado actual es TEST228 PASS (22/10/2026); consultar [ESTADO_MASTER](ESTADO_MASTER_22_OCTUBRE_2026.md).

## Fuente 1: log.txt (transcripción histórica sin recortes)

<details>
<summary>Ver bitácora original de pruebas</summary>

```text
MASTER LVL RICO — 20 DE OCTUBRE DE 2026 — VICE PASS
Estado: MASTER aprobado por usuario. Base aprobada TEST165 + TEST167.
Se corrige la linea inferior de bloques negros VIC-II (idle graphics / $3FFF) usando
$D011=$1B solo para Window=25, Map Scroll=No (antes $18). GROUP e INDIVIDUAL PASS.
No se borra ni se pisa $3FFF; no se tapan pixeles ni se pierden filas.
TEST165 PASS: preview Scroll Up grupal acompasada al motor PRG rapido 2 px/IRQ.
TEST164: motor Scroll Up compacto hasta 256 chars, ticks variables; preserva TEST155.
Exclusion explicita: TEST166 cambio IRQ $FA->$FB NO es parte del MASTER.
ZIP MASTER_LVL_RICO_20_DE_OCTUBRE_2026.zip, 627 archivos, sin PRG de diagnostico.
SHA256: 7fe4195336b818f46cf91216a0c7f3f1240b4fe989f560dbefb2dc582b69d8fb
WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
Documentacion detallada: releases/MASTER_LVL_RICO_20_OCTUBRE_2026/README.md
----------------------------------------------------------

MASTER LVLLVL RICO — 256 CARACTERES / 1 TICK — 19 DE OCTUBRE DE 2026
=============================================================================
ESTADO: MASTER APROBADO DESDE TEST149 (PASS).
- Interfaz: divisor vertical editor/tileset libre, sin mover frames.
- Exportación: 256 caracteres NORMAL UP, 8 frames, 1 tick, aprobada
  VISUALMENTE en VICE. No es medición instrumental exacta de 50 Hz.
- Mantener TODAS las animaciones activadas aunque su forma no muestre movimiento.
- TEST147 optimiza rutina rapida ASM y preview; TEST149 arregla divisor.
- Ruta SCUMM/Map Scroll de TEST138 no modificada en TEST149.
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- Local: MASTER_LVLLVL_256_1_TICK_19_OCTUBRE_2026.zip
- Documentos activos: solamente log.txt y mapaconceptual.txt.
- PRG, SID y TXT de pruebas no forman parte del MASTER.
- Fuentes originales en el historial de Git y ramas backup del 19/10/2026.

LOG — RESULTADOS Y ESTADOS
=========================
TEST148: FAIL interfaz. El divisor lateral movia la barra inferior de frames.
TEST149: PASS interfaz. Correccion del selector de redimensionamiento east/south.
TEST147: optimizacion 256 animaciones sin eliminar los glifos aparentemente
inmoviles; alternativa rapida compila dentro del rango de memoria permitido.
TEST149 exportador conserva TEST147 intacto.
Video VICE 256x1tick revisado: cerca del rendimiento PAL esperado; usuario
confirmo que se ve correcto. No prometer 50 Hz exactos sin verificacion por IRQ.

ARCHIVOS HISTORICOS TXT INTEGRADOS A CONTINUACION
=================================================


===== ORIGEN HISTORICO: dist/LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PENDING PASS/FAIL.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.

TEST81 - CLEAN RESTART: BLACK VIEWPORT GAP + LARGE VERTICAL MAP EXPORT
Status: PENDING PASS/FAIL.
Base: TEST80 PASS / checkpoint seguro 3e135f184fd1801f1c8e62e679aa2eaf11d1e329.
- Rebuilt directly from TEST80 PASS. No TEST82/TEST83 code is inherited.
- UI change only: when MAP SCROLL is active, the existing TEST79 preview canvas is prefilled black before drawing. This replaces the transparent/checker gap outside a smaller Window without changing Window, Scroll Area, Screen geometry, scale, crop math or scroll behavior.
- Export change only: reintroduces the already validated large vertical source-map runtime for Screen width 40 and height 26..255.
- First target case: Screen 40x50, Window 40x24 (or 40x25), Scroll Area 40x50, one Frame, Scroll Up/Down.
- The complete 40x50 source map is stored separately at $4000+; VIC still uses the normal $0400/$0800 1000-byte screen buffers and shows 24/25 rows while the camera traverses the full Scroll Area.
- Normal 40x25 exports still delegate to approved TEST77 unchanged.
- TEST81 intentionally does not add the later TEST82 per-cell color experiment; color behavior is outside this isolated restart test.

TEST82 CLEAN LARGE MAP PHASE FIX - 16 OCT 2026
- Base exacta: LVLLVL_TEST81_CLEAN_BLACK_GAP_LARGE_40X50.zip, itself rebuilt from TEST80 PASS.
- UI black-gap behavior unchanged.
- Large 40xN exporter: fixes first-row scroll phase by preparing the hidden screen from the currently visible VIC buffer, matching the proven TEST76 vertical pipeline.
- Scroll Up: shifts physical rows 1..24 into rows 0..23, then injects exactly the next logical map row into row 24 from the 40xN source map.
- Scroll Down: shifts physical rows 0..23 into rows 1..24, then injects exactly the previous logical map row into row 0.
- Camera still traverses the complete Scroll Area and wraps only at Scroll Area boundaries.
- No changes to Window, Scroll Area, editor geometry, black gap fill, TEST77 normal 40x25 export, charset or color behavior.

TEST83 CLEAN - LARGE MAP VIEWPORT OVER FULL SOURCE - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base: TEST82 CLEAN LARGE MAP PHASE FIX, itself on the TEST80 PASS clean line.
- Corrects the editor-side interpretation only; source Screen data is never cropped.
- MAP SCROLL OFF: LVLLVL returns to the complete Screen preview/editor (e.g. 40x50).
- MAP SCROLL ON for a large vertical map: GridView2d sees the Window height only (e.g. 40x24), matching the visible Commodore viewport.
- The scroll renderer separately renders the complete Scroll Area (e.g. all 50 rows) into an offscreen source surface and moves that source behind the fixed Window.
- Rows below the Window remain available and enter from below during Scroll Up; they are not discarded when the viewport is reduced.
- No document dimensions, Screen rows, Window metadata or Scroll Area metadata are modified.
- Existing clean TEST82 large-map PRG exporter remains installed, so the C64 export still uses the full 40xN source map while VIC displays only the 24/25-row viewport.
- Unit validation: GridView2d reports 192px for 40x24 while scroll is ON, restores 400px for 40x50 when OFF; source movement test confirms 3px phase reads 3px farther into the full source.

TEST83 PASS CONFIRMADO POR USUARIO - 16 OCT 2026
- Screen/Mapa fuente 40x50 permanece completo.
- MAP SCROLL OFF vuelve a mostrar las 50 filas completas para edicion.
- MAP SCROLL ON usa Window como viewport y recorre el Scroll Area completo sin recortar filas fuente.
- Caso aprobado: Screen 40x50 + Window 40x24 + Scroll Area 40x50.

TEST84 - DEFAULT C64 WINDOW 40x25 + PER-CELL COLORS - 16 OCT 2026
Status: PARTIAL / REPLACED BY TEST85.
Base exacta: TEST83 PASS.
- Cuando un Screen supera 40 columnas o 25 filas y se abre Rico's Window Dimensions, una Window aun no configurada/full-Screen recibe una sola vez el default C64 de hasta 40x25. Scroll Area no se modifica.
- El usuario conserva libertad total para cambiar luego la Window; el default no se vuelve a imponer sobre una eleccion manual.
- Para el exportador grande vertical 40xN se conserva intacto el runtime row-phase-safe de TEST82/TEST83.
- Se agrega un mapa de colores por celda paralelo al mapa de caracteres: caracteres en $4000+, colores C64 (fc) en $7000+.
- Color RAM se construye desde las mismas 25 filas de camara que el mapa visible y se actualiza al confirmar cada nuevo bloque de scroll.
- Exportaciones normales 40x25 siguen delegando a TEST77; no se toca su runtime.
- Primer caso de prueba recomendado: Screen 40x50 + Window 40x25 + Scroll Area 40x50 + Scroll Up, verificando geometria y colores en VICE.

TEST85 - SPARSE COLOR COMMIT / SMOOTHER LARGE MAP - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base exacta: TEST84 sobre TEST83 PASS.
- TEST84 queda marcado como PARTIAL: el default 40x25 funciona y el PRG conserva color por celda, pero el usuario detecta salto perceptible al cruzar filas y restos claros/blancos durante el fine-scroll.
- Diagnostico sobre el PRG exportado por el usuario: los datos de color si estan presentes en $7000; el problema no es perdida del mapa de color.
- Causa del salto: TEST84 reconstruia las 1000 posiciones de Color RAM dentro de cada commit de buffer, agregando demasiado trabajo al cambio de fila.
- TEST85 elimina esa reconstruccion completa en cada commit.
- Al iniciar, Color RAM se rellena una sola vez con el color dominante de los caracteres visibles; las celdas cuyo charset es completamente vacio no fuerzan colores claros irrelevantes.
- En cada cambio de camera_row se actualizan solamente las posiciones ocupadas por caracteres visualmente no vacios del nuevo viewport mediante tablas sparse precalculadas.
- Para el PRG de prueba recibido, el viewport contiene aproximadamente 38..41 caracteres no vacios por camera_row, en vez de 1000 escrituras de color por commit.
- Se conserva sin cambios el row-phase-safe de TEST82/83, el mapa fuente 40x50 completo, Window 40x25 por defecto y Scroll Area 40x50.
- Exportaciones normales 40x25 siguen delegando a TEST77.

TEST86 - 2026-10-16 - ASM pointer table fix for sparse colors
- Base: TEST85 sparse color optimization.
- Fix: color-update pointer tables are emitted as numeric low/high bytes instead of <label/>label expressions.
- Reason: LVLLVL in-browser assembler rejected color_update_000... symbolic references.
- Sparse per-character color commit optimization remains unchanged.

TEST87 PENDING — LEFT PALETTE SIZE / POSITION
- Base exacta: MASTER TEST86 PASS.
- Único cambio funcional: se elimina el título "C64 COLORS" de la paleta rápida izquierda.
- Swatches ampliados de 17 px a 30 px de alto, conservando 2 columnas y la misma posición/anclaje del MASTER.
- Sin cambios en exportación, scroll, Window, Scroll Area ni runtime C64.

TEST88 PENDING: optimized 960-byte backbuffer shift so exported Ticks / Step tracks PAL IRQ cadence more closely; no UI/geometry/color changes.

TEST89 PENDING - 16/10/2026
- Base: TEST88.
- PRG confirmado por inspeccion: Ticks/Step=1, Pixels/Step=8.
- Nuevo fast path vertical para 8 px/step: backbuffer preparado anticipadamente en main loop.
- Objetivo: 8 px por frame PAL (1 fila de caracteres por frame) cuando Ticks/Step=1.
- Los modos 1..7 px conservan la ruta TEST88.


===== ORIGEN HISTORICO: LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PASS CONFIRMADO.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.


TEST77 PASS EN VICE - RESULTADO FINAL
- Scroll Area confirmado también en PRG/VICE para una sola frame.
- Scroll vertical conserva las 40 columnas.
- Eliminadas la banda negra y la ocultación lateral del caso validado.
- Este runtime/exporter queda como base aprobada de TEST80.


============================================================
17 OCT 2026 - MASTER LVL-RICO / TEST120 PASS
============================================================

MASTER:
- MASTER_LVL-RICO_17_OCTUBRE_2026.zip
- SHA256: 7b98cb59532394b99410a9d26c5b90259b04ec21666f0c7ec6006479c96f709d
- Exact payload: 622 files / 646 ZIP entries.
- Validation authority: downloadable TEST120 ZIP.

NATIVE CHAR ANIMATION / VICE:
- TEST104 proved the original James native animate_chars path needs the displayed animated bank at $3800.
- Final mapping kept in MASTER:
  BANK 1 = $3800-$3FFF
  BANK 2 = $3000-$37FF
- Frame bank selection continues through $D018.
- TEST105 confirmed native character animation in VICE with current UI preserved.

EDITOR FLICKER INVESTIGATION:
- Flicker frequency followed character ticksPerFrame exactly.
- TEST118 diagnostic disabled TileSet.update() for animated characters: PASS diagnostic, both flicker and character motion disappeared.
- This proved the fault was inside the animation update/repaint path rather than MAP SCROLL or the general UI clock.
- TEST119 restored glyph updates with dirty map-cell redraw but still allowed UI-side drawing: FAIL, flicker returned.
- TEST120 isolates the tick completely:
  * currentTile.canvasDrawCharacters() muted during the tick;
  * tile palette and side palette draw calls muted during the tick;
  * Graphic.invalidateAllCells() suppressed during the tick;
  * Graphic.redraw() suppressed during the tick;
  * currentTileData is hashed before/after;
  * only cells using glyph IDs that actually changed are redrawn on their layer canvas.
- TEST120 ZIP = PASS CONFIRMADO POR USUARIO.
- Character motion visible; general flicker removed.

WEB / PACKAGING RULE:
- Web is not rebuilt manually from separate patches.
- Each future test is assembled first as a ZIP.
- GitHub Pages payload must then be fully replaced from that exact ZIP.
- TEST120 Pages was rebuilt cleanly: 622 payload files + only .github workflow/.nojekyll infrastructure.
- 79 stale test files were removed.
- Pages exact-payload commit: 725930f44f3beb84ffee8fe07c771e438ee0546a.

PROMOTION:
- main/dist/ promoted to exact TEST120 PASS payload.
- Source mirror receives the final post-TEST80 runtime modules including TEST120.
- New checkpoint branch: promotion/lvl-rico-master-17-oct-2026.


===== ORIGEN HISTORICO: tests/TEST129/LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PENDING PASS/FAIL.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.

TEST81 - CLEAN RESTART: BLACK VIEWPORT GAP + LARGE VERTICAL MAP EXPORT
Status: PENDING PASS/FAIL.
Base: TEST80 PASS / checkpoint seguro 3e135f184fd1801f1c8e62e679aa2eaf11d1e329.
- Rebuilt directly from TEST80 PASS. No TEST82/TEST83 code is inherited.
- UI change only: when MAP SCROLL is active, the existing TEST79 preview canvas is prefilled black before drawing. This replaces the transparent/checker gap outside a smaller Window without changing Window, Scroll Area, Screen geometry, scale, crop math or scroll behavior.
- Export change only: reintroduces the already validated large vertical source-map runtime for Screen width 40 and height 26..255.
- First target case: Screen 40x50, Window 40x24 (or 40x25), Scroll Area 40x50, one Frame, Scroll Up/Down.
- The complete 40x50 source map is stored separately at $4000+; VIC still uses the normal $0400/$0800 1000-byte screen buffers and shows 24/25 rows while the camera traverses the full Scroll Area.
- Normal 40x25 exports still delegate to approved TEST77 unchanged.
- TEST81 intentionally does not add the later TEST82 per-cell color experiment; color behavior is outside this isolated restart test.

TEST82 CLEAN LARGE MAP PHASE FIX - 16 OCT 2026
- Base exacta: LVLLVL_TEST81_CLEAN_BLACK_GAP_LARGE_40X50.zip, itself rebuilt from TEST80 PASS.
- UI black-gap behavior unchanged.
- Large 40xN exporter: fixes first-row scroll phase by preparing the hidden screen from the currently visible VIC buffer, matching the proven TEST76 vertical pipeline.
- Scroll Up: shifts physical rows 1..24 into rows 0..23, then injects exactly the next logical map row into row 24 from the 40xN source map.
- Scroll Down: shifts physical rows 0..23 into rows 1..24, then injects exactly the previous logical map row into row 0.
- Camera still traverses the complete Scroll Area and wraps only at Scroll Area boundaries.
- No changes to Window, Scroll Area, editor geometry, black gap fill, TEST77 normal 40x25 export, charset or color behavior.

TEST83 CLEAN - LARGE MAP VIEWPORT OVER FULL SOURCE - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base: TEST82 CLEAN LARGE MAP PHASE FIX, itself on the TEST80 PASS clean line.
- Corrects the editor-side interpretation only; source Screen data is never cropped.
- MAP SCROLL OFF: LVLLVL returns to the complete Screen preview/editor (e.g. 40x50).
- MAP SCROLL ON for a large vertical map: GridView2d sees the Window height only (e.g. 40x24), matching the visible Commodore viewport.
- The scroll renderer separately renders the complete Scroll Area (e.g. all 50 rows) into an offscreen source surface and moves that source behind the fixed Window.
- Rows below the Window remain available and enter from below during Scroll Up; they are not discarded when the viewport is reduced.
- No document dimensions, Screen rows, Window metadata or Scroll Area metadata are modified.
- Existing clean TEST82 large-map PRG exporter remains installed, so the C64 export still uses the full 40xN source map while VIC displays only the 24/25-row viewport.
- Unit validation: GridView2d reports 192px for 40x24 while scroll is ON, restores 400px for 40x50 when OFF; source movement test confirms 3px phase reads 3px farther into the full source.

TEST83 PASS CONFIRMADO POR USUARIO - 16 OCT 2026
- Screen/Mapa fuente 40x50 permanece completo.
- MAP SCROLL OFF vuelve a mostrar las 50 filas completas para edicion.
- MAP SCROLL ON usa Window como viewport y recorre el Scroll Area completo sin recortar filas fuente.
- Caso aprobado: Screen 40x50 + Window 40x24 + Scroll Area 40x50.

TEST84 - DEFAULT C64 WINDOW 40x25 + PER-CELL COLORS - 16 OCT 2026
Status: PARTIAL / REPLACED BY TEST85.
Base exacta: TEST83 PASS.
- Cuando un Screen supera 40 columnas o 25 filas y se abre Rico's Window Dimensions, una Window aun no configurada/full-Screen recibe una sola vez el default C64 de hasta 40x25. Scroll Area no se modifica.
- El usuario conserva libertad total para cambiar luego la Window; el default no se vuelve a imponer sobre una eleccion manual.
- Para el exportador grande vertical 40xN se conserva intacto el runtime row-phase-safe de TEST82/TEST83.
- Se agrega un mapa de colores por celda paralelo al mapa de caracteres: caracteres en $4000+, colores C64 (fc) en $7000+.
- Color RAM se construye desde las mismas 25 filas de camara que el mapa visible y se actualiza al confirmar cada nuevo bloque de scroll.
- Exportaciones normales 40x25 siguen delegando a TEST77; no se toca su runtime.
- Primer caso de prueba recomendado: Screen 40x50 + Window 40x25 + Scroll Area 40x50 + Scroll Up, verificando geometria y colores en VICE.

TEST85 - SPARSE COLOR COMMIT / SMOOTHER LARGE MAP - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base exacta: TEST84 sobre TEST83 PASS.
- TEST84 queda marcado como PARTIAL: el default 40x25 funciona y el PRG conserva color por celda, pero el usuario detecta salto perceptible al cruzar filas y restos claros/blancos durante el fine-scroll.
- Diagnostico sobre el PRG exportado por el usuario: los datos de color si estan presentes en $7000; el problema no es perdida del mapa de color.
- Causa del salto: TEST84 reconstruia las 1000 posiciones de Color RAM dentro de cada commit de buffer, agregando demasiado trabajo al cambio de fila.
- TEST85 elimina esa reconstruccion completa en cada commit.
- Al iniciar, Color RAM se rellena una sola vez con el color dominante de los caracteres visibles; las celdas cuyo charset es completamente vacio no fuerzan colores claros irrelevantes.
- En cada cambio de camera_row se actualizan solamente las posiciones ocupadas por caracteres visualmente no vacios del nuevo viewport mediante tablas sparse precalculadas.
- Para el PRG de prueba recibido, el viewport contiene aproximadamente 38..41 caracteres no vacios por camera_row, en vez de 1000 escrituras de color por commit.
- Se conserva sin cambios el row-phase-safe de TEST82/83, el mapa fuente 40x50 completo, Window 40x25 por defecto y Scroll Area 40x50.
- Exportaciones normales 40x25 siguen delegando a TEST77.

TEST86 - 2026-10-16 - ASM pointer table fix for sparse colors
- Base: TEST85 sparse color optimization.
- Fix: color-update pointer tables are emitted as numeric low/high bytes instead of <label/>label expressions.
- Reason: LVLLVL in-browser assembler rejected color_update_000... symbolic references.
- Sparse per-character color commit optimization remains unchanged.

TEST87 PENDING — LEFT PALETTE SIZE / POSITION
- Base exacta: MASTER TEST86 PASS.
- Único cambio funcional: se elimina el título "C64 COLORS" de la paleta rápida izquierda.
- Swatches ampliados de 17 px a 30 px de alto, conservando 2 columnas y la misma posición/anclaje del MASTER.
- Sin cambios en exportación, scroll, Window, Scroll Area ni runtime C64.

TEST88 PENDING: optimized 960-byte backbuffer shift so exported Ticks / Step tracks PAL IRQ cadence more closely; no UI/geometry/color changes.

TEST89 PENDING - 16/10/2026
- Base: TEST88.
- PRG confirmado por inspeccion: Ticks/Step=1, Pixels/Step=8.
- Nuevo fast path vertical para 8 px/step: backbuffer preparado anticipadamente en main loop.
- Objetivo: 8 px por frame PAL (1 fila de caracteres por frame) cuando Ticks/Step=1.
- Los modos 1..7 px conservan la ruta TEST88.

TEST126 — TEST77 real path diagnostic (17/10/2026): prueba borde/caracteres alternando, confirmado por usuario.
TEST127 — TEST77 original @ invertido (18/10/2026): PASS de escritura al charset, no corrige coexistencia.
TEST128 — NATIVE CHAR ANIMATION + MAP SCROLL TEST77 (18/10/2026): PENDING VICE PASS/FAIL.
- Partida exacta: web TEST127 (MASTER sin modificar).
- Comparacion con Untitled (1).prg (SYS2080, rutina animate_chars original, tabla $1257: 06 06 00 00 01),
  y Untitled (7).prg (SYS8192, TEST77 scroll runtime sin animate_chars).
- Se retiran completamente la inversion del @ y la alternancia de borde de TEST127.
- TEST77 llama desde su IRQ a animate_chars_native; frame_tick y scroll mapa permanecen separados.
- Caracteristicas: tipos LVLLVL left/right/up/down/blink, ticksPerFrame, dos bancos $3000/$3800.
- No cambia el contenido original del charset ni el indice del caracter.
- Se excluyen los chars animados de la seleccion de blank_char.
- ASM generado y ensamblado ACME WebAssembly (exit 0). PRG demo @ x3 generado.
- PENDIENTE comprobar en VICE el PRG demo y el export de la web con el proyecto del usuario.

TEST128 — 18 OCT 2026 — PASS CONFIRMADO POR USUARIO
- Animacion real de caracteres @ + MAP SCROLL simultaneos en VICE.
- UNICO BUG REPORTADO: todos los caracteres perdian su color original y se veian blancos.

TEST129 — 18 OCT 2026 — PENDIENTE PASS/FAIL EN VICE
- Deriva exactamente de TEST128 PASS.
- BUG FIX: conservar color fg por celda, mediante buffers sincronizados con TEST77.
- Misma rutina de animacion de caracteres; mismo scroll existente. Sin diagnosticos artificiales.
- ACME WASM: compila PRG de demo horizontal con 3 @ y colores diferentes.
- No ascender a MASTER sin PASS.


===== ORIGEN HISTORICO: tests/TEST129/README_TEST129.txt =====
TEST129 — CARACTERES ANIMADOS + MAP SCROLL + COLORES ORIGINALES
============================================================
BASE: TEST128 PASS por validacion en VICE del usuario (tres @ animados y Map Scroll juntos).
MASTER 17 OCT 2026: INTACTO. Esta prueba no asciende a MASTER sin PASS.

CAMBIO AISLADO
- El TEST128 exportaba un color dominante y escribia ese color en toda $D800-$DBFF.
- TEST129 extrae el foreground fc real de CADA celda (40x25) de cada frame LVLLVL.
- Conserva dos buffers de color en $1000/$1400, sincronizados con los buffers de pantalla $0400/$0800.
- Reutiliza la misma preparacion de desplazamiento (up,down,left,right,pingpong,movein/moveout) de TEST77 en un segundo pase para mover los colores con cada celda.
- Actualiza la RAM de color $D800 cuando se confirma la pantalla preparada o el cambio de frame.
- No modifica animate_chars_native, su informacion de ticks ni los sprites de los caracteres.
- No modifica frame_tick ni la logica de scroll, salvo agregar la sincronizacion de los colores.
- Emite los datos fuente de color per-frame en la zona de datos del PRG.

PROBAR
1. Descomprimir el ZIP completo y abrir index.html.
2. Abrir el MISMO proyecto LVLLVL con los tres @, animacion de caracteres y Map Scroll.
3. Exportar PRG de nuevo y ejecutar en VICE.
4. Verificar que los 3 @ se animan, Map Scroll se mueve y el color original (celeste u otro) no cambia a blanco.
5. Observar en scroll rapido si aparecen retrasos visibles de la RAM de color. Confirmar PASS/FAIL.

PRG DE DEMOSTRACION
- TEST129_DEMO_3ARROBAS_COLORES_SCROLL.prg: 3 caracteres @ con colores de test
  diferentes (14, 3 y 7) y scroll horizontal; NO representa los colores del proyecto real.
- Para comprobar los colores originales hay que exportar el proyecto desde la web.

VALIDACION REALIZADA
- Runtime fuente ensamblado con ACME WebAssembly: PASS (ejemplo 40x25, tres @, scroll horizontal).
- PRG generado con encabezado de carga $0801: PASS.
- Integridad del archivo ZIP: se verifica al empaquetar.
- Ejecucion en VICE de TEST129: PENDIENTE. NO declarar PASS visual anticipadamente.

LIMITACION
- Esta prueba se limita al exportador TEST77 (40x25 con Map Scroll). Pantallas mayores de 25 filas siguen otra ruta de exportacion.


===== ORIGEN HISTORICO: tests/TEST130/LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PENDING PASS/FAIL.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.

TEST81 - CLEAN RESTART: BLACK VIEWPORT GAP + LARGE VERTICAL MAP EXPORT
Status: PENDING PASS/FAIL.
Base: TEST80 PASS / checkpoint seguro 3e135f184fd1801f1c8e62e679aa2eaf11d1e329.
- Rebuilt directly from TEST80 PASS. No TEST82/TEST83 code is inherited.
- UI change only: when MAP SCROLL is active, the existing TEST79 preview canvas is prefilled black before drawing. This replaces the transparent/checker gap outside a smaller Window without changing Window, Scroll Area, Screen geometry, scale, crop math or scroll behavior.
- Export change only: reintroduces the already validated large vertical source-map runtime for Screen width 40 and height 26..255.
- First target case: Screen 40x50, Window 40x24 (or 40x25), Scroll Area 40x50, one Frame, Scroll Up/Down.
- The complete 40x50 source map is stored separately at $4000+; VIC still uses the normal $0400/$0800 1000-byte screen buffers and shows 24/25 rows while the camera traverses the full Scroll Area.
- Normal 40x25 exports still delegate to approved TEST77 unchanged.
- TEST81 intentionally does not add the later TEST82 per-cell color experiment; color behavior is outside this isolated restart test.

TEST82 CLEAN LARGE MAP PHASE FIX - 16 OCT 2026
- Base exacta: LVLLVL_TEST81_CLEAN_BLACK_GAP_LARGE_40X50.zip, itself rebuilt from TEST80 PASS.
- UI black-gap behavior unchanged.
- Large 40xN exporter: fixes first-row scroll phase by preparing the hidden screen from the currently visible VIC buffer, matching the proven TEST76 vertical pipeline.
- Scroll Up: shifts physical rows 1..24 into rows 0..23, then injects exactly the next logical map row into row 24 from the 40xN source map.
- Scroll Down: shifts physical rows 0..23 into rows 1..24, then injects exactly the previous logical map row into row 0.
- Camera still traverses the complete Scroll Area and wraps only at Scroll Area boundaries.
- No changes to Window, Scroll Area, editor geometry, black gap fill, TEST77 normal 40x25 export, charset or color behavior.

TEST83 CLEAN - LARGE MAP VIEWPORT OVER FULL SOURCE - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base: TEST82 CLEAN LARGE MAP PHASE FIX, itself on the TEST80 PASS clean line.
- Corrects the editor-side interpretation only; source Screen data is never cropped.
- MAP SCROLL OFF: LVLLVL returns to the complete Screen preview/editor (e.g. 40x50).
- MAP SCROLL ON for a large vertical map: GridView2d sees the Window height only (e.g. 40x24), matching the visible Commodore viewport.
- The scroll renderer separately renders the complete Scroll Area (e.g. all 50 rows) into an offscreen source surface and moves that source behind the fixed Window.
- Rows below the Window remain available and enter from below during Scroll Up; they are not discarded when the viewport is reduced.
- No document dimensions, Screen rows, Window metadata or Scroll Area metadata are modified.
- Existing clean TEST82 large-map PRG exporter remains installed, so the C64 export still uses the full 40xN source map while VIC displays only the 24/25-row viewport.
- Unit validation: GridView2d reports 192px for 40x24 while scroll is ON, restores 400px for 40x50 when OFF; source movement test confirms 3px phase reads 3px farther into the full source.

TEST83 PASS CONFIRMADO POR USUARIO - 16 OCT 2026
- Screen/Mapa fuente 40x50 permanece completo.
- MAP SCROLL OFF vuelve a mostrar las 50 filas completas para edicion.
- MAP SCROLL ON usa Window como viewport y recorre el Scroll Area completo sin recortar filas fuente.
- Caso aprobado: Screen 40x50 + Window 40x24 + Scroll Area 40x50.

TEST84 - DEFAULT C64 WINDOW 40x25 + PER-CELL COLORS - 16 OCT 2026
Status: PARTIAL / REPLACED BY TEST85.
Base exacta: TEST83 PASS.
- Cuando un Screen supera 40 columnas o 25 filas y se abre Rico's Window Dimensions, una Window aun no configurada/full-Screen recibe una sola vez el default C64 de hasta 40x25. Scroll Area no se modifica.
- El usuario conserva libertad total para cambiar luego la Window; el default no se vuelve a imponer sobre una eleccion manual.
- Para el exportador grande vertical 40xN se conserva intacto el runtime row-phase-safe de TEST82/TEST83.
- Se agrega un mapa de colores por celda paralelo al mapa de caracteres: caracteres en $4000+, colores C64 (fc) en $7000+.
- Color RAM se construye desde las mismas 25 filas de camara que el mapa visible y se actualiza al confirmar cada nuevo bloque de scroll.
- Exportaciones normales 40x25 siguen delegando a TEST77; no se toca su runtime.
- Primer caso de prueba recomendado: Screen 40x50 + Window 40x25 + Scroll Area 40x50 + Scroll Up, verificando geometria y colores en VICE.

TEST85 - SPARSE COLOR COMMIT / SMOOTHER LARGE MAP - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base exacta: TEST84 sobre TEST83 PASS.
- TEST84 queda marcado como PARTIAL: el default 40x25 funciona y el PRG conserva color por celda, pero el usuario detecta salto perceptible al cruzar filas y restos claros/blancos durante el fine-scroll.
- Diagnostico sobre el PRG exportado por el usuario: los datos de color si estan presentes en $7000; el problema no es perdida del mapa de color.
- Causa del salto: TEST84 reconstruia las 1000 posiciones de Color RAM dentro de cada commit de buffer, agregando demasiado trabajo al cambio de fila.
- TEST85 elimina esa reconstruccion completa en cada commit.
- Al iniciar, Color RAM se rellena una sola vez con el color dominante de los caracteres visibles; las celdas cuyo charset es completamente vacio no fuerzan colores claros irrelevantes.
- En cada cambio de camera_row se actualizan solamente las posiciones ocupadas por caracteres visualmente no vacios del nuevo viewport mediante tablas sparse precalculadas.
- Para el PRG de prueba recibido, el viewport contiene aproximadamente 38..41 caracteres no vacios por camera_row, en vez de 1000 escrituras de color por commit.
- Se conserva sin cambios el row-phase-safe de TEST82/83, el mapa fuente 40x50 completo, Window 40x25 por defecto y Scroll Area 40x50.
- Exportaciones normales 40x25 siguen delegando a TEST77.

TEST86 - 2026-10-16 - ASM pointer table fix for sparse colors
- Base: TEST85 sparse color optimization.
- Fix: color-update pointer tables are emitted as numeric low/high bytes instead of <label/>label expressions.
- Reason: LVLLVL in-browser assembler rejected color_update_000... symbolic references.
- Sparse per-character color commit optimization remains unchanged.

TEST87 PENDING — LEFT PALETTE SIZE / POSITION
- Base exacta: MASTER TEST86 PASS.
- Único cambio funcional: se elimina el título "C64 COLORS" de la paleta rápida izquierda.
- Swatches ampliados de 17 px a 30 px de alto, conservando 2 columnas y la misma posición/anclaje del MASTER.
- Sin cambios en exportación, scroll, Window, Scroll Area ni runtime C64.

TEST88 PENDING: optimized 960-byte backbuffer shift so exported Ticks / Step tracks PAL IRQ cadence more closely; no UI/geometry/color changes.

TEST89 PENDING - 16/10/2026
- Base: TEST88.
- PRG confirmado por inspeccion: Ticks/Step=1, Pixels/Step=8.
- Nuevo fast path vertical para 8 px/step: backbuffer preparado anticipadamente en main loop.
- Objetivo: 8 px por frame PAL (1 fila de caracteres por frame) cuando Ticks/Step=1.
- Los modos 1..7 px conservan la ruta TEST88.

TEST126 — TEST77 real path diagnostic (17/10/2026): prueba borde/caracteres alternando, confirmado por usuario.
TEST127 — TEST77 original @ invertido (18/10/2026): PASS de escritura al charset, no corrige coexistencia.
TEST128 — NATIVE CHAR ANIMATION + MAP SCROLL TEST77 (18/10/2026): PENDING VICE PASS/FAIL.
- Partida exacta: web TEST127 (MASTER sin modificar).
- Comparacion con Untitled (1).prg (SYS2080, rutina animate_chars original, tabla $1257: 06 06 00 00 01),
  y Untitled (7).prg (SYS8192, TEST77 scroll runtime sin animate_chars).
- Se retiran completamente la inversion del @ y la alternancia de borde de TEST127.
- TEST77 llama desde su IRQ a animate_chars_native; frame_tick y scroll mapa permanecen separados.
- Caracteristicas: tipos LVLLVL left/right/up/down/blink, ticksPerFrame, dos bancos $3000/$3800.
- No cambia el contenido original del charset ni el indice del caracter.
- Se excluyen los chars animados de la seleccion de blank_char.
- ASM generado y ensamblado ACME WebAssembly (exit 0). PRG demo @ x3 generado.
- PENDIENTE comprobar en VICE el PRG demo y el export de la web con el proyecto del usuario.

TEST128 — 18 OCT 2026 — PASS CONFIRMADO POR USUARIO
- Animacion real de caracteres @ + MAP SCROLL simultaneos en VICE.
- UNICO BUG REPORTADO: todos los caracteres perdian su color original y se veian blancos.

TEST129 — 18 OCT 2026 — PENDIENTE PASS/FAIL EN VICE
- Deriva exactamente de TEST128 PASS.
- BUG FIX: conservar color fg por celda, mediante buffers sincronizados con TEST77.
- Misma rutina de animacion de caracteres; mismo scroll existente. Sin diagnosticos artificiales.
- ACME WASM: compila PRG de demo horizontal con 3 @ y colores diferentes.
- No ascender a MASTER sin PASS.

TEST130 — FIX PUNTEROS NUMERICOS DE COLOR EN EXPORT ONLINE — 18 OCT 2026
- Base: TEST129. Se reproduce con LVLLVL Assembler (js/main.js) exactamente
  'unknown value: frame_color_0' en los bytes < y >, que ACME si acepta.
- Unica correccion: reemplaza referencias adelantadas por punteros numericos
  calculados desde $4000 + 1000*N + (10*Animaciones + terminador).
- Sin cambios a la rutina original animate_chars ni al scroll de mapa.
- Auto-test reproductor LVLLVL interno: 6/6 PASS, datos colores por celda
  y direccion de cada frame verificados byte a byte.
- TEST129 no obtuvo PASS visual: falla la exportacion con assembler del navegador.
- TEST130: PASS compilacion navegador replicada; VICE pendiente de PASS/FAIL.
- MASTER no promovido: TEST128 sigue ultimo PASS visual.


===== ORIGEN HISTORICO: tests/TEST130/README_TEST130.txt =====
LVLLVL -> RICO — TEST130 — 18 OCT 2026
CORRECCION DE ERROR AL EXPORTAR EN VERSION ONLINE TEST129

ERROR REPORTADO POR USUARIO:
RICO TEST76: Error ensamblando runtime TEST75:
unknown value: frame_color_0 | unrecognised byte: <frame_color_0
unknown value: frame_color_0 | unrecognised byte: >frame_color_0

CAUSA:
TEST129 se compilo con ACME WebAssembly, pero el exportador online usa
el ensamblador interno de LVLLVL (new Assembler). Este ensamblador no
resuelve la referencia adelantada !byte <frame_color_0 / >frame_color_0.

CORRECCION EXCLUSIVA TEST130:
- Los punteros de color se calculan numericamenente (low/high) en JS.
- Direccion inicial = $4000 + 1000*numeroDeFrames + bytesAnimaciones.
- bytesAnimaciones = 10*numeroDeCharsAnimados + 1 terminador, si hay animacion.
- Cada frame ocupa otros 1000 bytes de colores.
- Guard de overflow de memoria de 64K; error explicativo al exceder rango.
- No se modifica la rutina native animate_chars, el Map Scroll,
  ni el comportamiento visual de los caracteres.

VALIDACION ESTATICA (NO VICE):
- Reproduccion exacta del error TEST129 en el Assembler interno: FAIL confirmado.
- 1 frame con 3 arrobas animados: PASS ensamblador interno.
- 1 frame sin animacion de chars: PASS.
- 2 frames con 2 chars animados: PASS.
- 6 frames con 3 chars animados: PASS.
- 20 frames: PASS.
- 26 frames: PASS guard overflow, sin generar datos incorrectos.
- Comprobacion exacta de direccion del label frame_color_N y de los 1000 colores: PASS.
- PRG demo generado desde el ensamblador interno de LVLLVL.

ESTADO:
- TEST128: PASS (animacion original de chars y Map Scroll en VICE)
- TEST129: PENDIENTE/FAIL de ensamblado en web online (sin verificacion visual de colores)
- TEST130: PASS ensamblado local y pendientes de prueba visual en VICE.
- MASTER LVL-RICO 17 OCT: SIN CAMBIOS.

ARCHIVOS:
- index.html -> identifica TEST130 y nueva cache key
- js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js -> exportador TEST77 corregido
- TEST130_DEMO_3ARROBAS_COLORES_SCROLL.prg -> demo generado con assembler interno
- TEST130_BUILTIN_ASSEMBLER_CHECK.cjs -> prueba reproducible con node.


===== ORIGEN HISTORICO: tests/TEST131/LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PENDING PASS/FAIL.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.

TEST81 - CLEAN RESTART: BLACK VIEWPORT GAP + LARGE VERTICAL MAP EXPORT
Status: PENDING PASS/FAIL.
Base: TEST80 PASS / checkpoint seguro 3e135f184fd1801f1c8e62e679aa2eaf11d1e329.
- Rebuilt directly from TEST80 PASS. No TEST82/TEST83 code is inherited.
- UI change only: when MAP SCROLL is active, the existing TEST79 preview canvas is prefilled black before drawing. This replaces the transparent/checker gap outside a smaller Window without changing Window, Scroll Area, Screen geometry, scale, crop math or scroll behavior.
- Export change only: reintroduces the already validated large vertical source-map runtime for Screen width 40 and height 26..255.
- First target case: Screen 40x50, Window 40x24 (or 40x25), Scroll Area 40x50, one Frame, Scroll Up/Down.
- The complete 40x50 source map is stored separately at $4000+; VIC still uses the normal $0400/$0800 1000-byte screen buffers and shows 24/25 rows while the camera traverses the full Scroll Area.
- Normal 40x25 exports still delegate to approved TEST77 unchanged.
- TEST81 intentionally does not add the later TEST82 per-cell color experiment; color behavior is outside this isolated restart test.

TEST82 CLEAN LARGE MAP PHASE FIX - 16 OCT 2026
- Base exacta: LVLLVL_TEST81_CLEAN_BLACK_GAP_LARGE_40X50.zip, itself rebuilt from TEST80 PASS.
- UI black-gap behavior unchanged.
- Large 40xN exporter: fixes first-row scroll phase by preparing the hidden screen from the currently visible VIC buffer, matching the proven TEST76 vertical pipeline.
- Scroll Up: shifts physical rows 1..24 into rows 0..23, then injects exactly the next logical map row into row 24 from the 40xN source map.
- Scroll Down: shifts physical rows 0..23 into rows 1..24, then injects exactly the previous logical map row into row 0.
- Camera still traverses the complete Scroll Area and wraps only at Scroll Area boundaries.
- No changes to Window, Scroll Area, editor geometry, black gap fill, TEST77 normal 40x25 export, charset or color behavior.

TEST83 CLEAN - LARGE MAP VIEWPORT OVER FULL SOURCE - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base: TEST82 CLEAN LARGE MAP PHASE FIX, itself on the TEST80 PASS clean line.
- Corrects the editor-side interpretation only; source Screen data is never cropped.
- MAP SCROLL OFF: LVLLVL returns to the complete Screen preview/editor (e.g. 40x50).
- MAP SCROLL ON for a large vertical map: GridView2d sees the Window height only (e.g. 40x24), matching the visible Commodore viewport.
- The scroll renderer separately renders the complete Scroll Area (e.g. all 50 rows) into an offscreen source surface and moves that source behind the fixed Window.
- Rows below the Window remain available and enter from below during Scroll Up; they are not discarded when the viewport is reduced.
- No document dimensions, Screen rows, Window metadata or Scroll Area metadata are modified.
- Existing clean TEST82 large-map PRG exporter remains installed, so the C64 export still uses the full 40xN source map while VIC displays only the 24/25-row viewport.
- Unit validation: GridView2d reports 192px for 40x24 while scroll is ON, restores 400px for 40x50 when OFF; source movement test confirms 3px phase reads 3px farther into the full source.

TEST83 PASS CONFIRMADO POR USUARIO - 16 OCT 2026
- Screen/Mapa fuente 40x50 permanece completo.
- MAP SCROLL OFF vuelve a mostrar las 50 filas completas para edicion.
- MAP SCROLL ON usa Window como viewport y recorre el Scroll Area completo sin recortar filas fuente.
- Caso aprobado: Screen 40x50 + Window 40x24 + Scroll Area 40x50.

TEST84 - DEFAULT C64 WINDOW 40x25 + PER-CELL COLORS - 16 OCT 2026
Status: PARTIAL / REPLACED BY TEST85.
Base exacta: TEST83 PASS.
- Cuando un Screen supera 40 columnas o 25 filas y se abre Rico's Window Dimensions, una Window aun no configurada/full-Screen recibe una sola vez el default C64 de hasta 40x25. Scroll Area no se modifica.
- El usuario conserva libertad total para cambiar luego la Window; el default no se vuelve a imponer sobre una eleccion manual.
- Para el exportador grande vertical 40xN se conserva intacto el runtime row-phase-safe de TEST82/TEST83.
- Se agrega un mapa de colores por celda paralelo al mapa de caracteres: caracteres en $4000+, colores C64 (fc) en $7000+.
- Color RAM se construye desde las mismas 25 filas de camara que el mapa visible y se actualiza al confirmar cada nuevo bloque de scroll.
- Exportaciones normales 40x25 siguen delegando a TEST77; no se toca su runtime.
- Primer caso de prueba recomendado: Screen 40x50 + Window 40x25 + Scroll Area 40x50 + Scroll Up, verificando geometria y colores en VICE.

TEST85 - SPARSE COLOR COMMIT / SMOOTHER LARGE MAP - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base exacta: TEST84 sobre TEST83 PASS.
- TEST84 queda marcado como PARTIAL: el default 40x25 funciona y el PRG conserva color por celda, pero el usuario detecta salto perceptible al cruzar filas y restos claros/blancos durante el fine-scroll.
- Diagnostico sobre el PRG exportado por el usuario: los datos de color si estan presentes en $7000; el problema no es perdida del mapa de color.
- Causa del salto: TEST84 reconstruia las 1000 posiciones de Color RAM dentro de cada commit de buffer, agregando demasiado trabajo al cambio de fila.
- TEST85 elimina esa reconstruccion completa en cada commit.
- Al iniciar, Color RAM se rellena una sola vez con el color dominante de los caracteres visibles; las celdas cuyo charset es completamente vacio no fuerzan colores claros irrelevantes.
- En cada cambio de camera_row se actualizan solamente las posiciones ocupadas por caracteres visualmente no vacios del nuevo viewport mediante tablas sparse precalculadas.
- Para el PRG de prueba recibido, el viewport contiene aproximadamente 38..41 caracteres no vacios por camera_row, en vez de 1000 escrituras de color por commit.
- Se conserva sin cambios el row-phase-safe de TEST82/83, el mapa fuente 40x50 completo, Window 40x25 por defecto y Scroll Area 40x50.
- Exportaciones normales 40x25 siguen delegando a TEST77.

TEST86 - 2026-10-16 - ASM pointer table fix for sparse colors
- Base: TEST85 sparse color optimization.
- Fix: color-update pointer tables are emitted as numeric low/high bytes instead of <label/>label expressions.
- Reason: LVLLVL in-browser assembler rejected color_update_000... symbolic references.
- Sparse per-character color commit optimization remains unchanged.

TEST87 PENDING — LEFT PALETTE SIZE / POSITION
- Base exacta: MASTER TEST86 PASS.
- Único cambio funcional: se elimina el título "C64 COLORS" de la paleta rápida izquierda.
- Swatches ampliados de 17 px a 30 px de alto, conservando 2 columnas y la misma posición/anclaje del MASTER.
- Sin cambios en exportación, scroll, Window, Scroll Area ni runtime C64.

TEST88 PENDING: optimized 960-byte backbuffer shift so exported Ticks / Step tracks PAL IRQ cadence more closely; no UI/geometry/color changes.

TEST89 PENDING - 16/10/2026
- Base: TEST88.
- PRG confirmado por inspeccion: Ticks/Step=1, Pixels/Step=8.
- Nuevo fast path vertical para 8 px/step: backbuffer preparado anticipadamente en main loop.
- Objetivo: 8 px por frame PAL (1 fila de caracteres por frame) cuando Ticks/Step=1.
- Los modos 1..7 px conservan la ruta TEST88.

TEST126 — TEST77 real path diagnostic (17/10/2026): prueba borde/caracteres alternando, confirmado por usuario.
TEST127 — TEST77 original @ invertido (18/10/2026): PASS de escritura al charset, no corrige coexistencia.
TEST128 — NATIVE CHAR ANIMATION + MAP SCROLL TEST77 (18/10/2026): PENDING VICE PASS/FAIL.
- Partida exacta: web TEST127 (MASTER sin modificar).
- Comparacion con Untitled (1).prg (SYS2080, rutina animate_chars original, tabla $1257: 06 06 00 00 01),
  y Untitled (7).prg (SYS8192, TEST77 scroll runtime sin animate_chars).
- Se retiran completamente la inversion del @ y la alternancia de borde de TEST127.
- TEST77 llama desde su IRQ a animate_chars_native; frame_tick y scroll mapa permanecen separados.
- Caracteristicas: tipos LVLLVL left/right/up/down/blink, ticksPerFrame, dos bancos $3000/$3800.
- No cambia el contenido original del charset ni el indice del caracter.
- Se excluyen los chars animados de la seleccion de blank_char.
- ASM generado y ensamblado ACME WebAssembly (exit 0). PRG demo @ x3 generado.
- PENDIENTE comprobar en VICE el PRG demo y el export de la web con el proyecto del usuario.

TEST128 — 18 OCT 2026 — PASS CONFIRMADO POR USUARIO
- Animacion real de caracteres @ + MAP SCROLL simultaneos en VICE.
- UNICO BUG REPORTADO: todos los caracteres perdian su color original y se veian blancos.

TEST129 — 18 OCT 2026 — PENDIENTE PASS/FAIL EN VICE
- Deriva exactamente de TEST128 PASS.
- BUG FIX: conservar color fg por celda, mediante buffers sincronizados con TEST77.
- Misma rutina de animacion de caracteres; mismo scroll existente. Sin diagnosticos artificiales.
- ACME WASM: compila PRG de demo horizontal con 3 @ y colores diferentes.
- No ascender a MASTER sin PASS.

TEST130 — FIX PUNTEROS NUMERICOS DE COLOR EN EXPORT ONLINE — 18 OCT 2026
- Base: TEST129. Se reproduce con LVLLVL Assembler (js/main.js) exactamente
  'unknown value: frame_color_0' en los bytes < y >, que ACME si acepta.
- Unica correccion: reemplaza referencias adelantadas por punteros numericos
  calculados desde $4000 + 1000*N + (10*Animaciones + terminador).
- Sin cambios a la rutina original animate_chars ni al scroll de mapa.
- Auto-test reproductor LVLLVL interno: 6/6 PASS, datos colores por celda
  y direccion de cada frame verificados byte a byte.
- TEST129 no obtuvo PASS visual: falla la exportacion con assembler del navegador.
- TEST130: PASS compilacion navegador replicada; VICE pendiente de PASS/FAIL.
- MASTER no promovido: TEST128 sigue ultimo PASS visual.

TEST131 (18 OCT 2026) — PENDIENTE VICE
- En TEST130 el usuario confirma mejora visual con Map Scroll + chars
  funcionando; aun aparecen pequeños saltos de lineas y basura blanca
  al atravesar zona superior de pantalla.
- Posible causa concreta: copia sin filtros de 1024 bytes de color RAM
  durante bottom IRQ en commit_prepared, sobrepasando margen raster.
- Cambio aislado TEST131: precomputar en main una lista sparse de
  colores diferentes en $1800-$1fcf y escribir en IRQ solo si <=120;
  fallback anterior si >120. No alterar scroll o animacion originales.
- 6/6 ensamblados LVLLVL PASS, 5/5 pruebas de rutinas 6502 PASS.
- Pendiente PASS/FAIL VICE. MASTER sin cambios.


===== ORIGEN HISTORICO: tests/TEST131/README_TEST131.txt =====
LVLLVL → RICO | TEST131 | 18 OCTUBRE 2026
==========================================

BASE: TEST130 (assembler real de LVLLVL PASS, prueba en VICE reporta
mejora, pero muestra saltos breves de filas y algunas celdas blancas
cuando la animacion atraviesa la zona alta de la pantalla).

HIPOTESIS TECNICA Y CORRECCION AISLADA
-------------------------------------
TEST130 copiaba siempre 1.024 bytes a la RAM de color ($D800-$DBFF)
en la IRQ, incluso si solo cambiaban unos pocos colores. La IRQ
comienza en la linea raster $FA y ese trabajo puede invadir el raster
del siguiente frame. Esto puede explicar el tearing de la zona alta.

TEST131 mantiene LAS MISMAS rutinas de Map Scroll y animate_chars_native.
En la preparacion en main loop, compara los 1000 colores del buffer
oculto con la RAM de color y prepara una lista de cambios por celda.
Guarda cada cambio como 2 bytes empaquetados en $1800-$1FCF
(offset bajo; pagina 2 bits + color 4 bits). Escribe solo las
celdas cambiadas en la IRQ al hacer swap.

PRESUPUESTO: se aplican listas de hasta 120 cambios en la IRQ.
Con mas de 120 cambios por paso, hay fallback al copiado completo de
TEST130, para preservar el resultado y evitar un nuevo problema
funcional. Por eso TEST131 es una prueba focalizada en scroll de
mapas con colores mayormente estables; NO es todavia una solucion
universal de raster para pantallas con demasiados cambios de color.

VALIDACIONES:
- Assembler de LVLLVL: 6/6 escenarios PASS (1, 2, 6, 20 frames,
  sin y con chars animados, y guard de limite RAM).
- Ejecucion de instrucciones 6502 reales en emulador de prueba
  acotado: 5 casos PASS (6, 90, 98, 206 y 900 cambios).
- Verificados los buffers de color $1000 y $1400.
- Codigo + tablas de runtime terminan antes de $3000.
- Los bytes de PRG se generan con el assembler interno de LVLLVL.
- El MASTER del 17 OCT y los dos sistemas de animacion no se tocan.

PENDIENTE: resultado visual PASS/FAIL en VICE con el proyecto real,
especialmente el borde superior, los cambios de color y la suavidad.

NOTA: en TEST131 no se afirman resultados visuales que todavia
no se probaron. Si los saltos persisten, comparar las transiciones
del buffer/guard row del Map Scroll con los mismos datos y ticks.


===== ORIGEN HISTORICO: tests/TEST132/LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PENDING PASS/FAIL.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.

TEST81 - CLEAN RESTART: BLACK VIEWPORT GAP + LARGE VERTICAL MAP EXPORT
Status: PENDING PASS/FAIL.
Base: TEST80 PASS / checkpoint seguro 3e135f184fd1801f1c8e62e679aa2eaf11d1e329.
- Rebuilt directly from TEST80 PASS. No TEST82/TEST83 code is inherited.
- UI change only: when MAP SCROLL is active, the existing TEST79 preview canvas is prefilled black before drawing. This replaces the transparent/checker gap outside a smaller Window without changing Window, Scroll Area, Screen geometry, scale, crop math or scroll behavior.
- Export change only: reintroduces the already validated large vertical source-map runtime for Screen width 40 and height 26..255.
- First target case: Screen 40x50, Window 40x24 (or 40x25), Scroll Area 40x50, one Frame, Scroll Up/Down.
- The complete 40x50 source map is stored separately at $4000+; VIC still uses the normal $0400/$0800 1000-byte screen buffers and shows 24/25 rows while the camera traverses the full Scroll Area.
- Normal 40x25 exports still delegate to approved TEST77 unchanged.
- TEST81 intentionally does not add the later TEST82 per-cell color experiment; color behavior is outside this isolated restart test.

TEST82 CLEAN LARGE MAP PHASE FIX - 16 OCT 2026
- Base exacta: LVLLVL_TEST81_CLEAN_BLACK_GAP_LARGE_40X50.zip, itself rebuilt from TEST80 PASS.
- UI black-gap behavior unchanged.
- Large 40xN exporter: fixes first-row scroll phase by preparing the hidden screen from the currently visible VIC buffer, matching the proven TEST76 vertical pipeline.
- Scroll Up: shifts physical rows 1..24 into rows 0..23, then injects exactly the next logical map row into row 24 from the 40xN source map.
- Scroll Down: shifts physical rows 0..23 into rows 1..24, then injects exactly the previous logical map row into row 0.
- Camera still traverses the complete Scroll Area and wraps only at Scroll Area boundaries.
- No changes to Window, Scroll Area, editor geometry, black gap fill, TEST77 normal 40x25 export, charset or color behavior.

TEST83 CLEAN - LARGE MAP VIEWPORT OVER FULL SOURCE - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base: TEST82 CLEAN LARGE MAP PHASE FIX, itself on the TEST80 PASS clean line.
- Corrects the editor-side interpretation only; source Screen data is never cropped.
- MAP SCROLL OFF: LVLLVL returns to the complete Screen preview/editor (e.g. 40x50).
- MAP SCROLL ON for a large vertical map: GridView2d sees the Window height only (e.g. 40x24), matching the visible Commodore viewport.
- The scroll renderer separately renders the complete Scroll Area (e.g. all 50 rows) into an offscreen source surface and moves that source behind the fixed Window.
- Rows below the Window remain available and enter from below during Scroll Up; they are not discarded when the viewport is reduced.
- No document dimensions, Screen rows, Window metadata or Scroll Area metadata are modified.
- Existing clean TEST82 large-map PRG exporter remains installed, so the C64 export still uses the full 40xN source map while VIC displays only the 24/25-row viewport.
- Unit validation: GridView2d reports 192px for 40x24 while scroll is ON, restores 400px for 40x50 when OFF; source movement test confirms 3px phase reads 3px farther into the full source.

TEST83 PASS CONFIRMADO POR USUARIO - 16 OCT 2026
- Screen/Mapa fuente 40x50 permanece completo.
- MAP SCROLL OFF vuelve a mostrar las 50 filas completas para edicion.
- MAP SCROLL ON usa Window como viewport y recorre el Scroll Area completo sin recortar filas fuente.
- Caso aprobado: Screen 40x50 + Window 40x24 + Scroll Area 40x50.

TEST84 - DEFAULT C64 WINDOW 40x25 + PER-CELL COLORS - 16 OCT 2026
Status: PARTIAL / REPLACED BY TEST85.
Base exacta: TEST83 PASS.
- Cuando un Screen supera 40 columnas o 25 filas y se abre Rico's Window Dimensions, una Window aun no configurada/full-Screen recibe una sola vez el default C64 de hasta 40x25. Scroll Area no se modifica.
- El usuario conserva libertad total para cambiar luego la Window; el default no se vuelve a imponer sobre una eleccion manual.
- Para el exportador grande vertical 40xN se conserva intacto el runtime row-phase-safe de TEST82/TEST83.
- Se agrega un mapa de colores por celda paralelo al mapa de caracteres: caracteres en $4000+, colores C64 (fc) en $7000+.
- Color RAM se construye desde las mismas 25 filas de camara que el mapa visible y se actualiza al confirmar cada nuevo bloque de scroll.
- Exportaciones normales 40x25 siguen delegando a TEST77; no se toca su runtime.
- Primer caso de prueba recomendado: Screen 40x50 + Window 40x25 + Scroll Area 40x50 + Scroll Up, verificando geometria y colores en VICE.

TEST85 - SPARSE COLOR COMMIT / SMOOTHER LARGE MAP - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base exacta: TEST84 sobre TEST83 PASS.
- TEST84 queda marcado como PARTIAL: el default 40x25 funciona y el PRG conserva color por celda, pero el usuario detecta salto perceptible al cruzar filas y restos claros/blancos durante el fine-scroll.
- Diagnostico sobre el PRG exportado por el usuario: los datos de color si estan presentes en $7000; el problema no es perdida del mapa de color.
- Causa del salto: TEST84 reconstruia las 1000 posiciones de Color RAM dentro de cada commit de buffer, agregando demasiado trabajo al cambio de fila.
- TEST85 elimina esa reconstruccion completa en cada commit.
- Al iniciar, Color RAM se rellena una sola vez con el color dominante de los caracteres visibles; las celdas cuyo charset es completamente vacio no fuerzan colores claros irrelevantes.
- En cada cambio de camera_row se actualizan solamente las posiciones ocupadas por caracteres visualmente no vacios del nuevo viewport mediante tablas sparse precalculadas.
- Para el PRG de prueba recibido, el viewport contiene aproximadamente 38..41 caracteres no vacios por camera_row, en vez de 1000 escrituras de color por commit.
- Se conserva sin cambios el row-phase-safe de TEST82/83, el mapa fuente 40x50 completo, Window 40x25 por defecto y Scroll Area 40x50.
- Exportaciones normales 40x25 siguen delegando a TEST77.

TEST86 - 2026-10-16 - ASM pointer table fix for sparse colors
- Base: TEST85 sparse color optimization.
- Fix: color-update pointer tables are emitted as numeric low/high bytes instead of <label/>label expressions.
- Reason: LVLLVL in-browser assembler rejected color_update_000... symbolic references.
- Sparse per-character color commit optimization remains unchanged.

TEST87 PENDING — LEFT PALETTE SIZE / POSITION
- Base exacta: MASTER TEST86 PASS.
- Único cambio funcional: se elimina el título "C64 COLORS" de la paleta rápida izquierda.
- Swatches ampliados de 17 px a 30 px de alto, conservando 2 columnas y la misma posición/anclaje del MASTER.
- Sin cambios en exportación, scroll, Window, Scroll Area ni runtime C64.

TEST88 PENDING: optimized 960-byte backbuffer shift so exported Ticks / Step tracks PAL IRQ cadence more closely; no UI/geometry/color changes.

TEST89 PENDING - 16/10/2026
- Base: TEST88.
- PRG confirmado por inspeccion: Ticks/Step=1, Pixels/Step=8.
- Nuevo fast path vertical para 8 px/step: backbuffer preparado anticipadamente en main loop.
- Objetivo: 8 px por frame PAL (1 fila de caracteres por frame) cuando Ticks/Step=1.
- Los modos 1..7 px conservan la ruta TEST88.

TEST126 — TEST77 real path diagnostic (17/10/2026): prueba borde/caracteres alternando, confirmado por usuario.
TEST127 — TEST77 original @ invertido (18/10/2026): PASS de escritura al charset, no corrige coexistencia.
TEST128 — NATIVE CHAR ANIMATION + MAP SCROLL TEST77 (18/10/2026): PENDING VICE PASS/FAIL.
- Partida exacta: web TEST127 (MASTER sin modificar).
- Comparacion con Untitled (1).prg (SYS2080, rutina animate_chars original, tabla $1257: 06 06 00 00 01),
  y Untitled (7).prg (SYS8192, TEST77 scroll runtime sin animate_chars).
- Se retiran completamente la inversion del @ y la alternancia de borde de TEST127.
- TEST77 llama desde su IRQ a animate_chars_native; frame_tick y scroll mapa permanecen separados.
- Caracteristicas: tipos LVLLVL left/right/up/down/blink, ticksPerFrame, dos bancos $3000/$3800.
- No cambia el contenido original del charset ni el indice del caracter.
- Se excluyen los chars animados de la seleccion de blank_char.
- ASM generado y ensamblado ACME WebAssembly (exit 0). PRG demo @ x3 generado.
- PENDIENTE comprobar en VICE el PRG demo y el export de la web con el proyecto del usuario.

TEST128 — 18 OCT 2026 — PASS CONFIRMADO POR USUARIO
- Animacion real de caracteres @ + MAP SCROLL simultaneos en VICE.
- UNICO BUG REPORTADO: todos los caracteres perdian su color original y se veian blancos.

TEST129 — 18 OCT 2026 — PENDIENTE PASS/FAIL EN VICE
- Deriva exactamente de TEST128 PASS.
- BUG FIX: conservar color fg por celda, mediante buffers sincronizados con TEST77.
- Misma rutina de animacion de caracteres; mismo scroll existente. Sin diagnosticos artificiales.
- ACME WASM: compila PRG de demo horizontal con 3 @ y colores diferentes.
- No ascender a MASTER sin PASS.

TEST130 — FIX PUNTEROS NUMERICOS DE COLOR EN EXPORT ONLINE — 18 OCT 2026
- Base: TEST129. Se reproduce con LVLLVL Assembler (js/main.js) exactamente
  'unknown value: frame_color_0' en los bytes < y >, que ACME si acepta.
- Unica correccion: reemplaza referencias adelantadas por punteros numericos
  calculados desde $4000 + 1000*N + (10*Animaciones + terminador).
- Sin cambios a la rutina original animate_chars ni al scroll de mapa.
- Auto-test reproductor LVLLVL interno: 6/6 PASS, datos colores por celda
  y direccion de cada frame verificados byte a byte.
- TEST129 no obtuvo PASS visual: falla la exportacion con assembler del navegador.
- TEST130: PASS compilacion navegador replicada; VICE pendiente de PASS/FAIL.
- MASTER no promovido: TEST128 sigue ultimo PASS visual.

TEST131 (18 OCT 2026) — PENDIENTE VICE
- En TEST130 el usuario confirma mejora visual con Map Scroll + chars
  funcionando; aun aparecen pequeños saltos de lineas y basura blanca
  al atravesar zona superior de pantalla.
- Posible causa concreta: copia sin filtros de 1024 bytes de color RAM
  durante bottom IRQ en commit_prepared, sobrepasando margen raster.
- Cambio aislado TEST131: precomputar en main una lista sparse de
  colores diferentes en $1800-$1fcf y escribir en IRQ solo si <=120;
  fallback anterior si >120. No alterar scroll o animacion originales.
- 6/6 ensamblados LVLLVL PASS, 5/5 pruebas de rutinas 6502 PASS.
- Pendiente PASS/FAIL VICE. MASTER sin cambios.

TEST132 (18 OCT 2026) — PENDIENTE VICE / PASS PRUEBAS RUNTIME
- Entrada: vídeo de 8.617s del usuario; TEST131 redujo basura blanca pero persisten saltos al alcanzar borde superior.
- Hipótesis: fallback de 1024 bytes en IRQ si TEST131 detecta >120 colores distintos puede romper presupuesto raster.
- Corrección localizada: máximo 40 cambios/IRQ, resto pendientes; no fallback de copia de color en cada commit de scroll.
- Main loop espera drenaje de cambios de color para proteger lista y buffering.
- Compilación ensamblador nativo: 6/6 PASS, rutinario 6502: 7/7 PASS (0,6,90,98,206,900,1000 celdas).
- Animación chars TEST128 y Map Scroll no modificados. Guardar TEST131 y MASTER. No elevar antes de VICE.


===== ORIGEN HISTORICO: tests/TEST132/README_TEST132.txt =====
LVLLVL / RICO — TEST132 — 18 OCTUBRE 2026
======================================
BASE: TEST131 (mejora parcial de basura blanca; FAIL por saltos y residuos de color en borde superior del mapa).

VIDEO DE REFERENCIA: 2026-10-18 11-57-28.mkv, 8.617 segundos, 1920x1080 a 60 fps (VICE, aportado por usuario).
El video confirma artefactos cerca del borde alto durante la traslación vertical. No prueba por si mismo la causa de esos artefactos.

HIPOTESIS QUE PRUEBA TEST132
---------------------------
TEST131 hizo actualizaciones de color dispersas hasta 120 celdas en IRQ, pero
si eran más de 120 volvía a copiar 1024 bytes de golpe. El tiempo variable
puede alargar la interrupción raster iniciada en $FA y producir saltos visuales
cuando alcanza la parte superior en el cuadro siguiente.

TEST132 elimina el fallback de copia completa del commit de scroll y limita
cada ejecución de la IRQ a 40 cambios de color. Los cambios restantes se
aplican en IRQ siguientes. Se conserva la lista precomputada en $1800-$1FCF,
los dos buffers de screen y color y la animación nativa de caracteres.

Mientras existe una lista pendiente, el main loop no pisa esa lista con
nuevas preparaciones ni transiciones de frame; puede pausarse el ritmo del
scroll ante cambios de color masivos. El dibujo original no se altera.
La RAM de color del C64 no es doble buffer: durante uno o más cuadros las
celdas pueden mostrar aún el color previo si hay más de 40 diferencias.

ESTADO
------
PASS COMPILACION: ensamblador integrado LVLLVL, 6 escenarios (1, 2, 6 y 20
frames, con/sin chars animados y guard de RAM).
PASS RUTINAS 6502: emulacion de la rutina ensamblada con 0, 6, 98, 90,
206, 900 y 1000 cambios; todas las celdas terminan con el color esperado,
y cada IRQ escribe hasta 40 celdas.

SIN PASS VISUAL: aun falta probar en VICE el proyecto real del video.
No ascender al MASTER ni marcar como resuelto el salto vertical antes de esa prueba.

LIMITES DE ALCANCE
-----------------
Se ha cambiado exclusivamente la forma en que se aplican los colores del
scroll TEST77 en la interrupcion. No se modifican los algoritmos de scroll,
scroll de caracteres, charsets, banks, disenos, ni la configuracion UI.
Las transiciones completas a otro frame conservan el tratamiento de color
anterior: esta prueba se centra en los pasos de scroll de mapa.

Repositorio: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export


===== ORIGEN HISTORICO: tests/TEST133/README_TEST133.txt =====
RICO / LVLLVL TEST133 — PRIORIDAD A COLORES VISIBLES
18 OCTUBRE 2026 — PRUEBA, SIN PASS VISUAL AUN

TEST132: dos animaciones + Map Scroll funcionan y no quedan fantasmas ni saltos de linea.
Pendiente: destellos blancos de algunas celdas cada cierto numero de frames.

HIPOTESIS: la cola limitada a 40 actualizaciones por IRQ colorea primero celdas vacias.
Tras el intercambio de pantalla, los glifos visibles aun pueden heredar por unos frames
los colores previos de RAM, que en ocasiones son blancos.

CAMBIO UNICO EN TEST133:
- La cola de cambios de color se prepara con dos pasadas fuera de IRQ:
  1) celdas que en el siguiente screen buffer contienen un glifo distinto de blank_char;
  2) el resto de celdas.
- No se elimina ninguno de los cambios de color y no se cambian patrones de glifos.
- El presupuesto sigue siendo 40 escrituras de color por IRQ.
- Se conservan animacion de caracteres, Map Scroll, exportador TEST77 y timings.
- No altera frames, colores originales ni el MASTER.

TESTS AUTOMATICOS:
- 6/6 configuraciones de compilacion con ensamblador nativo LVLLVL.
- 7/7 pruebas de rutina 6502 con recuento final y orden de prioridades.

VICE: EXPORTAR DESDE ESTA WEB Y VERIFICAR SI DESAPARECE EL BLINK BLANCO.
Si reaparece cualquier ghost o salto de linea, STOP y revertir a TEST132.
GitHub: serigrafiamdp-web/lvllvl-scummpet-export


===== ORIGEN HISTORICO: tests/TEST134/README_TEST134.txt =====
RICO / LVLLVL — TEST134 — 18 OCTUBRE 2026
OBJETIVO: quitar destellos blancos ocasionales al combinar la animacion ORIGINAL de caracteres @ con Map Scroll.
ESTADO: PASS FINAL EN VICE / 18 OCT 2026.

DIAGNOSTICO REAL (PRG del usuario Untitled (2).prg, exportado con TEST133):
- Un frame; Map Scroll RIGHT, 6 ticks/step, 1 pixel/step.
- El caracter $00 esta animado UP cada 6 ticks; el codigo aparece 26 veces en pantalla.
- Los 26 $00 tienen color 14 (celeste); las restantes 974 celdas son espacio $20 con color 1 (blanco).
- TEST133 compara directamente el byte de color del backbuffer ($00-$0f) contra el byte leido desde $d800-$dbe7. En C64 el color tiene solamente 4 bits validos; no se puede utilizar el nibble superior de su lectura para comprobar igualdad. Esto puede convertir celdas ya correctas en diferencias falsas y acumular hasta 1000 escrituras por paso.
- Ademas, TEST133 trata como vacias solamente las celdas $ff (blank_char del motor), ignorando el caracter espacio $20 que en ambos charsets es realmente vacio.

CAMBIOS TEST134 (SOLO EXPORTADOR TEST77):
1) Comparar el color de RAM tras aplicar AND #$0F, preservando la semantica real de los 4 bits de C64.
2) Priorizar las celdas con glifos visibles segun tabla de 256 codigos generada desde los dos charsets reales y metadatos de animacion. Se consideran vacios solo los glifos sin pixels en ambos bancos y que no esten animados.
3) Conservar las dos animaciones, las velocidades, los datos de los tiles y la cola de maximo 40 actualizaciones por IRQ de TEST132.

VALIDACION:
- Ensamblador original LVLLVL: 6/6 configuraciones compiladas.
- Emulacion de rutinas de color 6502: 8/8 escenarios PASS, ahora simulando los bits altos indeterminados de RAM de color.
- Reconstruccion del PRG real: 26 caracteres @, tipo UP, ticks6, 974 espacios blancos y 26 caracteres celestes.
- Los bytes de charset BANK1/BANK2, pantalla, tabla de animacion original y colores del PRG reconstruido son identicos al PRG recibido.
- En un desplazamiento RIGHT de una celda, se detectan 30 cambios reales de color y se aplican en 1 IRQ. No 1000 cambios falsos.

INSTRUCCIONES:
- Abrir index.html de este ZIP o la web GitHub Pages TEST134.
- Validado en VICE con el proyecto real: exportacion final aprobada, sin destello blanco.
- Comparar opcionalmente el PRG TEST134_REPRO_USUARIO_26_ARROBAS.prg, reconstruido del ultimo archivo enviado.
- PASS VISUAL confirmado por usuario con su proyecto real: exporta correctamente las animaciones de caracteres y Map Scroll a la vez, sin blink blanco, caracteres fantasma ni saltos de linea.
- PASS adicional confirmado: color de borde y color de fondo del editor se respetan en el PRG ejecutable.
- Aprobado para promocion a nuevo MASTER el 18/10/2026.


===== ORIGEN HISTORICO: tests/TEST135/README_TEST135.txt =====
RICO / LVLLVL — TEST135 — 18 OCT 2026
ESTADO: PRUEBA EXPERIMENTAL / VICE PENDIENTE / MASTER TEST134 INTACTO

PROBLEMA DEMOSTRADO POR EL USUARIO:
- LVLLVL previsualiza correctamente el scroll de caracteres y el mapa a 1 tick.
- En VICE el PRG exportado con ambos a 1 tick avanza a saltos, en vez de un movimiento uniforme.
- Ambas animaciones a 6 ticks ya pasan en TEST134.
- Evidencia visual: 2026-10-18 15-58-08.mkv (2,784 segundos, 60fps).

CAUSA EN RUNTIME TEST134:
- El buffer nuevo se solicitaba al llegar al ultimo pixel fino (0 o 7), demasiado tarde.
- El bloque de preparacion en main_loop activa main_busy; durante ese tiempo la IRQ omite frame_tick, congelando el desplazamiento fino hasta que el buffer esté listo.
- A 1 tick esa pausa aparece a cada paso entre celdas de 8 pixeles.

CAMBIO AISLADO DE TEST135:
- Solo en exportacion de UN FRAME y Map Scroll normal UP/DOWN/LEFT/RIGHT con ticks/step=1 y pixels/step=1.
- Adelanta el pedido de buffer al PRIMER pixel fino del grupo (fine=1 o 6), dando seis ticks de tiempo antes del intercambio.
- Permite que el scroll fino siga avanzando durante main_busy con acceso directo a $D011/$D016 y sin interferir con tmp_byte ni punteros del preparador.
- Intercambia las pantallas SOLO al 8vo pixel y cuando prep_ready esta activo.
- Si el buffer sigue sin terminar al alcanzar el limite, aguarda sin corromper datos.
- Se conservan animate_chars_native, los datos de los glifos, colores y el sistema TEST134 de Color RAM; las velocidades mayores, otras animaciones y modos conservan la ruta anterior.

VALIDACIONES AUTOMATICAS:
- Ensamblador interno original de LVLLVL: 6/6 regresiones PASS.
- Escenarios reales de usuario (26 arrobas, bancos/colores conservados), cuatro direcciones a 1 tick y 6 ticks: 8/8 ensamblados PASS.
- Emulacion de LAS INSTRUCCIONES 6502 generadas, 4 direcciones: fine-scroll de un pixel por IRQ durante cuatro IRQ ocupadas y swap solo en el paso 8: PASS 4/4.
- No es un PASS de VICE: confirmar usuario con su mismo proyecto a 1 tick y a 6 ticks.

INSTRUCCIONES:
1. Abrir el index.html de este ZIP, o la web TEST135 una vez desplegada.
2. Exportar el MISMO proyecto: animacion de char 1 tick; Map Scroll 1 tick, 1 pixel/step.
3. Revisar VICE: movimiento continuo arriba/derecha y ausencia de errores de color y caracteres fantasma.
4. Probar 6 ticks como regresion.
5. Informar PASS/FAIL. Si aun salta, enviar PRG generado con TEST135 para medir el siguiente cuello de botella.

VERSION ANTERIOR CONSERVADA:
MASTER_LVL_RICO_TEST134_PASS_18_OCT_2026.zip
SHA256 095be926a55414057428f42fe3311bf64b5b5d46a2ce2e64dc46083345e47fce


===== NOTA CONSOLIDACION =====
Los LOG de TEST133–TEST137 eran copias incrementales: para evitar duplicados se conserva el LOG cumulativo de TEST138 mas reciente. Todos los originales se preservan en historial y respaldo de Git.


===== ORIGEN HISTORICO: tests/TEST136/README_TEST136.txt =====
RICO / LVLLVL — TEST136 — 18 OCT 2026
ESTADO: PRUEBA / VICE PENDIENTE / MASTER ESTABLE TEST134 INTACTO

OBSERVACION USUARIO:
- En TEST135, animacion char UP + Map Scroll RIGHT ambos a 1 tick mejora, pero cada varias frames se ve un movimiento lateral en lugar de diagonal constante.
- Video de evidencia: 2026-10-18 18-49-47.mkv (8.434 s, 1920x1080 a 60 fps).

HIPOTESIS / CAUSA PLAUSIBLE EN EL CODIGO:
- TEST135 ya adelanta la preparacion de la pantalla y mantiene el fine scroll mientras main_busy.
- La rutina build_sparse_colors (heredada de TEST133/134) recorria 1000 celdas DOS veces: primero visibles y despues vacias. Durante ese trabajo main_busy impide la ruta frame_tick regular.
- El presupuesto de 6 pasos finos para preparar la siguiente pantalla puede quedarse corto a 1 tick, con una pausa en el limite del bloque de 8 pixels.

CAMBIO AISLADO TEST136:
- Solo un unico frame, mapa cardinal Up/Down/Left/Right, 1 tick/step y 1 pixel/step.
- Se genera build_sparse_colors de una sola pasada (1000 celdas en vez de 2000).
- Mantiene la comparacion correcta de Color RAM con AND #$0F y la lista de parches de maximo 40 celdas por IRQ.
- No modifica animate_chars_native, los glifos, las rutinas VIC fine scroll, ni el intercambio anticipado de buffers de TEST135.
- A velocidades distintas o configuraciones fuera de este alcance, se emite EXACTAMENTE el mismo codigo ensamblador que TEST135.
- CONSIDERACION: Si >40 celdas cambian de color simultaneamente en 1 tick, pueden existir colores transitorios mientras se aplican las siguientes IRQs; ese comportamiento debe validarse con proyectos de colores muy variados.

PRUEBAS:
- Compilacion original de LVLLVL 6/6 regresiones PASS.
- 8/8 pruebas de ensamblado (4 direcciones, 1tick y 6ticks) PASS.
- 4/4 pruebas de ejecucion del desplazamiento fino en 6502 PASS (comportamiento heredado de TEST135).
- Verificacion diferencial: en 6 ticks el texto completo del codigo ASM generado coincide byte por byte con TEST135, en 4 direcciones.
- 1 tick: se elimina la fase de doble recorrido, conserva bytes originales del screen ($4000) y colores ($43f3) del caso real recibido.
- Pendiente: video/VICE a 1 tick. TEST134 sigue MASTER hasta confirmacion.

PRUEBA:
1. Abrir esta WEB de TEST136 (en ZIP o Github Pages).
2. Exportar el mismo proyecto con animate chars 1 tick UP y Map Scroll 1 tick RIGHT, 1px/step.
3. Observar si desaparece el movimiento lateral aislado cada 8 pixels. Verificar tambien los colores.
4. Probar de nuevo a 6 ticks como regresion.

RESPALDOS:
- MASTER TEST134 PASS: MASTER_LVL_RICO_TEST134_PASS_18_OCT_2026.zip
- TEST135: LVLLVL_TEST135_FAST_1T_PREFETCH_CHAR_MAP_SCROLL.zip


===== ORIGEN HISTORICO: tests/TEST137/README_TEST137.txt =====
LVLLVL / RICO — TEST137 — FRAME DURATION ROLLOVER / 18 OCTUBRE 2026
ESTADO: PRUEBA EN VICE PENDIENTE. MASTER TEST134 INTACTO.

OBSERVACION CONFIRMADA:
- TEST136 mejora la fluidez a 1 tick pero persisten desplazamientos laterales ocasionales: el movimiento deja de ser diagonal.
- Video del usuario: 2026-10-18 19-13-53.mkv (13.8 segundos, 1920x1080, 60 fps).

CAUSA DE CODIGO IDENTIFICADA:
- frame_tick / frame_tick_next para un solo frame repone frame_remaining (duration) y ejecuta RTS sin continuar frame_tick_scroll.
- En esa IRQ la rutina animate_chars_native SI se ejecuta: el caracter se mueve pero el Map Scroll pierde un pixel/tick.
- Esa diferencia de fases es especialmente visible con ambos a 1 tick, y se repite cada vez que expira la duracion del frame.

CAMBIO MUY LIMITADO TEST137:
- Solo para frame unico + scroll cardinal + 1 tick/step + 1 pixel/step (el alcance existente de TEST136).
- Tras cargar la duracion, ejecutar JMP frame_tick_scroll en lugar de RTS.
- Conserva exactas las rutas de 6 ticks, multi-frame, Ping Pong, Move In/Out, animacion de caracteres, colores, geometria y prefetch.
- NO cambia el temporizador; solo impide descartar el tick del mapa en su rollover.

PRUEBAS REPRODUCIBLES:
- TEST137_ASSEMBLER_REGRESSION.cjs: 24/24 PASS (4 direcciones x 2 velocidades x 3 duraciones: 1, 12 y 1024).
- Comparacion source ASM: con 6 ticks es byte por byte IDENTICO a TEST136.
- A 1 tick solo cambia el retorno al terminar la duracion del frame por un salto a frame_tick_scroll.
- TEST137_CPU_DURATION_ROLLOVER_CHECK.cjs: 6/6 PASS; ejecuta instrucciones 6502 reales ensambladas, y comprueba que en la IRQ de rollover fine_pos aumenta y se solicita el siguiente buffer.
- La demostracion compilada TEST137_REAL_USER_1T_RIGHT_CHAR_UP_1T.prg usa los datos del PRG real enviado en TEST134 (26 arrobas celestes).

PRUEBA EN VICE:
1. Desde la web TEST137 exportar el proyecto actual con animacion de caracteres UP 1T y Map Scroll RIGHT 1T 1px/step.
2. Confirmar una diagonal continua, incluso cuando vence Frame Duration. Si no, aportar el nuevo PRG real.
3. Comprobar regresion a 6 ticks; borde, fondo y colores deben permanecer correctos.
4. No promover a MASTER sin PASS visual del usuario.


===== ORIGEN HISTORICO: tests/TEST138/README_TEST138.txt =====
RICO / LVLLVL — TEST138 — 18 OCTUBRE 2026
ESTADO: MILESTONE PASS — VICE VISUAL CONFIRMADO POR USUARIO; 48/48 COMPILACIONES PASS

OBJETIVO
- Corregir el movimiento ocasional lateral cuando Map Scroll UP 1tick/1px + Animated Char RIGHT 1tick.
- Mantener fluidez, velocidad configurable por char y MASTER TEST134 inalterado.

INVESTIGACION EN REPOSITORIO PROPIO
- SCUMM-PET-C64 README.md: MASTER IRQ raster $FA para SID, Visual ScrollStep y eventos; un scheduler visual.
- milestones/ECM_SINGLE_SCHEDULER_PASS_13_OCT_2026/README.md: animacion continua dentro de una unica sesion de scheduler (PASS).
- releases/MASTER_13_OCT_2026_ECM_BORDER_ANIMATED_CHARS_V056/README.md: Animated Chars tienen ticks/counters individuales (PASS).
- docs/SCUMM_HIBRIDO_MAPA_MILESTONES.txt: flujo front -> back -> screen swap -> Color RAM; el scheduler define timing de frames.
- NO se copiaron direcciones o binarios SCUMM: motor y memoria del exportador LVLLVL son distintos. Se reusa el principio de reloj maestro con subcontadores.

CAMBIOS AISLADOS EN EL EXPORTADOR TEST77
1. Gear de desplazamiento: cuando el modo es un solo frame, scroll cardinal, 1tick/1px y hay Animated Chars, muestrear fine_pos antes y despues de procesar Map Scroll en la misma IRQ.
2. Si fine_pos cambio, llamar a animate_chars_native (que conserva su contador original por caracter y su tipo/direccion/ticks configurados en editor). Si no cambio, no avanzar el tick del caracter. Los 6ticks y otros modos emiten ASM identico a TEST137.
3. Optimizar SOLO pantallas 40x25 con TODOS los screen codes y colores identicos en TODO Scroll Area: map periodico de 8x8. No se necesita nuevo front/back por cada ciclo; actualizar D011/D016 un pixel por tick y repetir modulo 8. Nunca para pantallas con diferencias reales.
4. Contadores de diagnostico: $48 = avance real registrado (modulo 256), $49 = ticks sin avance (modulo 256). $47 guarda posicion anterior. Son contadores de diagnostico solo en modo engranado.

DATOS DE PRUEBA REALES
- TEST SCROLL NUEVO.prg: mapa 40x25 con 1000 glifos $00 celestes, scroll UP 1tick 1px, char $00 RIGHT 1tick, frame duration 12.
- PRG TEST138_REAL_USER_1T_UP_CHAR_RIGHT.prg generado usando chars/colores reales.
- PRG TEST138_NONUNIFORM_1T_RIGHT_CHAR_3T.prg fuerza ruta general con celda distinta y char 3ticks.

VERIFICACION AUTOMATICA
- Assembler original de LVLLVL: 48/48 PASS (4 direcciones, 1/6 ticks, char 1/3/6 ticks, uniforme/no uniforme).
- Compilacion 6tick identica byte por byte al TEST137.
- TEST138_CPU_GEAR_AND_UNIFORM_CHECK.cjs: 32/32 pasos consecutivos a 1px/tick SIN pedido de nuevo buffer para mapa uniforme. Simulacion de espera de mapa: 13 eventos, 9 avances, 4 esperas; la llamada a animate_chars_native ocurre solo cuando el mapa avanzo.
- Importante: la prueba de engranaje intercepta llamadas a animate_chars_native para verificar el gate, NO es validacion grafica C64 real.
- PASS visual en VICE confirmado en el proyecto real del usuario con mapa uniforme UP 1tick/1px y char RIGHT 1tick. Mapas no uniformes y otras combinaciones conservan solo validacion automatica hasta nuevas pruebas.

REGLAS
- TEST134 es MASTER estable y NO se toca.
- TEST137 fue el ultimo test experimental anterior. TEST138 queda CONGELADO como milestone PASS en rama dedicada.
- Este milestone PASS se conserva separado de main por decision de preservar el MASTER TEST134 y el milestone TEST138 sin mezclar trabajo experimental.

CONFIRMACION FINAL / 18 OCT 2026
- Usuario confirma expresamente: 'esa solucion es perfecta'.
- PASS del engranaje a 1 tick, diagonal fluida, sin movimientos laterales periodicos apreciables en el caso validado.
- ZIP congelado: MILESTONE_LVL_RICO_TEST138_PIXEL_GEAR_PASS_18_OCT_2026.zip.
- SHA256: a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227.
- MAIN conserva MASTER TEST134. Rama milestone es nuevo punto de retorno.


===== ORIGEN HISTORICO: tests/TEST138/LOG.txt =====
RICO LVLLVL - LOG ACUMULATIVO

TEST59B - PASS / MASTER
- Move Out + Move In menu restored.
- Blank staging screen at $0C00 removes transition tearing into Move In.
- Preview PAL 50 Hz / zoom sync / border fix retained.

TEST60 - PENDING PASS/FAIL
- Base: TEST59B MASTER PASS.
- Isolated fix: vertical MAP SCROLL uses 40 columns (VIC-II CSEL=1, $D016=$08).
- Vertical modes affected: Scroll Up/Down, Ping Pong Up/Down, Move Out Up/Down, Move In Up/Down.
- Vertical keeps 24-row mode to hide the work row.
- Horizontal modes remain 38 columns exactly as in TEST59B.
- Goal: restore the right/left visible column during vertical movement without changing horizontal scrolling.


TEST61 - FAIL
- Async backbuffer experiment reduced IRQ work but did not remove the visible refresh problem.
- Not promoted.

TEST62 - FAIL
- Safe Move Out -> Move In transition experiment still showed garbage during the black interval and broken horizontal bands while Move In was entering.
- Not promoted.

TEST63 - PENDING PASS/FAIL
- Base package: TEST60 (40-column vertical fix), without TEST61/62 runtime experiments.
- General clean architecture for every MAP SCROLL animation: Scroll, Ping Pong, Move Out and Move In, in all four directions.
- Strict double buffer:
  FRONT = VIC-II visible screen and is never modified.
  BACK = hidden screen and is fully built before presentation.
  $D018 swaps FRONT/BACK only from the raster IRQ after BACK is ready.
- Heavy screen preparation and hidden frame loading run in main loop, never inside the raster IRQ.
- IRQ skips timing work while main is actively building a hidden buffer, preventing shared zero-page state from being read half-written.
- Frame-to-frame transitions use the same general hidden BACK path; they are not special-cased only for Move In.
- $0C00 remains the blank staging screen and is only used when a foreground-color change requires hiding Color RAM reconstruction.
- Vertical modes keep 40 columns + 24 rows. Horizontal modes keep 38 columns + 24 rows.
- Ticks / Step cadence is preserved across buffer swaps.
- Pixels / Step values that cross a character boundary preserve any deferred pixels for the next safe commit.
- Goal: eliminate raster tearing / broken horizontal geometry for any scrolling animation and any frame sequence.


TEST63 - STRICT DOUBLE BUFFER
Status: PARTIAL / FAIL for phase continuity.
- PASS parcial: elimina la basura durante la pantalla negra y evita tearing de bandas incompletas.
- FAIL: Move/Ping Pong presentan saltos hacia atras cada cruce de 8 pixeles.
- Causa: BACK se preparaba con ping_pos 7/15/23... en vez de la posicion que corresponde al swap 8/16/24...

TEST64 - DOUBLE BUFFER PHASE FIX
Status: PENDING PASS/FAIL.
- Conserva el doble buffer estricto general de TEST63.
- Corrige fase de Move Out / Move In / Ping Pong en ambos sentidos.
- Al llegar al borde de caracter se proyecta un pixel adicional solo para preparar el BACK que se mostrara en el siguiente swap.
- Respeta limites de recorrido: no proyecta mas alla del maximo ni por debajo de cero.
- Scroll normal mantiene su comportamiento de TEST63.
- No se agregan archivos TXT nuevos; este cambio queda documentado en LOG.txt.

TEST65 - PREVIEW VERTICAL 24 ROWS
Status: PENDING PASS/FAIL.
- Runtime PRG TEST64 remains byte-identical and is NOT modified.
- Fix only affects LVLLVL animation preview.
- Vertical Move In / Move Out preview now uses the real visible height: 24 rows x 8 = 192 px.
- The hidden 25th work row is not drawn as part of the visible vertical Move viewport.
- Goal: remove the ~1-character jump between frames seen only in LVLLVL Play while VICE is already seamless at 192 ticks / 1 px per tick.
- Temporal mismatch identified: LVLLVL was visually closing at 200 ticks because it previewed 25 rows instead of the VIC-II 24-row viewport.

TEST65 - PASS
- LVLLVL preview vertical Move In / Move Out now matches the real VIC-II 24-row viewport.
- Correct timing confirmed in VICE at 192 ticks, Ticks/Step=1, Pixels/Step=1.
- Runtime TEST64 remains unchanged and correct.

TEST66 - WINDOW DIMENSION MENU CLONE
Status: PENDING PASS/FAIL.
- Base: TEST65 PASS.
- Adds Screen > Window Dimension... immediately below the existing Dimensions... item.
- This first test is intentionally only a UI/menu clone.
- Window Dimension... opens the same existing Dimensions dialog/action.
- No viewport data, frame metadata, cleaning, export optimization or runtime behavior is changed yet.
- Goal: validate placement, naming and cloned interaction before making Window Dimension independent in the next test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST66 - PASS
- Screen > Window Dimension... appears immediately below Dimensions...
- The cloned dialog opens correctly.
- This validated menu placement and interaction only.

TEST67 - WINDOW DIMENSION PER FRAME
Status: PENDING PASS/FAIL.
- Base: TEST66 PASS + TEST65 preview PASS + TEST64 runtime behavior retained.
- Screen Dimension remains the real grid size (example: 40x25).
- Window Dimension is independent per frame and stores X / Y / Width / Height metadata.
- Changing Window Dimension does NOT resize or delete the Screen grid.
- Area outside the Window is masked black in the editor/animation view, not shown as transparency.
- Duplicating a frame duplicates its Window Dimension; inserted frames default to the full Screen size.
- MAP SCROLL preview now reads the per-frame Window Dimension instead of a fixed 192 px vertical constant.
- RICO PRG export sanitizes cells outside each frame Window to blank_char without destructively editing the LVLLVL source frame.
- VIC-II geometry is derived from Window dimensions:
  40x25 -> 25 rows / 40 columns ($D011 base $18, $D016 base $08)
  40x24 -> 24 rows / 40 columns ($D011 base $10, $D016 base $08)
  38x24 -> 24 rows / 38 columns ($D011 base $10, $D016 base $00)
- Existing Move/Ping Pong travel limits are intentionally unchanged in this test.
- No new per-test TXT files added; documented only in cumulative LOG.txt.


TEST67 - PASS
- Window Dimension independiente por frame validado.
- Screen real permanece intacto mientras Window define un area visible independiente.
- Mascara negra exterior, preview guiado por Window y saneado de exportacion confirmados para continuar.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PENDING PASS/FAIL.
- Base: TEST67 PASS.
- Redesign only: no changes to MAP SCROLL runtime, preview math or exporter metadata format.
- Replaces Width/Height + X/Y editing with four independent crop margins: Left, Right, Top, Bottom.
- Window X/Y/Width/Height are computed from the four margins, preserving the TEST67 metadata contract.
- Includes a live graphical preview showing the visible rectangle inside the real Screen.
- Editing one side gives priority to that side; the opposite margin is constrained only if both would collapse the Window below 1 cell.
- Goal: allow cropping from any edge cleanly before porting the same four-side model to the original Screen Dimensions dialog.
- No new per-test TXT files added; documented only in cumulative LOG.txt.

TEST68 - WINDOW DIMENSION FOUR-SIDE CROP
Status: PARTIAL / CONTINUE.
- Interface redesign accepted as improved: independent Left / Right / Top / Bottom crop controls.
- Preserves TEST67 per-frame Window metadata and black masking.
- Follow-up issue identified: LVLLVL MAP SCROLL preview still used the complete Screen as its animation source, so rows/columns outside the Window could re-enter while scrolling.
- Not promoted independently; TEST69 addresses that preview-source mismatch.

TEST69 - WINDOW AS MAP SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base: TEST68 UI over TEST67 PASS Window architecture.
- LVLLVL MAP SCROLL preview now extracts only the per-frame Window rectangle before animation.
- Scroll / Ping Pong / Move Out / Move In animate the cropped Window surface rather than the complete Screen grid.
- Data outside Window remains stored in the real Screen but cannot re-enter the LVLLVL scroll preview.
- Example: Screen 40x25 + Window 40x24 => preview source is exactly 320x192 px; row 25 stays outside the animation.
- PRG runtime/exporter is unchanged from TEST67 in this test.
- ZIP documentation cleanup rule applied: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt remain; no per-test TXT files are created or carried forward.

TEST69 - PREVIEW PASS / EXPORT FAIL
- LVLLVL Window-as-scroll-surface behavior confirmed correct by user.
- PRG export did not reproduce the same Window behavior.
- Diagnosis: TEST67 exporter still scrolled hardcoded 40x25 / 319x199 geometry and, additionally, the TEST67 apply_scroll_regs patch had accidentally removed the strict-double-buffer helper labels prepare_requested / commit_prepared / request_prepare / request_ping_prepare.
- TEST69 preview remains the approved visual behavior; runtime/export is replaced in TEST70.

TEST70 - WINDOW-DRIVEN PRG SCROLL SURFACE
Status: PENDING PASS/FAIL.
- Base runtime rebuilt from TEST64 PASS instead of the broken TEST67 runtime.
- Restores all strict-double-buffer helper routines from TEST64.
- Adds per-frame Window X/Y/Width/Height to the PRG runtime.
- Scroll, Ping Pong, Move Out and Move In now operate only inside the Window rectangle.
- Cells outside Window are sanitized to blank_char and are never rotated/scrolled back into the visible Window.
- Dynamic travel limits: horizontal = Window Width * 8 - 1; vertical = Window Height * 8 - 1.
- Dynamic row/column copy loops replace hardcoded 25-row / 40-column scroll preparation.
- Move In staging seeds the complete sanitized backbuffer before rendering the Window transition, preventing stale data outside a changed Window.
- VIC-II 38/40-column and 24/25-row geometry remains derived from each frame Window.
- Generated assembly validation: zero unresolved branch/JSR/JMP labels; ACME assembly status 0; code/tables end before charset at $3000 (window_w_table at $2941 in validation build).
- Packaging rule maintained: only LOG.txt and RICO_FEATURES_MILESTONES_14_OCT_2026.txt are kept as TXT documentation.


TEST71 — SCREEN SOURCE + WINDOW VIEWPORT
- Screen Dimension remains the complete animation source (40x25).
- Window Dimension is only the visible viewport; content outside it is preserved and may scroll into view.
- Fixes the 25th row being cut when Window is 40x24.
- Preview and PRG runtime use the same source/view separation.
- Based on TEST64 double-buffer runtime; no memory-saving change in this test.


TEST71 - PASS
- Screen remains the complete scroll source and Window acts only as the viewport.
- A 40x25 design with Window 40x24 keeps row 25 available to enter during scrolling.

TEST72 - RICO'S WINDOW DIMENSIONS: EDITOR FREE + FRAME NAVIGATION
Status: PENDING PASS/FAIL.
- Window metadata no longer masks, crops, blocks paste, or limits editing in the normal LVLLVL editor.
- Full Screen remains available for drawing, selection and paste outside Window.
- Window is used only by MAP SCROLL visualization and export.
- Rico's Window Dimensions dialog adds < and > frame navigation using the same symbols as LVLLVL.
- Before changing frame from the dialog, the current frame Window margins are saved automatically; the next frame values are then loaded in the same dialog.
- New UI naming convention: custom RICO features/windows use the "Rico's" prefix to distinguish them from original LVLLVL functions.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST73 - RICO'S DIMENSIONS FOUR-SIDE RESIZE
Status: PENDING PASS/FAIL.
- Replaces the normal Screen > Dimensions experience for 2D non-sprite documents with Rico's Dimensions...
- Four signed edge controls: Left / Right / Top / Bottom.
- Positive values add rows/columns on that edge; negative values remove them.
- Left and Top changes physically shift existing content so the requested edge is added/removed correctly.
- Right and Bottom changes resize from those edges without shifting the origin.
- New Screen Width/Height are computed automatically from the four deltas; minimum dimension is 1x1.
- Live preview shows old content footprint versus the new Screen rectangle.
- Sprite documents keep the native LVLLVL Dimensions dialog as fallback because it also controls tile dimensions.
- No changes to Rico's Window Dimensions, MAP SCROLL preview/runtime, or exporter in this test.
- No new per-test TXT files; cumulative LOG.txt and milestones only.


TEST74 - RICO'S DIMENSIONS SUBTRACT FIX
Status: PENDING PASS/FAIL.
- Fixed negative Left/Top resize across multiple frames.
- Original LayerGrid resize inverted offsetX/offsetY inside the frame loop, alternating the source side between consecutive frames.
- Source offsets are now computed once and remain stable for every frame.
- TEST73 UI and Right/Bottom behavior remain unchanged.

TEST75 - RICO'S WINDOW DIMENSIONS: INDEPENDENT SCROLL AREA
Status: PENDING PASS/FAIL.
- Added a third per-frame geometry: Scroll Area.
- Screen remains the complete editable design.
- Window remains the visible viewport used by MAP SCROLL/export geometry.
- Scroll Area independently defines which Screen rectangle participates in MAP SCROLL.
- Default Scroll Area is the full Screen for backward compatibility.
- Rico's Window Dimensions now switches between editing Window and Scroll Area with the same Top/Bottom/Left/Right controls.
- Frame navigation < > saves both geometries per frame.
- MAP SCROLL preview uses Scroll Area as moving source and clips through Window.
- PRG exporter uses Scroll Area X/Y/W/H for scroll preparation and travel limits, while Window still drives visible VIC geometry.
- Normal LVLLVL editing remains unrestricted outside both Window and Scroll Area.
- No new per-test TXT files; LOG.txt and milestones only.

TEST76 - SCROLL AREA GUARD CELLS / VIC EDGE FIX
Status: PENDING PASS/FAIL.
- TEST75 preview/UI kept unchanged because LVLLVL behavior is correct.
- Vertical smooth scroll now maintains a physical guard row when Scroll Area is shorter than the 25-row C64 screen buffer.
- For a 40x24 Scroll Area, the hidden 25th buffer row is generated from the wrapped first row for continuous Up/Down scroll; it no longer comes from Screen row 25 and no longer remains blank.
- Ping Pong / Move vertical modes fill that hidden guard row with blank background instead of stale data.
- Scroll Area 40x25 keeps the full 25-row source and therefore does not require a synthetic guard row.
- Horizontal fine scroll now forces VIC CSEL=0 (38-column hardware window) to hide edge fetches and avoid the clipped character / stray-pixel artifact at left/right.
- Screen, Window and Scroll Area metadata are otherwise unchanged.
- No new per-test TXT files; cumulative LOG.txt and milestones only.

TEST77 - SINGLE-FRAME SCROLL AREA EXPORT
Status: PENDING PASS/FAIL.
- Fixes exporter fallback: one-frame Scroll Up/Down/Left/Right now uses the modern Window + Scroll Area runtime instead of legacy TEST50.
- This fixes vertical D016 geometry and makes Scroll Area effective in VICE for single-frame wrap scrolls.
- Preview behavior is unchanged.


TEST78 - FAIL PARCIAL
- Se confirmo que el ZIP era la version nueva porque Rico's Screen Dimension aparecia correctamente.
- El resto del layout no aparecio y el boton MAP SCROLL quedo sin responder.
- Causa probable aislada: movimiento post-DOM del panel Frames dejo su wrapper original superpuesto/interceptando controles.

TEST79 - PENDING PASS/FAIL
- Base limpia: TEST77 PASS.
- Frames se mueve desde el layout interno de LVLLVL, no por reparenting DOM posterior.
- Rico's Screen Dimension conservado.
- Paleta compacta C64 4x4 en toolsPanel con instalacion robusta via MutationObserver/polling.
- Colours: boton -/+ de minimizar/restaurar instalado al aparecer el panel real.
- Rico's Map Scroll reconstruido desde TEST75 probado; < > cambia frames sin cerrar y guarda antes de cambiar.
- PAUSE/PLAY global congela/reanuda preview sin borrar configuracion.
- Exporter TEST77 no se modifica.

TEST79 - UI INTEGRATION FIX
Status: PARTIAL / REPLACED BY TEST80.
- MAP SCROLL button and new Rico's Map Scroll dialog confirmed working.
- Interface layout confirmed visually incorrect: root Frames panel occupied space awkwardly and did not follow the intended two-row composition.
- TEST80 keeps the working MAP SCROLL implementation and replaces only the layout strategy.

TEST80 - CLEAN UI LAYOUT + DEFAULT COLUMNS 16
Status: PASS CONFIRMADO.
- Keeps TEST79 working Rico's Map Scroll button/dialog and TEST77 PASS exporter unchanged.
- Bottom frame area is treated as two clean rows inside the native Frames component: controls row + 20px timeline row.
- Bottom Frames region spans from the left edge only to the right-side inspector boundary; right Tiles/Colours panel can continue to the bottom.
- Legacy empty bottom tile-palette holder is hidden by default so it no longer creates a blank band above Frames.
- Compact C64 quick palette changed to 2 columns x 8 rows in the left tools strip; left click selects FG and right click selects BG.
- Colours right panel is shown but starts minimized on every app opening; + restores it for the current session.
- Side Tiles defaults to Columns of 16 at startup and each Screen load. This is a default only: the user can select another tile layout manually afterwards.
- No new per-test TXT files; LOG.txt and milestones only.


TEST80 PASS CONFIRMADO POR USUARIO
- Interfaz limpia aprobada.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8 aprobada.
- Colours inicia minimizado.
- Tiles inicia en Columns of 16.
- TEST77 runtime/exporter permanece como base aprobada.

TEST81 - CLEAN RESTART: BLACK VIEWPORT GAP + LARGE VERTICAL MAP EXPORT
Status: PENDING PASS/FAIL.
Base: TEST80 PASS / checkpoint seguro 3e135f184fd1801f1c8e62e679aa2eaf11d1e329.
- Rebuilt directly from TEST80 PASS. No TEST82/TEST83 code is inherited.
- UI change only: when MAP SCROLL is active, the existing TEST79 preview canvas is prefilled black before drawing. This replaces the transparent/checker gap outside a smaller Window without changing Window, Scroll Area, Screen geometry, scale, crop math or scroll behavior.
- Export change only: reintroduces the already validated large vertical source-map runtime for Screen width 40 and height 26..255.
- First target case: Screen 40x50, Window 40x24 (or 40x25), Scroll Area 40x50, one Frame, Scroll Up/Down.
- The complete 40x50 source map is stored separately at $4000+; VIC still uses the normal $0400/$0800 1000-byte screen buffers and shows 24/25 rows while the camera traverses the full Scroll Area.
- Normal 40x25 exports still delegate to approved TEST77 unchanged.
- TEST81 intentionally does not add the later TEST82 per-cell color experiment; color behavior is outside this isolated restart test.

TEST82 CLEAN LARGE MAP PHASE FIX - 16 OCT 2026
- Base exacta: LVLLVL_TEST81_CLEAN_BLACK_GAP_LARGE_40X50.zip, itself rebuilt from TEST80 PASS.
- UI black-gap behavior unchanged.
- Large 40xN exporter: fixes first-row scroll phase by preparing the hidden screen from the currently visible VIC buffer, matching the proven TEST76 vertical pipeline.
- Scroll Up: shifts physical rows 1..24 into rows 0..23, then injects exactly the next logical map row into row 24 from the 40xN source map.
- Scroll Down: shifts physical rows 0..23 into rows 1..24, then injects exactly the previous logical map row into row 0.
- Camera still traverses the complete Scroll Area and wraps only at Scroll Area boundaries.
- No changes to Window, Scroll Area, editor geometry, black gap fill, TEST77 normal 40x25 export, charset or color behavior.

TEST83 CLEAN - LARGE MAP VIEWPORT OVER FULL SOURCE - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base: TEST82 CLEAN LARGE MAP PHASE FIX, itself on the TEST80 PASS clean line.
- Corrects the editor-side interpretation only; source Screen data is never cropped.
- MAP SCROLL OFF: LVLLVL returns to the complete Screen preview/editor (e.g. 40x50).
- MAP SCROLL ON for a large vertical map: GridView2d sees the Window height only (e.g. 40x24), matching the visible Commodore viewport.
- The scroll renderer separately renders the complete Scroll Area (e.g. all 50 rows) into an offscreen source surface and moves that source behind the fixed Window.
- Rows below the Window remain available and enter from below during Scroll Up; they are not discarded when the viewport is reduced.
- No document dimensions, Screen rows, Window metadata or Scroll Area metadata are modified.
- Existing clean TEST82 large-map PRG exporter remains installed, so the C64 export still uses the full 40xN source map while VIC displays only the 24/25-row viewport.
- Unit validation: GridView2d reports 192px for 40x24 while scroll is ON, restores 400px for 40x50 when OFF; source movement test confirms 3px phase reads 3px farther into the full source.

TEST83 PASS CONFIRMADO POR USUARIO - 16 OCT 2026
- Screen/Mapa fuente 40x50 permanece completo.
- MAP SCROLL OFF vuelve a mostrar las 50 filas completas para edicion.
- MAP SCROLL ON usa Window como viewport y recorre el Scroll Area completo sin recortar filas fuente.
- Caso aprobado: Screen 40x50 + Window 40x24 + Scroll Area 40x50.

TEST84 - DEFAULT C64 WINDOW 40x25 + PER-CELL COLORS - 16 OCT 2026
Status: PARTIAL / REPLACED BY TEST85.
Base exacta: TEST83 PASS.
- Cuando un Screen supera 40 columnas o 25 filas y se abre Rico's Window Dimensions, una Window aun no configurada/full-Screen recibe una sola vez el default C64 de hasta 40x25. Scroll Area no se modifica.
- El usuario conserva libertad total para cambiar luego la Window; el default no se vuelve a imponer sobre una eleccion manual.
- Para el exportador grande vertical 40xN se conserva intacto el runtime row-phase-safe de TEST82/TEST83.
- Se agrega un mapa de colores por celda paralelo al mapa de caracteres: caracteres en $4000+, colores C64 (fc) en $7000+.
- Color RAM se construye desde las mismas 25 filas de camara que el mapa visible y se actualiza al confirmar cada nuevo bloque de scroll.
- Exportaciones normales 40x25 siguen delegando a TEST77; no se toca su runtime.
- Primer caso de prueba recomendado: Screen 40x50 + Window 40x25 + Scroll Area 40x50 + Scroll Up, verificando geometria y colores en VICE.

TEST85 - SPARSE COLOR COMMIT / SMOOTHER LARGE MAP - 16 OCT 2026
Status: PENDING PASS/FAIL.
Base exacta: TEST84 sobre TEST83 PASS.
- TEST84 queda marcado como PARTIAL: el default 40x25 funciona y el PRG conserva color por celda, pero el usuario detecta salto perceptible al cruzar filas y restos claros/blancos durante el fine-scroll.
- Diagnostico sobre el PRG exportado por el usuario: los datos de color si estan presentes en $7000; el problema no es perdida del mapa de color.
- Causa del salto: TEST84 reconstruia las 1000 posiciones de Color RAM dentro de cada commit de buffer, agregando demasiado trabajo al cambio de fila.
- TEST85 elimina esa reconstruccion completa en cada commit.
- Al iniciar, Color RAM se rellena una sola vez con el color dominante de los caracteres visibles; las celdas cuyo charset es completamente vacio no fuerzan colores claros irrelevantes.
- En cada cambio de camera_row se actualizan solamente las posiciones ocupadas por caracteres visualmente no vacios del nuevo viewport mediante tablas sparse precalculadas.
- Para el PRG de prueba recibido, el viewport contiene aproximadamente 38..41 caracteres no vacios por camera_row, en vez de 1000 escrituras de color por commit.
- Se conserva sin cambios el row-phase-safe de TEST82/83, el mapa fuente 40x50 completo, Window 40x25 por defecto y Scroll Area 40x50.
- Exportaciones normales 40x25 siguen delegando a TEST77.

TEST86 - 2026-10-16 - ASM pointer table fix for sparse colors
- Base: TEST85 sparse color optimization.
- Fix: color-update pointer tables are emitted as numeric low/high bytes instead of <label/>label expressions.
- Reason: LVLLVL in-browser assembler rejected color_update_000... symbolic references.
- Sparse per-character color commit optimization remains unchanged.

TEST87 PENDING — LEFT PALETTE SIZE / POSITION
- Base exacta: MASTER TEST86 PASS.
- Único cambio funcional: se elimina el título "C64 COLORS" de la paleta rápida izquierda.
- Swatches ampliados de 17 px a 30 px de alto, conservando 2 columnas y la misma posición/anclaje del MASTER.
- Sin cambios en exportación, scroll, Window, Scroll Area ni runtime C64.

TEST88 PENDING: optimized 960-byte backbuffer shift so exported Ticks / Step tracks PAL IRQ cadence more closely; no UI/geometry/color changes.

TEST89 PENDING - 16/10/2026
- Base: TEST88.
- PRG confirmado por inspeccion: Ticks/Step=1, Pixels/Step=8.
- Nuevo fast path vertical para 8 px/step: backbuffer preparado anticipadamente en main loop.
- Objetivo: 8 px por frame PAL (1 fila de caracteres por frame) cuando Ticks/Step=1.
- Los modos 1..7 px conservan la ruta TEST88.

TEST126 — TEST77 real path diagnostic (17/10/2026): prueba borde/caracteres alternando, confirmado por usuario.
TEST127 — TEST77 original @ invertido (18/10/2026): PASS de escritura al charset, no corrige coexistencia.
TEST128 — NATIVE CHAR ANIMATION + MAP SCROLL TEST77 (18/10/2026): PENDING VICE PASS/FAIL.
- Partida exacta: web TEST127 (MASTER sin modificar).
- Comparacion con Untitled (1).prg (SYS2080, rutina animate_chars original, tabla $1257: 06 06 00 00 01),
  y Untitled (7).prg (SYS8192, TEST77 scroll runtime sin animate_chars).
- Se retiran completamente la inversion del @ y la alternancia de borde de TEST127.
- TEST77 llama desde su IRQ a animate_chars_native; frame_tick y scroll mapa permanecen separados.
- Caracteristicas: tipos LVLLVL left/right/up/down/blink, ticksPerFrame, dos bancos $3000/$3800.
- No cambia el contenido original del charset ni el indice del caracter.
- Se excluyen los chars animados de la seleccion de blank_char.
- ASM generado y ensamblado ACME WebAssembly (exit 0). PRG demo @ x3 generado.
- PENDIENTE comprobar en VICE el PRG demo y el export de la web con el proyecto del usuario.

TEST128 — 18 OCT 2026 — PASS CONFIRMADO POR USUARIO
- Animacion real de caracteres @ + MAP SCROLL simultaneos en VICE.
- UNICO BUG REPORTADO: todos los caracteres perdian su color original y se veian blancos.

TEST129 — 18 OCT 2026 — PENDIENTE PASS/FAIL EN VICE
- Deriva exactamente de TEST128 PASS.
- BUG FIX: conservar color fg por celda, mediante buffers sincronizados con TEST77.
- Misma rutina de animacion de caracteres; mismo scroll existente. Sin diagnosticos artificiales.
- ACME WASM: compila PRG de demo horizontal con 3 @ y colores diferentes.
- No ascender a MASTER sin PASS.

TEST130 — FIX PUNTEROS NUMERICOS DE COLOR EN EXPORT ONLINE — 18 OCT 2026
- Base: TEST129. Se reproduce con LVLLVL Assembler (js/main.js) exactamente
  'unknown value: frame_color_0' en los bytes < y >, que ACME si acepta.
- Unica correccion: reemplaza referencias adelantadas por punteros numericos
  calculados desde $4000 + 1000*N + (10*Animaciones + terminador).
- Sin cambios a la rutina original animate_chars ni al scroll de mapa.
- Auto-test reproductor LVLLVL interno: 6/6 PASS, datos colores por celda
  y direccion de cada frame verificados byte a byte.
- TEST129 no obtuvo PASS visual: falla la exportacion con assembler del navegador.
- TEST130: PASS compilacion navegador replicada; VICE pendiente de PASS/FAIL.
- MASTER no promovido: TEST128 sigue ultimo PASS visual.

TEST131 (18 OCT 2026) — PENDIENTE VICE
- En TEST130 el usuario confirma mejora visual con Map Scroll + chars
  funcionando; aun aparecen pequeños saltos de lineas y basura blanca
  al atravesar zona superior de pantalla.
- Posible causa concreta: copia sin filtros de 1024 bytes de color RAM
  durante bottom IRQ en commit_prepared, sobrepasando margen raster.
- Cambio aislado TEST131: precomputar en main una lista sparse de
  colores diferentes en $1800-$1fcf y escribir en IRQ solo si <=120;
  fallback anterior si >120. No alterar scroll o animacion originales.
- 6/6 ensamblados LVLLVL PASS, 5/5 pruebas de rutinas 6502 PASS.
- Pendiente PASS/FAIL VICE. MASTER sin cambios.

TEST132 (18 OCT 2026) — PENDIENTE VICE / PASS PRUEBAS RUNTIME
- Entrada: vídeo de 8.617s del usuario; TEST131 redujo basura blanca pero persisten saltos al alcanzar borde superior.
- Hipótesis: fallback de 1024 bytes en IRQ si TEST131 detecta >120 colores distintos puede romper presupuesto raster.
- Corrección localizada: máximo 40 cambios/IRQ, resto pendientes; no fallback de copia de color en cada commit de scroll.
- Main loop espera drenaje de cambios de color para proteger lista y buffering.
- Compilación ensamblador nativo: 6/6 PASS, rutinario 6502: 7/7 PASS (0,6,90,98,206,900,1000 celdas).
- Animación chars TEST128 y Map Scroll no modificados. Guardar TEST131 y MASTER. No elevar antes de VICE.

TEST132 — PASS PARCIAL (18 OCT 2026, VICE user validation)
- Con Map Scroll y animacion de caracteres simultaneos: desplazamiento correcto.
- Desaparecieron los caracteres fantasma y saltos de linea observados en TEST131.
- Resta un destello blanco ocasional en caracteres visibles al cambiar el mapa.
- TEST132 no se promueve a MASTER por este defecto cromatico.

TEST133 — PENDIENTE DE PASS/FAIL EN VICE
- Base: TEST132, sin cambios de scroll, movimiento de chars ni 40 escrituras por IRQ.
- El generador de diferencias de color ahora hace dos recorridos: primero celdas donde el buffer de pantalla nuevo muestra un caracter distinto de blank_char, y luego los espacios.
- Se aplican todos los cambios, no se omiten los de espacios.
- Justificacion: evita que la cola de color gaste los primeros 40 slots de IRQ en colores de espacios que no se ven.
- Compilacion con assembler original LVLLVL: 6/6 PASS.
- Ejecucion de build_sparse_colors y begin_sparse_colors 6502: 7/7 PASS, prioridad visible verificada.
- Carga extra solo en preparacion fuera de IRQ: doble recorrido del buffer de 1000 celdas.
- MASTER 17 OCT y TEST132 se conservan; sin PASS visual no promover.

TEST133 — FAIL PARCIAL / 18 OCT 2026
- Usuario sigue viendo blink blanco ocasional en exportacion de su proyecto real, aunque demo sintetico no parpadea.
- Usuario envio Untitled (2).prg para comparar byte a byte con demo.

TEST134 — PENDIENTE VICE / 18 OCT 2026
- Se confirma en PRG real: 1 frame, RIGHT scroll 6 ticks 1px, caracter $00 animado UP 6 ticks, 26 celdas del caracter $00 en celeste 14 y 974 espacios $20 blancos 1.
- Error de TEST133: compara color entero con Color RAM (solo 4 bits validos), provocando falsas diferencias de color en C64 real.
- Error adicional: prioridades usan blank_char ($ff), no glifos realmente vacios como el espacio $20.
- TEST134 corrige lectura de Color RAM en los cuatro bloques con AND #$0f; prioridades usan tabla de visibilidad compilada desde BANK1/BANK2 y lista de animaciones, no codigos asumidos.
- Emulacion 6502 con nibble alto de Color RAM simulado: 8/8 PASS. Caso PRG real desplazado 1 caracter: 30 colores modificados, listos en 1 IRQ.
- Assembler nativo LVLLVL: 6/6 PASS; PRG real reconstruido mantuvo datos de charsets/screen/colors/animacion byte a byte.
- PRG y WEB aun pendientes de validacion en VICE. MASTER no se toca.

TEST134 — PASS FINAL EN VICE / 18 OCT 2026
- Usuario confirmo coexistencia de animacion de caracteres y Map Scroll, sin blanco, sin saltos ni fantasmas, y colores de borde y fondo correctos. Promovido a MASTER; conservar sin modificaciones.

TEST135 — PENDIENTE VICE / 18 OCT 2026
- A 1 tick tanto animate_chars como Map Scroll, vista previa OK pero PRG exportado avanza a saltos; video del usuario de 2,784 s.
- Se identifica la pausa de frame_tick con main_busy y comienzo tardio de prepare_requested en fine=0/7.
- Prefetch anticipado en fine=1/6; durante main_busy solo se actualizan bits de scroll fino VIC ($d011/$d016), sin pisar tmp_byte.
- Intercambio del backbuffer al octavo pixel, no antes. Solo aplicable a unico frame / scrolling cardinal / 1tick / 1px. TEST134 y modos restantes preservados.
- Original assembler: 6/6 PASS; escenarios adicionales 8/8 PASS; ejecucion de codigo 6502 ensamblado: 4/4 PASS. Validacion VICE pendiente.

TEST135 — PASS PARCIAL / 18 OCT 2026
- Usuario informa mejora del scroll diagonal a 1tick, pero observa desplazamientos horizontales aislados de forma periodica. Video nuevo de 8,434 s.

TEST136 — PENDIENTE VICE / 18 OCT 2026
- Se reduce build_sparse_colors de 2 pasos a 1 para exportaciones 1frame / cardinal / 1T 1px, evitando carga redundante de 1000 celdas durante main_busy.
- 4 direcciones a 6ticks emiten codigo ASM identico a TEST135; 4 direcciones 1tick compiladas PASS; 4 pruebas de fine scroll 6502 PASS.
- Conserva MASTER134, prueba enfocada al escalon lateral periodico.

TEST136 — MEJORA PARCIAL / 18 OCT 2026
- Usuario confirma menos pasos laterales pero todavia algunos. Adjunta video 2026-10-18 19-13-53.mkv de 13.8 s.

TEST137 — PENDIENTE VICE / 18 OCT 2026
- Identificado frame_tick_next: en un solo frame la recarga duration ejecuta RTS, descartando un tick del Map Scroll.
- La animacion de caracteres corre independientemente en IRQ, causando desplazamiento no diagonal justo al rollover.
- TEST137 modifica solo 1 frame / cardinal 1T/1px; hace JMP frame_tick_scroll tras recargar duration.
- 24/24 compilaciones del assembler original PASS; 6/6 pruebas de instrucciones 6502 rollover PASS.
- El codigo a 6 ticks es identico a TEST136. MASTER TEST134 intacto.
- No promocionar hasta PASS visual VICE.

TEST137 — FAIL PARCIAL / 18 OCT 2026
- Usuario confirma perdidas periodicas de movimiento diagonal a 1tick. Se solicita investigar sincronizacion conjunta y el motor C64 propio.

TEST138 — GEAR MAP PIXEL / MILESTONE PASS VICE
- SCUMM-PET-C64 validaba IRQ maestra y una sesion scheduler continua; Animated Chars tienen tick independiente. Se adopta mismo principio, no binarios ni mapa de memoria.
- En modo cardinal 1frame 1tick/1px: animar glyph solo cuando fine_pos avanzo efectivamente. Su contador configurable 1..255 sigue intacto.
- Pantalla totalmente uniforme + color uniforme: usar actualizacion fina VIC modulo8 sin preparar backbuffer identico.
- 48/48 ensambles PASS. CPU 32/32 avance uniforme y 13/13 pruebas gear gate PASS (9 avances, 4 esperas).
- MILESTONE PASS VISUAL CONFIRMADO POR USUARIO: engranaje TEST138 perfecto para MAP UP 1T/1px + animacion CHAR RIGHT 1T; diagonal fluida.
- Se congela el ZIP exacto con SHA256 a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227.
- Guardado como milestone separado y reproducible; MASTER TEST134 de main intacto.
- No extrapolar PASS visual a mapas no uniformes sin validarlos.

```

</details>

## Fuente 2: mapaconceptual.txt (transcripción histórica sin recortes)

<details>
<summary>Ver mapa conceptual original</summary>

```text
MASTER LVL RICO — 20/10/2026 — PASS VICE
 MASTER TEST149 / 256 normal 1 tick
    -> Group Animate TEST153/155
    -> Scroll Up rapido TEST161/164, grupos hasta 256, 2px IRQ nominal
    -> Preview 50Hz TEST165 PASS, sin cambiar exportador
    -> TEST167 FIX idle ghost bytes de VIC-II, sin recortar pantalla
          25 filas, sin hardware Map Scroll: $D011=$1B
          25 filas, con Map Scroll: se conserva $D011=$18
          24 filas: se conserva $D011=$10
          $3FFF nunca sobrescrito (glyph 255)
          PRG GROUP e INDIVIDUAL PASS VICE confirmado.
    -> NUEVO MASTER 20 OCT (reversible; TEST166 descartado).
CHECKPOINT: releases/MASTER_LVL_RICO_20_OCTUBRE_2026/README.md
----------------------------------------------------------

MASTER LVLLVL RICO — 256 CARACTERES / 1 TICK — 19 DE OCTUBRE DE 2026
=============================================================================
ESTADO: MASTER APROBADO DESDE TEST149 (PASS).
- Interfaz: divisor vertical editor/tileset libre, sin mover frames.
- Exportación: 256 caracteres NORMAL UP, 8 frames, 1 tick, aprobada
  VISUALMENTE en VICE. No es medición instrumental exacta de 50 Hz.
- Mantener TODAS las animaciones activadas aunque su forma no muestre movimiento.
- TEST147 optimiza rutina rapida ASM y preview; TEST149 arregla divisor.
- Ruta SCUMM/Map Scroll de TEST138 no modificada en TEST149.
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- Local: MASTER_LVLLVL_256_1_TICK_19_OCTUBRE_2026.zip
- Documentos activos: solamente log.txt y mapaconceptual.txt.
- PRG, SID y TXT de pruebas no forman parte del MASTER.
- Fuentes originales en el historial de Git y ramas backup del 19/10/2026.

MAPA CONCEPTUAL / MILESTONES
===========================
MASTER 19/10/2026
 |-- WEB y LOCAL: index.html, css, js, servidor_local.ps1, BAT
 |-- Dual charset: BANK1/BANK2 (256 codigos cada uno)
 |-- Preview PAL, redraw agrupado TEST147
 |-- Exportador PRG: 256 char animados a 1 tick, PASS VISUAL en VICE
 |-- Divisor editor/tileset: TEST149 PASS
 |-- SCUMM Map Scroll: TEST138 PASS, sin cambios en esta consolidacion
 |-- Documentacion: log.txt + mapaconceptual.txt
MILESTONES: TEST19,25,28,32,33,34,55,58,80,120,134,138,
            142,143,145,147,148 FAIL,149 PASS.
REGLA: conservar todos los caracteres activos, aunque algunos dibujos
aparenten estar quietos por simetria o ausencia de pixels.
CAMBIOS FUTUROS: en TEST aislado, no sobrescribir el MASTER sin PASS visual.

MILESTONES Y NOTAS TECNICAS HISTORICAS INTEGRADAS A CONTINUACION
================================================================


===== ORIGEN HISTORICO: dist/RICO_FEATURES_MILESTONES_14_OCT_2026.txt =====
RICO / LVLLVL - FEATURES Y MILESTONES
=====================================
Fecha de consolidacion: 14 de octubre de 2026
Estado actual validado: TEST 19 = PASS
Base ejecutable validada: LVLLVL_TEST19_ACTIVE_FRAME_BANK_RENDER.zip
SHA256 base PASS: d8137c661c0340de7619f1002f227bad3bddb0dad28011d5228dc46fae9f2d2e
Repositorio: serigrafiamdp-web/lvllvl-scummpet-export

OBJETIVO GENERAL
================
Extender LVLLVL para el flujo RICO/SCUMM/C64 sin romper el modelo nativo de
screen codes de la C64. El editor debe poder trabajar con dos charsets de
256 glifos, seleccionar por frame cual banco esta activo y mantener los
screen codes siempre en 0..255.

ARQUITECTURA ACTUAL APROBADA
============================
1. CHARSET BANK 1
   - 256 slots.
   - Es el tileset nativo de LVLLVL.
   - En configuracion C64 nueva, por defecto contiene C64 normal.

2. CHARSET BANK 2
   - 256 slots independientes.
   - Se guarda con el proyecto en el campo ricoCharsetBank2.
   - En configuracion C64 nueva, por defecto se inicializa con C64 Shifted.
   - Puede ser reemplazado/modificado con Rico's Remix.

3. SCREEN CODES
   - La pantalla nunca usa indices 256..511.
   - Cada celda conserva siempre un codigo 0..255.
   - El banco activo de la frame decide si el codigo N dibuja BANK 1[N]
     o BANK 2[N].

4. DATO POR FRAME
   - Campo interno: charsetBank: 1 | 2
   - Frames nuevas: BANK 1 por defecto.
   - Frames viejas sin este dato: BANK 1 por compatibilidad.
   - Duplicate conserva el banco de la frame origen.
   - Al navegar entre frames, el selector se refresca leyendo el valor
     guardado en esa frame.

5. PRINCIPIO DE RUNTIME C64
   - El concepto final es alternar entre dos charsets de 256 sin reescribir
     los screen codes.
   - La implementacion/export C64 definitiva del cambio de puntero de charset
     queda para una milestone posterior.

FEATURES RICO YA VALIDADAS
==========================

RICO-ECM-01 - LIVE REPACK TEXTMODE -> C64 ECM
Estado: PASS
- Escanea las frames antes de activar ECM.
- Prioriza los glifos realmente usados.
- Reorganiza los usados dentro de los 64 slots fisicos ECM.
- Reescribe screen codes preservando bits 6-7 como selector de background.
- Cancela si la conversion no puede hacerse sin perdida.

RICO-ECM-02 - SELECTOR MANUAL DE 64 GLIFOS
Estado: PASS
- En proyectos vacios permite elegir manualmente los 64 glifos ECM.
- Fuente: tileset cargado, normal o custom, hasta 256 glifos.
- Los elegidos pasan a slots fisicos 0..63.

RICO-ECM-03 - RESELECCION ECM -> ECM
Estado: PASS
- Conserva el tileset fuente original.
- Permite reabrir la seleccion de glifos.
- Protege slots ya usados por el artwork.

RICO-ECM-04 - UI NATIVA EDIT TILE PALETTE
Estado: PASS
- Dialogo estilo LVLLVL.
- Fuente a la izquierda, 64 glifos ECM a la derecha.
- OK / Cancel.
- Sin paneles diagnosticos agregados.

BUG FIX 07 - CHOOSE A TILE SET
Estado: PASS
- Preview vuelve a cambiar al seleccionar presets.
- OK aplica el tileset elegido.
- Fix aislado en capa RICO, sin modificar el chooser original de James.

RICO REMIX TILESET
==================

MILESTONE TEST 08 - MENU RICO'S REMIX
Estado: PASS
- Nueva opcion debajo de Choose A Tile Set.
- ID independiente: rico-tileset-remix.

MILESTONE TEST 10 - REMIX POR SLOT
Estado: PASS
- Variantes C64 reutilizadas desde la libreria original.
- C64 / C64 Shifted / Swedish / Swedish Shifted / Japanese / Japanese Shifted.
- El tileset permanece en 256 slots por banco.
- Click en fuente N reemplaza slot N.
- Segundo click sobre la misma fuente restaura el estado previo.
- Cancel descarta; OK confirma.

MILESTONE TEST 14 - UI REMIX 512 CONTINUO
Estado: PASS
- Interfaz final actual de Rico's Remix.
- Izquierda solo familias:
    C64
    C64 SWEDISH
    C64 JAPANESE
- Cada familia representa 512 glifos continuos:
    posiciones 0..255   = normal / BANK 1
    posiciones 256..511 = shifted / BANK 2
- Derecha: 512 custom en la misma geometria.
- 32 filas x 16 columnas.
- Sin titulos BANK 1/BANK 2 dentro de la grilla.
- Sin separaciones negras internas.
- Cabecera compacta.
- Sin scroll interno: los 512 se ven juntos en la ventana Remix.
- Correspondencia visual 1:1 SOURCE <-> CUSTOM.
- BANK 2 persiste como ricoCharsetBank2.

SELECTOR DE CHARSET POR FRAME
=============================

MILESTONE TEST 15 - CHARSET BANK POR FRAME
Estado: validado dentro del flujo que culmina en TEST 19 PASS
- Control junto a Frame Duration con estetica nativa:
    Charset Bank: [1]
- Valores 1 o 2.
- El valor pertenece a cada frame.
- Al navegar por < >, campo numerico, timeline o playback, se refresca.
- Frames nuevas = BANK 1.
- Duplicate copia el banco de origen.

PALETA LATERAL DUAL BANK
========================

MILESTONE TEST 17 - PREVIEW REAL DE BANK 2
Estado: PASS
- Vista lateral por defecto: Columns of 16.
- Se aprovecha el espacio vertical de Tiles.
- La paleta muestra 512 posiciones continuas:
    arriba = BANK 1, 256 glifos
    abajo  = BANK 2, 256 glifos
- El banco no activo queda grisado/bloqueado.
- El banco activo acepta seleccion.
- BANK 2 renderiza preview real; ya no aparece negro.
- El tileset real de LVLLVL continua siendo de 256 indices.
- La mitad inferior es una representacion virtual del BANK 2.
- Al seleccionar BANK 2, un click sobre la posicion visual 256+N se traduce
  al screen code N, nunca a 256+N.
- Scrollbar vertical de la paleta queda disponible en Columns of 16.
- Layers se minimiza al inicio para liberar altura.

MILESTONE TEST 18 - BANK 2 C64 SHIFTED POR DEFECTO
Estado: integrado y validado como parte de TEST 19 PASS
- BANK 1 por defecto = C64 normal.
- BANK 2 por defecto = C64 Shifted.
- Si BANK 2 ya fue personalizado por Rico's Remix, no se sobrescribe.

MILESTONE TEST 19 - RENDER REAL POR FRAME
Estado: PASS CONFIRMADO
- La seleccion BANK 1/BANK 2 deja de ser solo visual.
- Frame en BANK 1: codigo N usa BANK 1[N].
- Frame en BANK 2: codigo N usa BANK 2[N].
- Se puede seleccionar un glifo de BANK 2 y pintar realmente con el glifo
  BANK 2 correspondiente.
- Al volver a una frame BANK 1, los mismos screen codes recuperan la forma
  de BANK 1.
- Al regresar a una frame BANK 2, recuperan la forma de BANK 2.
- BANK 2 puede ser el C64 Shifted por defecto o un banco modificado con Remix.
- No se escriben indices 256..511 en Screen RAM / mapa de LVLLVL.

PERSISTENCIA ACTUAL
===================
Tileset:
  ricoCharsetBank2
    version: 1
    width / height
    tileData[0..255]
    metadata de origen cuando corresponde

Frame:
  charsetBank = 1 | 2

REGLAS QUE NO DEBEN ROMPERSE
============================
- BANK 1 y BANK 2 contienen 256 slots cada uno.
- El mapa de pantalla trabaja exclusivamente con 0..255.
- La posicion visual inferior 256+N representa BANK 2[N], no un screen code
  mayor a 255.
- Rico's Remix administra los dos bancos.
- La frame decide cual banco interpreta sus screen codes.
- Choose A Tile Set original debe seguir funcionando.
- Las features ECM RICO existentes no deben degradarse.

ESTADO VISUAL ACTUAL
====================
Panel lateral Tiles:
- Columns of 16 por defecto.
- BANK 1 arriba.
- BANK 2 abajo.
- Banco activo normal.
- Banco inactivo grisado y no seleccionable.

Barra de Frames:
- Frame Duration: [ticks]
- Charset Bank: [1|2]
- Luego New Frame / Duplicate / Delete / Show Previous Frame.

Rico's Remix:
- SOURCE 512 a la izquierda.
- CUSTOM 512 a la derecha.
- Sin divisiones BANK visibles dentro de la grilla.
- C64 / C64 SWEDISH / C64 JAPANESE como familias fuente.

PROXIMAS MILESTONES / PENDIENTES
================================
1. Tile Editor para BANK 2
   - Editar pixeles de un glifo BANK 2 sin redirigir accidentalmente a BANK 1.

2. Export de framepack / SCUMM_ANIMATION_V1
   - Serializar charsetBank por frame.
   - Exportar ambos charsets de 256 cuando el recurso los necesite.

3. Runtime C64
   - Cargar/ubicar CHARSET BANK 1 y CHARSET BANK 2 en memoria valida.
   - Cambiar el charset activo por frame con el mecanismo VIC-II apropiado.
   - Mantener screen codes sin conversion adicional.

4. Validacion combinada con ECM
   - El sistema dual-bank normal esta PASS en TEST 19.
   - La combinacion dual-bank + restricciones ECM de 64 glifos debe probarse
     como milestone separada antes de considerarla aprobada.

5. Undo/Redo
   - Verificar explicitamente Undo/Redo del cambio charsetBank por frame y de
     las operaciones Remix antes de promoverlo como contrato definitivo.

HISTORIAL DE CHECKPOINT
=====================
TEST 19 = PASS: primer checkpoint dual-bank por frame dentro del editor.
Los TEST intermedios quedan como historial de pruebas.

MILESTONE TEST 21 - PALETA BANKS 32 x 8
Estado: PASS CONFIRMADO
- Nueva vista lateral `Banks 32 x 8`.
- BANK 1 se muestra arriba como 32 columnas x 8 filas.
- BANK 2 se muestra debajo como 32 columnas x 8 filas.
- Preserva la composicion visual de tilesets importados desde imagenes 32x8.
- La vista `Columns of 16` continua disponible.
- El banco inactivo sigue grisado y bloqueado.
- BANK 2 sigue mapeando posiciones visuales 256..511 a screen codes 0..255.

MILESTONE TEST 23 - EXPORT PRG DUAL BANK POR FRAME
Estado: PASS CONFIRMADO EN VICE
- Alcance validado: Standard Character Mode, sin SID/musica y sin ECM/Multicolor.
- El PRG exporta ambos charsets residentes:
    BANK 1 -> $3000-$37FF (2048 bytes)
    BANK 2 -> $3800-$3FFF (2048 bytes)
- Cada frame conserva screen codes 0..255 y selecciona automaticamente BANK 1 o BANK 2.
- El marcador de banco se transporta por frame sin duplicar la pantalla.
- Rutina auxiliar de cambio de charset ubicada en $2FE0.
- El cambio de banco modifica solo los bits de charset de $D018 y preserva el screen buffer activo.
- BANK 2 se exporta desde ricoCharsetBank2 real, incluyendo cambios hechos con Rico's Remix.
- TEST22 fue FAIL por crecimiento del player: la tabla de frames alrededor de $0FFF/$1000 piso codigo y produjo CPU JAM en $1009.
- TEST23 corrige el problema sin agrandar el player: reemplaza una instruccion STA $D024 de 3 bytes por JSR $2FE0 de 3 bytes.
- VICE confirma reproduccion correcta Frame BANK 1 <-> Frame BANK 2.

COSTO DE MEMORIA VALIDADO
=========================
- BANK 1: 2048 bytes.
- BANK 2: 2048 bytes.
- Costo adicional respecto de un solo charset: +2048 bytes.
- El selector por frame cuesta esencialmente 1 byte de metadata por frame mas una rutina muy pequena.
- No se duplica Screen RAM ni el frame data por usar dos bancos.

REGLA PARA EL FUTURO EXPORTADOR DE RECURSOS
===========================================
El formato de recursos RICO/SCUMM debe conservar esta misma arquitectura:
- screen codes 0..255;
- metadata charsetBank por frame;
- exportar BANK 2 solo cuando el recurso realmente lo necesite;
- el runtime cambia el puntero de charset y no reescribe la pantalla para cambiar de banco.

CHECKPOINT ACTUAL
=================
TEST 23 = PASS CONFIRMADO EN VICE.
Checkpoint estable actual: editor dual-bank + seleccion por frame + export PRG Standard dual-bank.
Este es el punto seguro para continuar los proximos experimentos.

TEST54 (15 OCT 2026) - MAP SCROLL Ping Pong PRG exporter prepared: 4 ping-pong directions, non-wrapping background gaps, clean 38x24 viewport. STATUS: PENDING PASS/FAIL.

MILESTONE TEST 56 - MAP SCROLL MOVE OUT
Estado: PASS CONFIRMADO EN VICE
- Salida no-wrap Left / Right / Up / Down.
- Queda fuera hasta terminar Frame Duration.

MILESTONE TEST 57 - MAP SCROLL MOVE IN
Estado: PASS CONFIRMADO EN VICE
- MOVE pasa a llamarse MOVE OUT.
- Move In Left / Right / Up / Down entra desde fuera y queda en posicion normal.

MILESTONE TEST 58 - MAP SCROLL PREVIEW SYNC
Estado: PENDING USER PASS/FAIL
- Preview temporal PAL 50 Hz independiente del g_tick irregular del editor.
- Pixels / Step calculado en pixeles C64 antes de aplicar zoom.
- Border Color nativo restaurado durante MAP SCROLL.
- Runtime PRG TEST57 sin cambios.

MILESTONE TEST 65 - PREVIEW VERTICAL 24 ROWS
Estado: PASS CONFIRMADO
- LVLLVL Move In/Out vertical preview sincronizado con las 24 filas visibles reales del VIC-II.
- Timing validado en VICE: 192 ticks, 1 tick/step, 1 px/step.

MILESTONE TEST 67 - WINDOW DIMENSION POR FRAME
Estado: PASS CONFIRMADO
- Screen Dimension conserva el mapa real.
- Window Dimension define X/Y/Width/Height por frame sin destruir datos.
- Exterior de Window se enmascara negro y se sanea con blank_char al exportar.
- Geometria VIC derivada de Window: 40x25, 40x24 y 38x24 validadas estructuralmente.

MILESTONE TEST 68 - WINDOW DIMENSION CUATRO LADOS
Estado: EN DESARROLLO / UI MEJORADA
- Interfaz Left / Right / Top / Bottom independiente.
- Conserva metadata de TEST67.
- Detectado pendiente: el preview de MAP SCROLL aun podia animar datos exteriores al Window.

MILESTONE TEST 69 - WINDOW COMO SUPERFICIE DE MAP SCROLL
Estado: PENDING PASS/FAIL
- El preview de LVLLVL recorta primero la fuente al rectangulo Window.
- MAP SCROLL anima solamente esa superficie recortada.
- Las filas/columnas exteriores siguen existiendo en Screen pero quedan fuera del movimiento visual.
- Regla de packaging: los ZIP conservan unicamente LOG.txt y este mapa de milestones como documentacion TXT.

MILESTONE TEST 69 - WINDOW COMO SUPERFICIE DE MAP SCROLL
Estado: PREVIEW PASS / EXPORT FAIL
- LVLLVL confirmado correcto: MAP SCROLL anima solo el rectangulo Window.
- Export PRG no reproducía el mismo comportamiento; se detectaron constantes 40x25 / 319x199 y helpers del doble buffer eliminados accidentalmente en TEST67.

MILESTONE TEST 70 - WINDOW COMO SUPERFICIE REAL DEL RUNTIME PRG
Estado: PENDING PASS/FAIL
- Runtime reconstruido desde TEST64 PASS.
- Recuperados prepare_requested, commit_prepared, request_prepare y request_ping_prepare.
- Window X/Y/W/H gobierna copias, limites y superficie de Scroll / Ping Pong / Move Out / Move In.
- Maximo horizontal = W*8-1; maximo vertical = H*8-1.
- Exterior de Window permanece blank_char y no participa del desplazamiento.
- Ensamblado ACME validado sin errores antes de empaquetar.

TEST71: Screen is the full scroll source; Window is viewport only. A 40x25 design with Window 40x24 keeps row 25 available to enter during scroll.


MILESTONE TEST 71 - SCREEN SOURCE + WINDOW VIEWPORT
Estado: PASS CONFIRMADO
- Screen completo sigue siendo la fuente del scroll.
- Window limita solamente el area visible; contenido fuera de Window puede entrar durante el desplazamiento.

MILESTONE TEST 72 - RICO'S WINDOW DIMENSIONS
Estado: PENDING PASS/FAIL
- El editor normal queda completamente libre fuera de Window: dibujar, seleccionar y pegar no se restringen.
- Window se aplica solamente a visualizacion MAP SCROLL y exportacion.
- Navegacion de frames integrada en la misma ventana con controles < y >.
- Los valores de la frame actual se guardan antes de cambiar y los de la nueva frame se cargan sin cerrar la ventana.
- Convencion UI desde TEST72: las features propias llevan el prefijo "Rico's".

MILESTONE TEST 73 - RICO'S DIMENSIONS CUATRO LADOS
Estado: PENDING PASS/FAIL
- Redimension fisica del Screen mediante Left / Right / Top / Bottom con valores firmados.
- Valor positivo agrega filas/columnas; valor negativo elimina.
- Left/Top desplazan el contenido existente para modificar fisicamente esos bordes.
- Right/Bottom modifican el borde correspondiente sin desplazar el origen.
- Tamano final calculado automaticamente y preview visual incluida.
- Rico's Window Dimensions y MAP SCROLL quedan sin cambios en este test.


MILESTONE TEST 74 - RICO'S DIMENSIONS SUBTRACT FIX
Estado: PENDING PASS/FAIL
- Corrige Left/Top negativos en proyectos con varias frames.
- El offset fuente se calcula una sola vez y se aplica igual a todas las frames.
- La interfaz de Rico's Dimensions permanece sin cambios.

MILESTONE TEST 75 - WINDOW + SCROLL AREA INDEPENDIENTES
Estado: PENDING PASS/FAIL
- Screen = area completa editable.
- Window = viewport visible.
- Scroll Area = rectangulo del Screen que participa del MAP SCROLL.
- Scroll Area es por frame y por defecto ocupa todo el Screen.
- Rico's Window Dimensions permite alternar Window / Scroll Area usando los mismos cuatro lados y navegar frames con < >.
- Preview LVLLVL y exportador PRG leen Scroll Area como fuente de movimiento y Window como geometria visible.
- Caso clave: Screen 40x25 + Window 40x24 + Scroll Area 40x24 excluye fila 25; con Scroll Area 40x25 la fila 25 participa del scroll.

MILESTONE TEST 76 - GUARD CELLS DEL SCROLL AREA
Estado: PENDING PASS/FAIL
- Corrige la banda negra de VICE cuando Window/Scroll Area usan 24 filas: el buffer C64 conserva una fila fisica de guarda sin incorporar la fila 25 del Screen al Scroll Area.
- Scroll continuo vertical usa una fila de guarda wrap; Ping Pong / Move vertical usan guarda en blanco.
- Scroll Area 25 filas conserva las 25 filas reales sin guarda sintetica.
- Fine scroll horizontal fuerza CSEL=0 / 38 columnas hardware para ocultar los fetches laterales y evitar caracter cortado/pixel residual en los bordes.
- La interfaz Rico's Window Dimensions + Scroll Area permanece igual.

MILESTONE TEST 77 - SINGLE-FRAME SCROLL AREA EXPORT
Estado: PENDING PASS/FAIL
- Las animaciones de una sola frame con Scroll Up/Down/Left/Right dejan de caer al runtime legado TEST50.
- Usan el runtime moderno con Window + Scroll Area, igual que el preview de LVLLVL.
- Vertical conserva la geometria horizontal definida por Window; Scroll Area controla la fuente efectiva.


MILESTONE TEST 78 - FAIL PARCIAL
- Rico's Screen Dimension visible, pero cambios de layout no aparecieron y MAP SCROLL no respondio.

MILESTONE TEST 79 - UI INTEGRATION FIX
Estado: PENDING PASS/FAIL
- Parte de TEST77 PASS.
- Frames nace en el south del textModeEditor principal para llegar al borde izquierdo sin overlays.
- Paleta C64 compacta 16 colores en la barra izquierda.
- Colours minimizable/restaurable con -/+.
- Rico's Screen Dimension.
- Rico's Map Scroll basado en TEST75 con navegacion < > y PAUSE/PLAY global.
- Runtime/exporter TEST77 permanece sin cambios.

MILESTONE TEST 79 - UI INTEGRATION FIX
Estado: PARCIAL / REEMPLAZADO POR TEST80
- Rico's Map Scroll vuelve a abrir correctamente y conserva < > + PAUSE/PLAY.
- Layout inferior visualmente incorrecto; TEST80 rehace solo la composicion de interfaz.

MILESTONE TEST 80 - CLEAN UI LAYOUT
Estado: PASS CONFIRMADO
- Frames conserva dos filas nativas: controles arriba y timeline abajo, alineadas y compactas.
- La zona inferior llega desde el borde izquierdo hasta antes del panel derecho; Tiles/Colours mantiene toda la altura lateral.
- Se oculta el holder inferior vacio de Tile Palette para evitar una banda sin uso.
- Paleta rapida C64 16 colores en formato 2x8 dentro de la barra izquierda.
- Colours arranca minimizado y puede restaurarse con + durante la sesion.
- Tiles abre por defecto en Columns of 16 en inicio/carga de Screen sin bloquear cambios manuales posteriores.
- Rico's Map Scroll TEST79 y exporter TEST77 se mantienen funcionalmente sin cambios.


CHECKPOINT TEST80 PASS
======================
- Nuevo checkpoint seguro aprobado por usuario.
- Mantiene TEST77 PASS como runtime/exporter MAP SCROLL.
- Consolida Window + Scroll Area, Rico's Screen Dimension, Rico's Map Scroll con navegacion < > y PAUSE/PLAY, layout inferior limpio, paleta rapida C64 2x8, Colours minimizado y Columns of 16 por defecto.

MILESTONE TEST 81 - CLEAN RESTART / BLACK GAP + LARGE VERTICAL MAP
Estado: PENDING PASS/FAIL
Base: TEST80 PASS.
- Cambio visual aislado: el canvas del preview MAP SCROLL recibe fondo negro antes del render; no modifica geometria, Window, Scroll Area ni formulas de movimiento.
- Exportador grande reintroducido desde la version que ya habia recorrido correctamente mapas verticales: Screen 40x26..40x255, una Frame, Scroll Up/Down.
- Caso de validacion principal: Screen 40x50 + Window 40x24 + Scroll Area 40x50.
- El viewport visible sigue siendo 24/25 filas; el mapa fuente completo se recorre desde RAM separada y los buffers VIC siguen siendo $0400/$0800.
- Exportaciones 40x25 continúan por TEST77 sin cambios.
- No se heredan TEST82/TEST83.

TEST82 PENDING - LARGE MAP ROW PHASE FIX
- Base: clean TEST81 from TEST80 PASS.
- Keeps Screen 40x50 + Window 40x24/25 + Scroll Area 40x50 model.
- Replaces full backbuffer regeneration at each character boundary with the proven row-shift phase used by the stable vertical 40-column runtime.
- Only one new source row is injected from the large map per 8-pixel row crossing, preserving design geometry when scroll starts.

MILESTONE TEST 83 - VIEWPORT SOBRE FUENTE COMPLETA 40x50
Estado: PENDING PASS/FAIL
- MAP SCROLL OFF conserva la previsualizacion/edicion completa del Screen (ejemplo 40x50).
- MAP SCROLL ON muestra solamente la Window (ejemplo 40x24) como viewport visible del C64.
- Scroll Area sigue siendo la fuente completa (ejemplo 40x50): las filas 25..50 no se recortan y entran por debajo durante Scroll Up.
- La reduccion de altura se aplica solamente a GridView2d; no cambia el documento ni las dimensiones reales del Screen.
- El exportador grande de la linea limpia se conserva para recorrer el mapa fuente 40xN completo en el PRG.

MILESTONE TEST 83 - PASS CONFIRMADO / VIEWPORT SOBRE FUENTE COMPLETA
Estado: PASS CONFIRMADO POR USUARIO
- Screen 40x50 conserva sus 50 filas reales.
- MAP SCROLL ON muestra solo la Window mientras el Scroll Area 40x50 completo sigue alimentando el recorrido.
- MAP SCROLL OFF restaura la vista completa de 50 filas.
- Geometria del arte preservada durante el preview.

MILESTONE TEST 84 - DEFAULT 40x25 + COLORES POR CELDA
Estado: PARTIAL / REEMPLAZADO POR TEST85
- Los Screens mayores a la pantalla C64 reciben como default inicial de Window hasta 40x25 al abrir Rico's Window Dimensions; Scroll Area sigue siendo independiente y completo.
- El default se aplica una sola vez y no bloquea cambios manuales posteriores.
- El exportador grande vertical conserva el row-phase-safe aprobado y agrega color por celda: mapa chars $4000+, mapa colors $7000+.
- Color RAM sigue la misma camera_row del mapa, evitando el relleno monocromo/blanco del exportador grande anterior.
- Caso objetivo: Screen 40x50 / Window 40x25 / Scroll Area 40x50 / Scroll Up o Down.

MILESTONE TEST 85 - SPARSE COLOR COMMIT
Estado: PENDING PASS/FAIL
- Base: TEST84 / TEST83 PASS.
- Mantiene Screen grande completo + viewport Window 40x25 + Scroll Area completo.
- Corrige el costo de TEST84: no vuelve a copiar las 1000 celdas de Color RAM en cada salto de fila.
- Color RAM se inicializa con un color dominante seguro y luego solo se actualizan las posiciones de caracteres no vacios del viewport.
- Objetivo: recuperar la fluidez de TEST83 y eliminar flashes/restos blancos sin volver al exportador monocromo.

TEST86 PENDING PASS/FAIL
- Fixes TEST85 assembler rejection of sparse color pointer labels.
- Uses numeric sparse-row addresses; no symbolic <color_update_xxx / >color_update_xxx entries.

TEST87 PENDING
- Left quick C64 palette: title removed and swatches enlarged to match approved visual reference; same sidebar anchor/position as TEST86 MASTER.


===== ORIGEN HISTORICO: RICO_FEATURES_MILESTONES_14_OCT_2026.txt =====
RICO / LVLLVL - FEATURES Y MILESTONES
=====================================
Fecha de consolidacion: 14 de octubre de 2026
Estado actual validado: TEST 19 = PASS
Base ejecutable validada: LVLLVL_TEST19_ACTIVE_FRAME_BANK_RENDER.zip
SHA256 base PASS: d8137c661c0340de7619f1002f227bad3bddb0dad28011d5228dc46fae9f2d2e
Repositorio: serigrafiamdp-web/lvllvl-scummpet-export

OBJETIVO GENERAL
================
Extender LVLLVL para el flujo RICO/SCUMM/C64 sin romper el modelo nativo de
screen codes de la C64. El editor debe poder trabajar con dos charsets de
256 glifos, seleccionar por frame cual banco esta activo y mantener los
screen codes siempre en 0..255.

ARQUITECTURA ACTUAL APROBADA
============================
1. CHARSET BANK 1
   - 256 slots.
   - Es el tileset nativo de LVLLVL.
   - En configuracion C64 nueva, por defecto contiene C64 normal.

2. CHARSET BANK 2
   - 256 slots independientes.
   - Se guarda con el proyecto en el campo ricoCharsetBank2.
   - En configuracion C64 nueva, por defecto se inicializa con C64 Shifted.
   - Puede ser reemplazado/modificado con Rico's Remix.

3. SCREEN CODES
   - La pantalla nunca usa indices 256..511.
   - Cada celda conserva siempre un codigo 0..255.
   - El banco activo de la frame decide si el codigo N dibuja BANK 1[N]
     o BANK 2[N].

4. DATO POR FRAME
   - Campo interno: charsetBank: 1 | 2
   - Frames nuevas: BANK 1 por defecto.
   - Frames viejas sin este dato: BANK 1 por compatibilidad.
   - Duplicate conserva el banco de la frame origen.
   - Al navegar entre frames, el selector se refresca leyendo el valor
     guardado en esa frame.

5. PRINCIPIO DE RUNTIME C64
   - El concepto final es alternar entre dos charsets de 256 sin reescribir
     los screen codes.
   - La implementacion/export C64 definitiva del cambio de puntero de charset
     queda para una milestone posterior.

FEATURES RICO YA VALIDADAS
==========================

RICO-ECM-01 - LIVE REPACK TEXTMODE -> C64 ECM
Estado: PASS
- Escanea las frames antes de activar ECM.
- Prioriza los glifos realmente usados.
- Reorganiza los usados dentro de los 64 slots fisicos ECM.
- Reescribe screen codes preservando bits 6-7 como selector de background.
- Cancela si la conversion no puede hacerse sin perdida.

RICO-ECM-02 - SELECTOR MANUAL DE 64 GLIFOS
Estado: PASS
- En proyectos vacios permite elegir manualmente los 64 glifos ECM.
- Fuente: tileset cargado, normal o custom, hasta 256 glifos.
- Los elegidos pasan a slots fisicos 0..63.

RICO-ECM-03 - RESELECCION ECM -> ECM
Estado: PASS
- Conserva el tileset fuente original.
- Permite reabrir la seleccion de glifos.
- Protege slots ya usados por el artwork.

RICO-ECM-04 - UI NATIVA EDIT TILE PALETTE
Estado: PASS
- Dialogo estilo LVLLVL.
- Fuente a la izquierda, 64 glifos ECM a la derecha.
- OK / Cancel.
- Sin paneles diagnosticos agregados.

BUG FIX 07 - CHOOSE A TILE SET
Estado: PASS
- Preview vuelve a cambiar al seleccionar presets.
- OK aplica el tileset elegido.
- Fix aislado en capa RICO, sin modificar el chooser original de James.

RICO REMIX TILESET
==================

MILESTONE TEST 08 - MENU RICO'S REMIX
Estado: PASS
- Nueva opcion debajo de Choose A Tile Set.
- ID independiente: rico-tileset-remix.

MILESTONE TEST 10 - REMIX POR SLOT
Estado: PASS
- Variantes C64 reutilizadas desde la libreria original.
- C64 / C64 Shifted / Swedish / Swedish Shifted / Japanese / Japanese Shifted.
- El tileset permanece en 256 slots por banco.
- Click en fuente N reemplaza slot N.
- Segundo click sobre la misma fuente restaura el estado previo.
- Cancel descarta; OK confirma.

MILESTONE TEST 14 - UI REMIX 512 CONTINUO
Estado: PASS
- Interfaz final actual de Rico's Remix.
- Izquierda solo familias:
    C64
    C64 SWEDISH
    C64 JAPANESE
- Cada familia representa 512 glifos continuos:
    posiciones 0..255   = normal / BANK 1
    posiciones 256..511 = shifted / BANK 2
- Derecha: 512 custom en la misma geometria.
- 32 filas x 16 columnas.
- Sin titulos BANK 1/BANK 2 dentro de la grilla.
- Sin separaciones negras internas.
- Cabecera compacta.
- Sin scroll interno: los 512 se ven juntos en la ventana Remix.
- Correspondencia visual 1:1 SOURCE <-> CUSTOM.
- BANK 2 persiste como ricoCharsetBank2.

SELECTOR DE CHARSET POR FRAME
=============================

MILESTONE TEST 15 - CHARSET BANK POR FRAME
Estado: validado dentro del flujo que culmina en TEST 19 PASS
- Control junto a Frame Duration con estetica nativa:
    Charset Bank: [1]
- Valores 1 o 2.
- El valor pertenece a cada frame.
- Al navegar por < >, campo numerico, timeline o playback, se refresca.
- Frames nuevas = BANK 1.
- Duplicate copia el banco de origen.

PALETA LATERAL DUAL BANK
========================

MILESTONE TEST 17 - PREVIEW REAL DE BANK 2
Estado: PASS
- Vista lateral por defecto: Columns of 16.
- Se aprovecha el espacio vertical de Tiles.
- La paleta muestra 512 posiciones continuas:
    arriba = BANK 1, 256 glifos
    abajo  = BANK 2, 256 glifos
- El banco no activo queda grisado/bloqueado.
- El banco activo acepta seleccion.
- BANK 2 renderiza preview real; ya no aparece negro.
- El tileset real de LVLLVL continua siendo de 256 indices.
- La mitad inferior es una representacion virtual del BANK 2.
- Al seleccionar BANK 2, un click sobre la posicion visual 256+N se traduce
  al screen code N, nunca a 256+N.
- Scrollbar vertical de la paleta queda disponible en Columns of 16.
- Layers se minimiza al inicio para liberar altura.

MILESTONE TEST 18 - BANK 2 C64 SHIFTED POR DEFECTO
Estado: integrado y validado como parte de TEST 19 PASS
- BANK 1 por defecto = C64 normal.
- BANK 2 por defecto = C64 Shifted.
- Si BANK 2 ya fue personalizado por Rico's Remix, no se sobrescribe.

MILESTONE TEST 19 - RENDER REAL POR FRAME
Estado: PASS CONFIRMADO
- La seleccion BANK 1/BANK 2 deja de ser solo visual.
- Frame en BANK 1: codigo N usa BANK 1[N].
- Frame en BANK 2: codigo N usa BANK 2[N].
- Se puede seleccionar un glifo de BANK 2 y pintar realmente con el glifo
  BANK 2 correspondiente.
- Al volver a una frame BANK 1, los mismos screen codes recuperan la forma
  de BANK 1.
- Al regresar a una frame BANK 2, recuperan la forma de BANK 2.
- BANK 2 puede ser el C64 Shifted por defecto o un banco modificado con Remix.
- No se escriben indices 256..511 en Screen RAM / mapa de LVLLVL.

PERSISTENCIA ACTUAL
===================
Tileset:
  ricoCharsetBank2
    version: 1
    width / height
    tileData[0..255]
    metadata de origen cuando corresponde

Frame:
  charsetBank = 1 | 2

REGLAS QUE NO DEBEN ROMPERSE
============================
- BANK 1 y BANK 2 contienen 256 slots cada uno.
- El mapa de pantalla trabaja exclusivamente con 0..255.
- La posicion visual inferior 256+N representa BANK 2[N], no un screen code
  mayor a 255.
- Rico's Remix administra los dos bancos.
- La frame decide cual banco interpreta sus screen codes.
- Choose A Tile Set original debe seguir funcionando.
- Las features ECM RICO existentes no deben degradarse.

ESTADO VISUAL ACTUAL
====================
Panel lateral Tiles:
- Columns of 16 por defecto.
- BANK 1 arriba.
- BANK 2 abajo.
- Banco activo normal.
- Banco inactivo grisado y no seleccionable.

Barra de Frames:
- Frame Duration: [ticks]
- Charset Bank: [1|2]
- Luego New Frame / Duplicate / Delete / Show Previous Frame.

Rico's Remix:
- SOURCE 512 a la izquierda.
- CUSTOM 512 a la derecha.
- Sin divisiones BANK visibles dentro de la grilla.
- C64 / C64 SWEDISH / C64 JAPANESE como familias fuente.

PROXIMAS MILESTONES / PENDIENTES
================================
1. Tile Editor para BANK 2
   - Editar pixeles de un glifo BANK 2 sin redirigir accidentalmente a BANK 1.

2. Export de framepack / SCUMM_ANIMATION_V1
   - Serializar charsetBank por frame.
   - Exportar ambos charsets de 256 cuando el recurso los necesite.

3. Runtime C64
   - Cargar/ubicar CHARSET BANK 1 y CHARSET BANK 2 en memoria valida.
   - Cambiar el charset activo por frame con el mecanismo VIC-II apropiado.
   - Mantener screen codes sin conversion adicional.

4. Validacion combinada con ECM
   - El sistema dual-bank normal esta PASS en TEST 19.
   - La combinacion dual-bank + restricciones ECM de 64 glifos debe probarse
     como milestone separada antes de considerarla aprobada.

5. Undo/Redo
   - Verificar explicitamente Undo/Redo del cambio charsetBank por frame y de
     las operaciones Remix antes de promoverlo como contrato definitivo.

HISTORIAL DE CHECKPOINT
=====================
TEST 19 = PASS: primer checkpoint dual-bank por frame dentro del editor.
Los TEST intermedios quedan como historial de pruebas.

MILESTONE TEST 21 - PALETA BANKS 32 x 8
Estado: PASS CONFIRMADO
- Nueva vista lateral `Banks 32 x 8`.
- BANK 1 se muestra arriba como 32 columnas x 8 filas.
- BANK 2 se muestra debajo como 32 columnas x 8 filas.
- Preserva la composicion visual de tilesets importados desde imagenes 32x8.
- La vista `Columns of 16` continua disponible.
- El banco inactivo sigue grisado y bloqueado.
- BANK 2 sigue mapeando posiciones visuales 256..511 a screen codes 0..255.

MILESTONE TEST 23 - EXPORT PRG DUAL BANK POR FRAME
Estado: PASS CONFIRMADO EN VICE
- Alcance validado: Standard Character Mode, sin SID/musica y sin ECM/Multicolor.
- El PRG exporta ambos charsets residentes:
    BANK 1 -> $3000-$37FF (2048 bytes)
    BANK 2 -> $3800-$3FFF (2048 bytes)
- Cada frame conserva screen codes 0..255 y selecciona automaticamente BANK 1 o BANK 2.
- El marcador de banco se transporta por frame sin duplicar la pantalla.
- Rutina auxiliar de cambio de charset ubicada en $2FE0.
- El cambio de banco modifica solo los bits de charset de $D018 y preserva el screen buffer activo.
- BANK 2 se exporta desde ricoCharsetBank2 real, incluyendo cambios hechos con Rico's Remix.
- TEST22 fue FAIL por crecimiento del player: la tabla de frames alrededor de $0FFF/$1000 piso codigo y produjo CPU JAM en $1009.
- TEST23 corrige el problema sin agrandar el player: reemplaza una instruccion STA $D024 de 3 bytes por JSR $2FE0 de 3 bytes.
- VICE confirma reproduccion correcta Frame BANK 1 <-> Frame BANK 2.

COSTO DE MEMORIA VALIDADO
=========================
- BANK 1: 2048 bytes.
- BANK 2: 2048 bytes.
- Costo adicional respecto de un solo charset: +2048 bytes.
- El selector por frame cuesta esencialmente 1 byte de metadata por frame mas una rutina muy pequena.
- No se duplica Screen RAM ni el frame data por usar dos bancos.

REGLA PARA EL FUTURO EXPORTADOR DE RECURSOS
===========================================
El formato de recursos RICO/SCUMM debe conservar esta misma arquitectura:
- screen codes 0..255;
- metadata charsetBank por frame;
- exportar BANK 2 solo cuando el recurso realmente lo necesite;
- el runtime cambia el puntero de charset y no reescribe la pantalla para cambiar de banco.

CHECKPOINT ACTUAL
=================
TEST 23 = PASS CONFIRMADO EN VICE.
Checkpoint estable actual: editor dual-bank + seleccion por frame + export PRG Standard dual-bank.
Este es el punto seguro para continuar los proximos experimentos.

TEST54 (15 OCT 2026) - MAP SCROLL Ping Pong PRG exporter prepared: 4 ping-pong directions, non-wrapping background gaps, clean 38x24 viewport. STATUS: PENDING PASS/FAIL.

MILESTONE TEST 56 - MAP SCROLL MOVE OUT
Estado: PASS CONFIRMADO EN VICE
- Salida no-wrap Left / Right / Up / Down.
- Queda fuera hasta terminar Frame Duration.

MILESTONE TEST 57 - MAP SCROLL MOVE IN
Estado: PASS CONFIRMADO EN VICE
- MOVE pasa a llamarse MOVE OUT.
- Move In Left / Right / Up / Down entra desde fuera y queda en posicion normal.

MILESTONE TEST 58 - MAP SCROLL PREVIEW SYNC
Estado: PENDING USER PASS/FAIL
- Preview temporal PAL 50 Hz independiente del g_tick irregular del editor.
- Pixels / Step calculado en pixeles C64 antes de aplicar zoom.
- Border Color nativo restaurado durante MAP SCROLL.
- Runtime PRG TEST57 sin cambios.

MILESTONE TEST 65 - PREVIEW VERTICAL 24 ROWS
Estado: PASS CONFIRMADO
- LVLLVL Move In/Out vertical preview sincronizado con las 24 filas visibles reales del VIC-II.
- Timing validado en VICE: 192 ticks, 1 tick/step, 1 px/step.

MILESTONE TEST 67 - WINDOW DIMENSION POR FRAME
Estado: PASS CONFIRMADO
- Screen Dimension conserva el mapa real.
- Window Dimension define X/Y/Width/Height por frame sin destruir datos.
- Exterior de Window se enmascara negro y se sanea con blank_char al exportar.
- Geometria VIC derivada de Window: 40x25, 40x24 y 38x24 validadas estructuralmente.

MILESTONE TEST 68 - WINDOW DIMENSION CUATRO LADOS
Estado: EN DESARROLLO / UI MEJORADA
- Interfaz Left / Right / Top / Bottom independiente.
- Conserva metadata de TEST67.
- Detectado pendiente: el preview de MAP SCROLL aun podia animar datos exteriores al Window.

MILESTONE TEST 69 - WINDOW COMO SUPERFICIE DE MAP SCROLL
Estado: PENDING PASS/FAIL
- El preview de LVLLVL recorta primero la fuente al rectangulo Window.
- MAP SCROLL anima solamente esa superficie recortada.
- Las filas/columnas exteriores siguen existiendo en Screen pero quedan fuera del movimiento visual.
- Regla de packaging: los ZIP conservan unicamente LOG.txt y este mapa de milestones como documentacion TXT.

MILESTONE TEST 69 - WINDOW COMO SUPERFICIE DE MAP SCROLL
Estado: PREVIEW PASS / EXPORT FAIL
- LVLLVL confirmado correcto: MAP SCROLL anima solo el rectangulo Window.
- Export PRG no reproducía el mismo comportamiento; se detectaron constantes 40x25 / 319x199 y helpers del doble buffer eliminados accidentalmente en TEST67.

MILESTONE TEST 70 - WINDOW COMO SUPERFICIE REAL DEL RUNTIME PRG
Estado: PENDING PASS/FAIL
- Runtime reconstruido desde TEST64 PASS.
- Recuperados prepare_requested, commit_prepared, request_prepare y request_ping_prepare.
- Window X/Y/W/H gobierna copias, limites y superficie de Scroll / Ping Pong / Move Out / Move In.
- Maximo horizontal = W*8-1; maximo vertical = H*8-1.
- Exterior de Window permanece blank_char y no participa del desplazamiento.
- Ensamblado ACME validado sin errores antes de empaquetar.

TEST71: Screen is the full scroll source; Window is viewport only. A 40x25 design with Window 40x24 keeps row 25 available to enter during scroll.


MILESTONE TEST 71 - SCREEN SOURCE + WINDOW VIEWPORT
Estado: PASS CONFIRMADO
- Screen completo sigue siendo la fuente del scroll.
- Window limita solamente el area visible; contenido fuera de Window puede entrar durante el desplazamiento.

MILESTONE TEST 72 - RICO'S WINDOW DIMENSIONS
Estado: PENDING PASS/FAIL
- El editor normal queda completamente libre fuera de Window: dibujar, seleccionar y pegar no se restringen.
- Window se aplica solamente a visualizacion MAP SCROLL y exportacion.
- Navegacion de frames integrada en la misma ventana con controles < y >.
- Los valores de la frame actual se guardan antes de cambiar y los de la nueva frame se cargan sin cerrar la ventana.
- Convencion UI desde TEST72: las features propias llevan el prefijo "Rico's".

MILESTONE TEST 73 - RICO'S DIMENSIONS CUATRO LADOS
Estado: PENDING PASS/FAIL
- Redimension fisica del Screen mediante Left / Right / Top / Bottom con valores firmados.
- Valor positivo agrega filas/columnas; valor negativo elimina.
- Left/Top desplazan el contenido existente para modificar fisicamente esos bordes.
- Right/Bottom modifican el borde correspondiente sin desplazar el origen.
- Tamano final calculado automaticamente y preview visual incluida.
- Rico's Window Dimensions y MAP SCROLL quedan sin cambios en este test.


MILESTONE TEST 74 - RICO'S DIMENSIONS SUBTRACT FIX
Estado: PENDING PASS/FAIL
- Corrige Left/Top negativos en proyectos con varias frames.
- El offset fuente se calcula una sola vez y se aplica igual a todas las frames.
- La interfaz de Rico's Dimensions permanece sin cambios.

MILESTONE TEST 75 - WINDOW + SCROLL AREA INDEPENDIENTES
Estado: PENDING PASS/FAIL
- Screen = area completa editable.
- Window = viewport visible.
- Scroll Area = rectangulo del Screen que participa del MAP SCROLL.
- Scroll Area es por frame y por defecto ocupa todo el Screen.
- Rico's Window Dimensions permite alternar Window / Scroll Area usando los mismos cuatro lados y navegar frames con < >.
- Preview LVLLVL y exportador PRG leen Scroll Area como fuente de movimiento y Window como geometria visible.
- Caso clave: Screen 40x25 + Window 40x24 + Scroll Area 40x24 excluye fila 25; con Scroll Area 40x25 la fila 25 participa del scroll.

MILESTONE TEST 76 - GUARD CELLS DEL SCROLL AREA
Estado: PENDING PASS/FAIL
- Corrige la banda negra de VICE cuando Window/Scroll Area usan 24 filas: el buffer C64 conserva una fila fisica de guarda sin incorporar la fila 25 del Screen al Scroll Area.
- Scroll continuo vertical usa una fila de guarda wrap; Ping Pong / Move vertical usan guarda en blanco.
- Scroll Area 25 filas conserva las 25 filas reales sin guarda sintetica.
- Fine scroll horizontal fuerza CSEL=0 / 38 columnas hardware para ocultar los fetches laterales y evitar caracter cortado/pixel residual en los bordes.
- La interfaz Rico's Window Dimensions + Scroll Area permanece igual.

MILESTONE TEST 77 - SINGLE-FRAME SCROLL AREA EXPORT
Estado: PASS CONFIRMADO EN VICE
- Las animaciones de una sola frame con Scroll Up/Down/Left/Right dejan de caer al runtime legado TEST50.
- Usan el runtime moderno con Window + Scroll Area, igual que el preview de LVLLVL.
- Vertical conserva la geometria horizontal definida por Window; Scroll Area controla la fuente efectiva.


MILESTONE TEST 78 - FAIL PARCIAL
- Rico's Screen Dimension visible, pero cambios de layout no aparecieron y MAP SCROLL no respondio.

MILESTONE TEST 79 - UI INTEGRATION FIX
Estado: PENDING PASS/FAIL
- Parte de TEST77 PASS.
- Frames nace en el south del textModeEditor principal para llegar al borde izquierdo sin overlays.
- Paleta C64 compacta 16 colores en la barra izquierda.
- Colours minimizable/restaurable con -/+.
- Rico's Screen Dimension.
- Rico's Map Scroll basado en TEST75 con navegacion < > y PAUSE/PLAY global.
- Runtime/exporter TEST77 permanece sin cambios.

MILESTONE TEST 79 - UI INTEGRATION FIX
Estado: PARCIAL / REEMPLAZADO POR TEST80
- Rico's Map Scroll vuelve a abrir correctamente y conserva < > + PAUSE/PLAY.
- Layout inferior visualmente incorrecto; TEST80 rehace solo la composicion de interfaz.

MILESTONE TEST 80 - CLEAN UI LAYOUT
Estado: PASS CONFIRMADO
- Frames conserva dos filas nativas: controles arriba y timeline abajo, alineadas y compactas.
- La zona inferior llega desde el borde izquierdo hasta antes del panel derecho; Tiles/Colours mantiene toda la altura lateral.
- Se oculta el holder inferior vacio de Tile Palette para evitar una banda sin uso.
- Paleta rapida C64 16 colores en formato 2x8 dentro de la barra izquierda.
- Colours arranca minimizado y puede restaurarse con + durante la sesion.
- Tiles abre por defecto en Columns of 16 en inicio/carga de Screen sin bloquear cambios manuales posteriores.
- Rico's Map Scroll TEST79 y exporter TEST77 se mantienen funcionalmente sin cambios.


CHECKPOINT TEST80 PASS
======================
- Nuevo checkpoint seguro aprobado por usuario.
- Mantiene TEST77 PASS como runtime/exporter MAP SCROLL.
- Consolida Window + Scroll Area, Rico's Screen Dimension, Rico's Map Scroll con navegacion < > y PAUSE/PLAY, layout inferior limpio, paleta rapida C64 2x8, Colours minimizado y Columns of 16 por defecto.


PROMOCION GITHUB TEST80 PASS
============================
- TEST80 confirmado PASS por usuario el 16/10/2026.
- Se promueve como nuevo checkpoint seguro del repositorio.
- Runtime/exporter MAP SCROLL aprobado: TEST77.
- Interfaz aprobada: Screen/Window/Scroll Area, Rico's Map Scroll, layout inferior limpio, paleta C64 2x8, Colours minimizado y Columns of 16 por defecto.
- ZIP de checkpoint aprobado: LVLLVL_TEST80_RICO_CLEAN_UI_LAYOUT_PASS.zip
- SHA256 del ZIP aprobado: 77d44844fdf7eccb41f1ce1ee6a75e588024f82f4071e56d9a33d0e8f3e97a1c


===== ORIGEN HISTORICO: RICO_FEATURES_MILESTONES_17_OCT_2026.txt =====
RICO / LVL-RICO — MILESTONES 17 OCT 2026
=========================================

MASTER ACTUAL
-------------
MASTER_LVL-RICO_17_OCTUBRE_2026.zip
SHA256 7b98cb59532394b99410a9d26c5b90259b04ec21666f0c7ec6006479c96f709d
VALIDACION: TEST120 ZIP PASS CONFIRMADO.

CADENA RECIENTE
---------------
TEST80 PASS
- Layout limpio.
- Rico's Map Scroll operativo.
- Paleta compacta 2x8.
- Colours inicia minimizado.
- Tiles inicia Columns of 16.

TEST81-TEST89
- Ajustes de viewport/large-map y runtime PRG.
- Large Map source/window/color/timing/max-speed integrados.
- TEST89 queda dentro del MASTER.

TEST104 / TEST105
- Recuperada animacion nativa de caracteres en VICE.
- animate_chars nativo de James trabaja sobre $3800.
- Mapping validado: BANK1 $3800, BANK2 $3000.
- TEST105: VICE PASS, UI actual conservada; quedaba flicker en preview.

TEST118
- Diagnostico: se desactiva TileSet.update() para Animated Chars.
- Resultado: desaparecen simultaneamente flicker y movimiento.
- Prueba causal: el problema estaba dentro de la ruta de update/repaint de caracteres.

TEST119
- Dirty map cells pero aun quedaban redraws de Current Tile / palettes.
- FAIL: vuelve el flicker.

TEST120
- Durante el tick se silencian Current Tile, palettes, invalidateAllCells y graphic.redraw.
- Se detectan glyph IDs realmente modificados comparando currentTileData.
- Solo se redibujan las celdas del mapa que usan esos IDs.
- ZIP PASS CONFIRMADO: animacion visible, sin flicker general.

REGLA NUEVA DE WEB
------------------
- ZIP = unica fuente de validacion.
- Cada test futuro reemplaza todo el payload de GitHub Pages desde el ZIP.
- No se vuelven a reconstruir cambios a mano en gh-pages.
- TEST120 Pages exact payload commit: 725930f44f3beb84ffee8fe07c771e438ee0546a.

PROMOCION
---------
- main/dist = payload exacto TEST120 PASS (622 archivos).
- Documentacion actualizada.
- Checkpoint: promotion/lvl-rico-master-17-oct-2026.


===== ORIGEN HISTORICO: RICO_TEST30_DOUBLE_HEIGHT_VERTICAL_NOTES.txt =====
RICO TEST30 - DOUBLE HEIGHT AUTO VERTICAL PAIRS

Correction over TEST29:
- A tall 8x14/8x16 source glyph is split into two real C64 8x8 chars.
- The two sister chars are stored as a VERTICAL pair in the standard 16-column C64 palette.
- Pair 0 = TOP slot 0 + BOTTOM slot 16; pair 1 = 1 + 17; ...
- 128 vertical pairs consume the full 256 slots of one bank.
- Clicking a source glyph imports BOTH halves immediately at the insertion cursor and advances to the next pair.
- Clicking the CUSTOM tileset only moves the next insertion cursor; it is no longer required for every glyph.
- 8x16 splits 8+8 exactly.
- 8x14 splits 8+6 and pads the final two BOTTOM rows with black.
- BANK defaults to the active frame bank when entering DOUBLE HEIGHT mode.

Goal: the adapted C64 tileset visibly shows TOP directly above BOTTOM for every imported glyph.


===== ORIGEN HISTORICO: RICO_TEST31_16X16_MODULE_NOTES.txt =====
RICO TEST31 - REMIX 16x16 -> C64 2x2 MODULES
==============================================
Base: TEST30 PASS.

Goal
----
Integrate the native LVLLVL 16x16 source presets into Rico's Remix while preserving
a real C64 destination charset of 256 independent 8x8 characters per bank.

Contract
--------
One selected 16x16 source module consumes FOUR C64 character slots:

  TOP LEFT      TOP RIGHT
  BOTTOM LEFT   BOTTOM RIGHT

The normal 16-column C64 tile palette is partitioned into 8 x 8 module cells.
Each module occupies a physically adjacent 2x2 block.

Module 0:  slots 0,1 / 16,17
Module 1:  slots 2,3 / 18,19
...
Maximum: 64 modules per BANK = 64 x 4 = 256 character slots.

Source split
------------
TL = source x 0..7,  y 0..7
TR = source x 8..15, y 0..7
BL = source x 0..7,  y 8..15
BR = source x 8..15, y 8..15

No scaling and no padding are needed for true 16x16 sources.

UI
--
New Remix category: MODULE 2x2 · 16x16.
Current presets include Kenny 1 Bit Pack and Patterns and Tiles.
Each source glyph is drawn at native 16x16 with an 8/8 crosshair guide.
Clicking a source glyph immediately writes all four C64 tiles into the selected
2x2 destination block and advances the insertion cursor to the next module.
Clicking any of the four destination tiles selects its whole 2x2 module.

Validation target
-----------------
Select a visually obvious 16x16 source module and verify that CUSTOM shows exactly
that image reconstructed from four adjacent 8x8 characters in a 2x2 square.
Confirm repeated source clicks append to the next 2x2 module and do not disturb the
previous four tiles.


===== ORIGEN HISTORICO: RICO_TEST32_LOCAL_TILESET_LIBRARY_NOTES.txt =====
RICO TEST32 - LOCAL TILESET LIBRARY
===================================
Base: TEST31 PASS.

Objetivo
--------
Permitir que un Tile Set importado quede guardado localmente en el navegador,
aparezca en Custom Text Mode Sets y pueda utilizarse como SOURCE dentro de
Rico's Remix a Tileset.

Flujo
-----
1. Tiles -> Choose A Tile Set -> Load/Import Tile Set.
2. Importar PNG/BIN/JSON/etc con el importador normal de LVLLVL.
3. Dejar marcado "Save to RICO Local Library" y elegir nombre.
4. OK: se importa normalmente y se guarda una copia local.
5. Custom Text Mode Sets -> RICO LOCAL LIBRARY muestra los sets guardados.
6. Export JSON genera RICO_TILESET_LIBRARY.json.
7. Import JSON restaura/mezcla una biblioteca exportada.
8. Rico's Remix -> RICO LOCAL LIBRARY muestra automáticamente los sets locales compatibles.

Persistencia
------------
TEST32 usa localStorage con clave ricoLocalTileSetLibraryV1.
Los sets quedan sólo en el navegador/perfil actual hasta exportarlos a JSON.
El JSON puede promoverse más adelante al source del fork.

Formato JSON
------------
format: RICO_TILESET_LIBRARY_V1
version: 1
tileSets: [
  id, name, width, height, tileCount, type, source,
  createdAt, updatedAt, tileData
]

Compatibilidad Rico Remix
-------------------------
8x8   -> 1 slot C64 por glyph.
7x8   -> 1 slot C64 8x8, columna derecha vacía.
8x14  -> 2 slots verticales, bottom con 2 filas negras.
8x16  -> 2 slots verticales, split exacto 8+8.
16x16 -> 4 slots en bloque C64 2x2.

Otros tamaños pueden guardarse y reutilizarse desde Custom Text Mode Sets, pero
no aparecen todavía como SOURCE de Rico's Remix hasta definir su adaptación C64.

PASS/FAIL
---------
Pendiente de validación del usuario.


===== ORIGEN HISTORICO: RICO_TEST33_ANIMATED_PALETTE_PREVIEW_NOTES.txt =====
RICO TEST33 - ANIMATED CHARACTER PALETTE PREVIEW
================================================
Base: TEST32 PASS.

Objetivo:
Restaurar la previsualizacion en movimiento de caracteres animados dentro de las
paletas de caracteres. Deben animarse aunque el glyph no este usado en pantalla.

Comportamiento esperado:
- La paleta principal de 256 caracteres anima el BANK activo.
- La paleta lateral dual-bank anima BANK 1 y BANK 2 simultaneamente.
- Funciona en Columns of 16 y Banks 32 x 8.
- Respeta Scroll, Ping Pong, Blink y Frames.
- No modifica los pixeles base: usa buffers de preview separados.
- No cambia el renderer del mapa; solo refresca las vistas de paleta.

Prueba recomendada:
1. Animar un caracter de BANK 1 que NO este colocado en pantalla.
2. Confirmar que se mueve en la paleta.
3. Animar otro caracter de BANK 2 con otro modo/timing.
4. Confirmar que ambos se mueven simultaneamente en la paleta lateral.
5. Cambiar de BANK y confirmar que la paleta principal muestra el BANK activo.


===== ORIGEN HISTORICO: RICO_TEST34_GROUP_ANIMATE_NOTES.txt =====
RICO TEST34 - GROUP ANIMATE
==========================
Base: TEST33 PASS.

Goal
----
Add a second animation control under Tile Editor > Animated named "Group Animate".
Unlike normal Animated, Group Animate treats the complete 2D tile selection as ONE
large bitmap and only then slices the animated result back into its 8x8 C64 tiles.

Example: a 2x2 selection is animated as one 16x16 bitmap, not four independent 8x8
animations. Scroll Up therefore lets pixels leave the top edge of the whole 16x16
surface and wrap back through the bottom edge of the whole 16x16 surface.

Implemented
-----------
- New Group Animate dropdown below normal Animated.
- Same animation choices as the normal RICO animation menu:
  No, Scroll Left/Right/Up/Down, Ping Pong Left/Right/Up/Down, Blink, Frames.
- Independent Group Ticks/Frame.
- Preserves the 2D geometry of the Tile Editor selection.
- Standard Scroll wraps at the OUTER boundary of the entire selected group.
- Ping Pong clips/moves the entire group surface globally.
- Blink works over the complete group surface.
- Frames advances the member tiles synchronously.
- Group metadata is stored per BANK in document data: ricoGroupAnimationsV1.
- BANK1/BANK2 remain independent.
- Group members are removed from ordinary per-character animation to avoid double animation.
- Selecting a normal Animated mode on member tiles removes the intersecting Group Animate.
- Group animation is propagated to the screen and to TEST33 palette previews.

Important test
--------------
Select a recognizable multi-tile image (for example 2x2), choose Group Animate > Scroll Up,
and verify that the WHOLE image crosses tile boundaries continuously. Internal 8x8 borders
must not behave as independent wrap boundaries.

Status: PENDING USER PASS/FAIL.


===== ORIGEN HISTORICO: RICO_TEST35_MAP_SCROLL_NOTES.txt =====
RICO TEST35 - MAP SCROLL
Base: TEST34 PASS.

- MAP SCROLL button beside Frame Duration.
- Visible word "ticks" removed beside Frame Duration to gain room; duration is still ticks.
- Per-frame dialog: No / Scroll L-R-U-D / Ping Pong L-R-U-D + Ticks/Step.
- Standard scroll wraps the complete rendered map as one surface.
- Ping Pong moves the complete map out and back without wrap.
- Frame Duration and MAP SCROLL Ticks/Step are independent.
- Entering a frame restarts its map-scroll phase at 0.
- Duplicate Frame copies the MAP SCROLL setting; new frame defaults to No.
- Character animation and Group Animate remain independent inside the moving map.

TEST STATUS: PASS confirmado por usuario.


===== ORIGEN HISTORICO: RICO_TEST36_MAP_SCROLL_BACKGROUND_FIX_NOTES.txt =====
RICO TEST36 - MAP SCROLL PING PONG BACKGROUND FIX
Base: TEST35 PASS.

Cambio unico:
- En MAP SCROLL Ping Pong, el area que queda expuesta al desplazar el mapa ya no muestra transparencia/checkerboard del editor.
- Esa zona se rellena con el Background Color C64 de la frame actual.
- Scroll normal con wrap, velocidad, metadata por frame, Frame Duration, Character Animate y Group Animate no se modifican.

TEST STATUS: awaiting PASS/FAIL.


===== ORIGEN HISTORICO: RICO_TEST37_MAP_SCROLL_SPEED_NOTES.txt =====
RICO TEST37 - MAP SCROLL: PIXELS PER STEP

Base: TEST36 PASS.

Cambio unico:
- La ventana MAP SCROLL suma un control Pixels / Step (1..8).
- Ticks / Step conserva el intervalo temporal.
- Pixels / Step controla cuantos pixels avanza el mapa en cada step.
- Ejemplos:
  Ticks/Step=1, Pixels/Step=1 -> 1 px por tick.
  Ticks/Step=1, Pixels/Step=8 -> 8 px por tick.
  Ticks/Step=4, Pixels/Step=2 -> salto de 2 px cada 4 ticks.
- Compatible con Scroll y Ping Pong en las cuatro direcciones.
- Configuraciones TEST35/36 existentes migran implicitamente con Pixels/Step=1.
- El fix TEST36 de rellenar con Background Color C64 en Ping Pong se conserva.

PENDIENTE: PASS/FAIL del usuario.


===== ORIGEN HISTORICO: RICO_TEST38_TILE_PALETTE_EDIT_REFRESH_NOTES.txt =====
RICO TEST38 - TILE PALETTE EDIT REFRESH
14 OCT 2026

Base: TEST37 PASS.

Bug fixed:
- Editing a character changed the real glyph and its use on the map,
  but the visible charset/tile palette index could keep showing the old glyph.

Cause:
- TEST33 intentionally caches palette-only preview pixels so animated unused
  characters keep animating in the palette. Manual Tile Editor edits did not
  invalidate that cache immediately.

Fix:
- TileEditorGrid.updateCharacter now invalidates the active BANK preview cache
  for the edited character(s).
- Forces the TEST33/TEST34 preview pipeline to rebuild on the current tick.
- Forces Group Animate composites to rebuild when a member glyph was edited.
- Redraws both the main palette and the dual BANK side palette immediately.
- BANK 2 side indices use the virtual +256 mapping.

No MAP SCROLL, animation timing, PRG export, or glyph pixel logic changed.


===== ORIGEN HISTORICO: RICO_TEST48_PRG_MAP_SCROLL_REFERENCE_NOTES.txt =====
RICO TEST48 - LVLLVL PRG MAP SCROLL via proven standalone runtime

Base: TEST38 PASS + reference vertical MAP SCROLL PRG confirmed PASS in VICE.

This test deliberately stops patching the legacy LVLLVL frame player for the supported case.
When LVLLVL exports a PRG and the project is:
- 1 frame
- 40x25
- 8x8 character set
- MAP SCROLL = Scroll Up

ToPRGAdv exports with the known-good standalone scroll runtime instead. The user still exports normally from LVLLVL.

Imported from the current project at export time:
- 1000 screen codes from frame 1
- active frame charset bank (BANK1/BANK2) copied into $3000
- C64 background color
- border color
- dominant per-cell foreground color (Color RAM is uniform in this first integration test)
- Ticks / Step
- Pixels / Step (1..8; very aggressive settings can be naturally limited by hidden-buffer preparation)

Runtime:
- BASIC: SYS8192
- engine: $2000
- screen buffers: $0400/$0800
- charset: $3000
- source map: $4000
- fine vertical scroll: $D011
- screen swap: $D018
- hidden screen prepared in 8 IRQ phases

Unsupported cases fall back to the existing LVLLVL/TEST23 exporter unchanged.

TEST: export normally from LVLLVL, then run the resulting PRG in VICE.


===== ORIGEN HISTORICO: RICO_TEST49_PRG_MAP_SCROLL_DIRECTIONS_NOTES.txt =====
RICO TEST49 - PRG MAP SCROLL WRAP DIRECTIONS

Base: TEST48 PASS for Scroll Up.

Export path for a single 40x25 / 8x8 frame:
- Scroll Up: exact proven TEST48 runtime retained.
- Scroll Down: standalone double-buffer VIC-II runtime.
- Scroll Left: standalone double-buffer VIC-II runtime using $D016.
- Scroll Right: standalone double-buffer VIC-II runtime using $D016.
- Ticks/Step and Pixels/Step exported.
- BANK1/BANK2 charset selection preserved.
- Color RAM remains uniform/dominant-color as in TEST48; per-cell color scrolling postponed until direction runtimes are validated.
- Ping Pong is not enabled in this test.

TEST ORDER:
1. Reconfirm Up did not regress.
2. Down.
3. Left.
4. Right.
Use Pixels/Step=1 initially.


===== ORIGEN HISTORICO: RICO_TEST50_VERTICAL_SCROLL_BORDER_MASK_NOTES.txt =====
RICO TEST50 - VERTICAL MAP SCROLL BORDER MASK

Base: TEST49.

Problem observed in VICE/video:
- Up/Down fine scroll is smooth inside the 8-pixel phase.
- At the top/bottom display edge a partial glyph / 1-line seam is visible during the wrap transition.

Fix:
- For vertical MAP SCROLL only, export uses VIC-II 24-row mode (D011 RSEL=0) during scrolling.
- Up keeps YSCROLL 7..0 but base bits use $10 instead of $18.
- Down keeps YSCROLL 0..7 but base bits use $10 instead of $18.
- This is the classic C64 smooth vertical-scroll masking technique: the slightly larger top/bottom border hides the row replacement transition.
- Left/Right runtimes are unchanged.

Tradeoff:
- Vertical visible text area is 24 rows while scrolling, with 4 extra border pixels at top and bottom.
- A future advanced 25-row edge-to-edge mode would require raster/border tricks and is intentionally out of scope for this isolated fix.


===== ORIGEN HISTORICO: RICO_TEST51_MAP_SCROLL_38X24_NOTES.txt =====
RICO TEST51 - MAP SCROLL CLEAN VIEWPORT 38x24

Base: TEST50 PASS.

Goal:
- Hide the VIC-II seam on all four wrap directions.
- Keep the logical screen/map data at 40x25 characters.
- During MAP SCROLL, render in VIC-II 38-column + 24-row mode.

VIC-II:
- $D011 RSEL=0 => 24 visible rows.
- $D016 CSEL=0 => 38 visible columns.
- Fine Y scroll remains in $D011 bits 0..2.
- Fine X scroll remains in $D016 bits 0..2.

Directions:
- Scroll Up: TEST50 vertical seam fix retained + CSEL=0.
- Scroll Down: TEST50 vertical seam fix retained + CSEL=0.
- Scroll Left: RSEL=0, CSEL=0; horizontal fine-scroll values no longer re-enable 40-column mode.
- Scroll Right: RSEL=0, CSEL=0; horizontal fine-scroll values no longer re-enable 40-column mode.

Important:
The exported screen data remains 40x25. The reduced 38x24 viewport is only the visible VIC-II window used to hide row/column turnover at the borders.

Pending user PASS/FAIL in VICE.


===== ORIGEN HISTORICO: RICO_TEST52_FRAME_TIMING_NOTES.txt =====
RICO TEST52 - MAP SCROLL FRAME TIMING

Goal:
- Export 2+ LVLLVL frames with the standalone MAP SCROLL runtime.
- The runtime reads each LVLLVL Frame Duration (ticks).
- When the assigned ticks finish, it loads the next LVLLVL frame and its own MAP SCROLL settings.
- The sequence loops back to Frame 1 after the last frame.

Supported in this test:
- C64 Standard / 8x8 / 40x25.
- 2..32 frames.
- MAP SCROLL: No, Up, Down, Left, Right.
- Ticks / Step and Pixels / Step independently per frame.
- Frame Duration independently per frame.
- 38x24 clean VIC-II viewport from TEST51.
- BANK1/BANK2 charset selection per frame.
- Per-frame background / border / dominant foreground color.

Still intentionally postponed:
- Ping Pong MAP SCROLL in PRG.
- Full per-cell Color RAM scrolling (uniform dominant foreground is retained).
- Character/group animation integration into this standalone runtime.

Suggested validation:
Frame 1: Scroll Left, Duration 150, Ticks/Step 4, Pixels/Step 1.
Frame 2: Scroll Right, Duration 150, Ticks/Step 4, Pixels/Step 1.
Export PRG normally. It should alternate F1 Left -> F2 Right -> F1 Left indefinitely.


===== ORIGEN HISTORICO: RICO_TEST53_FRAME_DURATION_512_NOTES.txt =====
RICO TEST53 - FRAME DURATION 512 TICKS

Base: TEST52 PASS.

Changes:
- Frame Duration UI range expanded from 1..255 to 1..512 ticks.
- Graphic.setFrameDuration clamps to 1..512.
- MAP SCROLL multi-frame PRG runtime now uses a 16-bit frame countdown.
- Duration is exported as low/high byte tables, so values 256..512 are represented correctly.
- MAP SCROLL Ticks / Step remains 1..255; this test changes Frame Duration only.
- Keeps TEST52 behaviour: multi-frame, per-frame scroll direction/speed, 38x24 clean viewport, Up/Down/Left/Right.

Suggested validation:
Frame 1: Scroll Left, Frame Duration 512, Ticks/Step 4, Pixels/Step 1.
Frame 2: Scroll Right, Frame Duration 512, Ticks/Step 4, Pixels/Step 1.
Export PRG and verify each frame remains active for the longer duration before switching.


===== ORIGEN HISTORICO: RICO_TEST54_MAP_SCROLL_PINGPONG_NOTES.txt =====
RICO / LVLLVL TEST54 - MAP SCROLL PING PONG

Base: TEST53 (Frame Duration 16-bit up to 512) + validated TEST51 clean 38x24 viewport.

Goal
----
Export the four MAP SCROLL Ping Pong modes already present in the LVLLVL editor:
- Ping Pong Left
- Ping Pong Right
- Ping Pong Up
- Ping Pong Down

Runtime behavior
----------------
- Non-wrapping movement: exposed area is background, not wrapped map data.
- Horizontal range: 0..319 px (40 chars * 8 - 1).
- Vertical range: 0..199 px (25 chars * 8 - 1).
- At the far end the direction reverses pixel-perfectly and returns toward origin.
- Uses the clean VIC-II viewport: 38 columns x 24 rows.
- Ticks / Step and Pixels / Step remain per frame.
- Frame Duration remains per frame and can change to a different scroll type on the next frame.
- Existing wrap Scroll Up/Down/Left/Right remains unchanged.

Implementation detail
---------------------
At each 8-pixel character boundary, Ping Pong rebuilds the hidden screen buffer from the original frame data plus blank cells instead of rotating/wrapping the current screen. This preserves the original map data for the return trip. A character code unused by all exported frame maps is reserved and zeroed in both charset banks to guarantee truly blank exposed background.

Test suggestion
---------------
Start with one or two frames using Ping Pong Left / Right, Ticks=1, Pixels=1. With Frame Duration max 512, horizontal Ping Pong will reach the far end at 319 ticks and visibly reverse, but a full out-and-back cycle would need 638 ticks at 1 px/tick. For a full cycle within 512, use Pixels / Step = 2.

STATUS: PENDING USER PASS/FAIL.


===== ORIGEN HISTORICO: RICO_TEST55_PINGPONG_CONTINUOUS_NOTES.txt =====
RICO TEST55 - MAP SCROLL PING PONG CONTINUOUS
15 OCT 2026

Base: TEST54 + TEST53/TEST51 validated chain.

Reason for TEST55:
TEST54 could appear to reach the end of a Ping Pong travel and jump directly back to the original position. The Ping Pong direction state was not necessarily the cause: when a one-frame PRG reached Frame Duration, next_frame -> load_frame reloaded the same frame, clearing ping_pos/ping_reverse and restoring the original screen.

Changes:
1. Single-frame MAP SCROLL no longer reloads its screen/config at Frame Duration rollover. Only the 16-bit frame timer is reloaded. Scroll/Ping Pong state continues seamlessly.
2. Frame Duration UI/storage/export range extended from 1-512 to 1-1024 ticks.
3. Multi-frame behavior is unchanged: when Frame Duration ends it advances to the next frame and loads that frame's own MAP SCROLL config.
4. Ping Pong max travel remains TEST54 behavior: horizontal 319 px, vertical 199 px, then reverse.
5. Clean VIC-II viewport remains 38x24.

Suggested tests:
A) One frame: Ping Pong Left, Ticks/Step=1, Pixels/Step=1. Any Frame Duration value should no longer reset the image at timer rollover; it should continue and reverse.
B) Multi-frame: use Frame Duration around 640+ if the intent is to visibly complete a full horizontal out-and-back cycle before advancing.

STATUS: PASS CONFIRMADO EN VICE por la usuaria.
El Ping Pong vuelve correctamente en sentido contrario sin reiniciar desde el origen.


===== ORIGEN HISTORICO: RICO_TEST56_MAP_SCROLL_MOVE_NOTES.txt =====
RICO TEST56 - MAP SCROLL MOVE
15 OCT 2026

Base segura: TEST55 PASS confirmado en VICE.

Objetivo
--------
Agregar un nuevo tipo de MAP SCROLL llamado MOVE.

Comportamiento
--------------
MOVE desplaza la pantalla completa en una sola direccion, con el mismo camino
no-wrap y fondo expuesto usado por Ping Pong, pero NO invierte la direccion.

Modos nuevos:
- MOVE Left
- MOVE Right
- MOVE Up
- MOVE Down

Reglas:
1. Ticks / Step y Pixels / Step funcionan igual que en Scroll/Ping Pong.
2. La pantalla se desplaza hasta quedar fuera del viewport limpio 38x24.
3. Al alcanzar el recorrido maximo, MOVE se detiene.
4. No hace wrap y no vuelve a aparecer durante el resto de Frame Duration.
5. El timer de Frame Duration sigue corriendo aunque MOVE ya haya terminado.
6. En multi-frame, cuando vence Frame Duration se carga normalmente la siguiente frame.
7. En una sola frame, se conserva la regla TEST55: el timer se recarga sin recargar la pantalla,
   por lo que una MOVE ya terminada permanece fuera y no reaparece.
8. Scroll normal y Ping Pong conservan su comportamiento previo.

Recorrido runtime:
- Horizontal: maximo 319 px, igual que Ping Pong TEST55.
- Vertical: maximo 199 px, igual que Ping Pong TEST55.
Estos recorridos son suficientes para sacar completamente la imagen del viewport visible 38x24.

Implementacion
--------------
- UI/preview: RICO_MAP_SCROLL_MOVE_TEST56.js
- Runtime PRG: RICO_PRG_MAP_SCROLL_MOVE_TEST56.js
- Metadata existente ricoMapScrollV1 se conserva; cfg version pasa a 3.
- Codigos runtime:
    9  = MOVE Left
    10 = MOVE Right
    11 = MOVE Up
    12 = MOVE Down
- TEST55 permanece sin modificar como checkpoint seguro.

Prueba sugerida
---------------
A) Una frame:
   MOVE Left
   Ticks / Step = 1
   Pixels / Step = 1
   Frame Duration = 500
   Esperado: sale hacia la izquierda, queda fuera y NO regresa.

B) Multi-frame:
   Frame 1 = MOVE Left, duration 500.
   Frame 2 = imagen distinta / No o cualquier otro MAP SCROLL.
   Esperado: Frame 1 sale, queda el fondo visible hasta tick 500 y entonces aparece Frame 2.

C) Repetir MOVE Right / Up / Down.

D) Regresion:
   Confirmar Ping Pong Left/Right/Up/Down sigue regresando.
   Confirmar Scroll Left/Right/Up/Down sigue haciendo wrap.

STATUS: PASS CONFIRMADO EN VICE por la usuaria.


===== ORIGEN HISTORICO: RICO_TEST57_MAP_SCROLL_MOVE_IN_OUT_NOTES.txt =====
RICO TEST57 - MAP SCROLL MOVE OUT + MOVE IN
15 OCT 2026

Base segura: TEST56 PASS confirmado en VICE.

Objetivo
--------
1. Renombrar visualmente MOVE a MOVE OUT sin romper metadata/proyectos TEST56.
2. Agregar MOVE IN en las cuatro direcciones.

Opciones
--------
MOVE OUT:
- Move Out Left
- Move Out Right
- Move Out Up
- Move Out Down

MOVE IN:
- Move In Left
- Move In Right
- Move In Up
- Move In Down

Semantica de direccion
----------------------
La direccion indica hacia donde SE MUEVE la imagen.

Ejemplos:
- Move In Left: empieza fuera por la derecha y entra moviendose hacia la izquierda.
- Move In Right: empieza fuera por la izquierda y entra moviendose hacia la derecha.
- Move In Up: empieza fuera por abajo y entra moviendose hacia arriba.
- Move In Down: empieza fuera por arriba y entra moviendose hacia abajo.

Comportamiento MOVE IN
----------------------
1. Al cargar la frame, el viewport visible 38x24 empieza sin caracteres de la imagen.
2. Se ve solamente el Background Color de la frame.
3. La imagen entra desde fuera segun la direccion seleccionada.
4. Ticks / Step y Pixels / Step funcionan igual que en Scroll, Ping Pong y Move Out.
5. Al completar el recorrido, la imagen queda en su posicion normal.
6. No vuelve a salir ni reinicia durante el resto de Frame Duration.
7. Si hay otra frame, se carga al vencer Frame Duration.
8. En una sola frame, el rollover de Frame Duration no reinicia Move In: queda visible en posicion normal.

Recorrido
---------
- Horizontal: 319 px maximos.
- Vertical: 199 px maximos.
Se reutilizan los extremos no-wrap validados en TEST55/56, suficientes para ocultar completamente
la imagen dentro del viewport limpio 38x24 al inicio de Move In.

Compatibilidad
--------------
- Los tipos internos TEST56 move-left/right/up/down se conservan.
- Solo cambia su etiqueta visible a Move Out ...
- Metadata ricoMapScrollV1 se conserva.
- Config version: 4.
- Codigos runtime existentes 0..12 se conservan.
- Nuevos:
    13 = Move In Left
    14 = Move In Right
    15 = Move In Up
    16 = Move In Down
- Alias TEST56 se conserva para compatibilidad.

Prueba sugerida
---------------
A) Una frame:
   Move In Left
   Ticks / Step = 1
   Pixels / Step = 1
   Frame Duration = 500
   Esperado: empieza vacia, entra desde la derecha hacia la izquierda, queda completa y espera.

B) Repetir Move In Right / Up / Down.

C) Regresion:
   - Move Out Left/Right/Up/Down debe seguir igual que TEST56 PASS.
   - Ping Pong debe seguir volviendo.
   - Scroll debe seguir haciendo wrap.

STATUS: PASS CONFIRMADO EN VICE por la usuaria.


===== ORIGEN HISTORICO: RICO_TEST58_MAP_SCROLL_PREVIEW_SYNC_NOTES.txt =====
RICO TEST58 - MAP SCROLL PREVIEW SYNC + BORDER FIX
15 OCT 2026

Base segura
-----------
TEST57 PASS confirmado en VICE y promovido a main.
Runtime/exportador PRG TEST57 NO se modifica en este test.

Objetivos
---------
1. Corregir la velocidad de preview MAP SCROLL dentro de LVLLVL para que coincida con el PRG exportado.
2. Evitar que el borde visual de LVLLVL pase a negro al activar MAP SCROLL.

Causa velocidad
---------------
LVLLVL usa FRAMERATE = 1000/50, pero el contador global g_tick se incrementa desde requestAnimationFrame
solo cuando transcurrieron >= 20 ms y luego reinicia lastTickTime al timestamp actual.

En una pantalla de 60 Hz:
- requestAnimationFrame llega aproximadamente cada 16.67 ms.
- el primer frame no alcanza 20 ms;
- el segundo llega a ~33.3 ms, incrementa g_tick una sola vez y reinicia el reloj.
Resultado practico: g_tick puede avanzar cerca de 30 veces por segundo en vez de 50.

El runtime C64 exportado usa IRQ PAL de 50 Hz, por lo que Ticks / Step se veia mas lento en el editor.

Correccion temporal TEST58
--------------------------
- El preview MAP SCROLL deja de basar su tiempo en g_tick.
- Usa un reloj PAL propio de 20 ms por tick = 50 Hz.
- Un pump requestAnimationFrame revisa la fase PAL y redibuja solo cuando cambia el step.
- TileSet.update conserva un fallback, pero consulta el mismo reloj PAL.

Causa escala / zoom
-------------------
TEST57 calculaba dist en pixeles C64 pero aplicaba ese valor directamente sobre el canvas escalado.
Con zoom distinto de 100%, 1 Pixel / Step visual no equivalia a 1 pixel C64.

Correccion escala TEST58
------------------------
- El desplazamiento se calcula siempre en coordenadas fuente C64:
    horizontal modulo 320 px
    vertical modulo 200 px
    Ping Pong / Move usan maximo 319 / 199 px
- Recien al dibujar se multiplica el offset por la escala del editor.
- Por lo tanto el zoom cambia el tamaño visual, pero NO la velocidad logica.

Causa borde negro
-----------------
El hook de MAP SCROLL renderiza la frame en un canvas intermedio para desplazarla.
El drawFrame nativo normalmente dibuja despues el Border Color alrededor de la pantalla.
Al interceptar ese flujo, el borde nativo quedaba fuera del canvas intermedio y el fondo negro del editor quedaba visible.

Correccion borde TEST58
-----------------------
- Se replica solamente el dibujo nativo del border despues del render scroll.
- Usa el Border Color real de la capa/frame actual.
- Respeta la visibilidad nativa del border.
- No modifica el valor guardado del Border Color.
- No afecta el PRG exportado.

Archivos activos
----------------
UI preview:
  src/js/rico/RICO_MAP_SCROLL_PREVIEW_SYNC_TEST58.js
  dist/js/rico/RICO_MAP_SCROLL_PREVIEW_SYNC_TEST58.js

Runtime PRG:
  RICO_PRG_MAP_SCROLL_MOVE_IN_OUT_TEST57.js (sin cambios)

Prueba sugerida
---------------
A) Velocidad
   Scroll Left
   Ticks / Step = 1
   Pixels / Step = 1
   Comparar LVLLVL vs PRG.
   Deben tener la misma velocidad logica: 320 ticks = 6.4 segundos por vuelta horizontal PAL.

B) Zoom
   Repetir con distintos niveles de zoom.
   La velocidad logica debe permanecer igual.

C) Border
   Elegir un Border Color claramente distinto de negro.
   Activar Scroll / Ping Pong / Move Out / Move In.
   El borde debe conservar ese color.

D) Regresion
   Exportar PRG y validar que TEST57 sigue identico.

STATUS: PASS CONFIRMADO por la usuaria.


===== ORIGEN HISTORICO: RICO_TEST59_MOVE_IN_TRANSITION_STAGING_NOTES.txt =====
RICO TEST59 - CLEAN MOVE IN TRANSITION STAGING
15 OCT 2026

Base segura
-----------
TEST58 PASS confirmado y promovido a main.
Preview 50 Hz + zoom sync + border fix se conserva.
TEST57 MOVE OUT + MOVE IN runtime era PASS salvo un microframe de basura visible
en transiciones multi-frame hacia una frame MOVE IN.

Sintoma observado
-----------------
Secuencia tipica:
Frame 1: Move Out Left
Frame 2: Move In Right (entra desde la izquierda)

Cuando la pantalla debia estar vacia entre ambas, aparecia durante una microframe
una pantalla parcialmente construida: filas superiores con caracteres y parte
inferior aun vacia.

Diagnostico
-----------
No era corrupcion del recurso ni del charset.
load_frame copiaba los 1000 screen codes de la nueva frame directamente a:
  $0400-$07E7
  $0800-$0BE7
mientras una de esas screen RAM podia seguir seleccionada por VIC-II.

La copia ocurre desde el IRQ y dura suficientes ciclos como para atravesar raster
visible. El VIC-II podia leer una screen a medio actualizar, produciendo tearing.

Solucion TEST59
---------------
Se reserva una tercera screen RAM temporal:
  $0C00-$0FFF

Al inicio:
- blank_char se inicializa.
- $0C00-$0FFF se llena con blank_char.
- blank_char es glyph 0 en ambos charset banks, por lo que la pantalla staging
  siempre muestra solamente el Background Color.

Cuando la NUEVA frame es Move In (tipos 13..16):
1. Se cargan su Background Color, Border Color y charset bank.
2. $D018 cambia temporalmente a screen $0C00.
3. VIC-II ve una pantalla completamente vacia.
4. La CPU puede reconstruir $0400 y $0800 sin que sean visibles.
5. Se prepara la posicion inicial de Move In.
6. Solo cuando esta terminada se hace swap hacia la screen real.

No se agrega staging a transiciones normales para evitar introducir flashes vacios
donde no corresponden.

Memoria
-------
$0400-$07E7 = screen A
$0800-$0BE7 = screen B
$0C00-$0FFF = blank transition staging
$2000+       = codigo runtime
$3000/$3800 = charset banks
$4000+       = frame data

Prueba principal
----------------
Repetir exactamente el caso que revelo el problema:
- Frame 1: Move Out Left
- Frame 2: Move In desde la izquierda (Move In Right segun semantica de movimiento)
- Ticks / Step = 1
- Pixels / Step = 1
- observar varias vueltas

Esperado:
- Frame 1 sale.
- Pantalla queda limpia.
- No aparece ninguna microframe con caracteres parciales.
- Frame 2 comienza a entrar limpiamente desde la izquierda.

Regresion
---------
- Move Out sigue igual.
- Move In en las 4 direcciones sigue igual.
- Ping Pong y Scroll normal siguen igual.
- Preview TEST58 no se modifica.

STATUS: TEST59 inicial bloqueado por regresion de integracion UI. TEST59B = PASS CONFIRMADO por la usuaria.


TEST59B - MENU RESTORE
----------------------
Problema detectado al abrir el paquete TEST59:
- el menu MAP SCROLL no mostraba las opciones Move Out / Move In.

La UI fuente contenia las opciones, pero el paquete seguia cargando el modulo con
nombre/cache TEST58 mientras el runtime ya era TEST59.

Correccion:
- nuevo modulo dedicado RICO_MAP_SCROLL_PREVIEW_SYNC_TEST59.js
- conserva exactamente las 8 opciones Move:
  Move Out Left / Right / Up / Down
  Move In Left / Right / Up / Down
- conserva preview 50 Hz, zoom sync y border fix de TEST58
- agrega alias TEST59 y mantiene aliases TEST58/57/56/37 por compatibilidad
- runtime staging TEST59 sin cambios


RESULTADO FINAL TEST59B
-----------------------
PASS confirmado.

Validado por la usuaria:
- las 8 opciones Move Out / Move In vuelven a aparecer en MAP SCROLL;
- la transicion Move Out -> Move In funciona;
- desaparece la microframe basura/tearing durante la pantalla vacia;
- staging $0C00 cumple su funcion sin romper el resto del runtime.

TEST59 inicial queda documentado como intento intermedio con regresion de integracion UI.
TEST59B es la version aprobada y nuevo MASTER.

```

</details>
