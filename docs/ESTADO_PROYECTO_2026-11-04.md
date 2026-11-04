# Estado LVLLVL RICO — 4 de noviembre de 2026

**Nuevo checkpoint: TEST328, PASS confirmado por el usuario** para el PRG Extended Background Color (ECM) con Map Scroll horizontal en un proyecto de 100 columnas.

- **[Abrir TEST328](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test328-ecm-preserve-4-backgrounds/)**
- **[Registro de PASS](../TEST/test328-ecm-preserve-4-backgrounds/PASS_04_NOV_2026.md)** · **[Funciones corregidas](FEATURES_EXPORT_PRG_ECM_TEST326_328.md)**.
- **Checkpoint:** `release/test328-ecm-horizontal-pass-2026-11-04`.
- **Editor principal:** TEST297; sigue en `https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/` y **no se modificó**.
- MASTER anteriores: `MASTER_LVLLVL_RICO_23_OCTUBRE_2026` y `MASTER_LVLLVL_RICO_24_OCTUBRE_2026`, preservados.
- GitHub Pages: `gh-pages`, no `main` (historias divergentes).

## Qué confirmó el usuario

El 04/11/2026 respondió **pass** tras la publicación de TEST328 para corregir la pérdida de los fondos de Extended Background Color. Caso MEGASOFT:

| Propiedad | Configuración |
| --- | --- |
| Archivo | `MEGASOFT 100 filas.json` (nombre histórico; realmente **100 columnas × 25 filas**) |
| Screen / Scroll Area | **100×25** |
| Rico's Window | **40×25** |
| Frames | **1** |
| Map Scroll | **Left**, **1 píxel cada 2 ticks** |
| Glifos usados | **22** |
| Fondos efectivos | **0, 8 y 14** |
| Animación individual | **8 caracteres** con Scroll Left configurado, 8 frames / 16 ticks |
| Group Scroll | **No existe en el JSON usado** |
| Estado | **PASS comunicado por el usuario**, sin archivo PRG adjunto ni matriz desglosada |

## Correcciones realizadas

1. **TEST326:** techo artificial de 96 columnas eliminado; se comprueba RAM. 245 columnas monoframe y 102 compacto multiframe son **máximos teóricos**, no PASS de hardware.
2. **TEST327:** integración del planificador Map + Individual + Group en generación de ASM, sin suprimir los efectos.
3. **TEST328:** conexión correcta con el botón real **Export PRG**; previamente la ruta horizontal recopilaba animaciones con una rutina anterior.
4. **TEST328 ECM:** en lugar de `$D011=$1B` (Text Mode), configura `$D011=$5B` (ECM) y cuatro fondos `$D021–$D024`, conservando en el código de pantalla el selector de fondo de 2 bits.
5. **TEST328 repack:** cuenta caracteres utilizados, reubica hasta 64 glifos físicos, remapea el mapa y las animaciones **solo durante la exportación**. El editor y el JSON permanecen intactos. Si necesita más de 64 glifos o más de cuatro fondos, informa error y no exporta incompleto.

## No dar por aprobado sin otra prueba

Group Scroll **real y simultáneo con individuales**, un mismo glyph compartido por ambos motores, dos BANK con animación, modo Right, cuatro fondos distintos en VICE, multiframe, diagonal, SID sobre ECM, ventanas distintas de 40×25 y tamaños horizontales superiores a 100. Las pruebas sintéticas de construcción de ASM no sustituyen el PASS del usuario.

## Actualización posterior: TEST329, integración para PARED.json (pendiente PASS)

La portada raíz se actualizó para incorporar el exportador horizontal y ECM de TEST328, conservando las rutinas Bitmap de TEST297. **La integración TEST329 no tiene PASS independiente todavía.** Su código JavaScript no fue modificado, solo las referencias de carga en `index.html` y el orden se verificó idéntico a TEST328.

`PARED.json`: 100×25, Window 40×25, Scroll Area 100×25, Left 1 px/tick, **4 caracteres usados (170, 171, 186, 187)**; todas sus celdas usan `bc=8` y los dos colores 1/2 son **foregrounds**. El editor principal antiguo contenía topes 96 columnas y un bloqueo por ocho caracteres configurados con animación que PARED no utiliza.

**Respaldo para rollback:** `backup/gh-pages-root-test297-before-test329-pared-2026-11-04`. El TEST328 aislado y su rama PASS siguen disponibles. El ECM diagonal Up aún requiere una implementación separada. [Análisis y plan de prueba](TEST329_PARED_LEFT_EXPORT.md).

## Recuperación

- [TEST328 PASS](../TEST/test328-ecm-preserve-4-backgrounds/)
- [Documento técnico detallado](FEATURES_EXPORT_PRG_ECM_TEST326_328.md)
- [Estado anterior histórico (2/11)](ESTADO_PROYECTO_2026-11-02.md)
- [Guía de continuidad](GUIA_PARA_NUEVO_CHAT_IA.md)

**Regla:** no modificar TEST297/MASTER o fusionar `main` y `gh-pages` sin nuevas pruebas. La confirmación PASS se atribuye al caso real informado, no a las combinaciones pendientes.
