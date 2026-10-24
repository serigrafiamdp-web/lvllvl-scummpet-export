# TEST289 — Live Recolor Preview de Bitmap Multicolor

**Fecha:** 24 de octubre de 2026.
**Base:** TEST288 PASS (estampado de 256 tiles con colores de origen), TEST287 Rico's Decolorize, TEST286 Bitmap procedimental.
**Estado:** PASS en validaciones aisladas de JavaScript, render de miniaturas y cursor y estampado; **pendiente PASS visual real de navegador/VICE**.
**Protección:** no modifica MASTER ni ramas anteriores.

## Problema

El usuario cambia BG / C1 / C2 / C3 desde los controles multicolor a la izquierda del Tile Editor o desde la paleta lateral. TEST288 aplicaba esos nuevos valores cuando pintaba sobre el mapa, pero:
- La vista del índice de 256 caracteres continuaba con los colores anteriores.
- El brush seleccionado seguía presentando una combinación distinta, porque el cursor de LVLLVL se dibujaba mediante `CurrentTile.drawCursor()` con parámetros nativos de modo carácter.
- El índice se dibujaba por `TilePaletteDisplay.drawTilePalette()` usando otros colores y un canvas diferente del Tile Editor.
- Tras cambiar de selección, la recolorización elegida podía perderse.

## Corrección

No se añade ningún control ni panel nuevo.

- Se observa `ed.__ricoBitmapBrush` con un `Proxy`. Cualquier cambio en los swatches reales C1 / C2 / C3 dispara una actualización diferida.
- Se escucha `CurrentTile.setColor` (paleta lateral) y los setters nativos C64 Multi1 / Multi2. El índice activo BG/C1/C2/C3 de TEST281 determina la tinta afectada cuando se usa el selector FG nativo.
- El cambio de fondo BG refresca las previews pero respeta su naturaleza **global**: no se copia como metadato por tile ni se recolorea un mapa existente completo por C1/C2/C3.
- **Índice de tiles:** se superpone el coloreado real de cuatro valores de píxel (`00=BG, 01=C1, 10=C2, 11=C3`) solo a los IDs seleccionados sobre el `tileCanvas`, respetando su posición real, zoom y selección múltiple. Las miniaturas fuera de la selección no se modifican.
- **Cursor / Brush:** se recolorea `currentTile.cursorCanvas` con la misma función de conversión, para cada tile de la matriz seleccionada, y se vuelve a dibujar la vista previa nativa de `currentTile.canvasDrawCharacters()`.
- **Tile Editor:** se dispara el refresco de `tileEditorGrid.draw()`, que ya usa las tintas Bitmap MC de TEST280.
- **Persistencia por tile:** cuando cambiás una tinta, se guarda el triplete C1/C2/C3 empacado de 12 bits en `tileSet.tileData[id].props.ricoBmpColors` para cada tile seleccionado, y se mantiene durante futuras selecciones. El índice, el cursor y el próximo estampado usan esa elección de manera consistente.
- **No afecta al arte ya dibujado** cuando cambiás C1/C2/C3: su paleta sigue en `frame.ricoBmpColors`. Al volver a estampar con Pencil, el nuevo color guardado se convierte en paleta local de esas celdas de destino.
- **Rico's Decolorize** sigue separado: mientras está activo prevalece `C1=0, C2=0, C3=1` y no se guardan sus tintas en los metadatos de los tiles normales.
- TEST288 conserva su comportamiento original cuando todavía no recoloreaste un tile.
- El sistema no observa tinta antes de activar SCREEN → Bitmap Multicolor, preservando la inicialización nativa C1/C2/C3 de TEST279.

## Cómo probar

1. Abrí [TEST289 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test289-bitmap-live-recolor-preview/).
2. Activá `SCREEN → Multicolor Bitmap (Experimental)` y seleccioná una matriz de tiles en el índice lateral derecho (puede ser 1×1, 4×4 o el índice completo 16×16).
3. En el Tile Editor (parte inferior izquierda), cambiá C1, C2 o C3.
4. **Inmediatamente** se tienen que recolorear los tiles seleccionados en el índice, el brush superior y su preview; los no seleccionados deben permanecer iguales.
5. Cambiá de selección y volvé a la anterior: debe recuperar los colores asignados.
6. Pintá con el lápiz normal sobre el mapa: debe usar los colores nuevos sin modificar zonas anteriores.
7. Probá `EDIT → Rico's Decolorize`: debe seguir forzando la combinación B/N solo cuando lo activás.
8. Exportá por el menú habitual **Export PRG** y comprobá la paleta en VICE.

## Validación aislada

- Sintaxis JS: PASS.
- Prueba con fuente de 2 tiles de colores distintos: las RGB de la primera y segunda miniatura del índice coincidieron con las mismas RGB del cursor, antes **y después** de recolorear C1/C2/C3: PASS.
- El siguiente estampado guardó exactamente `0xC94` (C1=4, C2=9, C3=12): PASS.
- La paleta original de las celdas previamente dibujadas permaneció intacta: PASS.
- BG modificado volvió a colorear píxeles `00` del cursor y del índice: PASS.
- Activar TEST287 Rico's Decolorize produjo `0x100` en la preview: PASS.
- Prueba con 256 tiles seleccionados: la nueva combinación `0xC94` se escribió en los metadatos de los 256, se mantuvo al cambiar la selección y volvió a aplicarse al estampado. PASS.
- Pintado programático de un tile distinto del seleccionado: NO recibió la recolorización: PASS.

## Limitaciones

- El coloreado por índice es un metadato propio de Bitmap Multicolor: no sustituye las paletas por celda del mapa físico VIC-II ni recolorea retroactivamente las celdas antiguas.
- Si un tile se usa en distintas celdas con paletas locales diferentes, seleccionar ese tile sigue mostrándolo con una sola paleta de índice.
- Falta comprobar visualmente la escala del índice `Custom` al 300 % y algunos layouts de tiles personalizados en navegador.
- Falta confirmar persistencia después de guardar/cerrar/reabrir un documento y Undo/Redo de los 12 bits añadidos al tile. En TEST289 está comprobado que persisten dentro de la sesión al cambiar de selección, no el ciclo completo de guardado.
- No se modifican reproductores ASM, animaciones, scroll, SID o exportación PRG.

## Entregables

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test289-bitmap-live-recolor-preview/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test289-bitmap-live-recolor-preview.zip
- Código: `TEST/test289-bitmap-live-recolor-preview/js/RICO_BITMAP_LIVE_RECOLOR_TEST289.js`
