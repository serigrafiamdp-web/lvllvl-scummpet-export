# TEST247 — Diagonal direct-color + código desenrollado de caracteres

**Base:** TEST244 `release/test244-direct-color-raster`, nuestro mejor candidato multicolor (TEST245 sin mejora medible, TEST242/243 FAIL). **Experimental; pendiente de VICE.** MASTER y root de gh-pages intactos.

## Hallazgo del monitor TEST246

La prueba de VICE arrojó:
`A020..A02B = 2a 00 31 80 3d 9e 9f 9e 9f 9f 46 01`.
Inicia preparación a raster 42 y termina en 305, más tarde que el IRQ de Color RAM superior $A0 (160). Los contadores módulo 256 muestran 158 IRQ a tiempo, 159 sin lista, 158 commits; la pantalla queda alrededor de 25 movimientos/s.

## Modificación TEST247

Cambiar **solamente** `diag_shift221` (copia de la pantalla secundaria) cuando TEST244 ha seleccionado su técnica directa de Color RAM y el movimiento es **Diagonal Up Left / Up Right**.

- Antes: 1000 caracteres por frame mediante tres páginas LDA/STA absolute,X + bucles de 256, y cola de 232 bytes. La fila inferior y columna entrante se vuelven a pintar.
- Ahora: dos rutas ASM de **936 copias LDA absoluto / STA absoluto**, 8 ciclos cada una, sin bucle por carácter. Omitimos la fila entrante completa (40 bytes) y la columna entrante (24 bytes). Las rutinas existentes `diag_edge_column221` siguen recalculando la columna y fila desde el mapa verdadero. Ninguna restricción de colores, índices o geometría.
- Estimación de copia nueva: ~7.506 ciclos; ahorro **aproximadamente 4.400 ciclos por paso respecto del copiado base**, sin contar bordes e interrupciones. No significa todavía mayor FPS; el raster medio sigue en $A0 (160).

La copia superior Color RAM a $A100-$AC40 y la inferior a $B800-$C340 permanecen idénticas a TEST244. No se tocan IRQ, $D018, música normal, BANK1/2 o demás direcciones.

## Seguridad del cargador y memoria

No debemos incluir código estático en $E000 dentro de un PRG lineal porque obligaría al cargador a atravesar los registros de hardware $D000-$DFFF. Por ese motivo:

- Rutina de copia `$0800 → $0400` está preensamblada a **$1000-$1EA2** y **$C341-$CA91**, dentro del archivo PRG.
- Rutina `$0400 → $0800` se **genera una sola vez al inicio** por una subrutina compacta en el core $2000, después de `LDA #$35 / STA $01`. Crea código RAM en $E000-$F5F0, con KERNAL desactivado. No se escriben registros I/O durante la carga.
- Tamaño más alto del PRG lineal: **$CA91**, nunca dentro de los registros VIC-II/SID/CIA.
- La RAM $1000-$17FF antes usada para buffers TEST203 queda libre exclusivamente cuando se selecciona el motor TEST244 con Color RAM directo; no ejecuta el scanner TEST203.
- `$B000-$B7FF` sigue intocada y se conserva el fallback idéntico cuando TEST244 no selecciona.
- **SID nativo habilitado:** TEST247 se desactiva automáticamente y mantiene TEST244 para evitar colisiones con reservas de memoria de PSID. No afirmar todavía compatibilidad musical del nuevo banco de código.

## Checks

- 32 configuraciones de exportación ASM: 8 seleccionan ruta nueva (2 diagonales arriba × 2 banks × 2 artes multicolor) y 24 preservan byte por byte TEST244.
- 24 simulaciones de movimiento con 40,45,57,76 columnas y 25,32,41 filas, ambas direcciones hacia arriba: **5.520 cuadros completos** sin diferencias de caracteres.
- Control sintáctico y estático de instrucción 6502: **0 saltos relativos fuera de rango, 0 colisiones de segmentos**.
- Segmentos ASM de copia de 0800->0400: $1000-$1EA2, $C341-$CA91. Color RAM $A100-$AC40 y $B800-$C340. Código de inicio core $2000-$2618. PRG termina $CA91.
- Rutina generada en E000: 936 ×6 bytes LDA/STA + 1 RTS = 5617 bytes, $E000..$F5F0. **La ejecución del constructor de código al arrancar necesita prueba en VICE, no se ejecutó físicamente aquí.**
- No usar status PASS real hasta que el usuario pruebe el PRG.

## URLs

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test247/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test247-diagonal-unrolled-char-buffer.zip

## Prueba VICE

Abrir WEB TEST247, cargar el proyecto original `TERRY COLORES LENTO`, exportar PRG con Diagonal Up Left, 8 px/tick y 1 tick/paso, BANK1, sin SID; ejecutar en VICE x64sc PAL sin warp. Comparar con TEST244: fluidez, transiciones de color, arte, líneas superiores, ausencia de freeze. Si falla, usar TEST244 no modificar MASTER.

En consola después de exportar: `window.RICO_TEST247_LAST_BUILD` -> `selected:true`, `mode:'safe-loader-unrolled-double-screen'`.

Un retardo inicial breve es esperable porque construimos 5617 bytes de código de copia solo al arranque; no debe introducir tirones mientras corre el scroll.
