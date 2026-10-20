# MASTER LVL RICO — 20 DE OCTUBRE DE 2026

**Estado:** MASTER APROBADO POR USUARIO EN VICE (TEST165 + TEST167).
**Fecha:** 20/10/2026
**Base de partida:** MASTER TEST149 del 19/10/2026; pruebas sucesivas TEST153/155/161/164/165 y FIX TEST167.

## Cambios funcionales consolidados
1. **Group Animate Scroll Up:** grupos rectangulares de hasta 256 codigos; 1..255 ticks configurables. Para grupos grandes la ruta rapida mueve 2 px por IRQ de PAL (100 px/s nominales si cada IRQ se atiende). TEST155 2 columnas x 8 filas conserva su ruta de 1 px/tick.
2. **Preview TEST165:** reloj monotono PAL de 20 ms en Scroll Up grupal; velocidad aproximada a la obtenida en PRG. BANK 1/2, preview estatica de tileset y otras animaciones sin modificaciones.
3. **TEST167 FIX VIC-II idle-state graphics:** Window 25 filas sin Map Scroll selecciona base `$D011=$1B` (YSCROLL=3) en lugar de `$18` (YSCROLL=0). Quita la franja de bloques negros, mostrada por el byte idle `$3FFF=$F0`. Con Map Scroll de hardware mantiene `$18`, y con ventanas de <=24 filas mantiene `$10`. **No tocar $3FFF:** es byte del glifo 255 de BANK 2.
4. **Pruebas VICE:** usuario confirma PASS final con GROUP e INDIVIDUAL y el resultado TEST165 de preview. Las velocidades declaradas son aproximadas, no certificacion instrumental de 50 Hz exactos.
5. **Preservado:** 256 char a 1 tick de TEST149, BANK 1/2, color por celda, Map Scroll / SCUMM TEST138, layout y divisor, proteccion de caracteres vacios.

## Exclusiones
- TEST166 IRQ $FB fue un intento que no elimino el problema comun; **NO incluido en MASTER**.
- El ZIP FINAL no lleva PRG de ejemplo ni SID; solo 2 archivos TXT de documentacion (`log.txt` y `mapaconceptual.txt`), 1 lanzador Windows y el sitio local.
- No se modifica el MASTER 19/10 ni milestones anteriores.
- No se atribuye un PASS general a combinaciones todavia no ensayadas.

## Congelacion y reversibilidad
**ZIP**: `MASTER_LVL_RICO_20_DE_OCTUBRE_2026.zip` (guardado en Biblioteca).
**SHA256**: `7fe4195336b818f46cf91216a0c7f3f1240b4fe989f560dbefb2dc582b69d8fb`.
**Contenido**: 627 archivos, fuente operativa byte-identica a TEST167; solo docs y nombre de lanzador cambian.
**Web principal**: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/

### Fuentes criticas con SHA1 de Git
- `dist/index.html`: `5cb88416615b0292e582464c4f395790dc347821`
- `dist/js/RICO_GROUP_ANIMATE_TEST34.js`: `704333d9c798cad7ba0fb9e7f291f0d946e7f2ac`
- `dist/js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js`: `99176735116a2e267cc9a4667150e8d21ed3957a`
- `dist/js/SCUMM_ECM_LIVE_REPACK_TEST01.js`: `d034ac9ea03446435ace3be8586dd71d5eaeaa71`
- `dist/js/RICO_PALETTE_ANIM_UNMUTE_TEST139.js`: `8314e2ca3ec83ee5df839a1cad078ebfedeea770`

Siguiente desarrollo en TEST168+ sin escribir sobre este checkpoint.
