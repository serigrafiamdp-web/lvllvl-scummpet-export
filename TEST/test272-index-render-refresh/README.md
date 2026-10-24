# TEST272 — Índice de caracteres C64: HiRes/Multicolor y actualización de caché

**Fecha:** 24 de octubre de 2026. **Base:** TEST271 (charset estático Oil's Well + importación secuencial) / TEST269 (Warp PASS). No modifica ninguno de los test previos ni MASTER del 24/10.

## Problema informado

En la captura de TEST271 el mapa del nivel aparece correctamente a la izquierda, pero **el índice de caracteres del panel derecho muestra representaciones distintas de los caracteres que aparecen en el mapa**.

## Diagnóstico del código

Se localizaron dos causas en el render del índice lateral, independientes del PRG:

1. En `TEST259`, la función `usedColors` transforma **todos** los foreground colors `FC` en valores `8+(FC&7)`. Esto activa el modo de dibujo **multicolor** incluso en glyphs/tiles C64 que, por tener `FC<8`, deben dibujarse en **HiRes**. En el bitmap del mapa, LVLLVL respeta correctamente el bit 3 del color. El índice y el mapa podían verse diferentes con el mismo patrón 8×8.
2. Después de cada `Import`, la captura escribe el charset en `tileSet.readBinaryData` pero no obliga al índice `sidecharPaletteCanvas` a regenerar el **caché de imagen de caracteres**. El motor original normalmente reutiliza `tilePaletteImageData` en `draw()`; `TEST257` ya había corregido un síntoma parecido al cambiar el modo de pantalla. Aquí la invalidez se produce al **actualizar el charset** o cambiar a una frame con colores distintos.

## Solución implementada

- Sustituir **solamente dentro de la página TEST272** la rutina de vista previa de TEST259 por `RICO_SIDE_INDEX_HIRES_MULTICOLOR_TEST272.js` (misma interfaz original de `TilePaletteDisplay`, 512 celdas Bank1+Bank2 intactas).
- Muestrear para cada índice de carácter los colores usados en el **frame actual**. Cuando el código aparece mayoritariamente con `FC<8`, dibujar su glifo en HiRes; con `FC>=8`, en Multicolor. Si está presente en ambas modalidades se muestra la más frecuente; no se puede visualizar simultáneamente ambas interpretaciones en una única casilla del índice.
- Para caracteres no usados en el frame, mostrar los bits en HiRes neutro, sin inventar el color `FC bit3`.
- Añadir módulo `RICO_C64_INDEX_REFRESH_TEST272.js` al final del HTML, para hacer `sideTilePalette.tilePaletteDisplay.draw({redrawTiles:true,screenMode:'c64multicolor'})` cuando la captura se importa **exitosamente** y al navegar por frames previamente capturadas.
- No modificar ningún byte del charset, ni el modo gráfico del mapa, ni sus colores, mapas o el código PRG. La rutina de importación de TEST271 permanece intacta.

## Contexto de Oil's Well

- Los ocho mapas originales del PRG utilizan **73 índices de caracteres diferentes** (rango 0–81), todos de un mismo charset de 128 patrones (1024 bytes desde $9A00). No hacen falta ocho tilesets ni reindexar los 73 caracteres para importarlos en Bank1.
- Las tablas de Color RAM estática de los ocho mapas tienen **9 celdas con FC menor que 8 por nivel** (por lo demás predominan los valores con bit 3 activo). TEST259 mostraba en multicolor también estas celdas HiRes, alterando sus glifos en el índice.
- El índice lateral de LVLVL contiene Bank1 y Bank2, pero la captura C64 de estos ocho niveles se escribe **solamente en Bank1**. No se sobrescriben los datos existentes de Bank2. Esto puede explicar que la parte inferior del índice no replique el atlas capturado.

## Prueba interna

Mock de `TilePaletteDisplay.drawTilePalette` + `TileSet.drawCharacter` con carácter 11 (`FC=5`), carácter 22 (`FC=11`) e índice no utilizado: resultado **5 (HiRes), 11 (MC), 1 (HiRes neutro)**. Mock de Import y Frames: `draw({redrawTiles:true})` ejecutado tras import y al navegar de frame. **PASS de simulación, pendiente PASS de la web real.**

## Prueba visual

1. Abrir [TEST272 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test272-index-render-refresh/), proyecto nuevo/vacío.
2. **Import → C64 Formats → ricos oil.prg**, llegar al nivel 1.
3. Pulsar **Import** (o Capture) y comprobar la paleta de caracteres de la derecha.
4. Warp nivel 2 → Import. Cerrar la ventana y navegar entre las frames 1 y 2: el índice debe actualizarse cuando cambia la selección, y el mapa debe seguir intacto.
5. Si aún hay diferencias, capturar la pantalla y señalar **un carácter/índice concreto**, para contrastar bits HiRes / MC y caché; no asumir que toda diferencia visual implica un nuevo tileset.

## Entregables

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test272-index-render-refresh/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test272-index-render-refresh.zip
- Release: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test272-index-render-refresh
- TEST271 sin modificaciones: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test271-oils-stable-charset/
- MASTER sin cambios: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026
