# TEST259 — Motor ASM rápido con scroll fino (1–7 px) y ticks variables

**ESTADO: EXPERIMENTAL, falta VICE.** Basado en TEST258 (código original TEST257 aprobado provisionalmente). MASTER VIERNES 23 OCTUBRE 2026 no modificado. Todas las versiones conservadas.

## Pregunta central

El usuario busca la velocidad y estabilidad alcanzadas en TEST254/257 también con todos los valores de Ticks/Step, Pixels/Step y ocho movimientos, no simplemente eliminar escrituras VIC redundantes. TEST258 conservó los motores genéricos y optimizó $D011/$D016 solamente a 8 px. Para llevar realmente el motor de copias CHAR/Color RAM de 3 franjas a otras velocidades, es imprescindible distinguir el movimiento subcarácter de la actualización de las celdas completas.

## Alcance real de TEST259

- Diagonales **Up Left y Up Right** de 1 a 7 px/step, ticks del usuario 1..65535, con el mismo código de copia directa de la pantalla y de los 16 colores C64 de TEST254/257.
- En cada pulso de tick, el código ASM **plan_step** es idéntico al exportador TEST196 original para el tamaño real de píxeles. Se guarda y aplica scroll fino $D011/$D016 para movimientos parciales.
- Cuando se cruza el límite de 8 píxeles, se prepara un nuevo marco de 25 caracteres de columna + 40 de fila, y se ejecuta la copia 6502 ultraoptimizada en tres franjas raster (86 /132 /218), con el mismo caché de columnas verticales.
- Cuando NO hay cruce de celda, no se copia innecesariamente toda la pantalla. Se modifica exclusivamente el desplazamiento fino, como en el runtime original.
- Para que no aparezca un salto doble de velocidad al completarse la tercera franja en raster ~49, la nueva variable RAM $A06A (`t259_skip_first`) marca que en ese cuadro ya se llamó a `irq_tick`. El primer raster en ~86 omite otro tick si no hay un nuevo cuadro de caracteres pendiente; así se intenta mantener **máximo una planificación de avance por cuadro PAL**. Es una modificación del planificador que requiere prueba en VICE.
- El `jsr apply_fine` final del commit de una celda se RESTAURA (TEST257 solo lo suprimió con seguridad para 8px). Se conserva la configuración de inicio del VIC-II.

**NO se limita Ticks/Step a 1.** TEST196 ya acepta 1..65535. TEST259 no cambia ese rango. Pixels/Step permanece 1..8.

## Restricciones de seguridad que NO se eliminan a ciegas

- El raster-chaser in-place del TEST254 copia de arriba hacia abajo. En dirección Down sería necesario cambiar el orden de copia de caracteres y colores y reconstruir dónde ingresan los bordes. Simplemente eliminar `d.dir.y!==-1` destruiría contenido o mostraría errores. Por eso Down Left y Down Right **siguen usando el motor genérico que ya exportaba correctamente**.
- Los cardinales Up/Down y Left/Right tienen motores independientes de 40 columnas y horizontal ancho; para igualar realmente su rendimiento hacen falta rutinas propias de preparación, barrido y IRQ. TEST259 no lo cambia.
- No forzar fast path con Group Animate, SID nativo, colores uniformes, o mapas que exceden el caché seguro. La ruta anterior se conserva automáticamente sin datos perdidos.
- No prometer 50fps: el tiempo de creación de un nuevo frame de caracteres/color y la cadencia fina deben medirse en hardware emulado PAL.

## Algoritmo ASM implementado

1. Se invoca el constructor TEST257/258 con `pixels=8` **solo para seleccionar** el pipeline de tres franjas ya validado. Nunca se altera la configuración del proyecto en el editor.
2. En la fuente ASM generada se corrigen únicamente las tres instrucciones de `plan_step` que llevan el tamaño del paso (X positivo/negativo e Y negativo). Los `ADC/SBC #$08` del resto del algoritmo, que son los que hacen modulo 8, permanecen intactos.
3. Se añade `jsr apply_fine` al final de una actualización de celda completa para recuperar la fase parcial.
4. Se elimina el segundo tick del mismo cuadro PAL en la fase inicial sin petición, tras el tick ejecutado al terminar la fase 3. Variable `A06A=00/01` se reserva sin tocar el profiler CIA A030–A049 ni los contadores A020–A028.
5. El resto del código de pantalla/Color RAM, caches, caracteres, bancos y datos de arte es idéntico a TEST257.

## Evidencia automática disponible

- **512 casos de exportación sintética**: cuatro diagonales, 1..8 px, ticks 1,2,4,8,16,255,256,1024 y dos bancos. **224 casos** de 1..7px Up Left/Right activaron TEST259; **288 casos** no seleccionados mantuvieron exactamente el ASM previo, sin diferencias.
- **112 comparaciones adicionales** entre el segmento `plan_step` de TEST259 y el exportador anterior para 1..7px, ambas diagonales Up, ticks 1,2,3,8,255,256,1024,65535. **112 idénticas bit a bit en fuente ASM de planner**.
- **14 inspecciones de saltos ASM** (2 sentidos Up x 7 valores de píxeles): 0 errores de branch ±127, 0 colisiones de memoria. Región programa $2000–$2EB4 en Up Left y $2000–$2E90 Up Right; charset comienza en $3000.
- **No se ha ejecutado PRG en VICE.** Las comprobaciones garantizan sintaxis de transformaciones, condiciones de fallback y distancias estáticas, no imagen perfecta ni FPS real.

## Accesos

- TEST259 WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test259/
- TEST259 ZIP COMPLETO: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test259-up-diagonal-fine-fast.zip
- Código: `js/RICO_PRG_UP_DIAGONAL_FRACTIONAL_TEST259.js`
- MASTER 23 OCT (no cambiado): https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026

## Validación recomendada en VICE, por etapas

1. TERRY multicolor, Bank1, Up Left: **Pixels/Step=4, Ticks/Step=1**. Exportar PRG TEST259. Verificar que el movimiento fino avance dos pulsos por carácter, sin salto extra ni pérdida de color. Comparar con TEST258 y con la preview.
2. Probar **Pixels/Step=1, Ticks/Step=1** y **Pixels/Step=3, Ticks/Step=2**, buscando costuras y ritmo uniforme.
3. Probar **Up Right** con Pixels=4, Ticks=1. Usar colores 0..15 y valores arbitrarios de charset.
4. Probar **8px, 1tick**; debe ser byte a byte igual a TEST257/258 (sin regresiones), y Down Left/Right deben seguir con sus rutas anteriores.
5. Contadores de raster para diagonales Up: `m a020 a028`. La firma `A030=53` del profiler TEST253 puede estar presente. La variable auxiliar es `m a06a a06a` (0/1) y no es un contador de saltos.
6. Si queda a saltos, verificar fase fina y ubicar la escritura de $D011/$D016 en la IRQ. No modificar el MASTER con un test que no tiene PASS visual.

## Próximas implementaciones si TEST259 es PASS

- Invertir correctamente el algoritmo de copia con borde superior y recorrido de memoria opuesto para **Down Left y Down Right**, preservando los 16 colores.
- Separar los planificadores de Up/Down y Left/Right para integrar el motor rápido por celda sin perder su scroll fino.
- Repetir mediciones bajo estrés máximo y cada Ticks/Step, sin eliminar limitaciones que son límites reales de RAM.
