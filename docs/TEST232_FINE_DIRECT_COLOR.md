# TEST232 — Color RAM directa para Up/Down a 1–7 píxeles

**Fecha:** 22/10/2026 · **Estado: PASS confirmado por el usuario en VICE.**  
**Base:** TEST229 SID ampliado PASS; MASTER del 22 de octubre preservado.  
**Motivo:** el usuario sigue viendo un blink/salto interno de una línea y colores marrones inesperados con Up a 1 Pixel/Step. TEST230 (borde) y TEST231 (prefetch anticipado) fueron descartados; no repetir sus soluciones.

## Hipótesis y cambio

El camino Up/Down a 8 píxeles aprobado en TEST227 utiliza **escrituras directas a Color RAM precalculadas**, mientras las velocidades de 1 a 7 píxeles todavía recurrían a la lista RLE `apply_vertical_color221`, la ruta híbrida TEST222 o `apply_sparse_colors`.

TEST232 utiliza exactamente el planificador de cambios de color del TEST227, con cada color calculado offline por transición entre `camera_row-1` y `camera_row` (Up) o entre `camera_row+1` y `camera_row` (Down). Inyecta `jsr commit_direct_color232` **únicamente en `commit_prepared`**, justo antes del intercambio del doble buffer. Se mantiene el salto absoluto que se autoparchea de TEST227 (no `JMP (zp)` porque ese ensamblador falló en TEST226).

Se conserva el reloj original, `Pixels/Step`, `Ticks/Step`, el registro `$D011` en modo **25 filas**, el contenido de mapas/charsets y el adaptador SID TEST229. Los 8 píxeles siguen usando TEST227 sin cambio alguno.

No se fuerza la optimización cuando el plan no cabe en RAM, hay Group Animate incompatible o se usa una ruta de color no elegible; mantiene el motor anterior y registra la decisión en `window.RICO_TEST232_LAST_BUILD`.

## Validación estática

- 256 configuraciones (Up/Down, 1–8 px, alturas de 25/32/60/96 filas, 4 patrones de colores), con 112 seleccionadas y 144 preservadas.
- En las elegibles, los cambios de color de las 25×40 celdas se reconstruyeron contra el mapa esperado en **cada posición de cámara**, con coincidencia exacta de valores.
- Sin cambios en la ruta de 8 píxeles ni en el código de movement / `apply_scroll_regs`; se sustituye una llamada a la rutina de color solo al completar un carácter.
- Las posiciones y los tamaños de tablas se limitan a la RAM que ya utiliza el planificador TEST227; si no es segura, se conserva fallback.
- **Estas comprobaciones no prueban que se hayan eliminado el blink ni los colores marrones en VICE**.

## Prueba en VICE

1. Abrir `https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/?v=test232`.
2. Exportar el mismo mapa, **Up, 1 Pixel/Step, 1 Tick/Step**, con 25 filas.
3. Confirmar en la consola del navegador que `RICO_TEST232_LAST_BUILD.selected === true`. Si indica `false`, se mantuvo el viejo motor de colores y el test no discrimina la hipótesis.
4. Ejecutar en VICE y revisar el mismo tramo interior de la captura. Observar si sigue saltando o parpadeando, y si aparecen colores marrones.
5. Si funciona, ensayar Up 2/4/7 píxeles y Down 1 píxel, y un SID grande; declarar PASS solo con aprobación del usuario.

**No promover a MASTER sin PASS en VICE.** Si se reproduce el error, analizar el PRG concreto y la fase real del IRQ; no cambiar otra vez el modo de 24/25 filas.

## Resultado final

El usuario confirmó **PASS** de TEST232 el 22/10/2026: la integración directa de Color RAM aplicada al scroll vertical fino quedó aprobada. Se creó `CHECKPOINT_TEST232_FINE_COLOR_PASS_22_OCT_2026` para conservar esta base antes de trabajar en diagonales. El PASS no implica que todos los mapas densos entren en la optimización; las rutas fallback permanecen.
