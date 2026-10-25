# TEST295 — Differential Speedcode, Bitmap Multicolor / doble buffer

**Fecha:** 24 de octubre de 2026  
**Base:** TEST294 (mejora visual medida ~19 % frente a TEST293), TEST292 (doble buffer sin parpadeo), TEST289 (PASS editor).  
**Estado TEST295:** simulación de CPU, equivalencia de bitmap, elección adaptativa y estrés de 256 tiles: **PASS interno**. **PENDIENTE PASS visual y velocidad real en VICE.**  
**MASTER y todos los TEST anteriores permanecen intactos.**

## Qué cambia respecto a TEST294

TEST294 usa speedcode con `LDA ($E2),Y` y muchos `STA abs,Y` para enviar cada fila de un tile a todos sus destinos físicos. Aunque esos destinos estén en un bitmap *oculto*, puede ser redundante escribir una fila que **ya tiene el mismo contenido**.

TEST295 genera máscaras de filas modificadas de 8 bits a partir de los **256 glifos base (2048 bytes)**. Para cada tile muy repetido, considera la textura origen correspondiente a la fase actual y la textura que el mismo banco VIC tiene guardada desde la última vez que se mostró.

**La fase anterior del mismo banco NO es p−1 sino p−2**, porque los bancos se alternan. Además, ambos bancos empiezan con fase 0, por lo que las dos primeras actualizaciones requieren máscaras especiales. Ignorar ese detalle produciría imágenes inconsistentes después de los cambios de banco.

### Speedcode 6502

```asm
    LDY #7
.row:
    LSR $EF        ; siguiente bit de máscara de fila (7 → 0)
    BCS .write
    JMP .next
.write:
    LDA ($E2),Y    ; fuente original del tile de esta fase
    STA $6000,Y    ; destino real 1 — ejemplo
    STA $6080,Y    ; destino real 2 — ejemplo
    ; … otros destinos generados por JS (1 o más)
.next:
    DEY
    BMI .end
    JMP .row
.end:
    RTS
```

Solo se ejecutan las escrituras físicas de las filas que difieren. Cuando las ocho filas están iguales, se omite directamente ese tile; cuando todas cambiaron, no se omite ninguna. TEST295 continúa usando dos copias de cada bloque speedcode: banco 1 (`$6000`) y banco 3 (`$E000`), más la sincronización al borde de TEST292.

La máscara se precalcula al **exportar**, no durante el tick C64. El motor conserva el tratamiento de BG/C1/C2/C3 por celda, el atlas completo de 256 tiles, las animaciones de un grupo horizontal y `Pixels/Tick=8` (8 píxeles multicolor reales equivalen a 16 bits).

## Selección automática para no empeorar otros casos

El nuevo exportador calcula el porcentaje de filas que se mantendrán iguales en **las fases normales** (excluyendo el ahorro excepcional de arranque):

- Si al menos **10 %** de esas filas ponderadas por su número de apariciones permanece igual, activa TEST295.
- Si no alcanza ese porcentaje, usa exactamente la construcción de TEST294, conservando su doble buffer y speedcode anterior.
- Si el grupo tiene pocos destinos por ID, se conserva la delegación anterior hacia TEST292.
- Si las máscaras no entran debajo de `$D000`, recurre a TEST294 en lugar de provocar solapamiento de memoria.

Las tablas diferenciales empiezan en una página alineada después de las tablas de punteros de TEST294; comprenden dos páginas especiales de arranque y una página por fase cíclica. En el caso 16×16, ocho fases, son **2560 bytes** de máscaras.

## Comparación de velocidad — ciclos de instrucciones simulados

**No son FPS de VICE ni aceleraciones garantizadas para el arte real.** Cada escenario sintético usa el mismo mapa/cantidades en TEST294 y TEST295.

| Escenario de 256 IDs | TEST294 ciclos/paso | TEST295 ciclos/paso | Reducción |
|---|---:|---:|---:|
| 1000 apariciones; mitad de filas repetidas | ~97.532 | ~82.984 | **14,9 %** |
| 1000 apariciones; todos los patrones comparados son iguales | ~97.532 | ~67.918 | **30,4 %** |
| 1000 apariciones; 4 IDs muy repetidos, mitad de filas repetidas | ~41.058 | ~21.363 | **48,0 %** |
| 1000 apariciones; filas muy variables | ~97.532 | ~97.532 (fallback TEST294) | **0 %** |
| 255 apariciones, casi todos los IDs únicos | ruta TEST292 | ruta TEST292 | **0 %** |

La mejora máxima de 48 % corresponde a **un caso favorable preparado para estresar 4 tiles repetidos**, NO a una medición del proyecto real.

## Validación de equivalencia

- Pruebas de 256 caracteres con 1000 apariciones: PASS.
- Fuentes aleatorias con cambios en todas las filas: usa fallback TEST294 y no modifica los bytes: PASS.
- Prueba con mitad superior estable y mitad inferior variable: **11 estados consecutivos**, sin diferencias de bitmap (8000 bytes por estado) ni de Screen RAM (1000 bytes por estado), incluyendo vuelta de fase 7 a fase 0: PASS.
- Caso de 4 tiles muy repetidos: **11 estados consecutivos**, bancos alternos 2/0, 0 diferencias de bitmap ni de Screen RAM respecto de TEST294: PASS.
- Primeras dos imágenes con máscaras de inicialización: PASS.
- PRG del grupo 16×16 con 1000 apariciones: **44.801 bytes**, ASM 627 bytes (escenario de un ID muy repetido). En la prueba de 4 IDs: **43.521 bytes**, ASM 732 bytes.
- Mapa y paleta de celdas original sin recolorear ni restampar en la exportación: mismo resultado que TEST294 en las pruebas.

## Cómo comprobarlo en VICE

1. Abrí [TEST295 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test295-bitmap-delta-speedcode/).
2. Importá **exactamente el mismo proyecto** de TEST294, manteniendo los 256 caracteres, las mismas apariciones sobre el mapa, Group Animate horizontal y `Pixels/Tick=8`.
3. Exportá por el **menú normal Export PRG**. Se genera `RICO_TEST295_MC_DELTA_SPEEDCODE_256TILES.prg` en el flujo habitual.
4. Comprobá en VICE que el movimiento conserve los colores y **no reaparezca el parpadeo**.
5. Compará la velocidad con TEST294 en las mismas condiciones. No reduzcás los caracteres.
6. Para saber si se activó la técnica o si eligió el fallback, consultá en la consola `window.RICO_TEST295_LAST_EXPORT` y observá `fasterRenderer`, `steadyStateSkipPercent` y `skippedRowStoresEstimate`.

## Límites
- Optimiza principalmente IDs muy repetidos con filas bitmap iguales entre estados del mismo banco. Un arte muy cambiante puede no ganar velocidad: entonces se preserva TEST294.
- Solo la ruta Bitmap Multicolor con un único grupo horizontal `Left`/`Right` a `Pixels/Tick=8`; otros movimientos siguen por las rutas anteriores.
- El C64 PAL dispone de ~19656 ciclos brutos por cuadro antes de badlines/VIC. Incluso los 21.363 ciclos del caso favorable con 4 IDs no garantizan un desplazamiento cada frame.
- Sigue pendiente confirmar el resultado visual y la cadencia de pasos en VICE real. No está aprobado como nuevo MASTER.

## Archivos
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test295-bitmap-delta-speedcode/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test295-bitmap-delta-speedcode.zip
- Script: `TEST/test295-bitmap-delta-speedcode/js/RICO_BITMAP_MC_DELTA_TEST295.js`
