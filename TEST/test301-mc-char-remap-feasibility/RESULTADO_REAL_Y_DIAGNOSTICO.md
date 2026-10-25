# TEST301 — No se observa cambio / diagnóstico explícito

**Fecha:** 25 de octubre de 2026. **Comentario del usuario después de probar TEST301:** "no hay cambios".

Este comentario **no permite inferir cuántas filas del proyecto fueron compatibles** sin el JSON original, pero la lógica actual de TEST301 explica el comportamiento: solo exporta el PRG nuevo `RICO_TEST301_MC_CHAR_REMAP_LOSSLESS.prg` si **las 25 filas** y todas sus fases preservan exactamente C1/C2/C3 en modo MC Character. De lo contrario cede el menú Export PRG a **TEST297 PASS** y descarga el mismo motor que antes, con la misma velocidad.

## Cambio de diagnóstico, no de render

Se corrigió la interfaz de exportación **sin agregar ningún menú**. Al elegir Export PRG ahora presenta un aviso persistente y destacado, con:

- `TEST301: CONVERSIÓN ACTIVADA`, archivo MC Character y confirmación del nuevo motor; **o**
- `TEST301: CONVERSIÓN NO ACTIVADA`, el archivo de TEST297 que se exporta, el conteo de filas compatibles, bandas candidatas y la primera causa que impide la conversión exacta.

También queda el reporte disponible en consola:

```js
window.RICO_TEST301_LAST_EXPORT
```

Campos importantes: `actualExporter`, `fullScreenEligible`, `rowsCompatible`, `candidateBands`, `reasons`, `diagnostic`, `outOfRangeLocalC3`, `colorConflicts`, `phaseCount`.

### Pruebas automáticas realizadas tras la corrección

- Imagen compatible 25/25: genera `RICO_TEST301_MC_CHAR_REMAP_LOSSLESS.prg` de **30.529 bytes**, sin invocar al exportador anterior.
- C1 diferente en filas/celdas: compatible **0/25**, no genera PRG nuevo y llama exactamente una vez a la ruta previa TEST297.
- C3=12 con uso efectivo del píxel %11: compatible **24/25**, no genera PRG nuevo y llama exactamente una vez a TEST297.
- Sintaxis JS: PASS, y los avisos muestran el motor verdadero.

**La velocidad del usuario todavía no cambió.** No corresponde promover TEST301 al MASTER o anunciar un nuevo PASS. La corrección sirve para recuperar datos del proyecto real y evitar experimentos que no llegan a activarse.

## Próximo trabajo

Si el arte no es compatible a pantalla completa, no tiene sentido seguir optimizando la ruta MC Character exclusiva. Analizar las `candidateBands` y el peso de celdas que conservan colores locales. Evaluar un motor mixto por bandas **solo si las filas compatibles realmente ahorran suficiente trabajo**, porque el VIC-II requiere cambios de modo y pantalla precisos por raster; el desarrollo necesitará instrumentación de IRQ/raster para no introducir desgarros. Mantener TEST297 como PASS de rollback.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test301-mc-char-remap-feasibility/
ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test301-mc-char-remap-feasibility.zip
