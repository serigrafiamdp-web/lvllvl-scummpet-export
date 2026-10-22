# TEST245 — Direct Color RAM raster: eliminar escrituras redundantes

**Base:** `release/test244-direct-color-raster`. **Estado:** PASS de pruebas de fuente/simulación, PENDIENTE prueba en VICE. MASTER y `gh-pages` raíz siguen intactos.

## Motivación
El usuario observa que TEST244 va un poco más fluido y rápido que los experimentos multicolor anteriores. **No está disponible todavía una captura nueva de TEST244**: la última MKV local `2026-10-22 16-59-26.mkv` corresponde a un test previo. Por tanto no atribuir métricas FPS medidas ni declarar PASS de rendimiento.

## Cambio mínimo TEST245
No se cambian las interrupciones en raster **$A0/$FA**, el `diag_shift221`, la técnica de copia directa ni las BANK1/BANK2.

1. El código desenrollado de Color RAM copia solamente las posiciones que sobreviven al relleno de la columna entrante. Cada una de las dos mitades salta las **12 posiciones** de columna que se reemplazan en el mismo cuadro: 468 `LDA/STA` en vez de 480.
2. La columna entrante lee colores originales almacenados por el exportador en `$7000...`, que ya son 0..15. Elimina dos ciclos de `AND #$0F` por cada una de las 25 celdas.
3. El último renglón entrante (40 colores) utiliza `LDA (color_src_lo),Y; STA $DBC0,Y; INY` totalmente desenrollado, eliminando comparaciones/saltos y el `AND` redundante.

## Ahorro estimado de CPU
- 24 escrituras LDA/STA absolutas eliminadas: 24×8 = **192 ciclos**.
- Eliminación de AND en 25 celdas columna: 25×2 = **50 ciclos**.
- Fila final desenrollada: antiguo bucle aproximado 40×19=760 ciclos frente a nuevo 40×10 +39×2=478: **282 ciclos**.
- **Total: ~524 ciclos menos por desplazamiento** en la ruta TEST245; variabilidad de cruces de página y raster no incluida. No equivale a una medición real de FPS.
- Transferencias principales: 468 por mitad, ~3750 ciclos por mitad incluyendo RTS.
- Los bancos generados terminan en **$ABF8** y **$C2F8**, lejos del SID reservado **$B000-$B7FF**.

## Cobertura de pruebas
- 32 combinaciones ASM generadas con cuatro direcciones, Bank1/2, mono/multicolor y arte en bloques/alto detalle: 8 usan TEST245, 24 mantienen el ASM anterior sin cambios. Ningún error de transformación.
- 24 simulaciones de 40×32, 45×32 y 57×32 con colores de seis bloques, pseudoaleatorios, rayas y damero; **36.352 cuadros** completos de 1.000 colores, cero discrepancias.
- Desplazamiento de Color RAM hacia arriba diagonal izquierda y derecha, 468 stores en cada IRQ (936 total), con relleno exacto de columna y fila.
- Chequeo estático de ramas ASM de IRQ/bordes sin saltos cortos fuera de rango. **No compilado en ensamblador real ni ejecutado en VICE por el asistente**.

## Probar
WEB aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test245/

ZIP de rama: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test245-direct-raster-elide-edge-writes.zip

Comparar exactamente el mismo proyecto multicolor TERRY bajo las mismas opciones (Up Left, 8 px/step, ticks 1, BANK1), y grabar el VICE para contraste con TEST244. Comprobar colores, bordes y fluidez. Log de consola: `window.RICO_TEST245_LAST_BUILD`, `selected:true`, `colorWrites:1001`.

**IMPORTANTE**: TEST245 solo aplica a las diagonales Up Left/Up Right multicolor sin RLE; Down Left/Down Right usan fallback de TEST239/236. No mezclar con TEST242/243 FAIL.
