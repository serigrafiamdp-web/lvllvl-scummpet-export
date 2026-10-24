# TEST282 — Exportación PRG real C64 Multicolor Bitmap (imagen estática)

**Fecha:** 24/10/2026. **Base:** TEST281 PASS. **MASTER sin cambios.**

## Qué hace
Exporta la **frame actual** del mapa experimental Bitmap MC como un PRG C64 autónomo, cargable con `LOAD"FILENAME",8,1` y `RUN` (o arrastrando al emulador VICE).

Se usa un generador propio de bytes 6502. **No reutiliza el player de modo carácter**: este primer paso necesita comprobar una imagen bitmap real, sin animaciones ni scroll.

El botón `Exportar Bitmap MC .PRG` aparece en el panel Tile Editor mientras el modo esté activo. El menú normal de exportación PRG también se redirige a este exportador solo en Bitmap MC.

## Mapa de memoria de hardware

| Uso | Dirección | Bytes |
|---|---:|---:|
| PRG BASIC SYS2064 | $0801 | 15 bytes hasta $0810 |
| Loader 6502 | $0810 | ~150 bytes |
| Datos en archivo Bitmap | $1000 | 8000 |
| Datos en archivo Screen | $2F40 | 1000 |
| Datos en archivo Color RAM | $3328 | 1000 |
| Matriz VIC / C1 C2 | $5C00 | 1000 |
| Bitmap VIC | $6000 | 8000 |
| Color RAM VIC / C3 | $D800 | 1000 |

Configura VIC bank 1 ($4000–$7FFF), `$DD00 & 3 = 2`, `$D018=$78`, `$D011=$3B`, `$D016=$18`, `$D021=BG`.

Formato de cada celda 8×8:
- 00 → $D021 background
- 01 → C1 (nibble alto de Screen RAM)
- 10 → C2 (nibble bajo de Screen RAM)
- 11 → C3 (nibble de Color RAM)

Cada celda aporta 8 bytes en el orden VIC, indexadas por `(y*40+x)*8 + row`.

## Resultados de pruebas internas
- Sintaxis JavaScript: **PASS**.
- Generación sintética 40×25, con dos glifos distintos, 16 colores locales y fondo: **PASS**.
- Emulación de las instrucciones 6502 reales del loader desde $0810 hasta el bucle de presentación: **PASS** (40.736 instrucciones en la prueba).
- Copia verificada byte a byte: bitmap 8000/8000, screen 1000/1000 y Color RAM 1000/1000: **PASS**.
- Registros resultantes: `$D011=$3B`, `$D016=$18`, `$D018=$78`, `$DD00=$02` y fondo según frame: **PASS**.
- Tamaño resultante PRG para el formato actual: **12049 bytes** (carga $0801, código y datos embebidos).

**PENDIENTE:** ejecución visual en VICE y PASS de la imagen real. La simulación de CPU no demuestra sincronización VIC ni resultado de video.

## Cómo probar
1. Abrí [TEST282 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test282-bitmap-mc-static-prg/).
2. Cargá un proyecto y activá `SCREEN → Multicolor Bitmap (Experimental)`.
3. Confirmá que la frame actual pinta correctamente con BG/C1/C2/C3.
4. Pulsá `Exportar Bitmap MC .PRG` desde Tile Editor o desde el menú habitual Export PRG.
5. Cargá el PRG resultante en VICE. Compará imagen y colores con el editor.

## Limitaciones esperadas y deliberadas
- **Únicamente imagen fija de la frame seleccionada**. No exporta frames siguientes, char animation, Group Animate, Map Scroll, ni SID.
- Exporta las **primeras 40 columnas y 25 filas** (esquina superior izquierda). Mapas mayores, por ejemplo 40×50, se recortan; los menores se rellenan con fondo. No aplica todavía el viewport del motor de scroll.
- Congela los patrones actuales del tileset, sin utilizar el motor de animación. Las formas repetidas en varias posiciones sí tienen colores por celda independientes.
- Deshabilita IRQ en el loader estático y queda mostrando la imagen; todavía no tiene salida al BASIC ni restauración del sistema.
- En cualquier otro modo SCREEN se conservan los exportadores previos. No se modificó su código.

## Enlaces
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test282-bitmap-mc-static-prg/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test282-bitmap-mc-static-prg.zip
- Código: `TEST/test282-bitmap-mc-static-prg/js/RICO_BITMAP_MC_STATIC_PRG_TEST282.js`
