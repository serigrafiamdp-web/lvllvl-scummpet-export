# TEST293 — Grouped Blitter adaptativo + doble buffer (Bitmap MC)

**Fecha:** sábado 24 de octubre de 2026. **Base:** TEST292, validado visualmente por el usuario como **sin parpadeos**, aunque todavía lento. La base estable del editor sigue siendo **TEST289 PASS**. Master, TEST289 y TEST292 intactos.

**Estado de TEST293:** PASS en pruebas de sintaxis, compilación, 6502 simulado y comparación exacta de bitmap; **pendiente PASS visual y velocidad en VICE**.

## Diagnóstico a partir de `2026-10-24 16-53-19.mkv`

Captura 1920×1080, 50 fps, duración 11,3 segundos. El usuario confirma que TEST292 eliminó los parpadeos pero no ganó velocidad. La técnica de doble buffer **elimina la presentación de cuadros incompletos**, pero no elimina las escrituras de cada celda del bitmap: hay que optimizar el blitter.

TEST292 recorre cada **aparición física** de los tiles. Para cada una resuelve el tile ID, consulta dos tablas de punteros de fase, carga la dirección del destino y copia 8 bytes. En un mapa de 256 IDs donde el tile 0 aparece repetido como fondo, hay hasta 1000 apariciones y se repite el lookup de origen hasta 1000 veces.

## Nueva técnica

**Group-by-Tile 6502 blitter, con 8 escrituras de bytes desenrolladas**:

- Ordena las apariciones por **tile ID (0..255)** durante la exportación JS.
- Calcula la dirección de origen del tile **una sola vez por cada ID por fase**.
- Itera después sobre una lista compacta de destinos **de dos bytes cada uno**, reutilizando ese origen.
- Copia los 8 bytes del patrón sin `DEY/BPL` por cada fila. No guarda ningún bitmap de fase adicional.
- Mantiene el doble buffer de TEST292:
  - Bank 1: bitmap $6000 y Screen $5C00, $DD00=2, $D018=$78.
  - Bank 3: bitmap $E000 y Screen $C400, $DD00=0, $D018=$18.
  - $01=$35, flip durante el borde inferior al terminar completamente la actualización.
- Mantiene 256 IDs, fondo y colores C1/C2/C3 ya existentes. El incremento de fase sigue siendo **8 píxeles multicolor efectivos = 16 bits = 2 columnas de tile**.
- La exportación continúa desde el **menú normal Export PRG**, sin agregar botones.

### Selección adaptativa del motor

La agrupación no siempre acelera: cuando cada ID solo aparece una vez, recorrer las cabeceras de grupo cuesta más que la lectura individual. TEST293 usa un criterio deliberadamente conservador:

- Si `apariciones < 3 × IDs animados`, reutiliza exactamente el motor TEST292.
- Si `apariciones >= 3 × IDs animados`, activa **TEST293 Grouped Blitter**.

Se informa la selección en `window.RICO_TEST293_LAST_EXPORT.fasterRenderer` después de exportar.

## Comparación CPU emulada con el MISMO bitmap

Se ejecutaron instrucciones 6502, se contabilizaron ciclos CPU incluyendo saltos y cruces de páginas, y se compararon 3 estados consecutivos de **8.000 bytes de bitmap y 1.000 bytes de pantalla** entre TEST292 y TEST293.

| Escenario | TEST292 ciclos/paso | TEST293 ciclos/paso | Cambio |
|---|---:|---:|---|
| 256 IDs, **1000 apariciones** | 220.200 | 187.051 | **15,1 % menos** |
| 255 apariciones (tile 0 vacío) | 56.249 | 66.234 (agrupado puro) | **17,8 % peor** |

**Los dos motores generaron 0 diferencias de bitmap y Screen RAM** durante los 3 estados, sin instrucciones ilegales ni errores de ejecución. Por eso TEST293 incorpora selección adaptativa: en el caso de 255 apariciones **usa TEST292 (56.249 ciclos)**, y en el caso de 1000 usa TEST293 (187.051 ciclos).

**Cuidado:** este es un conteo de ciclos mediante un emulador de instrucciones construido para la prueba, **no un benchmark de VICE con timing VIC-II exacto**, DMA/badlines o audio. La mejora global de velocidad puede ser menor en hardware real.

### Límite de hardware
Un cuadro PAL tiene 19.656 ciclos teóricos completos, antes de consumos del VIC. Por tanto 187.051 ciclos siguen siendo más de 9 cuadros PAL teóricos de trabajo. No se alcanzan **8 píxeles multicolor por cada cuadro físico** en el caso extremo; TEST293 constituye una optimización parcial medible, sin solución mágica para las 1000 escrituras.

## Memoria
| Segmento | Dirección | Estrés 1000 apariciones |
|---|---|---:|
| Atlas original 256×8 | $8000 | 2048 B |
| Cabeceras agrupadas (ID/count/list ptr) | desde $9008 | 5×256 = 1280 B |
| Lista de destinos (2 B/aparición) | después de cabeceras | 2000 B |
| Tablas por fase (source lo/hi) | páginas alineadas | 4096 B |
| Última dirección de datos | $AD00 | dentro de RAM alta |

PRG generado en estrés: **42.241 bytes**; ASM de la ruta agrupada **546 bytes**. La rama de 255 apariciones usa directamente el PRG de TEST292.

## Protocolo de comparación en VICE

1. Abrí **[TEST293 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test293-bitmap-grouped-blitter/)**.
2. Usá exactamente el mismo mapa grande de TEST292, sin tocar BG/C1/C2/C3, selección, tamaño del mapa, ticks ni scroll.
3. En un solo Group Animate horizontal configurá **Pixels/Tick=8**. Exportá mediante Export PRG.
4. Ejecutá el archivo `RICO_TEST293_MC_GROUPED_256TILES.prg` en VICE (si la rama adaptativa eligió la ruta TEST292, el nombre de archivo sigue indicando TEST293, pero el reporte de consola explica cuál motor eligió).
5. Confirmá dos cosas: **sin parpadeos** y **si realmente aumentó la velocidad** respecto de TEST292.
6. En consola de navegador, `window.RICO_TEST293_LAST_EXPORT` muestra `visibleCells`, `distinctTileIDs`, `fasterRenderer`.
7. Si el aumento sigue siendo insuficiente, investigar el costo mínimo de cada escritura o un motor con código desenrollado dinámico / actualización incremental, con validación de 256 IDs y celdas físicas.

## Enlaces

- [TEST293 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test293-bitmap-grouped-blitter/)
- [TEST293 ZIP](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test293-bitmap-grouped-blitter.zip)
- `TEST/test293-bitmap-grouped-blitter/js/RICO_BITMAP_MC_GROUPED_TEST293.js`

## Bibliografía técnica

- [Codebase64: Advanced Optimizing](https://codebase.c64.org/doku.php?id=base:advanced_optimizing)
- [The Transactor: Bitmap copy and unrolled loops](https://www.commodore.ca/wp-content/uploads/2015/12/the_transactor_vol09_02_1988_dec-www-commodore-ca.pdf)
