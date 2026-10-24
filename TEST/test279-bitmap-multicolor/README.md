# TEST279 — Nuevo modo SCREEN: Multicolor Bitmap (experimental)

**Fecha:** 24 de octubre de 2026.
**Base:** `TEST275` (modo Screen/Custom), `TEST274` (índice), `TEST273` (Custom automático), `TEST271` (Oil's Well y frames) y `TEST269` (Warp PASS).
**Estado:** PASS de prueba interna de menú, raster y color independiente; **pendiente PASS visual en el navegador**.
**MASTER `MASTER_LVLLVL_RICO_24_OCTUBRE_2026`: intacto.**

## Qué implementa ahora

Nuevo elemento bajo **SCREEN → Mode → Multicolor Bitmap (Experimental)** y opción equivalente en **SCREEN → Screen Mode**. También aparece un botón **Activar Bitmap MC** en la parte superior del panel lateral Tiles.

Se integra un render de **160×200 píxeles multicolor lógicos** (representados en 320×200 posiciones de pantalla con píxeles duplicados horizontalmente), manteniendo el mismo charset 8×8 y los mismos índices y frames actuales como herramientas de edición.

Cada celda 8×8 tiene una **paleta independiente de tres colores**: `C1`, `C2` y `C3`. El cuarto color es **Background**, compartido dentro de la frame. Códigos del bitmap de cada pareja de píxeles:

| Bits | Color |
|---|---|
| `00` | Fondo compartido |
| `01` | C1 de la celda |
| `10` | C2 de la celda |
| `11` | C3 de la celda |

El editor conserva el mapa de caracteres original y usa esos patrones 8×8 para **generar visualmente** la imagen bitmap en cada redraw. Las animaciones de chars, frame/timeline y scroll que ya llaman a la función de dibujo del editor pueden seguir actualizando sus patrones o posiciones; falta probar cada una a velocidad real en el navegador y posteriormente en un runtime C64 bitmap.

## Cómo se guardan los colores

Cada frame tiene su propia tabla `frame.ricoBmpColors`, con un entero por celda que empaqueta tres nibbles: `C1 | C2 << 4 | C3 << 8`.

- Al activar Bitmap MC, se toma como configuración inicial **C1/C2** de los registros MC1/MC2 anteriores y **C3** del foreground de cada celda anterior.
- Al pintar un carácter sobre una celda, el índice de carácter se mantiene y su paleta local se sustituye por los tres colores elegidos en la barra **C1, C2, C3**.
- **Aplicar celda** permite cambiar únicamente los colores de la celda bajo el cursor sin repintar el carácter.
- Cambiar los tres controles de color **no recolorea el mapa por sí solo**: prepara los colores del pincel.
- Cambiar el **Background** del mapa sigue siendo global dentro de cada frame.

El prototipo guarda la tabla nueva dentro del registro del documento de LVVL. La API nativa de guardado de proyectos no se modificó.

## Limitaciones IMPORTANTES de este primer test

1. **Aún NO exporta PRG/ASM como Bitmap Multicolor C64.** Los elementos de menú `Export PRG` y `C64 Assembly` avisan y bloquean la salida mientras esté seleccionado este modo, para evitar generar un archivo engañoso. Los demás modos conservan sus exportadores.
2. Internamente continúa usando la herramienta de edición `c64multicolor` para preservar las rutinas existentes de selección, índice, grupos, mapas y animaciones. El render bitmap experimental solo sustituye **la representación visual** del mapa, con colores independientes por celda. No hay todavía asignación de memoria VIC bitmap ($2000), screen/color RAM bitmap, ni rutinas ASM optimizadas.
3. El prototipo renderiza la grilla completa en cada redraw bitmap: servirá para medir el impacto de animaciones rápidas. Por ahora no se declara velocidad 1 tick PASS.
4. El índice de caracteres lateral sigue siendo un **índice de formas**: si el mismo glifo se usa en dos celdas con colores diferentes, la miniatura única no puede representar ambas combinaciones a la vez. El área de trabajo muestra las tres tintas de cada celda.
5. **No se creó un bitmap destructivo**: se conservan los datos del tileset y las 8×8 bits originales, de manera que al abandonar el modo, las herramientas siguen funcionando. Las paletas de tres colores quedan almacenadas para volver al modo experimental.
6. No está validado el comportamiento en capas superpuestas, zoom extremo, selección/paste, animation preview especial ni exportación a GIF/PNG; hay que probar. Este motor experimental debe utilizarse primero con una capa y un mapa sencillos.

## Prueba recomendada

1. Abrir [TEST279 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test279-bitmap-multicolor/), iniciar un proyecto en blanco o cargar el mapa `ricos oil.prg` importado.
2. Seleccionar **SCREEN → Mode → Multicolor Bitmap (Experimental)**. Debe aparecer como seleccionado. Como alternativa, pulsar el botón **Activar Bitmap MC** que aparece sobre el índice Tiles.
3. En la barra del índice seleccionar `C1=2, C2=5, C3=7` y pintar una celda que contenga un carácter con varios pares de píxeles.
4. Elegir `C1=9, C2=3, C3=15` y pintar la misma forma en la celda de al lado. **Las dos celdas deberían tener combinaciones de colores distintas sin cambiarse mutuamente.**
5. Cambiar el Background del mapa: solo debería cambiar el color representado por los píxeles `00` de todas las celdas; C1/C2/C3 se conservan.
6. Cambiar Frame 1 → Frame 2 y comprobar que cada una recuerda sus triples de colores, y que el editor permite repintar sin recolorear el resto.
7. Probar una animación simple de carácter y observar si el render bitmap la sigue. No utilizar todavía Export PRG como prueba de éxito.

## Validaciones automáticas

- Menú SCREEN: el nuevo elemento `mode-ricobitmapmulticolor` se inserta después de `mode-c64multicolor`; los menús anteriores continúan.
- El manejador nativo de menú enlaza ese elemento con `TextModeEditor.setScreenMode`, y la opción del diálogo `screenModeDialogMode` también existe.
- Con una grilla sintética 2×1 de dos celdas usando el mismo patrón 8×8, la primera conserva los colores del origen y la segunda recibe C1=3, C2=4, C3=5 **sin alterar la primera**.
- Los valores RGB del bitmap se calculan con el mismo patrón 00/01/10/11 y el fondo de capa compartido; al abandonar el modo se conserva `frame.ricoBmpColors`.
- La prueba automática no sustituye a la validación con el LVVL completo y un navegador real.

## Enlaces y recuperación

- **WEB TEST279:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test279-bitmap-multicolor/
- **ZIP TEST279:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test279-bitmap-multicolor.zip
- **Código:** `TEST/test279-bitmap-multicolor/js/RICO_BITMAP_MULTICOLOR_TEST279.js`
- **TEST275 intacto:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test275-index-follows-screen-mode/
- **MASTER intacto:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026

## Próximas fases posibles

(1) comprobar la selección/pintura/frame-by-frame en el navegador real; (2) hacer que el índice y herramientas de dibujo expliquen claramente la paleta de la celda seleccionada; (3) medir animaciones de glifos, mapa y grupos; (4) implementar un **exportador real Multicolor Bitmap** con 8 KB bitmap + 1 KB Screen RAM + 1 KB Color RAM y fondo, respetando la memoria del runtime C64 y la optimización de scroll.
