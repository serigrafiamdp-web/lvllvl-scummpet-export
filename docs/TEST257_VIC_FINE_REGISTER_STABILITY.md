# TEST257 — Estabilidad de scroll fino VIC-II ($D011 / $D016), prioridad fidelidad visual

**ESTADO: experimental pendiente de VICE.** Basado directamente en MASTER LVLLVL RICO VIERNES 23 OCTUBRE 2026 (TEST254), no en el TEST256 instrumentado ni TEST255. Conserva el MASTER sin modificaciones.

## Motivo

El motor TEST254 diagonal multicolor de 8 píxeles por desplazamiento mueve las coordenadas gruesas exactamente un carácter en X e Y. El algoritmo `plan_step` del generador TEST196 comienza con `fine_x` y `fine_y` en 7 para dirección visual negativa (-1), o 0 para positiva (+1). En pasos de 8, las operaciones de suma/resta más ajuste modulo 8 restauran SIEMPRE el mismo fine_x/fine_y. Esto se comprobó con 1000 movimientos para las cuatro combinaciones de signos y wrap de mapa.

La tercera fase raster del TEST254 terminaba llamando `jsr apply_fine`, que reescribe $D016 (horizontal) y $D011 (vertical) en cada desplazamiento pese a que los valores no cambian. Ocurre cerca del raster ~49/50 del cuadro siguiente, momento sensible antes de empezar a dibujar. En C64 es preferible no tocar los registros VIC-II si no existe un cambio real de estado. Evitamos únicamente esa escritura redundante para este modo fijo.

## Modificación mínima

**Antes** (extracto de `t250_last`):

```asm
 lda next_fx
 sta fine_x
 lda next_fy
 sta fine_y
 jsr apply_fine
 lda #$00
```

**Después**:

```asm
 lda next_fx
 sta fine_x
 lda next_fy
 sta fine_y
 lda #$00
```

Se conservan los registros lógicos fine_x/fine_y como antes. `start` **sigue ejecutando** el primer `jsr apply_fine` para programar $D011 y $D016 correctamente. No se elimina la rutina `apply_fine` ni otras llamadas fuera de la tercera IRQ. Dato clave: a 8 px el valor fino NO cambia de un desplazamiento al siguiente; para cualquier otra configuración sigue usando TEST254 sin modificaciones.

**No se alteran** copias de los 936 caracteres ni Color RAM, bordes, registros de dirección de scroll, orden de las tres bandas raster 86/132/218, periodos de scroll, buffers, 16 colores, charset Bank1/2, ciclo de IRQ, mapa circular, contador o profiler CIA de TEST253.

El cambio elimina exactamente 3 bytes de código máquina (`JSR absoluto`) y ahorra 6 ciclos de CPU por desplazamiento. La rutina `apply_fine` deja de ejecutarse al finalizar cada desplazamiento (su trabajo completo cuesta bastantes ciclos extra), por lo que el ahorro total es algo mayor. **El objetivo no es acelerar** sino evitar escrituras VIC innecesarias en la frontera vertical.

## Validación estática

- **128 combinaciones sintéticas** (signos X/Y, banks 1/2, 1/2/4/8 píxeles, mapas mono/multicolor, anchuras 45/55): **8 rutas activas**, **120 rutas fallback byte a byte idénticas a TEST254**.
- En las 8 activaciones, el ASM generado TEST257 es exactamente igual a TEST254, salvo una sola cadena `jsr apply_fine` eliminada en `t250_last`.
- Simulación de 1000 pasos con wrap y 4 signos: `fine_x/fine_y` invariantes, valores iniciales 7/0 según dirección.
- 0 colisiones de memoria y 0 saltos relativos 6502 fuera de rango. Programa termina en $2E9F; charset sigue iniciando en $3000. No cambia regiones del mapa/Color RAM.
- El código de instrumentación TEST256 **no** está presente en el programa. Sus lecturas en $A050..A061 no son válidas en TEST257.
- **Todavía no ejecutado en VICE**: validar visualmente antes de declarar PASS.

## Para probar

- WEB separada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test257/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test257-vic-fine-register-stability.zip
- El mismo TERRY multicolor, Diagonal Up Left, BANK1, 8 px por paso, 1tick, sin SID, VICE C64 PAL 100% Warp OFF.
- Comparar **directamente en pantalla** los bordes, costuras y posibles cambios de desplazamiento con TEST254 (no es necesario OBS).
- Si se quiere comprobar contadores, VICE Monitor:

```
m a020 a028
m a030 a049
```

- Los contadores de fase $A020-A028 son del motor original; los de CIA $A030-A049 permanecen para un diagnóstico conocido, con la precaución de no restar timestamps de preparaciones distintas.

## Criterio de decisión

Si TEST257 mantiene todas las propiedades de TEST254 y elimina un defecto visual visible, declarar PASS y considerar una próxima congelación. Si no hay mejoría, quedarse con TEST254. **No modificar ni actualizar el MASTER 23 OCT**; TEST255/256 quedan separados.

La captura OBS a 50 FPS había mostrado fotogramas duplicados y pasos dobles, pero no demuestra errores en el estado interno del motor. TEST257 es un ajuste de corrección de registros del VIC-II técnicamente seguro para 8px, no una afirmación de que arregle esos saltos de captura.
