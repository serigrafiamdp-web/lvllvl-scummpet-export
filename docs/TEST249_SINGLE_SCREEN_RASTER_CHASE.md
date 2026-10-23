## Resultado VICE: TEST249 — 22/10/2026

El usuario probó el PRG TEST249 en VICE y confirmó: **«aún lo veo igual; aún no hay errores; lo veo bien»**, adjuntando `2026-10-22 23-05-40.mkv`.

Análisis de imagen a 60 fps, ROI de mapa y umbral de diferencias >4 unidades medias:
- Archivo de **10,55 s** (~634 cuadros capturados).
- **264 avances visuales detectados** = **24,98 avances/s** según duración del flujo de video decodificado (≈25 fps).
- Referencias medidas con el mismo método: TEST244 ≈24,95/s, TEST247 ≈24,95/s, TEST248 ≈24,99/s.
- Sin pausas prolongadas: intervalos de movimiento capturado fundamentalmente de 2 o 3 cuadros (con artefactos de captura aislados).
- Visualmente el arte y los colores aparecen estables en cuadros inspeccionados; el análisis de movimiento no constituye verificación exhaustiva de ausencia de tearing.
- **PASS provisional de estabilidad visual; FAIL para objetivo de aceleración.** No promover a MASTER.

**Nota de implementación importante:** Aunque el enfoque utiliza una única pantalla in-place, TEST249 aún ejecuta las 8 filas superiores y las 16 inferiores **en una sola interrupción**, encadenadas. Por lo tanto, no ensaya todavía las **tres franjas temporizadas detrás del raster** descritas por Oscar64. Para la próxima arquitectura hay que medir y separar realmente tres fases, preservando bordes y arte, no repetir la copia monolítica de 936 caracteres y 936 colores.

**Referencia conservada:** TEST244.

---

# TEST249 — Single-screen diagonal, Color RAM + caracteres en el mismo recorrido

**Estado: EXPERIMENTAL, pendiente de PRG real en VICE.** No declarar PASS ni acelerar el MASTER sin validación del usuario.

## Origen concreto

Nueva arquitectura adaptada de estos ejemplos reales de Oscar64:
- https://github.com/drmortalwombat/oscar64/blob/main/samples/scrolling/colorram.c — carácter/color sin doble buffer detrás del haz, con franjas raster.
- https://github.com/drmortalwombat/oscar64/blob/main/samples/scrolling/cgrid8way.c — movimiento sobre celdas coloreadas, precálculo de columna/fila y protección de costuras.

TEST244–248 lograron ~25 pasos/s estables en 8 píxeles y mapa arbitrario. TEST248 VICE: `$A020..A027 = D4 6A 69 00 34 80 48 01`; 106 commits, 105 IRQ ocupadas, 0 esperas con CPU libre y pantalla sin terminar, último commit al raster 308.

## Qué hace TEST249

1. Conserva la pantalla VIC en **$0400** (no `swap_screens`, no copiar $0400->$0800). Inicializa con el render original para preservar arte, fuentes y los colores.
2. Cuando el planificador solicita una diagonal, prepara en la CPU principal **130 bytes de bordes** en buffers $1F00..$1F81: 25 caracteres y 25 colores de columna; 40 caracteres y 40 colores de fila final.
3. En la interrupción de raster **$60 (línea 96)**, si todo está preparado, ejecuta código ASM generado para mover **936 caracteres + sus 936 posiciones Color RAM juntas**, estrictamente en dirección ascendente, del destino actual hacia la posición diagonal +39/+41. Así no sobrescribe su fuente antes de leerla.
4. Inmediatamente después aplica los 25+40 caracteres entrantes y 25+40 colores desde los buffers, actualiza cámara y programa siguiente avance.
5. Conservar `plan_step`, `apply_fine`, charset Bank1/Bank2 y el mapa 40×50 etc. No se toca RLE horizontal/vertical ni los motores de otras diagonales.

**Selección conservadora**: solo *Diagonal Up Left / Up Right* a 8 píxeles por paso, mapa de filas duplicadas, colores arbitrarios, sin Group Animate y sin SID nativo. Otras rutas devuelven intacta la fuente TEST244.

## Código / regiones RAM

- $1000..$1EA2: primer tramo, 8 filas, 312 posiciones × (LDA/STA char, LDA/STA Color RAM), desenrollado en archivo PRG.
- $1F00..$1F81: buffers temporales de entrada precomputados, sin colisión con el código.
- $2000..$29E3: código de motor, constructor de 6502 y escritura de bordes.
- $E000..$FD40: segundo tramo, 16 filas ×39 celdas =624 posiciones, generado al arrancar **después de** `LDA #$35; STA $01`, fuera del archivo PRG. Las órdenes generadas son LDA/STA con direcciones absolutas de Screen RAM y Color RAM, 12 bytes por posición.
- Los datos de mapa $4000 y colores $7000 no se modifican.
- $A100..$C340: restos inertes de código TEST244 que ya no se ejecutan en el nuevo desplazamiento (se preservan por seguridad; podrían podarse en una prueba futura).
- Archivo PRG no atraviesa I/O $D000..$DFFF: llega como máximo a $C340.
- El código del motor alternativo no está diseñado todavía para reproducir SID nativo. Si está seleccionado, **fallback TEST244**.

## Presupuesto temporal

- 936 celdas × (8 ciclos char + 8 ciclos color) = **14.976 ciclos** de copia in-place.
- Rellenar 65 celdas × (8 char + 8 color) ≈ **1.040 ciclos**.
- Sin contar IRQ, preparación de buffers, badlines y escrituras del VIC.
- Total del recorrido de actualización al menos 16.016 ciclos. Es una prueba de una pantalla y raster-chasing, **no prueba de 50 pasos/s**.

No se usan listas de diferencias por celda ni comparación de Color RAM.

## Pruebas realizadas fuera de VICE

- Generación en 32 combinaciones con dirección, Bank1/Bank2, mono/multicolor, 4/8 píxeles: 4 rutas TEST249 seleccionadas y 28 rutas conservan exactamente TEST244 (incluye horizontales/diagonales abajo/mono).
- Simulación de **14.400 cuadros completos** con mapas 40/45/57/76 × 25/32/41, dos diagonales ascendentes y tres patrones de color: **cero discrepancias** tanto en 1000 caracteres como en 1000 colores por cuadro.
- Chequeo estático ASM de saltos condicionales: **0 saltos fuera de rango**.
- Chequeo de regiones generadas: **0 solapamientos**; bloque $1000-$1EA2 y motor $2000-$29E3; ninguna región PRG supera $C340.
- JS evaluado y llamadas a exportador de código fuente válidas; **no se verificó ensamblado ni ejecución final en VICE**.
- Si aparece arte corrupto, flickering, colores desfasados, pantalla congelada o pérdida de música, TEST249 se considera FAIL y se vuelve a TEST244 sin alterar MASTER.

## Probar

WEB aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test249/

ZIP aislado: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test249-single-screen-raster-chase.zip

Mismo proyecto original TERRY, diagonal Up Left, Bank1, 8px por step, 1 tick, **sin SID**, VICE PAL sin warp. Comparar con TEST244 en fluidez real, velocidad (avances/s) y conservar todos los colores. Console: `window.RICO_TEST249_LAST_BUILD` debe dar `selected:true`, `mode:'single-screen-in-place-char-color'`.

Solo si pasa, explorar splitting real en tres franjas detrás del raster y posible descenso a 1 frame sin bloquear CPU.
