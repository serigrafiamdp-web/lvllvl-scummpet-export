# MASTER LVL-RICO — 17 OCTUBRE 2026

## Estado

**PASS consolidado.**

Este MASTER toma como única fuente validada el ZIP:

`LVLLVL_TEST120_ISOLATED_CHAR_RENDER.zip`

Paquete consolidado:

`MASTER_LVL-RICO_17_OCTUBRE_2026.zip`

SHA256:

`7b98cb59532394b99410a9d26c5b90259b04ec21666f0c7ec6006479c96f709d`

Contenido del ZIP: **622 archivos** (**646 entradas** contando directorios).

## Checkpoint funcional

El estado incluye las features RICO acumuladas hasta TEST120, entre ellas:

- dual charset BANK 1 / BANK 2;
- selección de Charset Bank por frame;
- Rico's Remix a Tileset;
- Tile Editor BANK-aware;
- Edit Group Chars;
- animaciones por carácter y Group Animate;
- Rico's Screen Dimension;
- Rico's Map Scroll;
- Move In / Move Out / Scroll / Ping Pong;
- Scroll Area y Window;
- runtime/export PRG C64 large-map hasta TEST89;
- animación nativa C64 corregida para VICE;
- UI limpia TEST80;
- fix definitivo de flicker de Animated Chars TEST120.

## Fix TEST120 — Animated Chars sin flicker

Causa aislada: el tick de animación de carácter ejecutaba también rutas de repaint de interfaz y/o invalidación global.

Solución validada:

1. se deja que `TileSet.update()` cambie los datos del glyph;
2. durante ese tick se silencian:
   - `currentTile.canvasDrawCharacters()`;
   - redraw de paleta principal;
   - redraw de side palette;
   - `Graphic.invalidateAllCells()`;
   - `Graphic.redraw()`;
3. se calcula qué IDs de glyph cambiaron comparando `currentTileData` antes/después;
4. se redibujan únicamente las celdas del mapa que utilizan esos IDs.

Resultado confirmado: **animación visible + cero flicker general**.

## Memoria C64 validada para Animated Chars

James usa la rutina nativa `animate_chars` sobre `$3800`.

Por eso el MASTER usa:

- BANK 1: `$3800-$3FFF`
- BANK 2: `$3000-$37FF`

El cambio de banco por frame continúa por `$D018`.

## Regla de validación y publicación

- El **ZIP** es la fuente oficial de PASS/FAIL.
- La web no se reconstruye a mano.
- Para cada test nuevo: primero se genera el ZIP completo; luego GitHub Pages reemplaza **todo el payload** con exactamente esos archivos.
- La web TEST120 fue limpiada de restos anteriores y quedó como espejo exacto del ZIP.
- Commit Pages exacto: `725930f44f3beb84ffee8fe07c771e438ee0546a`.

## Git

- `main/dist/`: payload exacto de TEST120 PASS.
- `src/js/rico/`: mirror de módulos finales necesarios para el estado promovido.
- Branch de checkpoint: `promotion/lvl-rico-master-17-oct-2026`.

## Base upstream

Repositorio original de referencia:

`jaammees/lvllvl`

James sigue siendo la referencia para comportamiento nativo y detección de regresiones.
