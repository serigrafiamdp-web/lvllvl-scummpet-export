# TEST334 — SID y scroll: protección Zero Page

**05/11/2026 — candidato experimental; NO PASS de VICE.** En TEST333 el usuario confirmó que la basura gráfica **persistía** al colocar la reproducción SID después del commit visual. Por tanto, TEST333 es FAIL funcional; no se atribuye el problema únicamente al timing del raster.

## Hallazgo comprobado en el código

La rutina SID heredada de TEST211 solo guarda y restaura `$F0–$FF` de Zero Page. Los motores actuales de mapa, Group Scroll, Ondas, compactación ECM y animación individual guardan sus punteros y estado de pantalla en `$02–$38`; `$01` configura el banking del 6510. Una rutina SID que emplee las mismas posiciones puede corromper punteros, mapa, cursores y caracteres.

## Corrección aislada TEST334

- Se añade un respaldo independiente de la región `$00–$3F` para el motor gráfico y otro para el SID.
- Antes de `SID INIT` se guardan esos 64 bytes del gráfico; después se captura el estado privado del SID y se restauran los del gráfico.
- En cada `SID PLAY` se guarda el estado gráfico, se recupera el estado privado de la música, se ejecuta el reproductor, se guarda el estado resultante del SID y se restaura el gráfico.
- Se mantiene intacta la protección histórica `$F0–$FF` y el orden *graphics-first* de TEST333.
- Los dos respaldos de 64 bytes se almacenan en el segmento del motor. No se cambia el mapa, JSON, charset ni el propio archivo SID.
- Para comprobar qué ruta se utilizó: `window.RICO_TEST334_ZP_SNAPSHOT`, `window.RICO_TEST333_LAST_PATCH`, `window.RICO_TEST228_LAST_EXPORT`.

## Validación

Sintaxis JavaScript correcta y generación de ASM en las rutas horizontal 100×25 (sin SID, con SID 50 Hz y 100 Hz) y diagonal 120×120 (sin/con SID 50 Hz); con música se verificaron las cuatro rutinas de respaldo/restauración y la ejecución de SID después de las actualizaciones de color.

**No se ha ensamblado el código con un compilador 6502 real ni se ha probado en VICE.** La protección adicional consume ciclos en cada PLAY y puede exceder la memoria reservada si el motor está muy lleno; si el ensamblador da error, no debe marcarse PASS.

## Prueba comparativa

Usar el **mismo mapa y el mismo SID** del fallo. Exportar y ejecutar primero Left/Right a 50 Hz manual y luego diagonal. Si aún aparece basura, comparar con un SID mínimo sin variables Zero Page: distinguiría una colisión con el SID específico de una incompatibilidad estructural de nuestro reproductor. Para un diagnóstico concluyente hace falta el archivo **.SID exacto**, no solamente una captura.

**No fusionar el motor hasta el PASS real del usuario.** Si el SID modifica fuera de Zero Page la memoria de mapa `$4000–$9FFF`, screen buffers `$0400–$0FFF`, el charset `$3000/$3800` o los registros VIC, este resguardo NO lo impedirá. El próximo paso sería instrumentar escrituras reales del SID en VICE.

[Editor TEST334](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test334-sid-zp-sandbox/) · [TEST333 FAIL](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test333-sid-graphics-first/) · [Motor de referencia TEST332](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test332-unified-120x120/).
