# TEST231 — Parpadeo/salto de una línea en UP a 1 Pixel/Step

**Estado:** **FAIL en VICE**, confirmado por el usuario el 22/10/2026. La línea/blink sigue y aparecen caracteres marrones en el render.  
**Base:** TEST229 SID ampliado PASS; MASTER LVLLVL RICO 22 OCTUBRE sin modificar.  
**Video de referencia:** `2026-10-22 09-34-08.mkv` (usuario; no se agrega al repositorio).

## Diagnóstico

El usuario observó **un salto o blink de una línea dentro de la imagen mientras esta sube**, antes de que la imagen llegue al borde. **No es un error de recorte de la pantalla**. TEST230 modificó provisionalmente el modo de 25 a 24 filas; se descarta esa hipótesis y se restableció TEST229.

La ruta Up 1px del motor TEST225 preparaba el siguiente buffer al llegar a `fine_pos=0`. Si el renderizado aún no había finalizado en el próximo tick, `frame_tick` posponía el intercambio y aparecía un pequeño frenazo. La ruta de 8 px de TEST227 era independiente y seguía PASS.

El video muestra irregularidades de cadencia compatibles con este mecanismo. **Sin un test VICE posterior no se puede declarar probada esta causa ni afirmar que el blink esté eliminado.**

## Cambio exacto

Archivo nuevo `js/RICO_PRG_VERTICAL_UP_1PX_PREFETCH_TEST231.js` cargado **después** del módulo vertical TEST227 y **antes** del adaptador SID.

Para **Up, 1 Pixel/Step, Window Height 25**, realiza dos cambios puntuales en ASM:

1. Con `fine_pos=3`, solicita anticipadamente la preparación de la pantalla siguiente, sin intercambiar todavía pantallas.
2. Mientras `fine_pos>0`, continúa el desplazamiento fino aun si `prep_request=1`. Solo permite `commit_prepared` cuando `fine_pos=0`; entonces pone la nueva pantalla y vuelve a `fine_pos=7`.

Se preserva `$D011` en **modo 25 filas original**, todos los caracteres visibles, Color RAM, música SID TEST229 y las demás rutas de scroll.

## Validación interna

- 96 combinaciones de tipo Up/Down, velocidad 1–8, ventanas 24/25 y alturas de mapa 25/32/60: **solo las tres variantes elegibles Up 1px 25 filas cambiaron**; las otras 93 quedaron idénticas.
- Simulación de 96 pasos de 1 píxel: con preparación de 2–4 pasos, el cambio anterior presenta pausas al alcanzar `fine_pos=0`, mientras TEST231 continúa sin repetir posiciones. Para preparaciones mayores que la anticipación disponible puede seguir habiendo una pausa.
- No se modificó código de TEST227 vertical 8px, horizontal TEST220, diagonales ni SID TEST229.

## Prueba pendiente

Abrir web TEST231; exportar el mismo mapa del video con **Up / 1 Pixel/Step / 1 Tick/Step / 25 filas** y mirar en VICE el tramo de movimiento interior donde antes se producía el blink. Si todavía ocurre, obtener PRG y capturas de fotogramas alrededor del salto y medir el IRQ y la fase de buffer. No promover al MASTER sin PASS del usuario.

## Resultado real y decisión

El usuario compartió captura de TEST231 y reportó que **la línea salta/parpadea igual y además aparecen caracteres marrones**. Adelantar `prep_request` a `fine_pos=3` **no es solución**, y puede añadir riesgo de desincronización de colores y caracteres si se mueve `camera_row` antes del swap. Por tanto, TEST231 es **FAIL** y **se retiró de `gh-pages`**; se restauró la versión TEST229 aprobada. La rama de TEST231 queda como evidencia histórica. No confundir los 96 casos de generación estática con validación visual.

Siguiente investigación: inspeccionar el **PRG exacto** que produjo la captura y comparar el motor de color de 1 px (RLE `apply_vertical_color221`) con el de 8 px (direct `commit_direct_color226`), las instrucciones 6502 efectivamente ensambladas y los momentos de intercambio.
