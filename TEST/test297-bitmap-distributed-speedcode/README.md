# TEST297 — Distributed Speedcode / 256 tiles / Bitmap MC

**24 de octubre de 2026. Estado: TEST experimental, pendiente PASS en VICE.**

## Diagnóstico real (video del usuario)

Video `2026-10-24 22-47-48.mkv`: duración 10,34 s, captura 50 FPS. Al medir los cambios en la región central de la imagen se identificaron **47 cambios visibles**, con una cadencia de **10,96 fotogramas de captura por actualización**, equivalente a ~**4,56 actualizaciones por segundo**. No se aprecian desgarros o parpadeo significativo; el doble buffer sigue cumpliendo su cometido. **No hay mejora visible de TEST296 en este video**, conforme informa el usuario.

## Causa plausible de los tests anteriores sin mejora

Las ramas TEST294–296 especializan mediante speedcode únicamente los IDs con **16 o más apariciones físicas**. En el estrés de laboratorio 1000 celdas/256 IDs, se había repetido el ID 0 unas 745 veces; el speedcode era efectivo. En un dibujo grande con 256 IDs distribuidos y alrededor de 3–4 apariciones por ID, ningún ID llega a 16 y el speedcode puede quedar sin uso. **El video no contiene el JSON ni los IDs originales, por lo que esta explicación es una hipótesis fundada en el código, NO una medición de la distribución real del proyecto.**

## Cambios TEST297

1. Motor basado en TEST294, integrado sobre TEST296 para mantener todas las opciones de fallback. El speedcode se genera para **IDs con al menos 3 apariciones** y se priorizan los IDs más repetidos.
2. No se usa una secuencia de `CPX #tileID/BNE` por cada ID especializado. Se generan **cuatro tablas de 256 direcciones** en RAM alta: byte bajo/alto de los handlers del banco1 y bajo/alto del banco3. Una consulta directa por índice devuelve la dirección de la rutina específica en **tiempo constante**.
3. El 6510 usa `JSR` a un **trampolín con `JMP ($F0)`** para llamar el speedcode del ID; la instrucción `RTS` de cada rutina vuelve al bucle de grupos. Esto permite especializar muchos IDs sin agotar el código ASM de `$0810–$0FFF`.
4. Los destinos `STA absoluto,Y` son específicos del mapa, y se generan **dos copias por ID**, para $6000 y $E000 respectivamente, sin escribir sobre el banco visible.
5. Se limita el speedcode total a la región segura `$3800–$5AFF` (~8,9 KB). En el estrés distribuido de 256 IDs se especializan **194 IDs**, ocupando 8924 bytes; los demás IDs usan el blitter agrupado original.
6. Las tablas de despacho residen en cuatro páginas alineadas después de los metadatos existentes (caso prueba cerca de `$AD00–$B100`), bajo $D000.
7. **Adaptativo:** si aparecen menos de ocho IDs candidatos elegibles, vuelve al motor TEST296 (que puede delegar en TEST295, TEST294 y TEST292). Conserva el comportamiento anterior para escenas dominadas por un solo tile, o con casi todos los tiles únicos.
8. Exporta mediante **el menú normal Export PRG**; no agrega paneles ni botones. Archivo `RICO_TEST297_MC_DISTRIBUTED_SPEEDCODE_256TILES.prg` cuando aplica la nueva ruta.

## Prueba de carga realista, no un solo ID repetido 745 veces

Se generó una matriz de **40×25 = 1000 celdas físicas** usando `tileID = (y×40+x) % 256`, por lo que **los 256 IDs aparecen entre 3 y 4 veces cada uno**, sin concentrar el trabajo en el ID 0.

| | TEST296 | TEST297 |
|---|---:|---:|
| Apariciones físicas de grupo | 1000 | 1000 |
| IDs especializados por speedcode | 0 | **194** |
| Ciclos de CPU / actualización, simulador 6502 | **187.044** | **120.990** |
| Ganancia CPU simulada | — | **35,3 %** |
| Imagen resultante en 11 estados | Referencia | **0 diferencias** |
| Screen RAM en 11 estados | Referencia | **0 diferencias** |

Las dos rutas ejecutaron 11 estados consecutivos, alternando ambos bancos VIC, incluyendo la vuelta al inicio del ciclo; se compararon por estado **8000 bytes de bitmap y 1000 bytes de pantalla**. Sin errores de opcodes ni incoherencias. Es una prueba **SIMULADA**, no una medición de FPS en VICE. Se incluyeron las fases 0–7, 0–2, no se alteraron los colores C1/C2/C3.

Para la distribución concentrada (tile 0 repetido, los otros IDs casi únicos), TEST297 delega automáticamente en TEST296. Para 255 IDs casi únicos también preserva la ruta TEST292. El PRG de estrés distribuido tiene ~43 KB, el ASM del dispatcher ocupa 586 bytes.

## Cómo probar con el proyecto real

1. Abrí la [WEB TEST297](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test297-bitmap-distributed-speedcode/).
2. Importá **el mismo mapa exacto**, los mismos 256 tiles, un Group Animate horizontal Left/Right, `Pixels/Tick=8` y los mismos ticks.
3. Usá el menú **Export PRG** normal; abrí en VICE.
4. Comprobá **ausencia de parpadeo** y si los pasos ocurren con menor separación que los ~11 fotogramas de captura de TEST296.
5. Después de exportar podés consultar en la consola web: `window.RICO_TEST297_LAST_EXPORT`:
   - `fasterRenderer`: qué ruta se eligió exactamente;
   - `distinctTileIDs`: IDs físicos distintos;
   - `specializedIDs`: IDs que recibieron speedcode;
   - `specializedCells`: suma de las apariciones que atienden las rutinas especializadas;
   - `candidateIDs`: candidatos de 3+ apariciones;
   - `visibleCells`: apariciones reales en el bitmap;
   - `speedcodeBytes`: código especializado creado.

**Importante:** si el mapa real no tiene al menos ocho IDs repetidos tres veces, TEST297 hará fallback y no se espera aceleración. En ese caso, esta información identificará con precisión el próximo cuello de botella en lugar de especular a partir del video.

## Alcance y restricciones

- Conserva el doble buffer y las paletas por celda, los 256 tiles de 8 bytes, el movimiento horizontal de 8 píxeles multicolor reales y el menú normal.
- No agrega movimientos verticales, Ping Pong, SID, mapa scroll ni simultaneidad con otros animadores a esta ruta.
- No altera **TEST289 PASS**, TEST292 sin parpadeos, TEST294/295/296 ni el MASTER.
- **TEST297 pendiente de PASS visual y rendimiento en el C64/VICE.**

### Enlaces
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test297-bitmap-distributed-speedcode/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test297-bitmap-distributed-speedcode.zip
- Código aditivo: `TEST/test297-bitmap-distributed-speedcode/js/RICO_BITMAP_MC_DISTRIBUTED_TEST297.js`
