# TEST353 — Actualización en vivo de la Preview del índice

**Estado: experimental; pendiente de prueba de usuario.** TEST339 tuvo PASS, pero el usuario volvió a detectar miniaturas desactualizadas después de editar Tileset al probar TEST352.

## Diagnóstico
- TEST339 sí está incluido en TEST352; no se trataba simplemente de haber olvidado incluir el archivo.
- TEST339 escucha `TileEditorGrid.prototype.updateCharacter`. Sin embargo, LVLLVL también actualiza caracteres mediante `TileSet.prototype.setPixel`, `TileSet.prototype.setTileData` y `TileSet.prototype.updateCharacter`; la edición puede dejar fuera el refresco TEST339.
- TEST33 almacena una copia independiente de los píxeles de cada banco en `tileSet.__ricoPalettePreview33`.
- `TilePaletteDisplay` guarda un atlas en `tilePaletteImageData`; `draw()` normal puede reutilizar imagen anterior. Para invalidar el atlas se necesita `display.draw({redrawTiles:true})`.

## Modificación
- Archivo independiente cargado **después de** TEST339 y de TEST352.
- Escucha los cuatro métodos de edición y agrupa cambios en una sola reconstrucción por frame UI.
- Sincroniza los píxeles modificados del BANK 1 o BANK 2 al caché de TEST33, reinicia únicamente sus fases afectadas y reconstruye la Preview lateral.
- No altera `tileData` original, frames, mapa, color, SID, PRG, scroll ni rutinas de exportación; no fuerza `graphic.redraw()`.
- Diagnósticos `window.RICO_TEST353_LAST_REFRESH` y `window.RICO_TEST353_SIDE_INDEX.status`.
- Mantiene TEST339, TEST349 PASS y TEST352 PASS intactos. No promueve al editor principal.

## Pruebas sintéticas
1. Sintaxis JavaScript PASS.
2. BANK1 `setPixel`: refleja nuevo píxel y borra fase antigua.
3. BANK2 `setPixel`: refleja cambio en BANK2 sin tocar BANK1.
4. `setTileData` con copia de 64 píxeles: refresca índice sin evento del grid.
5. Edición directa seguida de `TileEditorGrid.updateCharacter`: refresca índice.
6. Ediciones rápidas consecutivas: un solo repintado.

**No se ha validado todavía el dibujo real en el navegador del usuario ni un PRG VICE.**

Prueba: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test353-index-live-refresh/

Importar el proyecto habitual, modificar un carácter desde Tile Editor y comprobar que la miniatura lateral del índice cambia inmediatamente. Repetir con BANK 2 y comprobar que exportar frames + SID sigue funcionando.
