# TEST244 — Ping Pong FAST8 sostenido (23/10/2026)

## Estado

Prueba experimental, publicada por separado. **No es PASS VICE** hasta la comprobación visual y temporal del usuario.

- Página de prueba: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test244-ondas-pingpong-fast/
- Base: TEST243 (copia directa en fases byte-alineadas y cache de 8 fases cuando cabe).
- Los modos **ONDAS** siguen usando el motor progresivo original (TEST242); TEST242 y TEST243 no se modifican.

## Problema identificado

Al invertir un movimiento `pingpong-left/right` de 8 píxeles, la fase rebota en `width*8-1`. Esa posición no necesariamente coincide con el comienzo de un byte. Durante el viaje de regreso, muchas fases quedan en desplazamientos de 1–7 bits.

En TEST243 los grupos grandes tenían copia rápida de ocho bytes **solo cuando fase % 8 == 0**. Al quedar desalineados, ejecutaban el bucle original `group183_bit_loop` por cada fila de cada carácter, repetido tantas veces como el desplazamiento de bits (hasta 7), provocando una caída de velocidad dependiente de la fase.

## Cambios

1. **Grupos grandes / LUT completa no cabe:** suprime el bucle iterativo de desplazamiento de bits en fases desalineadas y lo reemplaza por ocho puntos de entrada de rutinas ASM 6502 desenrolladas `group244_shift_0..7`.
2. Selección de la entrada una vez por **fase** con `group244_choose_shift`; se autoparchea la dirección `group244_shift_jump+1/+2`. Código residente en RAM C64 bajo `$01=$35`.
3. **Fases alineadas de grupos grandes:** desenrolla la copia de 8 bytes y elimina el `CPY/BNE` del bucle antiguo.
4. **Grupos con LUT completa:** desenrolla la copia de 8 bytes también, conservando precálculo de subpíxeles de TEST243.
5. Conserva conmutación de charset mediante IRQ solo después de terminar fase completa (TEST242). Sin cambios a la UI, banco seleccionado, ONDAS, scroll de mapa ni SID.

## Comprobaciones estáticas

- Sintaxis JavaScript PASS.
- Generación de fuentes ASM sin etiquetas duplicadas o saltos a etiquetas inexistentes: ambos bancos, izquierda/derecha, grupos de 24, 192 y 256 caracteres.
- Ping Pong vertical y ONDAS permanecen idénticos a TEST243.
- Pendiente comprobación del ensamblado completo en navegador y ejecución real en VICE. No garantizar 8 px en cada raster tick para grupos grandes; depende de ciclos C64.

## Plan de comprobación

Usar el mismo arte y 8 px / 1 tick que en `2026-10-23 14-45-47.mkv`. Observar especialmente la vuelta posterior al rebote: el cambio de velocidad de TEST243 debería reducirse. Si persiste lentitud constante, el próximo candidato es el coste global de copiar todos los glyphs del grupo antes del bank flip.
