# TEST290 — Demoscene LUT blitter para Group Scroll Bitmap Multicolor

**Fecha:** 24 de octubre de 2026. **Base inalterada:** TEST289 PASS, TEST288 PASS, TEST286 motor procedural. MASTER sin cambios.

**Estado:** PASS matemático de tablas (8.960 casos), PASS de PRG y disposición de memoria (incluye 160 tiles), y PASS de simulación de instrucciones 6502 comparada contra TEST286 con siete cuadros consecutivos y distintos desplazamientos. **PENDIENTE validación visual/rendimiento en VICE y PASS del usuario**.

## Objetivo

Reducir tiempo de CPU de los desplazamientos horizontales **individuales y Group Animate** de Bitmap Multicolor. TEST286 ya procesa solamente caracteres afectados, pero en cada fila repetía `ASL lo / ROL hi / DEX / BNE` tantas veces como bits de desplazamiento (1 a 7). El costo dependía de la fase, sobre todo cerca de 6-7 bits.

TEST290 usa un **blitter lookup-table** inspirado en prácticas de demoscene C64:

`salida = (A << bits) | (B >>> (8-bits))`.

El cálculo se transforma en dos lecturas a tablas de 256 bytes (alineadas a página), `ORA` y la escritura al bitmap. Un par de operandos absolutos de `LDA abs,X` se parchean **una vez por animador/fase** para escoger las páginas adecuadas, no una vez por píxel.

### Tablas
- 7×256 bytes para `A << bits` con bits 1–7
- 7×256 bytes para `B >>> (8-bits)`
- TOTAL: **3.584 bytes**, sin necesidad de precalcular patrones del atlas por cada fase.
- Fase cero usa copia directa y no consulta las tablas.
- Se colocan en una dirección **alineada a 256 bytes justo después de los metadatos** del grupo: se elimina el gran hueco de un emplazamiento fijo.
- Se conserva el atlas de **256 patrones ×8 bytes = 2.048 bytes** y su buffer de trabajo de 2.048 bytes.
- Si los datos no caben en RAM alta por debajo de $D000, TEST290 informa error, nunca sobreescribe VIC o memoria de I/O.

## Rendimiento de la prueba sintética 6502

Se comparó **TEST286 vs TEST290 con idéntico mapa y fases** a través de 7 cuadros de salida, alternando Scroll Right grupal y Scroll Left individual. El simulador ejecutó opcodes 6502 y contó ciclos de cada subrutina. Fue una medición **analítica/simulada de instrucciones 6502**, no una captura ni cronometraje de VICE:

| Escenario (grupo 16 tiles visibles) | Ciclos render TEST286 | Ciclos render TEST290 | Mejora |
|---|---:|---:|---:|
| Group Right 1 bit + individual Left | 94.467 | 52.374 | **44,6 %** |
| Group Right 3 bits | 88.516 | 50.614 | **42,8 %** |
| Group Right 6 bits | 75.318 | 47.400 | **37,1 %** |

En los tres casos **0 diferencias entre los 8.000 bytes de bitmap producidos por ambas versiones en los siete cuadros**. La rutina de refresco a bitmap no cambia: la ganancia citada corresponde al **cálculo de patrones** (no implica ese porcentaje de ganancia global ni garantiza un tick bajo stress).

## Validación de memoria y PRG (después del empaquetado)

| Caso | Atlas original | Metadatos | LUT | PRG aproximado |
|---|---:|---:|---:|---:|
| 16 tiles visibles, grupo 10×16 | 2048 B | 472 B | 3584 B | **38.913 B** |
| 160 tiles visibles, grupo 10×16 | 2048 B | 1768 B | 3584 B | **40.193 B** |
| Grupo más 256 IDs en el mapa, 172 ocurrencias animadas | 2048 B | 1796 B | 3584 B | **40.449 B** |

Comprobada la alineación de LUT, su contenido exacto y su posición sin solapamiento. El aumento de tamaño del PRG frente a TEST286 contiene las tablas; no es una duplicación de frames.

## Cómo probar

1. [TEST290 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test290-bitmap-mc-group-lut/).
2. Cargar el proyecto usado en TEST289 PASS, elegir `SCREEN → Multicolor Bitmap (Experimental)`.
3. Seleccionar un grupo de tiles animados con `Group Animate → Scroll Right`, Ticks/Frame 2 y Pixels/Tick 1. Probar otro con `Scroll Left`.
4. Exportar mediante el **menú normal Export PRG**, sin botones extra. Archivo `RICO_TEST290_BITMAP_MC_LUT.prg`.
5. Abrir en VICE. Comparar a velocidad normal con un PRG exportado por TEST289, preferentemente con el mismo grupo, mapa, número de celdas y velocidad.
6. Probar grupos de 16, 32, 64 tiles, y después stress de 160. Informar si aparecen saltos, ralentizaciones, colores cambiados o diferencias.

## Limitaciones y advertencias

- Solo optimizamos **movimientos horizontales individuales y grupales** ya exportables por TEST286. No se incluyeron Up/Down, Ping Pong, SID, Map Scroll ni cambios de frames.
- **La optimización reproduce exactamente la semántica de bits de TEST286.** Este test todavía no convierte Pixels/Tick a pares de bits C64: en Bitmap MC un píxel visible = dos bits. Un desplazamiento de 1 bit puede mezclar códigos de color 2-bit. Mantener esa equivalencia es deliberado para poder comparar velocidad y byte a byte sin confundir errores visuales con una optimización. La corrección de desplazamiento por píxel multicolor debe evaluarse de forma separada.
- **La ganancia no elimina el límite de ciclos por frame.** En PAL el cuadro completo dispone de 19.656 ciclos antes de descuentos VIC; un grupo de 160 tiles puede necesitar varios cuadros. TEST290 no promete 1 tick para escenarios de stress.
- El cambio entre las dos versiones es el blitter ASM y sus lookup tables. No se altera el editor, la paleta BG/C1/C2/C3, Rico's Decolorize, los controles del índice, el cursor ni las rutinas previas de exportación de otros modos.
- El PRG sigue cargando todos los datos de imagen, tablas y estructuras sin compresión. TEST290 no utiliza un segundo bitmap de pantalla: no introduce parpadeo por cambio de buffers.

## Referencias consultadas

- [Codebase64 — modos de pantalla del C64](https://codebase64.c64.org/doku.php?id=base:built_in_screen_modes)
- [C64-Wiki — tiempo de raster](https://www.c64-wiki.com/wiki/raster_time)
- [Lemon64 — scroll horizontal de Bitmap Multicolor](https://www.lemon64.com/forum/viewtopic.php?t=83482)
- [How Things Work — doble buffer bitmap](https://www.filfre.net/2013/08/how-things-work-commodore-64-and-summer-games-edition/)

**Enlaces:** [WEB TEST290](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test290-bitmap-mc-group-lut/), [ZIP TEST290](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test290-bitmap-mc-group-lut.zip).
