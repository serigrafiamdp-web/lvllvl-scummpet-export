# TEST300 — Fast Hot Dispatch + Trident-inspired PAL Raster Scheduler

**Fecha:** 25 de octubre de 2026. **Estado:** PASS en emulador de instrucciones 6502 y equivalencia de bitmap; **PENDIENTE comprobación real en VICE**.  
**Último PASS confirmado por el usuario:** TEST297, rama `release/test297-pass-2026-10-24`.  
**MASTER intacto.** TEST299 y TEST298 permanecen tal como fueron guardados.

## Objetivo
Conseguir una nueva mejora perceptible de la cadencia de animación grupal Bitmap MC con 256 IDs y 1000 apariciones, conservando el doble buffer. TEST298 redujo ciclos pero no FPS visibles; TEST299 adelantó el raster y el video mostró una mejora medida de ~7.15 a ~8.35 actualizaciones/s, que el usuario no consideró relevante.

Este TEST300 combina **ambas técnicas** para intentar superar otro límite de raster.

## Cambios concretos
- Parte del motor y HTML experimental de TEST299, no del MASTER.
- Incorpora del TEST298 la selección de las páginas de handler speedcode **una sola vez por fase y banco VIC**.
- Evalúa si el tile ID tiene handler *antes* de leer sus cuatro bytes de metadatos de celdas/destinos. Los IDs especializados van directamente al speedcode, preservando una ruta agrupada para los demás.
- Conserva la ventana segura de flip de TEST299 (raster 251–311 y 0–34), su planificación sin la espera inicial fija cuando Ticks/Frame=1, y el doble buffer físico: bitmap1 $6000, bitmap2 $E000.
- No toca la función de render de píxeles, el atlas de 256×8 bytes, las paletas por celda C1/C2/C3, los 8 píxeles efectivos por paso ni el selector visual del editor.
- Sigue usando **el menú normal Export PRG**. No se agrega panel ni botón de exportación.
- Para otras configuraciones o escenas no elegibles, conserva las rutas de fallback anteriores.
- El módulo genérico de raster de TEST299 permanece en `TEST/test299-trident-raster-scheduler/js/RICO_C64_RASTER_LAB_TEST299.js` y se reutiliza por referencia, sin modificarlo.

## Validación interna
Se generaron tres PRG comparables: TEST297 PASS, TEST299 y TEST300. Prueba sintética con los **256 IDs del grupo distribuido por 1000 celdas** (`id = (y*40+x)%256`), direcciones Right y Left, `Pixels/Tick=8`, `Ticks/Frame=1`.

Se ejecutaron instrucciones de CPU 6502 con raster PAL de 312 líneas × 63 ciclos:
- **11 cambios efectivos de banco VIC-II** por caso.
- **0 diferencias** comparando 8000 bytes de bitmap y 1000 bytes de Screen RAM en los tres motores por cambio de banco.
- Los 11 flips de TEST300 ocurrieron en la línea raster 251 (dentro de la ventana segura establecida).
- Sin instrucciones ilegales, punteros inválidos ni cambio de paletas.
- PRG TEST300: 43.265 bytes, 194 IDs especializados (según el escenario), sin expansión del atlas.
- Fallback con un único ID caliente y `Ticks/Frame=2`: mismo PRG funcional que la ruta heredada.

### Cadencia del simulador (NO equivalente a VICE real)

| Motor | Actualizaciones/s sintéticas |
|---|---:|
| TEST297 PASS | 6,25 |
| TEST299 | 7,70 |
| TEST300 | **8,33** |

**TEST300 mejora un 8,3 % frente a TEST299 en este modelo.** El modelo de raster se basa en ciclos de CPU y NO resta DMA/badlines del VIC-II, ni mide tiempos reales de VICE. TEST299 mostró ~8,35 Hz *en video*, por lo que no debemos confundir esas mediciones de distinto origen ni extrapolar el porcentaje.

## Prueba en VICE
1. Abrir [TEST300 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test300-raster-early-hot-dispatch/).
2. Usar exactamente el mismo proyecto real que con TEST297/299: 256 caracteres, el mismo mapa 40×25 si corresponde, el mismo único grupo horizontal, `Pixels/Tick=8`, `Ticks/Frame=1`, mismos colores C1/C2/C3.
3. Exportar con **Export PRG** normal. Archivo `RICO_TEST300_MC_RASTER_EARLYHOT_256TILES.prg`.
4. Ejecutar en VICE y comparar directamente con TEST299 (referencia de ~6 fotogramas de captura a 50 FPS por desplazamiento) y TEST297 PASS (~7).
5. Confirmar **sin parpadeos, sin cambios de paleta y sin costuras**, y si ahora alcanza **~5 fotogramas por paso** o no. La mejora esperada es una hipótesis de prueba, no resultado garantizado.
6. En consola del navegador, `window.RICO_TEST300_LAST_EXPORT` indica motor escogido, apariciones, IDs especializados y política de raster.
7. Si no resulta más rápido, TEST297 PASS sigue disponible sin ninguna modificación.

## Contexto de técnicas Trident / Fairlight
TEST300 hereda el **control de ventanas de raster** y el desarrollo modular inspirado en la disciplina de sincronización de Trident. No incorpora todavía sus *overlapping IRQ handlers* ni modifica el ritmo del SID. Fuentes originales y próximos módulos están documentados en [ENGINE_DEMOSCENE_NOTES.md](../test299-trident-raster-scheduler/ENGINE_DEMOSCENE_NOTES.md).

## Enlaces
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test300-raster-early-hot-dispatch/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test300-raster-early-hot-dispatch.zip
- Script: `TEST/test300-raster-early-hot-dispatch/js/RICO_BITMAP_MC_RASTER_EARLYHOT_TEST300.js`
