# TEST256 — Diagnóstico de sincronización raster y cadencia de captura

**Estado: EXPERIMENTAL.** Parte del MASTER VIERNES 23 OCTUBRE 2026 (TEST254), sin cambiar el motor gráfico. TEST255 no se incorpora. El objetivo es calidad visual, no forzar 50 FPS.

## Hallazgo al analizar ambos videos

- TEST254: 584 cambios en 743 fotogramas de video a 60 FPS (~47,16 cambios/s); 427 separaciones de un fotograma, 155 de dos, una de tres.
- TEST255: 1066 cambios en 1357 fotogramas de video a 60 FPS (~47,13 cambios/s); 775 separaciones de un fotograma, 290 de dos y ninguna de tres entre cambios detectados.
- Una segunda medición por correlación espacial detectó ~36 saltos aparentes de dos desplazamientos en TEST254 y ~66 en TEST255. No demuestra un defecto del motor: puede deberse a fotogramas intermedios no capturados.
- Un único salto aparente de tres desplazamientos de TEST255 ocurrió en el ULTIMO fotograma decodificado, frame 1356 a los 22,6 s, justo en el corte del MKV.
- En TEST255, interrupciones=0xB6 (182 módulo 256), commits=0x3C (60 módulo 256); 182 = 3*60+2, compatible con tres IRQ por desplazamiento.
- Una máquina PAL actualiza cerca de 50 Hz, mientras las capturas fueron a 60 FPS. Esta diferencia puede introducir judder. Aún falta medir Speed% real en VICE y comprobar que ninguna franja raster se atrase.

## Cambios exactos

Se añade en tiempo de exportación una instrumentación 6502 de raster sin tocar ninguna copia de los 936 pares de caracteres/color, sus bordes, máscaras, scroll, cámara, fases programadas (86,132,218), ni el profiler CIA1 existente en TEST254.

**Solo para diagnóstico**: las pequeñas lecturas y escrituras de memoria dentro de las ISR añaden algún coste; no comparar directamente los FPS de TEST256 con los de TEST254.

## Monitor VICE

m a050 a061
m a020 a028

| Dirección | Información |
|---|---|
| A050 | Firma 56 (TEST256) |
| A051 | Versión 01 |
| A052 | Raster inicial de primera franja, nominal 86 |
| A053 | Raster final de primera franja |
| A054 | Raster inicial de segunda franja, nominal 132 |
| A055 | Raster final de segunda franja |
| A056 | Raster inicial de tercera franja, nominal 218 |
| A057 | Raster final de tercera franja, normalmente ~49 del cuadro siguiente |
| A058 | Veces que entró primera franja (módulo 256) |
| A059 | Veces que entró segunda franja (módulo 256) |
| A05A | Veces que entró tercera franja (módulo 256) |
| A05B | Máximo raster al finalizar primera franja |
| A05C | Máximo raster al finalizar segunda franja |
| A05D | Máximo raster al finalizar tercera franja |
| A05E | Número de ocasiones en que primera franja terminó en o después de raster 132 |
| A05F | Número de ocasiones en que segunda franja terminó en o después de raster 218 |
| A060 | Número de ocasiones en que tercera franja terminó en o después de raster 86 del cuadro siguiente |
| A061 | Primera IRQ sin movimiento solicitado (normal durante la inicialización) |

Los máximos y contadores de A05B a A061 permiten identificar una excepción aunque la lectura se realice varios segundos más tarde. Los contadores son módulo 256. El raster A057/A05D es solo byte bajo; presupone la ejecución normal de la tercera fase que cruza el raster 255.

## Prueba

- WEB aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test256/
- ZIP del branch: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test256-raster-seam-diagnostics.zip
- TERRY multicolor, Diagonal Up Left, Bank1, 8px / 1tick, sin SID. VICE x64sc PAL, Warp OFF.
- Ejecutar unos 3-5 segundos, parar en monitor y leer las dos órdenes. Confirmar firma 56 01. Repetir desde RESET si se necesita contar eventos exactos sin desborde.
- Si contadores late son cero, hay evidencia de fases correctas y conviene comparar captura nativa 50 FPS o monitor 50 Hz con VICE Speed 100%. Si alguno crece, investigar una costura/IRQ tardía del motor.
- Ningún resultado de TEST256 debe reemplazar el MASTER automáticamente.

## Verificaciones sintéticas

- 32 combinaciones del generador: 4 activan TEST256; 28 pasan intactas a TEST254.
- Código ASM de motor ocupa $2000–$2F02; los contadores nuevos A050–A061 no solapan el CIA A030–A049.
- Cero saltos 6502 fuera de rango y cero solapamientos de memoria verificados estáticamente.
- Aún no se ha ejecutado en VICE: no declarar PASS.
