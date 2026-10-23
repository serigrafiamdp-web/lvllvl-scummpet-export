# TEST250 — Tres franjas raster reales, diagonal CHAR + COLOR RAM in-place

**Estado:** código preparado, exportación ASM revisada estáticamente, falta VICE. TEST249 PASS provisional de estabilidad visual pero sin aceleración (>24,98 avances/s). TEST244 es referencia estable. MASTER y web principal conservados.

## Arquitectura nueva

Basada en la práctica de sincronización de franjas del código real Oscar64:
- https://github.com/drmortalwombat/oscar64/blob/main/samples/scrolling/colorram.c
- https://github.com/drmortalwombat/oscar64/blob/main/samples/scrolling/cgrid8way.c

Conservamos **exactamente** las instrucciones de copia LDA absoluta/STA absoluta de los caracteres y colores del TEST249. No recompone todo en una sola IRQ. Dividimos los 936 caracteres y sus 936 colores así:

| Interrupción VIC-II PAL | Filas visibles desplazadas | Copias char y Color RAM | Bordes de la columna |
|---|---:|---:|---:|
| $56 = línea 86 | filas 0–3 (4 filas) | 156 × 2 | 4 |
| $96 = línea 150 | filas 4–11 (8 filas) | 312 × 2 | 8 |
| $F8 = línea 248 | filas 12–23 (12 filas) | 468 × 2 | 13 + 40 celdas de fila inferior |

El tercer tramo puede terminar durante el principio del cuadro PAL siguiente. No adelantamos la tercera copia por encima de la imagen visible. Para cada franja se actualizan los caracteres y colores que el haz ya ha leído. **Sin doble buffer y sin cambiar la lógica del mapa.**

- Pantalla visible $0400, Color RAM $D800.
- Buffers de bordes precomputados $1F00–$1F81, exactamente 130 bytes como TEST249.
- Segmento estático $1000–$1EA1 dividido en $1000 y $1751 mediante RTS.
- Segmentos ejecutables generados en RAM alta al arrancar: $E000–$E750 (4 filas) y $E751–$FD41 (12 filas), separados por RTS; la rutina constructor del TEST249 ahora añade esos bytes al generarlos.
- No es un PRG que cargue bytes hasta $E000. El PRG sigue terminando bajo $D000.
- Intercambio pantalla $0400/$0800: ninguno.
- No modificar TEST244 ni el MASTER; no tocar color para otros scrolls.
- Activación únicamente si TEST249 eligió modo `single-screen-in-place-char-color`, es decir, scroll diagonal hacia arriba, 8 píxeles por paso, colores arbitrarios, sin Group Animate y sin SID nativo. Si no, fuente byte por byte idéntica a TEST249.

## Monitor VICE de diagnóstico

Después de correr el PRG unos 3–5 segundos, abrir monitor y ejecutar:

`m a020 a028`

| Byte | Significado |
|---|---|
| $A020 | fase actual: 0 = primera, 1 = segunda, 2 = tercera |
| $A021 | cuenta de IRQ raster (módulo 256) |
| $A022 | cuenta de movimientos completos (módulo 256) |
| $A023 | número de IRQ iniciales con CPU ocupada |
| $A024 | número de IRQ iniciales con solicitud pendiente no lista |
| $A025 | raster bajo al acabar la tercera fase |
| $A026 | bit alto ($00/$80) del raster al terminar |
| $A027 | firma $50 (ASCII "P") |
| $A028 | versión $01 |

IMPORTANTE: dado que el motor ahora espera **tres interrupciones por movimiento**, la cuenta de IRQ no es directamente comparable con TEST248 (1 IRQ por movimiento). La velocidad se mide contando avances visuales en MKV. Los contadores de 8 bits desbordan.

## Validaciones antes de VICE

- 32 exportaciones sintéticas, 4 activaciones (dos sentidos arriba × bancos1/2), 28 fallbacks exactos a TEST249.
- 0 colisiones ASM y 0 saltos relativos fuera de rango en validación estática por direcciones de instrucciones.
- PRG generado: regiones de pantalla $1000–$1EA1 y motor $2000–$2A57; tablas/charset intactas.
- El TEST249 ya había pasado 14.400 desplazamientos simulados con 1000 caracteres y colores; TEST250 cambia solo los puntos de corte de esos bucles, sin tocar las instrucciones de copia, entrada, o los datos del mapa.
- **La compilación real del PRG y los cuadros en VICE permanecen sin verificar.** El objetivo de 50 movimientos/s no está demostrado.

## Enlaces

- WEB aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test250/
- ZIP rama: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test250-three-raster-bands.zip

Probar con TERRY multicolor, Diagonal Up Left, 8 píxeles y 1 tick, Bank1, sin SID, en VICE PAL. Comparar contra TEST249 y TEST244 (≈25 movimientos/s). Ante corrupción visual o cuelgues, considerar FAIL y dejar MASTER intacto.
