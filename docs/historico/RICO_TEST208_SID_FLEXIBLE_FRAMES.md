# TEST208 — SID sin cantidad mínima de frames

Estado: EXPERIMENTAL. Requiere VICE para PASS real. Mantener TEST207, TEST206, TEST204 y TEST203 como referencias previas.

## Corrección solicitada
- **8 frames es un objetivo de la prueba, no una cantidad obligatoria.** Se permite 1, 2, 3... frames; el tope real resulta de la memoria disponible y el modo de scroll.
- Para **1 frame**, reutilizar el exportador TEST203: horizontal Left/Right, diagonal de 4 direcciones, o imagen estática sin scroll.
- Para **2 o más**, reutilizar empaquetado de TEST206, sin inventar otro player ni imponer exactamente ocho frames.
- Si un proyecto no cabe por una razón real de memoria, informar cuál; nunca truncar frames silenciosamente.
- El original del editor no se modifica.

## Reproductor SID original de James
- Referencia: https://github.com/jaammees/lvllvl/blob/main/src/js/textMode/c64export/export.asm
- PSID LOAD original $1000-$1FFF; INIT antes de activar IRQ, PLAY dentro del raster IRQ.
- Selección de frecuencia **Auto / 50 Hz / 100 Hz**. Auto detecta bit CIA; usa aproximación PAL de 60 Hz (6 plays cada 5 cuadros), sin prometer precisión CIA.
- El bit CIA ya **no cancela la exportación**.
- RSID, PSID sin PLAY y conflictos de memoria siguen mostrando incompatibilidad técnica genuina.
- Las listas de Color RAM multicolor de TEST203 se trasladan desde $1000-$17FF a $B000-$B7FF. Para pantalla monocromática no hay listas que mover.
- Se rechaza explícitamente un SID faltante cuando se pidió música. Sin SID se usa TEST206 u otro motor anterior.

## Comprobaciones técnicas
- 56 casos simulados con 1, 2, 3 y 8 frames: estático, Left, Right, diagonal, mono/multicolor, canciones PAL VBI/CIA.
- Revisiones de código 6502 para 1 estático, 1 horizontal, 1 diagonal, 2, 3 y 8 frames: cero saltos relativos fuera de rango, cero etiquetas duplicadas, sin conflicto de código con charset.
- No hay PASS de sonido ni de cambio real de frames: confirmar en VICE antes de consolidar.
