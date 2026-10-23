# MASTER LVLLVL RICO — VIERNES 23 DE OCTUBRE DE 2026

**ESTADO: MASTER CONGELADO DE TRABAJO — TEST254, rendimiento PASS en VICE, revisión fina de arte visual pendiente.**

Este checkpoint congela el progreso del editor LVLLVL RICO y su exportador PRG para Commodore 64. Mantener el buen aspecto visual tiene prioridad sobre alcanzar el máximo teórico de 50 movimientos por segundo. **No incluye la optimización TEST255.**

## Enlaces y fuente de verdad

- **MASTER 23 OCT 2026 (rama congelada)**: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026
- **ZIP completo del MASTER 23 OCT 2026**: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_23_OCTUBRE_2026.zip
- **WEB del TEST254, estable en pruebas**: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test254/
- **Código de la ruta que se conserva**: `js/RICO_PRG_DIAGONAL_UNROLL_EDGES_TEST254.js`, junto con las dependencias TEST196/236/244/249/250/251/252/253.
- **Documento técnico y video TEST254**: `docs/TEST254_UNROLLED_EDGES_6502.md`
- **Prueba posterior NO incluida en el MASTER**: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test255/
- **MASTER anterior del 22 OCT — rollback integral**: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026

**Importante:** La rama principal `main` y `gh-pages` tienen historias diferentes. No fusionar a ciegas. Este MASTER es el checkpoint de recuperación; la web predeterminada en la raíz de GitHub Pages no se sustituye por este snapshot, para no introducir regresiones ajenas.

## Por qué elegimos TEST254

Resultados medidos con MKV real de VICE:

| Ruta / test | Video | Desplazamientos visibles por segundo | Validación |
|---|---|---:|---|
| TEST244 | 2026-10-22 19-47-14.mkv | ~25,04 | referencia anterior |
| TEST248 | 2026-10-22 22-22-49.mkv | ~25,04 | referencia |
| TEST249 | 2026-10-22 23-05-40.mkv | ~25,02 | referencia |
| **TEST254** | **2026-10-23 01-25-00.mkv** | **~47,2** | **PASS de aceleración, visual bastante correcto según usuario** |
| TEST255 | 2026-10-23 01-44-08.mkv | ~47,1 | sin mejora mensurable; posible desincronización visual percibida |

La mejora TEST254 frente al ciclo anterior es de aproximadamente **+88,6%** (cerca de 1,89 veces). No se declara 50 fps PAL sostenidos. Se observaron cadencias próximas a 48–50 movimientos en segmentos cortos, y variaciones leves. La revisión visual minuciosa queda para el próximo encuentro.

**Decisión explícita del usuario 23 OCT:** «sí prefiero que se vea bien por más que no lleguemos al tope. Guardemos el progreso de hoy como MASTER VIERNES 23 DE OCTUBRE. Mañana seguimos».

Por ello **TEST255 se descarta del MASTER** hasta nuevo diagnóstico; no hacer más optimizaciones a costa de costuras, colores o fluidez visual.

## Arquitectura de la ruta TEST254 congelada

1. C64, ensamblador 6510/6502, scroll diagonal **arriba-izquierda / arriba-derecha**, 8 px por paso (modo de alto rendimiento).
2. VIC screen único en $0400 y Color RAM en $D800, copia directa de 936 pares carácter/color y actualización de bordes. No se elimina información cromática: mantiene los 16 colores de C64 y los índices de caracteres reales.
3. Motor de tres IRQ raster: aproximadamente líneas PAL 86 / 132 / 218. La última actualización cierra cerca de raster 49–50 del siguiente cuadro.
4. Caché de columnas transpuesto char/color para evitar rehacer punteros de filas, con datos de ejemplo TERRY en $8000–$967F (depende de dimensiones del mapa).
5. Rutina de preparación de bordes 6502 desenrollada: 25 posiciones de columna + 40 posiciones de última fila, con STA absoluto. Este cambio destrabó el cuello de CPU identificado en TEST253.
6. Cronómetro CIA1 de TEST253 **presente** en esta ruta, diagnóstico $A030–$A049; no eliminar en este MASTER. TEST255 es un experimento aparte que elimina profiler y 40 máscaras pero **NO forma parte de esta congelación**.
7. Compatibilidad de fallback: las combinaciones distintas al modo diagonal arriba a 8px/multicolor especificado retornan a las rutas anteriores (no promover la ruta TEST254 como universal).

Los demás modos y herramientas del LVLLVL, su editor, banks/tile sets, map scroll, player PRG y funcionalidades existentes se conservan como en la base de la rama TEST254. El MASTER no afirma que todos los modos hayan recibido validación individual con VICE.

## Evidencia del monitor del TEST254

```
(C:$2758) m a030 a049
>C:a030  53 01 d3 d4  de 44 97 8a  7a 77 37 00  53 00 35 00
>C:a040  4c 45 d4 01  00 01 57 00  66 89
(C:$a04a) m a020 a028
>C:a020  00 7a d3 00  00 32 00 50  01
```

- $A043=01 movimiento solicitado, $A044=00 CPU libre, $A045=01 preparación completa en la primera IRQ, $A046=57 (raster 87).
- Contraste TEST253: la primera IRQ encontraba CPU ocupada y preparación no disponible.
- Los contadores se desbordan módulo 256; las muestras CIA pueden corresponder a dos preparaciones distintas si VICE se detiene dentro de una de ellas. **No interpretar una diferencia de tiempos CIA mixta como duración válida.**

## Protocolo para retomar mañana

1. Partir **solo** de `MASTER_LVLLVL_RICO_23_OCTUBRE_2026` o de la rama inmutable de prueba `release/test254-unrolled-edge-preparation` (la primera ya está documentada como master). Crear una nueva rama TEST256 si hacen falta cambios. No tocar este MASTER.
2. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test254/ , cargar el mismo TERRY multicolor, diagonal Up Left, Bank1, 8px y 1tick, sin SID; probar en x64sc PAL sin Warp.
3. **Prioridad máxima: estética y sincronía de la imagen.** Examinar sobre todo costuras entre franjas, esquina inferior, bordes, y colores al máximo estrés con repetición circular del mapa. Marcar PASS de arte solamente tras validación consciente del usuario.
4. Si interesa diagnosticar el pequeño cambio rítmico, comparar resultados con TEST255 aislado. **No repetir una optimización de ciclos que no mejore la imagen ni su estabilidad.**
5. Medir 10–15 s de video con el mismo ROI y método, comprobando Speed ~100% de VICE y el ritmo visual; 47,2/s en video no prueba que el motor no esté ya avanzando cada PAL frame.
6. Si aparece un defecto, regresar al último PASS visual y probar arreglos pequeños en test nuevo. Mantener char y Color RAM correctos, 16 colores, y todos los fallback intactos.

## Criterios de respaldo

- **No modificar este branch MASTER** después del checkpoint.
- No cambiar `main` ni la raíz `gh-pages` solo para integrar el motor experimental.
- Documentar cada nuevo TEST con código, ZIP de rama, web de prueba y resultados VICE.
- Conservar TEST254 y TEST255 como pruebas separadas; conservar MASTER del 22 como respaldo anterior.

**Cierre:** 23 de octubre de 2026. Se prioriza corrección visual sobre perseguir 50/s; la performance PASS TEST254 queda respaldada, la validación visual final se reanudará después.
