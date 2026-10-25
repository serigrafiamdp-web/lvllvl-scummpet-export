# TEST297 — PASS REAL (VICE)

**Fecha:** 24 de octubre de 2026, Argentina.  
**Resultado confirmado por el usuario:** **PASS** del TEST297; mejora **bastante notable** en la velocidad del scroll grupal Bitmap Multicolor del proyecto real. La captura de referencia es `2026-10-24 23-46-06.mkv`.

## Alcance aprobado
- Scroll grupal de Bitmap Multicolor, usando el mapa real y selección de hasta 256 caracteres.
- Speedcode distribuido para IDs con 3 o más apariciones, con dispatch por tabla O(1).
- Movimiento a 8 píxeles multicolor por paso con **doble buffer** heredado de TEST292, sin parpadeo reportado en esta secuencia.
- Exportación desde el menú normal Export PRG, sin botones nuevos.

No se ha probado que alcance 8 píxeles por **cada frame PAL**: la mejora es visual y perceptible en VICE. No atribuir a esta aceptación una cifra exacta de FPS o de ganancia si no se ha medido.

## Guardado
La rama protegida de referencia por convención es `release/test297-pass-2026-10-24`, creada desde `release/test297-bitmap-distributed-speedcode` y anotada con este documento. El código de TEST297 se conserva tal cual, **sin alterar el MASTER ni ninguna rama previa**.

La evolución experimental continua en TEST298, partiendo de este PASS. Si falla, regresar a este TEST297.
