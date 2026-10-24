# TEST274 — Vista previa del índice C64 exclusivamente Multicolor

**Base:** TEST273 (Custom automático, TEST271 frames, TEST269 Warp PASS). **Estado:** prueba interna de render PASS; todavía sin validación visual del usuario.

## Cambio solicitado

El índice lateral mostraba miniaturas mixtas HiRes y Multicolor. El usuario confirmó que el mapa, los caracteres reales y la selección del índice funcionan; pidió que **la vista previa del índice use solo Multicolor**.

En capas con modo `c64multicolor`, TEST274 cambia **únicamente** el módulo visual de TEST272 por `RICO_SIDE_INDEX_MULTICOLOR_ONLY_TEST274.js`.

- Al dibujar cada miniatura del índice, usa siempre `screenMode='c64multicolor'` y `color=8+(FC&7)`, evitando que la regla hardware `FC<8` la convierta en HiRes. Para códigos presentes en varias celdas del mapa, utiliza el color de previsualización más frecuente; los no utilizados emplean un valor multicolor neutro `9`.
- Soporta los 256 caracteres de **Bank 1** y las 256 casillas virtuales de **Bank 2**. No cambia la relación índice → carácter ni los datos de Bank 2.
- Mantiene el `Custom` automático de TEST273 y el refresco completo de la caché tras cada Import de TEST272.
- No toca ningún byte del charset, PRG, mapa, Color RAM, sprites, emulación, exportador ni código de edición. Las capas que **no** estén en `c64multicolor` siguen el dibujado normal.

Esto es una **uniformización visual deliberada**, no una afirmación de que todos los caracteres del C64 deban usar modo Multicolor en todas las circunstancias.

## Prueba visual solicitada

1. Abrir WEB TEST274 y cargar `ricos oil.prg` en **Import → C64 Formats**.
2. Usar Warp a nivel 1 y pulsar Import. El índice debe elegir **Custom**.
3. Comparar el índice de la derecha: todos los caracteres deben visualizarse en **un mismo modo Multicolor**, sin miniaturas HiRes mezcladas.
4. Warp a nivel 2, Import otra vez, constatar Frame 2 y que la vista mantenga el modo uniforme. Probar elegir algunos índices y pintar: no debe alterarse la geometría, los datos ni las selecciones.

## Verificaciones realizadas

- Simulación de TilePaletteDisplay/TileSet con códigos usados FC=3,13,7 y no usados, más índices virtuales 256 y 511: **6/6 miniaturas son Multicolor**; las capas Textmode no son interceptadas.
- Preservación de datos del tileset: sin escrituras.
- El archivo anterior `TEST272` no se modifica, sino que se sustituye **solo en la página aislada TEST274**. TEST273 y MASTER 24/10 permanecen intactos.
- Prueba WEB real: **pendiente del usuario**, no marcar PASS aún.

## Enlaces

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test274-index-multicolor-only/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test274-index-multicolor-only.zip
- Código TEST274: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test274-index-multicolor-only/TEST/test274-index-multicolor-only
- MASTER: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026
