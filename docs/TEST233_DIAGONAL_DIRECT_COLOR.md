# TEST233 — Escrituras directas de Color RAM en las cuatro diagonales

**Estado:** experimental, pendiente de PASS en VICE. **Base:** TEST232 PASS confirmado por el usuario. El MASTER del 22 de octubre permanece congelado.

## Objetivo
Tras el PASS de TEST232 (Up/Down 1–7 píxeles con cambios directos de color), probar el mismo enfoque en **diag-up-left, diag-up-right, diag-down-left y diag-down-right**, a velocidades de 1–8 píxeles/tick, sin modificar el desplazamiento de caracteres ni el reproductor SID.

## Arquitectura
Archivo nuevo: `js/RICO_PRG_DIAGONAL_DIRECT_COLOR_TEST233.js`, cargado tras `RICO_PRG_DIAGONAL_TEST196.js` y antes del adaptador SID TEST229.

- Calcula offline las **diferencias exactas de color entre la cámara actual y la siguiente** en cada paso diagonal de un carácter. Respeta los giros de X e Y y el mapa de filas duplicadas (`fastRows`).
- Agrupa las escrituras por color: un `LDA #color` seguido por `STA $D800–$DBE7` de las posiciones necesarias.
- Deduplica los bloques idénticos de cada fase; se despachan con una tabla de punteros y el **salto absoluto autoparcheado** ya validado en TEST227. Nunca usar `JMP (zp)` de TEST226.
- Elimina la preparación de shadow y el intérprete RLE cuando utiliza la ruta directa. Cuando el plan excede la RAM o el mapa tiene otra arquitectura, **conserva sin cambios el generador diagonal TEST221**.
- Reserva `$A100–$CFFF` como máximo; jamás llega a `$D000` (registros I/O), y TEST229 puede seleccionar otro banco para el core si un SID grande requiere relocación.
- No cambia `plan_step`, `pending_x`, `pending_y`, `fine_x/y`, `$D011/$D016`, 25 filas, map data, grupos ni reloj musical.

## Activación y limitaciones

En la consola del navegador buscar `[RICO TEST233 DIAGONAL COLOR]`. La variable `RICO_TEST233_LAST_BUILD` informa `selected`, `mode`, `compiledBytes`, `maxWrites`, `maxCycles`, `cycleCount` y `deduplicated`.

**Importante:** la aceleración solo se activa cuando las escrituras directas precalculadas caben en RAM. En mapas muy coloridos y complejos puede quedar `selected:false`, y la velocidad será la anterior. Esto no es un cambio de motor universal.

## Pruebas realizadas

- **384 configuraciones** con las cuatro diagonales, cuatro velocidades, cuatro tamaños de mapa y seis patrones de colores. En **48 configuraciones** se activó la ruta directa. Todas reconstruyeron los **1.000 colores visibles** correctamente en cada fase; las restantes 336 conservaron su ASM original.
- Validación adicional de **72 variantes** con PSID sintéticos de 4.096, 4.875 y 6.144 bytes: música integrada sobre el ASM nativo, core en `$2000` o `$C000` según conflicto, sin perder las rutinas de scroll.
- No se modificaron los motores horizontales TEST220, verticales TEST227/232 ni SID TEST229.
- **Estas pruebas son de generación/código, no demuestran mejoras de velocidad en VICE.**

## Cómo evaluar

1. Abrir [web TEST233](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/?v=test233).
2. Exportar el mismo mapa con **diagonal Up/Left, 8 Pixels/Step y 1 Tick/Step**; luego las otras tres diagonales.
3. Verificar `RICO_TEST233_LAST_BUILD.selected === true`. Si es falso, el PRG usa el motor anterior y esta prueba no mide la optimización.
4. Evaluar en VICE velocidad real, imagen completa, colores correctos y estabilidad; probar después 1/2/4 píxeles y SID.
5. Si hay regresión, conservar el PRG, comparar ASM/Color RAM y regresar al checkpoint TEST232 PASS. Promover solo tras PASS explícito.

**Referencia estable de rollback:** `CHECKPOINT_TEST232_FINE_COLOR_PASS_22_OCT_2026`.