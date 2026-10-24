# TEST257 — SCREEN Multicolor: sincronización del índice del tileset

**Fecha:** 23/10/2026. **Estado:** prueba aislada, pendiente de PASS visual.

Basado en TEST256 de UI compacta + la cadena de exportación TEST247 PASS. No se modificaron ni MASTER, ni SCREEN, ni charset, ni motor ASM.

## Bug reproducido por descripción/captura

Al elegir SCREEN > Multicolor, los caracteres que aparecen en la pantalla principal usan el modo nuevo, pero el índice de tiles de BANK1/BANK2 conserva su representación visual en el modo anterior. Volver a Text también puede dejar el índice con una imagen antigua.

## Causa en el motor LVLLVL de James

La clase `TilePaletteDisplay` conserva un bitmap independiente `tilePaletteImageData`. El método `draw()` normal lo reutiliza y solo repinta selección/scroll. La reconstrucción con el SCREEN mode vigente sucede únicamente con `draw({redrawTiles:true})`, que delega a `drawTilePalette` leyendo `layer.getScreenMode()` y colores C64 del layer. Al llamar SCREEN > Multicolor, `TextModeEditor.setInterfaceScreenMode()` actualiza pantalla y editor pero puede dejar sin reconstruir el bitmap lateral. La ruta RICO TEST19 incluso usa deliberadamente `redrawTiles:false` para conmutar bancos a bajo costo.

Fuentes verificadas: `lospec/lvllvl/src/js/textMode/tileSet/tilePaletteDisplay.js` y `src/js/textMode/textModeEditor.js` (base James).

## Modificación acotada

El módulo `RICO_INDEX_SCREEN_MODE_TEST257.js` intercepta `TextModeEditor.prototype.setInterfaceScreenMode` después del método original. Cuando la interfaz ya tiene el modo nuevo, programa un único redibujado completo de `editor.sideTilePalette.tilePaletteDisplay.draw({redrawTiles:true, screenMode:modo})` sobre `sidecharPaletteCanvas`.

No toca pixels ni tiles, ni `TileSet`, ni `screenMode`, ni eventos de edición, ni los 512 índices virtuales, ni la selección activa, ni las APIs `TEST17/19` de BANK1/BANK2. Solo reconstituye el bitmap del índice. Se conserva el compactor de TEST256.

## Verificaciones disponibles

- JavaScript: sintaxis válida.
- Mock de editor: SCREEN Text -> Multicolor -> Text invoca `draw({redrawTiles:true})` con ambos modos, preservando la selección de 512 y ambos bancos.
- Test de uso real: **pendiente** comprobar visualmente en navegador que el índice cambia inmediatamente, conserva colores C64 y dibuja BANK1/BANK2 correctamente.

## Enlaces

- Web: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test257-screen-mode-index-sync/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test257-screen-mode-index-sync.zip
- TEST256 anterior: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test256-ui-multicolor-compact/
