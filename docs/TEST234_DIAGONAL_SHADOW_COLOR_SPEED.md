# TEST234 — Desplazamiento incremental de colores en diagonales densas

**Estado: FAIL confirmado por el usuario en VICE** (22/10/2026): anomalías visuales en el ZIP y el bug persiste tras recuperar el sistema de lanzamiento. **No promover**. Base de trabajo restaurada a TEST232 PASS, master congelado.

## Comparación empírica (capturas del usuario, 22/10/2026)
- Video diagonal: `2026-10-22 11-36-12.mkv`, 11,417 segundos, 60 fps.
- Video Up: `2026-10-22 11-37-15.mkv`, 10,584 segundos, 60 fps.
- Sobre una región central del mapa, la diagonal produjo cambios apreciables de pantalla en ~21 % de los fotogramas (≈13/s); Up en ~77 % (≈46/s). Son **estimaciones por diferencias de imagen**, no una medida precisa del ciclo IRQ ni de distancia; posible influencia de repetición de arte, sincronización del grabador y compresión. No concluir que configuraciones diferentes de Ticks/Step hayan sido descartadas.

## Diagnóstico
El motor diagonal TEST221 requiere, según ruta, recomponer 1000 colores del mundo en `$0C00`, explorar el shadow de 1000 celdas y aplicar cambios a Color RAM; o interpretar tramos RLE dentro del IRQ. TEST233 usa STA directos solo si las tablas de todas las posiciones caben. Con mapas densos normalmente cae en fallback (384 mapas simulados: solo 48 seleccionaron TEST233).

El scroll vertical TEST227/232 ganó velocidad precisamente cuando evitó estos recorridos costosos por frame.

## Arquitectura del TEST234
- Módulo `js/RICO_PRG_DIAGONAL_COLOR_SHADOW_SHIFT_TEST234.js` cargado después de TEST233, antes del adaptador SID.
- Cuando TEST233 ya entra con direct STA, **no lo sustituye**.
- Para mapas diagonales multicolor densos con filas duplicadas (`fastRows`), mueve la memoria de colores existente `$0C00–$0FE7` **dentro del propio shadow**, usando orden ascendente/descendente según `dx + 40×dy` para evitar pisar datos todavía necesarios.
- Solo obtiene del mapa la columna y fila entrantes (~65 celdas) y reemplaza exactamente esas posiciones.
- En el IRQ usa el `commit_colors199` original: copia la matriz de colores actualizada hacia `$D800–$DBFF` de arriba hacia abajo, evitando un intérprete RLE y el escaneo de diferencias.
- No modifica `plan_step`, desplazar caracteres, IRQ de SID, modo de 25 filas, `Pixels/Step` ni `Ticks/Step`.

## Pruebas de fuente
- **384 configuraciones**: 272 utilizaron incremental-shadow, 48 mantuvieron TEST233 directo, 64 mantuvieron el generador anterior.
- En cada configuración se simuló el avance diagonal y se verificaron las 1000 posiciones visibles de color comparadas con el mapa original; cero discrepancias.
- **192 escenarios con PSID de 4 KB, 4.875, 6 KB y 8 KB**: integración ASM completada, con núcleo en `$2000`, `$9000` o `$C000` según tamaño.
- Tamaño del núcleo en las muestras: cota conservadora de menos de 2236 bytes, dejando >1.8 KB dentro del segmento `$2000–$2FFF`.
- **Las pruebas estáticas no prueban todavía ni velocidad ni ausencia de tearing en VICE.**

## Prueba en VICE
1. Abrir [TEST234](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/?v=test234).
2. Usar mismo mapa y parámetros de ambos videos, primero **diagonal Up/Left, 8 Pixels/Step, 1 Tick/Step**.
3. Confirmar `RICO_TEST234_LAST_BUILD.mode === "incremental-shadow"`. Si dice `previous`, indicar `RICO_TEST233_LAST_BUILD.selected` para saber si lo cubre la ruta directa de TEST233.
4. Comparar velocidad y **color de cada fila durante movimiento**: vigilar tearing, franjas o colores que aparezcan tarde. Comprobar Left/Right y Up/Down para regresiones, aunque sus JS no se tocaron.
5. Probar otras 3 diagonales, velocidades 1/2/4/8 y SID opcional tras PASS inicial.

No consolidar como MASTER hasta PASS visual. Rollback: `CHECKPOINT_TEST232_FINE_COLOR_PASS_22_OCT_2026`.


## Resultado FAIL y causa pendiente de verificar

- Usuario confirma que TEST234 presenta un **bug visual** en la edición ZIP incluso tras volver al `START_LVLLVL_TEST01.bat` habitual. El cambio de perfil de Edge fue un problema independiente de workflow y ya se descartó.
- `gh-pages` se restauró a `CHECKPOINT_TEST232_FINE_COLOR_PASS_22_OCT_2026` (`fa8b53feeeef8daba4713d3f6d38974ba613bb64`). La rama experimental y su release de reproducción se conservan sin sobreescribir.
- **Sospecha de temporización**: TEST234 sustituye el commit color RLE por `commit_colors199`, que copia 4 bytes por iteración durante 256 iteraciones en IRQ. Solo ese bucle implica aproximadamente `256 × (4×(LDA abs,X 4 ciclos + STA abs,X 5 ciclos) + INX 2 + BNE 3) = 10.496` ciclos, sin contar IRQ ni otras rutinas. Se ejecuta desde raster `$FA` y puede alcanzar el siguiente período de pantalla visible, causando tearing/parpadeo. **Esta explicación aún no está validada con monitor VICE**.
- Por lo tanto **NO reutilizar el commit de pantalla completa dentro del IRQ** para una nueva versión. Medir tiempos/cadencia de la rutina de Color RAM y explorar actualizaciones incrementales sincronizadas con raster o direct STA segura con límites de ciclos.
- Mantener `TEST232 PASS` como referencia, no afirmar que TEST233 o TEST234 mejoraron el rendimiento.
