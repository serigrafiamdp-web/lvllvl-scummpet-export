# TEST281 — El pincel del Tile Editor usa la tinta Bitmap MC seleccionada

**Fecha:** 24 de octubre de 2026.
**Base:** TEST280 (contiene TEST279).
**Estado:** PASS sintaxis y prueba funcional aislada contra el código fuente nativo de TileEditorGrid. PENDIENTE PASS visual del usuario en LVLLVL completo.

## Problema resuelto
En TEST280, BG/C1/C2/C3 permitían elegir el número del color, pero **no cambiaban el modo de pixel que dibujaba el lápiz**.
TileEditorGrid seguía conservando el tipo C64 anterior (Frame, Cell, Multi 1, Multi 2), por eso pintar de nuevo siempre escribía los mismos pares de bits. En caracteres cuyo foreground tuviera el bit 3 apagado, la ruta original cambiaba a HiRes y evitaba dibujar 2-bit multicolor.

## Corrección
- Hacer clic en el swatch BG/C1/C2/C3 selecciona la **tinta activa**, además de abrir el picker de número de color.
- La selección activa se destaca con contorno blanco en el Tile Editor.
- Pincel real del editor: BG = par `00`; C1 = `01`; C2 = `10`; C3 = `11`.
- Mantener activo C64 multicolor de dos bits aun cuando el FC nativo importado sea 0..7. No afecta otros modos.
- Conectar el pincel real de mapa cuando existe, sin modificar el exportador.
- Conservar C1/C2/C3 por celda y fondo compartido del experimento 279/280.
- Respetar la lógica nativa de Undo/historial, animación de glifos y selección del Tile Editor.

## Validación aislada
Se tomó `src/js/textMode/tileSet/tileEditorGrid.js` de `main` y se ejecutó su método `toolStart()` con un pixel editor simulado, un carácter FC=3 (bit 3 apagado), y la integración TEST281:
- C1 → `0,1` PASS
- C2 → `1,0` PASS
- C3 → `1,1` PASS
- BG → `0,0` PASS
- El modo para dibujar permanece multicolor con `getCellColor()=11`. PASS

**Importante:** la prueba aislada no equivale a abrir LVLLVL en Chromium. Hay que confirmar la edición visual manualmente.

## Cómo probar
1. Abrí la WEB de TEST281 y activá `SCREEN → Multicolor Bitmap (Experimental)`.
2. En `Tile Editor`, clic en C1. Elegí un color (ej. verde).
3. Pintá directamente un par de píxeles sobre el carácter, luego elegí C2 y otro color.
4. Volvé a pintar **encima de ese mismo par de píxeles**. Debe cambiar a C2, no continuar pintando en C1.
5. Repetí con C3 y BG, y comprobá los 4 colores del carácter.
6. Las celdas ya existentes deben conservar su triple de colores local si sus paletas son diferentes.

El bitmap sigue siendo **experimental**: PRG/ASM bitmap no exportable. No se han modificado TEST280, TEST279, TEST275, MASTER o el reproductor/scroll.

## Enlaces
- [TEST281 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test281-bitmap-mc-ink-brush/)
- [ZIP TEST281](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test281-bitmap-mc-ink-brush.zip)
