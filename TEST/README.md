# Pruebas TEST y módulos activos de LVLLVL RICO

**Actualizado: 19/11/2026 (Argentina)** · [Nuevas features RICO](../README.md) · [Editor habitual](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/) · [Progreso](../docs/PROGRESO_2026-11-16.md) · [Inventario de features](../docs/FEATURES_RICO_2026-11-17.md)

## PASS, regresiones y experimentos recientes

| TEST | Estado |
|---|---|
| 364 | **PASS**: 16 índices de color C64 |
| 365 | Paleta elegida conservada, integrado |
| 366 | **PASS**: selector solo C64 |
| 367 | FAIL; primer acceso SpotySID sustituido |
| 368 | Acceso SpotySID integrado junto a HELP |
| 369 | **PASS**: parpadeo inicial corregido |
| 370 | Diagnóstico real de ASM 404 en ZIP original, ruta reemplazada |
| 371 | Muzza TASS **experimental**, PRG reconstruido todavía sin funcionamiento validado |
| 372 | **PASS del usuario**: exportación EBCM restaurada con LILCHEB |
| 373 | Se renombra menú **Interface → 64tass Export**; integrado, pendiente de PASS visual independiente |
| 380 | **Remix Tileset**: selección de casillero CUSTOM a la derecha y copia de cualquier glyph SOURCE a ese destino; cursor avanza dentro del mismo BANK. **8 checks JS PASS**, falta PASS visual en navegador. [Detalles](test380-remix-target-cursor/README.md) |

## Carpetas TEST que intervienen en producción

Los nombres TEST no significan que puedan borrarse. **Siempre consultar `gh-pages/index.html`** para determinar cuáles se cargan.

- `test242-ondas-pingpong/` y `test243..247-*/`: motores y optimizaciones Group Animate.
- `test326-horizontal-map-limits/`, `test327-horizontal-animated-map/`, `test328-ecm-preserve-4-backgrounds/`: horizontal y EBCM.
- `test350-ecm-safe-router/`, `test351-ecm-frames-sid/`, `test352-standard-frames-sid/`: modos y audio.
- `test354-calaca-diagonal-frames/`, `test355-export-combinations/`, `test363-diagonal-multiframe-unlocked/`: frames, Group y diagonales (VICE de las rutas nuevas pendiente).
- `test358-native-right-dock/`, `test359-full-height-right-sidebar/`, `test369-startup-workspace-flicker/`: Dock y layout.
- `test364-c64-palette-reader/`, `test365-c64-palette-selection/`, `test366-c64-only-palettes/`: paletas C64.
- `test368-spotysid-link-fix/`, `test371-muzza-live-asm/`, `test372-restore-ebcm-export/`: menú SpotySID, ZIP experimental y reparación EBCM.

El [manifiesto del 14/11](../docs/MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md) es una foto histórica; el `index.html` es la fuente de verdad para TEST364–372.

## Respaldo y normas de prueba

- [Checkpoint 16/11 — TEST372 PASS](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test372-pass-2026-11-16).
- [Checkpoint anterior — TEST369 PASS](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test369-pass-2026-11-16).
- [Archivo de 39 carpetas antiguas (14/11)](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass); [informe](../docs/LIMPIEZA_TESTS_Y_ARCHIVO_2026-11-14.md).

**Regla:** correcciones aisladas, sin romper exportaciones existentes ni sustituir una función por una versión incompleta. Diferenciar test JavaScript, ASM, PRG generado, PRG funcionando y PASS en VICE. Los proyectos privados de usuarios no se publican.
