# TEST242 — DIAGONAL / MACRO COLOR DELTA (45×32 / 6 bloques)

**RESULTADO REAL VICE 22/10/2026: FAIL — perdió fluidez.** El usuario confirmó además que el enfoque depende de bloques rectangulares y no es una solución general. No integrar en MASTER ni reemplazar el motor aprobado. Las simulaciones de exactitud no constituyen PASS de rendimiento.

## Lección técnica
La generación de fronteras rectangulares reduce celdas candidatas, pero la rutina `m242_cell` recalcula punteros, página e índices y prepara buffers indirectos por cada candidato; el overhead por celda sigue siendo alto. Para la alternativa general: precalcular durante exportación qué posiciones cambian de color para la dirección diagonal elegida, independiente de cámara y estructura del arte; conservar todos los colores y la sincronización raster, sin asumir rectángulos ni un ciclo <=255.

**Base:** TEST241, con TEST239 BANK1 fix y fallback TEST240. No reemplaza MASTER ni index raíz de gh-pages. **Fuente y simulación: PASS; ensamblado y VICE: PENDIENTE**.

## PRG comparados realmente

- `TERRY NUEVO 2 (12).prg` (rápido, un solo color $07).
- `TERRY COLORES LENTO.prg` (lento, seis colores).
- Los dos tienen 38.916 bytes, carga $0801; mapas ($4000-$6FFF), Bank1 ($3000-$37FF) y Bank2 ($3800-$3FFF) **idénticos**.
- Los 3.597 bytes diferentes se concentran en runtime ($2000...) y colores desde $7000.
- Área real 45×32, filas duplicadas de 90 bytes. Colores **exactamente** rectángulos 15×16: fila superior 3,13,5; inferior 4,14,7.
- Un paso diagonal cambia solamente entre **88 y 149** colores de las 1000 celdas (promedio exacto **125** en el ciclo completo).
- TEST236 / TEST240 no seleccionan RLE por `LCM(45,32)=1440` fases, excede contador de 8 bits (máx. 255).
- Ruta lenta incluye `prepare_sparse_colors203`, cuyo escaneo toca 1024 posiciones por frame (unas 18.432 ciclos incluso sin diferencias), además del desplazamiento del shadow de colores y del scroll de caracteres.
  
## Técnica única TEST242

Si los colores reales forman rectángulos exactos de tamaño constante, detectar ancho y alto óptimos de estos rectángulos en exportación. Para el caso TERRY, detectar 15×16.

- En lugar de desplazar el shadow de colores o comparar 1024 posiciones, calcular las columnas y filas que cruzan **fronteras de colores** en el paso diagonal.
- Leer el color de destino verdadero desde el mundo en $7000, sin aproximar colores. Registrar las posiciones y colores en las listas TEST203 de páginas `$1000-$13ff` y `$1400-$17ff`.
- El IRQ original `commit_sparse_colors203` sigue escribiendo solamente esas posiciones de Color RAM después del swap. No cambiar el swap, pantalla, charset, velocidades, SID o motores cardinales.
- Máximo 155 entradas candidatas (incluidas intersecciones duplicadas), versus 1024 comparaciones del fallback.
- La ruta activa **solo** si todas las celdas se agrupan perfectamente y cada fase exige como máximo 180 candidatos; en cualquier otro caso retorna el TEST241 anterior idéntico.
- El modo monocromático, RLE seleccionado, Group Animate y cualquier mapa no compatible quedan intactos.

## Verificación previa

- 4 direcciones × 1440 movimientos = **5760 frames simulados**, 1000 colores por frame, 0 diferencias frente al mapa de colores original.
- 24 pruebas de integración en generador ASM, 8 selecciones correctas (cuatro direcciones x dos bancos) y 16 rechazos limpios.
- Tamaño estimado de la rutina de tablas y ASM inyectado 527 bytes, sin branches cortos fuera de rango en chequeo estático de código.
- Sintaxis JS PASS. **No está verificado en VICE aún**; la mejoría en rendimiento es hipótesis basada en reducción del trabajo.

## Entregables

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test242-diagonal-macrocolor-delta.zip

WEB aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test242/

Reexportar el mismo mapa multicolor `TERRY COLORES LENTO` con diagonal Up Left, 8 px/step, ticks 1.

Consola tras exportar: `window.RICO_TEST242_LAST_BUILD`. Esperado `selected:true`, `blockWidth:15`, `blockHeight:16`, `maxCandidatesPerStep:155`.

Cualquier error de colores, franjas superiores o velocidad igual/peor implica FAIL, no promover. Revertir a TEST241 o MASTER.
