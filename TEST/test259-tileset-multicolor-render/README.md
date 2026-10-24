# TEST259 — El índice BANK1/BANK2 debe interpretar los bitmaps como C64 Multicolor

**Estado: listo para prueba web, pendiente PASS visual.**

## Error
SCREEN > Multicolor cambia correctamente la imagen del área de trabajo, pero el índice de 512 caracteres del tileset sigue mostrando la representación Hi-Res anterior. TEST257 forzaba el redibujado y TEST258 quitó el bloqueo ECM, pero no corregían el **modo efectivo que aplica el pintor de cada glifo**.

## Causa raíz verificada en código original James LVLLVL

`TilePaletteDisplay.drawTilePalette()` pasa `screenMode: 'c64multicolor'` a `TileSet.drawCharacter()`, pero este último revierte a `TEXTMODE` si el color de la celda es menor de 8 (bit 3 apagado). En el índice la mayoría de los caracteres usaban el color actual (< 8), mientras la imagen del área usa los colores guardados en las celdas. Esto produce formas monocromáticas/diferentes aunque `draw({redrawTiles:true})` se ejecute.

Código fuente: `lospec/lvllvl/src/js/textMode/tileSet/tileSet.js`, rama main, alrededor líneas 3483–3497. La condición corresponde al bit 3 de color RAM C64: un valor 8..15 habilita la interpretación de pares de píxeles Multicolor para caracteres.

## Corrección implementada sin convertir/destruir el tileset

- Intercepta únicamente el trazado del `sidecharPaletteCanvas` cuando la capa activa está en `c64multicolor`.
- Al dibujar el índice 512, pasa `screenMode:'c64multicolor'` y `color:8+(fc&7)` por cada código, dando prioridad al color guardado en la pantalla (si existe), o al color actual del pincel como respaldo.
- Pasa a cada glifo los tres registros lógicos que usa la capa: `backgroundColor`, `c64Multi1Color`, `c64Multi2Color`.
- No modifica `tileData`, `currentTileData`, `currentTile.color`, códigos de pantalla, BANK1/2 ni la selección actual.
- TEST257 reconstruye el bitmap completo del índice después de SCREEN > Multicolor/Text. TEST258 permite cambiar modos sin bloqueo ECM. TEST256 UI compacta permanece.
- Al volver a Text, la ruta del índice utiliza el dibujante original, sin color Multicolor forzado.
- Respeta orden de envolturas de TEST17 (índices virtuales 256–511) y TEST19 (BANK1/BANK2).

## Pruebas

- Sintaxis JS: válida.
- Ensayo de dibujante simulado con código 3 de BANK1, 259 de BANK2, registros C64 y color original 12: se envía `screenMode:c64multicolor`, `color:12` y los registros en ambos bancos; en Text vuelve sin transformaciones. Sin mutación de tileset.
- No se han realizado pruebas en navegador ni de VICE; **no declarar PASS** hasta revisión visual.

## Instrucciones

1. Abrir la web TEST259 con el archivo/arte del ejemplo.
2. SCREEN > Multicolor. La pantalla y el índice deben verse con el mismo patrón de píxeles dobles, y colores del modo C64.
3. SCREEN > Text. Verificar que ambos vuelvan a Hi-Res.
4. Confirmar que BANK1/BANK2 y el selector de 16 colores siguen utilizables.

## Enlaces
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test259-tileset-multicolor-render/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test259-tileset-multicolor-render.zip
- Código: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test259-tileset-multicolor-render/TEST/test259-tileset-multicolor-render
