# TEST253 — Cronómetro interno de 6510 usando CIA1 Timer A

**Estado: diagnóstico experimental.** Código generado y regiones ASM analizadas estáticamente. Falta compilar PRG real en el navegador y ejecutar en VICE. Se mantiene TEST252 como referencia funcional sin aceleración perceptible y TEST244 como referencia estable. MASTER intacto.

## Objetivo exacto

Saber cuánto tiempo necesita la preparación de bordes en TEST252 y si el primer raster IRQ de línea 86 llega cuando la CPU sigue ocupada. El final de la última franja en línea raster 49 de TEST251/TEST252, por sí solo, NO determina si `prep_edges249` se completó a tiempo.

## Implementación 6510 real

Configuramos CIA1 Timer A en **modo continuo, reloj PHI2**, contador descendente de 16 bits que empieza en `$FFFF`:

```asm
t253_init:
 lda #$00
 sta $dc0e
 lda #$ff
 sta $dc04
 sta $dc05
 lda #$11
 sta $dc0e
 rts
```

En el main loop:

```asm
 jsr t253_begin      ; Captura CIA y raster
 jsr prep_edges249   ; La misma rutina transpuesta de TEST252
 jsr t253_end        ; Captura CIA y raster + cuenta una preparación
```

El cronómetro también registra la creación de solicitudes inmediatamente después de `plan_step` y los estados `prep_request`, `main_busy`, `prep_ready` al entrar en la fase 0 (raster 86).

**No se cambió ninguna copia de caracteres o Color RAM, los buffers, el mapa ni la programación de raster 86/132/218.** Hay sobrecarga de diagnóstico, por tanto TEST253 **no es una optimización de FPS**.

CIA Timer A cuenta hacia abajo. Lecturas consecutivas `$DC04` y `$DC05` dan una instantánea de temporizador low/high; el ciclo de temporizador se reinicia después de $0000. Una preparación de menos de 65.536 ciclos puede medirse por diferencia modular, descontando cualquier IRQ que se haya ejecutado en ese intervalo.

## Monitor VICE

Después de ejecutar TERRY original multicolor, Diagonal Up Left, 8 px, 1 tick, Bank1, sin SID, unos pocos segundos, detener en monitor y ejecutar:

```
m a030 a049
m a020 a028
```

### Telemetría $A030..$A049 (26 bytes)

| Byte | Información |
|---|---|
| A030 | Firma **$53**: TEST253 correctamente cargado |
| A031 | Versión **$01** |
| A032 | Número de preparaciones completadas (módulo 256) |
| A033 | Número de solicitudes registradas (módulo 256) |
| A034 A035 | CIA Timer A **al empezar** preparación: LO, HI |
| A036 A037 | CIA Timer A **al terminar** preparación: LO, HI |
| A038 | Cuenta TEST250 IRQ al inicio |
| A039 | Cuenta TEST250 IRQ al final |
| A03A A03B | Línea raster al inicio (low, high bit $00/$80) |
| A03C A03D | Línea raster al final (low, high bit $00/$80) |
| A03E A03F | Línea raster cuando se encoló último movimiento |
| A040 A041 | CIA Timer A en el momento de encolar |
| A042 | Número de entradas en primera interrupción raster |
| A043 | Último valor de `prep_request` en primera IRQ |
| A044 | Último valor de `main_busy` en primera IRQ |
| A045 | Último valor de `prep_ready` en primera IRQ |
| A046 A047 | Línea raster de la última primera IRQ |
| A048 A049 | CIA Timer A de la última primera IRQ |

### Cómo calcular ciclos de preparación

```
start = A035*256 + A034
end   = A037*256 + A036
cycles = (start - end) & 65535
```

**Condición:** A038=A039 confirma que no saltó una IRQ durante esa preparación (salvo el caso teórico de 256 IRQ completas, incompatible con una preparación ordinaria). Si A038 y A039 son distintos, la diferencia de CIA incluye el tiempo pasado dentro de IRQ y no debe tratarse como ciclos exclusivos de preparación.

Los temporizadores registran tiempo en PHI2, incluyen el coste de muestreo, y se sobreescriben en cada paso. Las muestras `A03E/3F` y `A040/41` pertenecen a la última solicitud, que puede ser distinta de la preparación más reciente si se detiene el emulador justo durante una transición. Usar lecturas cuando el programa viene ejecutándose normalmente unos segundos; monitor pausa el CPU.

Comparar con `m a020 a028`, que conserva todos los contadores TEST250/TEST251, incluido último commit raster bajo/alto A025–A026.

## Pruebas estáticas realizadas

- 64 combinaciones sintéticas; 8 seleccionan instrumentación TEST253, 56 devuelven TEST252 intacto.
- Etiquetas y saltos: 0 duplicados, 0 saltos fuera de rango.
- 0 colisiones de código/datos:
  - código motor `$2000–$2BA9`, antes del charset `$3000`;
  - caché de TERRY `$8000–$967F`;
  - contadores previos `$A020–$A028`;
  - nuevos contadores `$A030–$A049`, sin solapamientos.
  - PRG llega a `$C340`, sin cargar dentro del I/O `$D000–$DFFF`.
- Compilador ASM real no disponible en este entorno; NO se ha comprobado en VICE todavía.

## Links

WEB independiente: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test253/

ZIP de rama: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test253-cia-cycle-profiler.zip

**Criterio:** si TEST253 no arranca o rompe los colores, se considera FAIL. Si arranca y los contadores son coherentes, usar ciclos para seleccionar la siguiente optimización. No promover experimentos al MASTER antes del PASS real.
