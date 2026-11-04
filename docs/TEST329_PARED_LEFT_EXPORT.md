# TEST329 — Integración del exportador ECM horizontal en la página principal

**Fecha:** 04/11/2026. **Estado:** candidato de integración en `gh-pages/index.html`, pendiente de prueba PRG real por el usuario. La base Bitmap MC TEST297 sigue cargada y el checkpoint TEST328 PASS permanece congelado.

## Problema informado

Con `PARED.json` el editor principal no exportaba Map Scroll hacia la izquierda; la ruta diagonal Up sí exportaba, pero no preservaba Extended Background Color.

## Diagnóstico del JSON original

| Campo | Valor |
| --- | --- |
| Screen | 100 columnas × 25 filas |
| Map Scroll | `left`, 1 píxel / tick, 1 frame |
| Rico's Window | 40×25, posición 0,0 |
| Scroll Area | 100×25, posición 0,0 |
| Modo de la capa guardado | `textmode` (seleccionar **Extended** en Export PRG) |
| Caracteres presentes en las celdas | **170, 171, 186, 187** (4 glifos) |
| Background de las 2.500 celdas | **8** (todas) |
| Foreground de celdas | **1 y 2** |
| Color global (frame) | **14** |
| Caracteres configurados para animación Left | 6, 22, 175, 191, 192, 193, 208, 209 (8, **ninguno aparece en el mapa PARED**) |
| Group Scroll configurado | Ninguno |
| Metadato legado `ricoLargeWindowDefault84` | width 65×25; no reemplaza Window 40×25 en la ruta de exportación revisada |

**ECM no inventa fondos:** este archivo usa un solo fondo efectivo (`bc=8`). El segundo color que ve el usuario es foreground (`fc=1` o `fc=2`), asignado en Color RAM. El VIC-II conserva hasta cuatro registros `$D021–$D024`, pero no hay más de un fondo en este archivo. Si se desean fondos distintos hay que asignarlos en los `bc` correspondientes.

## Bloqueo real detectado en el editor principal anterior (TEST297)

El `index.html` de raíz seguía cargando:
- `TEST/test242-ondas-pingpong/js/RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js`: rechaza `area.width>96`; también detecta y bloquea glyphs con animación configurada, incluso si son ajenos a este mapa.
- `js/RICO_PRG_HORIZ_COMPACT_FRAMES_TEST206.js`: límite de prueba de 96 columnas.
- No cargaba el scheduler TEST327 ni el parche ECM TEST328.

Por eso una exportación diagonal distinta podía ejecutarse mientras la horizontal de 100 columnas fallaba. La ruta diagonal tampoco tiene corrección ECM equivalente en TEST328: **NO afirmar que ECM diagonal esté arreglado**.

## Integración TEST329

La portada raíz ahora carga **exactamente los mismos 116 archivos JS, en el mismo orden, que TEST328**, con rutas adaptadas a la raíz (sin `<base href="../../">`):

1. Sustituido horizontal TEST186 por `TEST/test327-horizontal-animated-map/js/RICO_PRG_HORIZ_WIDE_TEST327.js`.
2. Sustituido multiframe compacto TEST206 por `TEST/test326-horizontal-map-limits/js/RICO_PRG_HORIZ_COMPACT_TEST326.js`.
3. Añadido `TEST/test327-horizontal-animated-map/js/RICO_HORIZ_CHAR_SCHEDULER_TEST327.js`.
4. Añadido al final `TEST/test328-ecm-preserve-4-backgrounds/js/RICO_ECM_EXPORT_REPACK_TEST328.js`.
5. Se mantuvo el motor `RICO_BITMAP_MC_DISTRIBUTED_TEST297.js` y los demás scripts que sustentan su checkpoint histórico.

**Prueba de lógica con PARED real:** se invocó `createPRG({mode:'extended',download:false})` con los módulos TEST328 y un ensamblador **simulado**. El generador reconoció los 4 glifos (170/171/186/187), repaque 0–3, ancho100, fondo8, $D011=$5B y registros $D021–$D024. No surgió error de restricciones; se obtuvo fuente ASM. **Esta prueba no certifica el ensamblado binario ni la ejecución en VICE.**

## Validación de usuario pendiente

1. Abrir `https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/` y refrescar con Ctrl+F5.
2. Cargar **PARED.json original**, mantener Map Scroll Left (1 px/tick, Window40×25, Scroll Area100×25), Export PRG con modo **Extended Background Color**.
3. Verificar que se descargue el PRG y se mueva el mapa hacia la izquierda en **VICE PAL**.
4. Verificar que todos los glifos y foregrounds 1 y 2 estén presentes, y que el fondo sea 8. **Un único fondo en PARED es lo correcto**.
5. Si no exporta, copiar el error que muestra la ventana y consultar `window.RICO_TEST326_HORIZONTAL_LAST_ERROR` y `window.RICO_TEST328_ECM_EXPORT.lastError` en la consola; no ocultar el error.

## Restricciones reales que se mantienen

- ECM tiene **64 glyphs** físicos y cuatro fondos; el exceso cancela exportación.
- La ruta horizontal ancha actual requiere ventana 40×25 y un frame; grupo y scroll individual sobre el mismo tile aún necesitan composición real.
- La ruta ECM para **diagonal** no está integrada en TEST328/329.
- Se conservan las restricciones por RAM; 245 columnas monoframe y 102 compacto multiframe son valores calculados, **no PASS** de hardware.

## Rollback

- [Versión TEST328 PASS aislada](../TEST/test328-ecm-preserve-4-backgrounds/).
- Rama `release/test328-ecm-horizontal-pass-2026-11-04` conserva los motores aprobados.
- **Respaldo exacto de la portada TEST297 anterior:** `backup/gh-pages-root-test297-before-test329-pared-2026-11-04`.
- No se han modificado los archivos originales de código JS ni los JSON del usuario.
