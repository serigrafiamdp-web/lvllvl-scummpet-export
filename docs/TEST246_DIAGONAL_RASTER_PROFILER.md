# TEST246 — C64 diagonal raster profiler: medir antes de acelerar

**Base: TEST244** (`release/test244-direct-color-raster`). Motor gráfico intacto, sin incorporar TEST245 que no demostró mejora medible. TEST246 es **diagnóstico**, no una versión más rápida. MASTER y web pública raíz intactos.

## Hipótesis

Capturas TEST244 y TEST245 apuntan a aproximadamente **25 avances por segundo** con PAL de 50 fps, aunque sus rutinas directas de Color RAM solo consumen ~3.840 ciclos por mitad. Sospechamos que el renderizado de caracteres termina demasiado tarde para el siguiente IRQ de mitad de cuadro en `$A0`, obligando a esperar hasta el próximo `$A0`. Necesitamos evidencia antes de modificar el planificador.

## Instrumentación

- Mantiene el motor TEST244: `diag_shift221`, doble-buffer de caracteres, transferencia directa de 480 colores en mitad alta + 480 en mitad baja, raster `$A0` y `$FA`, SID, bancos, borde y lógica de scroll.
- Solo cuando TEST244 selecciona **diagonales hacia arriba multicolor** agrega marcadores en el borde y contadores CPU.
- Colores del borde: **rojo** = empieza la preparación de caracteres; **verde** = preparación terminada; **azul** = transferencias de Color RAM superior; **celeste** = mitad superior terminada; **amarillo** = transferencias y reconstrucción de bordes inferior. Al completar el intercambio restaura el color original del borde. Los colores NO corresponden al arte del mapa.
- Los marcadores agregan unas pocas instrucciones al planificador; el ritmo de TEST246 puede diferir ligeramente del de TEST244. Nunca interpretar TEST246 como una mejora de FPS.

## Memoria de diagnóstico ($A020–$A02B)

| Direc. | Valor almacenado |
|---|---|
| $A020 | Raster bajo al inicio de preparación |
| $A021 | Bit 8 de raster al inicio (`$00` o `$80`) |
| $A022 | Raster bajo al completar preparación |
| $A023 | Bit 8 de raster al completar (`$00` o `$80`) |
| $A024 | Contador de todas las interrupciones del medio ($A0), módulo 256 |
| $A025 | Interrupciones del medio con próxima pantalla preparada, módulo 256 |
| $A026 | Interrupciones del medio con preparación pendiente/no lista, módulo 256 |
| $A027 | Interrupciones inferiores que completan transferencia y swap, módulo 256 |
| $A028 | Interrupciones inferiores con petición pendiente sin mitad alta ya ejecutada, módulo 256 |
| $A029 | Interrupciones del medio mientras `main_busy` activo, módulo 256 |
| $A02A | Firma `$46` (validación) |
| $A02B | Versión `$01` |

Los registros `$D012` y `$D011` se leen, nunca se alteran al medir. Las posiciones son RAM y pueden examinarse en el monitor de VICE.

## Protocolo del usuario

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test246/
2. Exportar el mismo proyecto TERRY multicolor en **Diagonal Up Left, 8 px por step, 1 tick**, Bank1, y ejecutarlo en **VICE x64sc PAL**, sin modo warp.
3. Reiniciar PRG para limpiar los contadores; dejarlo avanzar ~3 segundos (no más de 4 segundos por contador de 8 bits) y abrir el monitor VICE.
4. Ejecutar exactamente `m a020 a02b` y mandar una captura de esa línea o pegar los 12 bytes hexadecimales. Si es posible también un breve MKV mostrando los bordes de colores.
5. En el navegador: `window.RICO_TEST246_LAST_BUILD` debe indicar `selected:true`.

**Lectura**: si `A026` crece de modo parecido al número de avances `A027` y `A029` es alto, el render no llega a tiempo al raster medio. Si `A025` indica que llega preparado, pero `A027` queda muy por debajo, revisar alternancia del IRQ o tiempo inferior antes de planificar nuevos cambios.

## Tests automáticos realizados

- 32 combinaciones sintéticas: cuatro diagonales, Bank1/Bank2, mono/multicolor, dos patrones. 8 activan instrumentación, 24 mantienen ASM byte a byte de TEST244.
- Generación ASM sin excepciones para esos casos.
- Verificación estática de longitudes de instrucción y destinos de todos los saltos condicionales: **0 saltos fuera del rango -128..127**. Detectamos y corregimos una rama larga durante el desarrollo.
- Sin interferencia con SID `$B000-$B7FF`; contadores en hueco `$A020-$A02B`, entre `$A008` y rutina en `$A100`.
- **No montado en emulador VICE ni ensamblado como PRG por el asistente; aún requiere prueba real.**

**Descargas**

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test246/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test246-diagonal-raster-profiler.zip

No promover al MASTER hasta analizar resultados.
