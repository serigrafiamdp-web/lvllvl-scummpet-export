# TEST336 — Corrige el bloqueo previo del recopilador horizontal

Fecha 2026-11-05. Estado **experimental, sin PASS VICE**.

El usuario probó TEST335 con dos grupos y Map Scroll horizontal. Apareció: «PRG horizontal no exportado: TEST186: selecciona exactamente UN Group Scroll vertical para esta prueba.»

## Causa
`H.collect` de TEST335 invocaba el recopilador anterior antes de activar el planificador multigrupo. La función `makeGroup` en TEST186 rechazaba `mods.length!==1` incluso cuando el planificador TEST335 estaba preparado para procesar los grupos.

## Solución aislada
- Copia del módulo horizontal TEST327 a `RICO_PRG_HORIZ_WIDE_TEST336.js`, usada solamente en esta página.
- `makeGroup` delega al scheduler común cuando hay más de un grupo **y** el indicador temporal `RICO_TEST336_MULTIGROUP_COLLECT` está activo. Devuelve `null` para evitar un falso grupo único; el planificador posterior inspecciona y valida todos los grupos.
- `RICO_MAP_HORIZ_MULTIGROUP_TEST336.js` inspecciona los grupos antes del recopilador, activa el indicador únicamente dentro de `try/finally` y lo limpia siempre.
- Con cero o un grupo el código conserva el comportamiento histórico. No se alteran `gh-pages/index.html` principal, TEST332, TEST334 ni TEST335.
- Los límites por RAM y los conflictos de glifos siguen verificándose; no se impone límite artificial de dos grupos.

## Prueba
Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test336-horizontal-multigroup/ y repetir proyecto con Map Scroll Left (1px/tick), dos grupos distintos Left + Right, un frame, mapa ancho y Window 40×25. Exportar PRG y probar en VICE PAL. Si falla registrar error literal; no declarar PASS hasta VICE.
