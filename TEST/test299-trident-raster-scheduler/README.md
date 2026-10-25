# TEST299 — Trident/Fairlight-inspired Raster Scheduler (PAL-B)

**Fecha:** 25 de octubre de 2026. **Base:** `release/test297-pass-2026-10-24` — TEST297 confirmado PASS por el usuario en VICE. El código y las ramas del MASTER/TEST297 no se modificaron.

## Qué estamos probando

**No cambiamos ni una instrucción del blitter distribuido de TEST297** (salvo el control del bucle de timing). Los 256 tiles, hasta 1000 apariciones reales, 8 píxeles Multicolor por paso, C1/C2/C3, código especializado y el doble buffer mantienen sus semánticas anteriores.

**Problema detectado:** TEST297 renderizaba el frame completo y esperó SIEMPRE el raster 250 para cambiar el banco. A continuación, al volver a la etiqueta `tick`, esperaba de nuevo el raster 250 para empezar la próxima operación, perdiendo tiempo CPU que podría usarse para dibujar la imagen oculta. En ciertas fases, el render ya había terminado después de la oportunidad de swap, añadiendo latencia hasta la próxima visita a la línea 250.

**TEST299:**
- Una rutina reusable `RICO_C64_RASTER_LAB_299.emitSafeWindow`, implementada independientemente del exporter.
- Solo cuando hay un único Group Animate Left/Right a 8 px Multicolor/tick y `Ticks/Frame=1`, el renderer empieza la siguiente fase inmediatamente tras el flip; cuando termine la operación pesada, presenta el buffer completo durante una **ventana segura del raster PAL** (251–311 o 0–34).
- Elige siempre el banco contrario, preserva Color RAM y Screen RAM, y cambia `$DD00/$D018` sin mostrarse una imagen parcialmente construida.
- Fallback automático al TEST297 PASS con otros Ticks/Frame o si su scheduler no está cargado.
- Exporta desde **Export PRG** del menú habitual, sin botones nuevos. Archivo `RICO_TEST299_MC_RASTER_EARLYFLIP_256TILES.prg`.

## Inspiración y autoría

Revisamos el código ASM `anonymous-irq-handlers-example.s` del repo original [Trident/Fairlight](https://github.com/trident64/c64/blob/main/anonymous-irq-handlers-example.s) y [los artículos sobre IRQ anónimas](https://trident64.github.io/anonymous-irq-handlers/) y [IRQ superpuestos](https://trident64.github.io/overlapping-irq-handlers/). **TEST299 NO instala IRQ ni reproduce literalmente la macro original de Trident**: traslada al problema de la presentación de doble buffer la disciplina de programar eventos de raster de forma explícita. El guardado de IRQ y la coexistencia con un SID a 50 Hz se estudiarán por separado.

[Notas de ingeniería reutilizables](./ENGINE_DEMOSCENE_NOTES.md): principios, bibliografía y próximos módulos (SID, mapa, grupal, SCUMM).

## Validación interna — NO sustituye VICE

Simulador de instrucciones 6502 con raster físico estimado a partir de 312×63 ciclos PAL:
- Dos direcciones: Group Right y Group Left.
- 256 IDs distribuidos en 1000 celdas de 40×25: PASS.
- 11 imágenes sucesivas, completos 8000 bytes Bitmap y 1000 bytes de Screen RAM: **cero diferencias** contra TEST297.
- Intercambio de bancos siempre fuera del área visible: **PASS**, raster 260, 15, 251, 7, etc.
- Cadencia del escenario sintético: TEST297 6,25 presentaciones/s frente a TEST299 7,70; **~23 % estimado de mejora**. El modelo **no incluye DMA/badlines reales del VIC-II** y el VICE puede arrojar valores diferentes.
- Rutas no elegibles no ejecutan el scheduler nuevo: fallback TEST297.

No se cambia el color de celdas durante las actualizaciones, no existe IRQ/SID nuevo y no se garantiza compatibilidad NTSC para el scheduler de ventanas PAL.

## Prueba que debe realizar el usuario

1. [Abrir TEST299 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test299-trident-raster-scheduler/).
2. Cargar **exactamente el proyecto real** de TEST297 PASS.
3. Activar Bitmap Multicolor, mismo grupo de hasta 256 tiles, mismas apariciones, Group Scroll horizontal con `Pixels/Tick=8`, `Ticks/Frame=1`.
4. Usar el menú normal Export PRG; se generará `RICO_TEST299_MC_RASTER_EARLYFLIP_256TILES.prg`.
5. Ejecutar en VICE y comparar con TEST297: medir cuántos cuadros dura cada paso y comprobar que no reaparece tearing/parpadeo.
6. Si no mejora o falla, seguir trabajando desde `release/test297-pass-2026-10-24`.
7. Abrir consola del navegador y examinar `window.RICO_TEST299_LAST_EXPORT`; campo `rasterPolicy` señala el motor escogido.

## Ficheros y URLs

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test299-trident-raster-scheduler/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test299-trident-raster-scheduler.zip
- Motor: `js/RICO_BITMAP_MC_RASTER_TEST299.js`
- Librería timing reusable: `js/RICO_C64_RASTER_LAB_TEST299.js`
- Reglas generales: `ENGINE_DEMOSCENE_NOTES.md`
