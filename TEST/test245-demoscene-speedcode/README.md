# TEST245 — DEMOSCENE SPEEDCODE PING PONG (23/10/2026)

**TEST aislado, no PASS en VICE.** Web principal y TEST242–244 sin modificaciones.

## Diferencia respecto de TEST244

El exportador genera offline una secuencia de fases de Ping Pong, con desplazamiento recortado idéntico al `clippedShift()` de la vista previa. Las fases se almacenan desde `$4800` y el motor 6510 generado desde `$A000` ejecuta copias directas de glifos al charset que no está visible (`$3000` o `$3800`). Cuando termina una fase, el compositor existente solicita el flip de `$D018` en IRQ.

No se ejecuta un bucle de desplazamientos de bits, lookup de glyphs o recomposición geométrica por fase durante el PRG.

## Elección de fases

Para una dimensión de `N` píxeles, el rebote tiene período `P=2*(N-1)`; a 8 píxeles/tick genera `P/gcd(P,8)` estados distintos. La secuencia se precalcula completa desde el estado inicial sin duplicar innecesariamente el recorrido de vuelta.

| Grupo de prueba | Fases cacheadas | Cache redondeada | Ciclos teóricos base de copia |
| --- | ---: | ---: | ---: |
| 2×8 horizontal | 15 | 3.840 B | ~1.408 ciclos |
| 3×8 horizontal | 23 | 5.888 B | ~2.112 ciclos |
| 4×8 vertical | 63 | 16.128 B | ~2.816 ciclos |

Los ciclos son una aproximación del costo por byte generado, **no** medidas en VICE, y omiten IRQ, setup y tiempos de VIC-II.

## Memoria

- `$3000/$3800`: BANK1/BANK2 que se alternan en IRQ
- `$4000-$43FF`: pantalla fija
- `$4400-$47FF`: color fijo
- `$4800-$9FFF`: fases precompiladas, cada una alineada a página
- `$A000-$CFFF`: Speedcode 6502 y estado del planificador
- `$D000-$DFFF`: I/O (no escribir datos cache aquí)

Si el cache o el codebook no caben, TEST245 recurre a TEST244 sin recortar el grupo.

## Conservación

- ONDAS no cambia; usa su propia ruta progresiva.
- La exportación de Map Scroll combinado queda en las rutinas anteriores.
- Sin Map Scroll, Ping Pong Left/Right/Up/Down de 8 píxeles usa Speedcode cuando cabe en RAM.
- Para velocidades distintas de 8px se conserva la ruta TEST244.
- SID conserva su wrapper original sin alteraciones.

## Verificado

- Sintaxis de los módulos JS: PASS.
- Generación ASM y referencias de etiquetas: comprobadas para bancos 1/2, Ping Pong en cuatro direcciones, casos 2×8/3×8/4×8, ONDAS y fallback de 6×8.
- Verificación geométrica independiente de 15–20 fases de cada dirección: cero discrepancias de bitmap.
- **Pendiente**: ensamblado real, velocidad, timing PAL y ejecución VICE de los PRG exportados. No marcar PASS.

Prueba:
https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test245-demoscene-speedcode/
