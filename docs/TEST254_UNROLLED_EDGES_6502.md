# TEST254 — Copias de bordes 6502 totalmente desenrolladas (con CIA1 de TEST253)

**Estado: experimental pendiente de VICE.** Conserva todo lo funcional de TEST252, las tres franjas raster de TEST251 (86/132/218) y el cronómetro de TEST253. Solo optimiza la preparación de los 25 caracteres+colores de columna y 40 caracteres+colores de última fila. **MASTER no modificado.**

## Evidencia real TEST253 (23/oct/2026)

Monitor recibido:

```
(C:$20b5) m a030 a049
>C:a030  53 01 0e 0e  2e 0e db 04  34 35 37 00  5c 00 35 00
>C:a040  9c 0e 1b 01  01 00 57 00  ee 05
(C:$a04a) m a020 a028
>C:a020  00 35 0d 0d  00 32 00 50  01
```

- CIA1 Timer A al iniciar precomputación: `$0E2E` = 3630 ciclos restantes del contador descendente.
- CIA1 Timer A al terminar precomputación: `$04DB` = 1243.
- Diferencia módulo 65536: **$0953 = 2387 ciclos**, incluyendo una IRQ ($A038=34 y $A039=35).
- Se encoló el movimiento en el raster 53; preparó a partir de raster 55.
- Primera IRQ ocurrió con `prep_request=1`, `main_busy=1`, `prep_ready=0`, rastreada en raster **87** ($A046).
- Preparación acabó en raster **92** ($A03C = 5C).
- Timer en primera IRQ `$05EE` = 1518. Hasta fin de preparación pasaron `$05EE-$04DB=$0113=275` ciclos temporizados más parte del handler ISR. La cuenta de IRQ ocurrió entre inicio/fin, por lo que 2387 ciclos **no es el coste exclusivo del bucle de preparación**.
- Último commit sigue en raster **50** ($A025=32, A026=00).
- Los contadores de 8 bits son modulares. Con este flujo, perder el primer raster de cada nueva petición explica los ~25 avances/s reportados; falta comprobar si una preparación más corta rescata la primera IRQ.

## Cambio exacto del TEST254

Antes, ambas rutinas usan un bucle con `CPY #$19 / BNE` y `CPY #$28 / BNE` respectivamente, y `STA buf,Y` con direccionamiento absoluto indexado.

Ahora el exportador emite, al generar ASM, **65 copias independientes**:

```asm
t252_column_loop:
    lda (src_lo),y
    sta buf_colchar249+0
    lda (color_src_lo),y
    sta buf_colcolor249+0
    iny
    ; ... repetir hasta +24 sin loop CPY/BNE

t249_prep_last:
    lda (src_lo),y
    sta buf_rowchar249+0
    lda (color_src_lo),y
    and #$0f
    sta buf_rowcolor249+0
    iny
    ; ... repetir hasta +39 sin loop CPY/BNE
```

Esto preserva absolutamente el valor de todos los caracteres y colores y su máscara `AND #$0F` en última fila. Se elimina el último `INY` innecesario de cada bloque. Las escrituras `STA absoluto` cuestan 4 ciclos frente a `STA absoluto,Y` de 5 ciclos. Se eliminan 65 comparaciones y ramas.

**Ahorro exacto calculado para las dos rutinas:** aproximadamente **457 ciclos por preparación** (el cálculo supone mismo acceso CIA y no interferencia). El precio es código mayor: $2000–$2EA2, aún dentro de la región libre antes del charset $3000. El archivo PRG sigue terminando en $C340.

No se tocó:
- Timer CIA1, `t253_begin`, `t253_end`, telemetría $A030–$A049.
- Preparación de punteros y caches column-major $8000–$967F.
- Rutina in-place de pantalla CHAR / Color RAM, 936 celdas más bordes.
- IRQ raster 86/132/218, `prep_request`, `main_busy`, `prep_ready`, `plan_step`.
- Máscaras 16 colores y soporte para dos sentidos diagonal hacia arriba y Bank1/Bank2.

## Validación estática

- 64 exportaciones sintéticas (direcciones, bancos, mono/multicolor, velocidad 4/8, dos patrones de colores): **8 activaciones TEST254 y 56 fuentes byte a byte iguales a TEST253**.
- Ninguna rama ASM relativa fuera de rango, ningún segmento solapado.
- Motor $2000–$2EA2, y charset inicia en $3000 (dejamos hueco para no invadir).
- Ambos bucles desenrollados están presentes en fuentes para los ocho casos de selección.
- La simulación de buffers/mapa a partir de TEST252 había pasado >1,6 millones de lecturas. TEST254 no cambia el algoritmo, solo quita bucles y usa las mismas direcciones de destino.
- **No se ha ensamblado un PRG real ni ejecutado VICE desde las herramientas; la usuaria debe validar.**

## Probar en VICE

1. WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test254/
2. ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test254-unrolled-edge-preparation.zip
3. Exportar el mismo TERRY multicolor, Diagonal Up Left, Bank1, 8px/step, 1tick, sin SID, x64sc PAL, warp apagado.
4. Observar si cambia velocidad o arte. Comparar TEST253 de referencia, conservado.
5. En monitor, ejecutar ambos comandos:

```
m a030 a049
m a020 a028
```

**Resultados esperados:** `$A030=53` (firma del profiler); diferencia `(A035:A034 - A037:A036)&65535` menor en ~457 ciclos frente a TEST253, descontando ISR. Crucialmente `A038=A039` en última preparación indica que no fue interrumpida (si cae completa entre IRQs) y $A044/$A045 cambian a CPU libre y preparación lista cuando llegue la primera IRQ. Si todavía aparece IRQ dentro de la preparación, ajustar más el cuello. No declarar 50fps hasta medir video.
