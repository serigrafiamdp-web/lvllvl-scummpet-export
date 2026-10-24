# TEST292 — Doble buffer de bitmap C64, 256 tiles y 1.000 apariciones

**Fecha:** 24/10/2026. **Base:** TEST291 experimental, TEST289 PASS del usuario. Todos los PASS anteriores y MASTER intactos.

**Objetivo:** eliminar desgarros y parpadeos debidos a que TEST291 reescribe el bitmap visible mientras el VIC-II está dibujándolo. NO promete aumentar el número de desplazamientos por segundo.

## Video observado
Captura proporcionada por el usuario: `2026-10-24 16-26-00.mkv`, 10,8 s, 1920×1080, 50 fps. El movimiento de las caras coloreadas en el grupo se ve más rápido que antes, pero persiste inestabilidad visual. La hipótesis a comprobar con este test es *tearing* por escrituras al bitmap activo. No está demostrado aún que todo el parpadeo proceda de ahí: podría incluir parpadeo de colores, irregularidad temporal o del emulador/captura.

## Arquitectura
Dos bancos VIC alternos, cada uno con su pantalla local de C1/C2:

| Elemento | Banco visible 1 | Banco alternativo 3 |
|---|---|---|
| VIC bank ($DD00 bits bajos) | 2 → $4000–$7FFF | 0 → $C000–$FFFF |
| Bitmap | $6000–$7F3F | $E000–$FF3F |
| Screen RAM (C1/C2) | $5C00–$5FE7 | $C400–$C7E7 |
| $D018 | $78 | $18 |
| Color RAM C3 | $D800 compartido | $D800 compartido |

- Se configura $01=$35 al iniciar: I/O visible, ROM BASIC y KERNAL desactivadas; permite escribir y leer RAM alta bajo KERNAL ($E000).
- La copia del bitmap alternativo a $E000 y la pantalla alterna a $C400 se realiza **durante la inicialización en ASM**, no se almacena en el PRG cargado por BASIC: ello evita sobreescribir registros I/O durante LOAD a través de $D000–$DFFF.
- El blitter directo de TEST291 (8 píxeles MC visibles = 16 bits = 2 columnas de tile por paso) actualiza exclusivamente el bitmap oculto: cuando VIC muestra $6000 escribe en $E000, y viceversa.
- Cuando TERMINA de copiar TODAS las apariciones del grupo, espera al borde inferior (raster $FA=250) y actualiza los registros $DD00 y $D018 para mostrar la imagen ya acabada.
- Mantiene las 256 entradas del atlas original (2.048 bytes), fase por tile y lista de destinos de TEST291; **no precalcula todos los cuadros del bitmap**.
- Screen RAM de colores locales C1/C2 es estática y duplicada; Color RAM C3 es compartida e inmutable durante el scroll, igual que TEST291. Conserva colores locales, no desplaza la paleta con los píxeles.
- Se exporta exclusivamente desde **Export PRG** normal. Si hay un único grupo horizontal con Pixels/Tick=8 se exporta `RICO_TEST292_MC_DOUBLE_BUFFER_256TILES.prg`; otras situaciones mantienen la ruta TEST291/290.

## Resultado de verificación CPU
Prueba interna con un grupo de **16×16, 256 IDs**, con **1.000 celdas del bitmap físico que usan esos IDs**:

| Estado | Banco visible | Fase | Bitmap y Screen RAM comparados |
|---|---|---|---|
| Inicial | 1: $6000 | 0 | PASS, sin diferencias |
| Primer cambio | 3: $E000 | 1 | PASS, sin diferencias |
| Segundo cambio | 1: $6000 | 2 | PASS, sin diferencias |
| Tercer cambio | 3: $E000 | 3 | PASS, sin diferencias |

Simulación de ~263.000 instrucciones, sin errores de opcode, punteros o bancos, y con $D018 acorde a cada banco. El PRG mide **41.985 bytes**; el ASM 457 bytes. Sin corrupción del bitmap alternativo.

**Velocidad máxima:** TEST291 consumía ~207.159 ciclos / actualización de 1.000 celdas. TEST292 continúa reescribiendo las mismas celdas, por lo que **no equivale a un paso por cuadro PAL**. No es un PASS de velocidad; permite evitar mostrar resultados incompletos mientras el CPU trabaja en ellas. En una escena extensa se verá movimiento menos frecuente, idealmente sin tearing.

## Prueba en VICE

1. Abrí [TEST292 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test292-bitmap-mc-double-buffer/).
2. Cargá **el mismo proyecto del video**, con los mismos 256 tiles y grupo `Scroll Right` o `Left`, `Pixels/Tick=8` y el mismo `Ticks/Frame`.
3. Exportá con **Export PRG** normal y abrí el .PRG en VICE.
4. Compará con TEST291 bajo idénticas condiciones: buscá franjas/mitades de imagen de distintos estados, temblores y flicker; no evalúes solo velocidad.
5. Si desaparecen las franjas pero el desplazamiento es lento, el siguiente objetivo es reducir ciclos por **aparición física**, o aprovechar scroll hardware en áreas/raster splits factibles, no un LUT por tile.
6. Si hay cambios de color o parpadeos persistentes, documentarlos: Color RAM no se puede alternar simplemente al cambiar de banco y puede necesitar manejo por separado.

## Límites

- Esta arquitectura usa dos bancos VIC distintos, no dos bitmaps en el mismo banco (dos bitmaps de 8K más dos pantallas no caben en 16K).
- Se probó el caso de 256 tiles / 1000 apariciones; no se agregó soporte de animaciones verticales, otros grupos simultáneos, Ping Pong, SID ni Map Scroll.
- El resultado del emulador de instrucciones NO sustituye VICE real. **TEST292 PENDIENTE PASS VISUAL.**
- No modifica TEST289, TEST290 ni TEST291.

## Archivos
- [TEST292 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test292-bitmap-mc-double-buffer/)
- [ZIP completo](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test292-bitmap-mc-double-buffer.zip)
- `TEST/test292-bitmap-mc-double-buffer/js/RICO_BITMAP_MC_DOUBLE_BUFFER_TEST292.js`

## Referencias de la técnica
- https://codebase.c64.org/doku.php?id=base:color_ram_double_buffer
- https://codebase64.net/doku.php?id=base:vicii_memory_organizing
- https://1amstudios.com/articles/c64-smooth-scrolling/
