# TEST294 — C64 Speedcode Fan-Out adaptativo, 256 tiles y doble buffer

**Fecha:** sábado 24 de octubre de 2026.
**Base:** TEST293 experimental; TEST292 confirmado por el usuario **sin parpadeos**; TEST289 PASS del editor.
**Estado:** TEST294 PASS en simulador de CPU 6502, comparación del bitmap y generación de PRG; **PENDIENTE PASS visual y velocidad en VICE**.
**No altera MASTER ni ramas previas.**

## Hallazgo después de TEST293

El usuario comprobó que TEST293 conservó la eliminación del parpadeo, pero no produjo una aceleración perceptible. Reducir 15,1 % de ciclos por actualización en 1000 apariciones todavía dejaba **187.051 ciclos** por paso; ese ahorro no es necesariamente apreciable cuando siguen siendo muchos cuadros PAL por actualización.

## Nueva técnica — Speedcode (demoscene)

Inspirado en Codebase64, se genera código máquina 6502 **específico para cada tile del mapa que aparece repetido muchas veces**. En lugar de interpretar una lista de destinos en cada cuadro:

```asm
LDY #7
.row
 LDA ($E2),Y      ; mismo byte del tile origen de esta fila
 STA $6F00,Y      ; ocurrencia 1 (ejemplo ilustrativo)
 STA $7100,Y      ; ocurrencia 2
 STA $7238,Y      ; ocurrencia 3
 ; ... otras direcciones reales del proyecto
 DEY
 BMI .done
 JMP .row
.done
 RTS
```

**Se generan dos variantes de cada rutina**, una para el bitmap $6000–$7F3F, otra para $E000–$FF3F. El motor elige la del bitmap oculto usando el estado del doble buffer y hace el flip de VIC solo al finalizar la imagen completa.

Los bloques de código generados ocupan **$3800–$5AFF**, una región libre entre las fuentes de imagen iniciales y la Screen RAM VIC en $5C00. No se tocan los dos bitmaps ni su Color RAM.

Se especializan los IDs con **16 o más apariciones** hasta la capacidad disponible. Los demás IDs continúan por el blitter agrupado de TEST293. La política adaptativa anterior sigue vigente: si `apariciones < 3 × IDs animados`, se exporta directamente la variante TEST292 para evitar regresiones.

### Caso máximo — 256 IDs, 1000 apariciones visibles

En la escena sintética de máximo estrés, el tile 0 aparece **745 veces** y otros 255 IDs aparecen una vez cada uno. Para el tile 0 se generan dos versiones de speedcode de **4.492 bytes en total**.

| Versión | Ciclos por actualización de 1000 celdas (CPU simulada) |
|---|---:|
| TEST292 (double buffer inicial) | 220.200 |
| TEST293 (agrupado, PASS de equivalencia) | 187.051 |
| **TEST294 (speedcode fan-out)** | **97.531** |

- Reducción **47,9 %** respecto de TEST293.
- Reducción **55,7 %** respecto de TEST292.
- La simulación ejecutó tres estados de imagen consecutivos en ambas versiones. **0 diferencias en 8000 bytes de bitmap y 1000 bytes de Screen RAM por estado**.
- No hubo errores de instrucción ni fallos de banco.
- La prueba con solo 255 apariciones reproduce exactamente la rutina de TEST292 (sin regresión: mismo conteo de ciclos).
- También se compiló un escenario de 1000 celdas compartidas entre cuatro IDs repetidos. El generador creó speedcode para los cuatro, **6088 bytes** de código, sin superar la región $3800–$5AFF. Este último caso es PASS de generación, no benchmark de ciclos.

### Límites físicos

El C64 PAL tiene ~19.656 ciclos teóricos por cuadro antes de descuentos del VIC. Incluso con **97.531 ciclos** en el peor caso, el trabajo equivale al presupuesto bruto de aproximadamente 5 cuadros. No se puede prometer 8 píxeles MC por *cada* cuadro PAL cuando deben cambiar 1000 celdas. TEST294 acelera la generación de cuadros completos **sin sacrificar el doble buffer**, pero aún no se probó la velocidad en VICE.

La técnica conserva **8 píxeles multicolor reales por paso = 16 bits = dos columnas de tiles**, 256 patrones originales de 8 bytes, fondos BG y las paletas independientes por celda C1/C2/C3.

## Cómo probar en VICE

1. Abrí [TEST294 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test294-bitmap-speedcode-fanout/).
2. Conservá exactamente el mapa usado en TEST293 con los 256 tiles, el grupo de animación horizontal y los mismos parámetros. Debe tener **Pixels/Tick = 8**.
3. Exportá por el **menú normal Export PRG**. Se obtiene `RICO_TEST294_MC_SPEEDCODE_256TILES.prg`.
4. Ejecutalo en VICE, comparándolo con los PRG de TEST292 y TEST293, con el mismo video/tiempo de captura.
5. Comprobá que **el doble buffer sigue eliminando el parpadeo**, y que el desplazamiento resulta apreciablemente más rápido.
6. Para diagnosticar qué ruta se eligió, inspeccioná `window.RICO_TEST294_LAST_EXPORT`: `visibleCells`, `distinctTileIDs`, `specializedIDs`, `speedcodeBytes` y `fasterRenderer`.

## Limitaciones
- Único grupo horizontal Scroll Left/Right, Pixels/Tick 8 para la vía rápida; otros casos se delegan en TEST293/292/290.
- No se añadieron animaciones individuales o grupales simultáneas a esta vía rápida, scroll vertical, Ping Pong, SID ni Map Scroll.
- La selección de tiles no cambia: el motor especializa las **apariciones de celda**.
- La cifra de ciclos es del simulador 6502, no del VIC-II real (no descuenta badlines ni cuantiza el raster).
- Si hay más destinos especiales de los que caben bajo $5B00, el exportador utiliza el blitter agrupado para los restantes.
- Queda pendiente prueba visual, frecuencia real del movimiento, y prueba de guardado completo de preferencias del editor.

## Referencia técnica
Codebase64 — **Speedcode a.k.a. Loop Unrolling**, por Cruzer/CML:
https://codebase.c64.org/doku.php?id=base:speedcode

## Entregables
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test294-bitmap-speedcode-fanout/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test294-bitmap-speedcode-fanout.zip
- Script: `TEST/test294-bitmap-speedcode-fanout/js/RICO_BITMAP_MC_SPEEDCODE_TEST294.js`
