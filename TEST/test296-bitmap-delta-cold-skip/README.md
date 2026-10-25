# TEST296 — Bitmap Multicolor: Full-Tile Skip + Delta Speedcode

**Fecha:** sábado 24/10/2026. **Rama:** `release/test296-bitmap-delta-cold-skip`.  
**Base:** TEST295 experimental; TEST294 PASS de ganancia de velocidad según captura; TEST292 PASS sin parpadeos; TEST289 PASS del editor. MASTER y todas las pruebas anteriores intactas.  
**Estado TEST296:** PASS en generación de PRG y simulador 6502; **PENDIENTE PASS visual y de velocidad en VICE**.

## Nuevo hallazgo

TEST295 evita escribir filas de bitmap que ya tienen el valor correcto **para tiles muy repetidos (hot IDs)**. Sin embargo, seguía procesando las cabeceras, punteros de origen y hasta ocho escrituras de **todos los demás IDs seleccionados (cold IDs)**, incluso si ninguna fila de un cold ID iba a cambiar. En un grupo de 256 tiles esto genera decenas de miles de ciclos desperdiciados.

TEST296 aprovecha las mismas páginas de máscaras de diferencias ya presentes en TEST295, **sin añadir RAM de tablas**:
- Calcula una máscara de 8 bits por ID y por fase para los **256 tiles del grupo**, no solo para los más frecuentes.
- Recuerda que el mismo banco VIC fue visible dos actualizaciones antes: compara la fase `p` con `p−2`, no con `p−1`.
- Para los dos primeros cambios usa máscaras específicas contra la imagen inicial de ambos bancos (fase 0).
- En ASM, después de leer un tile ID, hace `LDA abs,X` en la página de máscaras. Si el byte de máscara vale cero, **salta directamente al siguiente ID sin cargar puntero, destino ni copiar sus ocho filas**.
- El código anterior de speedcode diferencial de TEST295 sigue atendiendo las filas individuales de los IDs altamente repetidos.
- Se conserva el doble buffer $6000/$E000, Screen $5C00/$C400, BG/C1/C2/C3 por celda, atlas de 256×8 bytes, scroll horizontal de 8 píxeles multicolor efectivos por paso y Export PRG habitual.

## Selección adaptativa

Hay un costo de consulta de máscara para cada tile visitado. Para evitar una regresión de velocidad:
- Solo activa la mejora nueva si el propio motor TEST295 es elegible.
- Debe haber al menos ocho cold IDs en el grupo y **20 % o más de máscaras cero** para ellos entre las fases cíclicas normales.
- Si el proyecto no alcanza ese umbral, el exportador emite **exactamente el PRG de TEST295**, con su código previo.
- Si TEST295 no aporta ahorro, se conservan automáticamente las rutas anteriores: TEST294 o TEST292.

La consola de la WEB permite inspeccionar `window.RICO_TEST296_LAST_EXPORT` y los campos `fasterRenderer`, `coldSkipPercent`, `skippedColdGroups`, `visibleCells` y `distinctTileIDs`.

## Validación CPU — 256 IDs y 1.000 celdas visibles

Pruebas sintéticas con el mismo mapa en TEST295 y TEST296, ejecutando código 6502 a través de **11 estados consecutivos**, alternando los dos bancos VIC, comparando por estado **8.000 bytes de bitmap y 1.000 bytes de Screen RAM**. Sin errores de opcode ni datos diferentes.

| Escenario | TEST295 ciclos/paso | TEST296 ciclos/paso | Cambio |
|---|---:|---:|---:|
| Muchos glyphs idénticos, tiles distintos en el índice | 67.918 | **14.041** | **−79,3 %** |
| Mezcla de un tercio variable y dos tercios repetidos | 88.903 | **67.957** | **−23,6 %** |
| Glyphs de mitad superior fija e inferior variable | 82.984 | 82.984 (fallback TEST295) | Sin cambios |
| Patrones muy variables | 97.532 | 97.532 (fallback TEST294) | Sin cambios |

Comprobación adicional: seis configuraciones de estrés con 256 IDs, 255–1.000 apariciones, un tile 0 vacío, un tile 0 repetido, 4 tiles muy repetidos y arte variable. El exportador eligió automáticamente TEST292, TEST294, TEST295 o TEST296 según correspondía. Sin solapamientos. Código ASM seleccionado TEST296: 635 bytes; PRG de estrés: **44.801 bytes** (sin aumento frente a TEST295, ya que reutiliza sus tablas existentes).

**Estas cifras son de una simulación de instrucciones 6502, no de VICE con temporización exacta de raster y badlines.** Especialmente los 14.041 ciclos corresponden a un caso sintético favorable: los tiles de distinto ID contienen patrones idénticos. No puede extrapolarse ese porcentaje al arte real del usuario.

## Protocolo de prueba visual

1. Abrí **[TEST296 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test296-bitmap-delta-cold-skip/)**.
2. Cargá **el mismo proyecto real** con el que validaste TEST294; no reduzcas la cantidad de tiles ni las dimensiones del mapa.
3. En SCREEN elegí Bitmap Multicolor, Group Animate horizontal, `Pixels/Tick=8`, mismos ticks y opciones previas.
4. Exportá usando el **menú normal Export PRG**, sin botones nuevos. Archivo `RICO_TEST296_MC_COLD_SKIP_256TILES.prg` cuando la ruta especial es elegible.
5. Abrilo en VICE, compará con TEST294/TEST295 bajo las mismas condiciones, y revisá: a) **velocidad perceptible** y b) **ausencia de parpadeos**.
6. Si no hay mejora, consultá `window.RICO_TEST296_LAST_EXPORT` y verificá si se seleccionó la ruta TEST296 o alguna de las anteriores.

## Límites

- Motor rápido solo para un Group Animate horizontal Left/Right con 8 píxeles MC por paso. No extiende los modos verticales, Ping Pong, Map Scroll, SID ni las animaciones simultáneas. Esos escenarios siguen usando su exportación de pruebas anteriores.
- Un índice de 256 tiles no equivale necesariamente a 256 celdas: puede haber hasta 1.000 apariciones visibles. La ganancia depende del **contenido de bits** y su semejanza entre fases.
- Algunos proyectos con patrones muy distintos no ganarán: se mantiene exactamente TEST294/295.
- Falta comprobarlo en VICE y medir la frecuencia de cambios visibles. **TEST296 no reemplaza MASTER**.

## Entregables

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test296-bitmap-delta-cold-skip/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test296-bitmap-delta-cold-skip.zip
- Script aditivo: `TEST/test296-bitmap-delta-cold-skip/js/RICO_BITMAP_MC_COLD_SKIP_TEST296.js`
