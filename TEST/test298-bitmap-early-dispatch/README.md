# TEST298 — Early Hot Dispatch + VIC Bank Page Prepatch

**Fecha:** 24 de octubre de 2026 (Argentina).  
**Punto de partida:** **TEST297 PASS confirmado por el usuario en VICE**, guardado en `release/test297-pass-2026-10-24`. TEST298 se construyó en una rama independiente de esa referencia.  
**Estado:** PASS en simulación de CPU 6502 y equivalencia de bitmap; **pendiente PASS visual y de velocidad real en VICE**. Ni MASTER ni TEST297 PASS fueron modificados.

## Objetivo

Hemos ganado velocidad real con TEST297, que especializa muchos IDs moderadamente repetidos (desde 3 apariciones en el mapa). TEST298 aprovecha esa misma arquitectura y elimina operaciones innecesarias del loop principal: en cada ID especializado, TEST297 leía las cabeceras de cantidad y lista de destinos, aunque la rutina speedcode ya tenía sus `STA abs,Y` codificados. Además, consultaba si estaba oculto el banco1 o el banco3 para cada tile.

## Cambios técnicos

- Se mantiene el motor Bitmap Multicolor experimental de **256 patrones × 8 bytes**, exactamente **8 píxeles multicolor efectivos por paso**, los colores C1/C2/C3 de cada celda y el **doble buffer** del VIC-II.
- Las tablas de direcciones del speedcode para el banco destino se eligen **UNA vez por fase**, escribiendo los bytes altos de los operandos `LDA abs,X` en el propio ASM (autoparcheado, RAM bajo $01=$35).
- El bucle por ID lee la fuente y consulta el handler speedcode **ANTES** de leer los cuatro campos de metadata de destino/cantidad. Para IDs con handler, salta directamente al código especializado y a `groupAdvance`.
- Solo los IDs sin speedcode ejecutan la lectura de cabecera de cantidad y destinos y el copiador original agrupado, con comportamiento idéntico a TEST297.
- Conserva los fallbacks automáticos de TEST297 a TEST296/292 cuando la distribución física no favorece la especialización.
- Sin paneles o botones adicionales: **Export PRG** del menú normal.
- Diagnóstico: `window.RICO_TEST298_LAST_EXPORT` registra la ruta, cantidad de IDs especializados, celdas, ASM y modo de video.

## Validación 6502

Se construyeron y ejecutaron **dos PRG completos** por escenario (TEST297 PASS / TEST298) en un simulador de CPU 6502 con conteo de instrucciones y ciclos. Se compararon **11 estados consecutivos** de **8.000 bytes del bitmap visible y 1.000 bytes de Screen RAM**, tanto los dos bancos VIC como las fases.

| Escenario | TEST297 ciclos/paso | TEST298 ciclos/paso | Resultado |
|---|---:|---:|---|
| 256 IDs distribuidos en 1.000 celdas, Right | 121.960 | **112.424** | **7,8 % menos** |
| Mismo estrés, scroll Left | 121.960 | **112.424** | **7,8 % menos** |
| 4 IDs muy repetidos | 41.058 | 41.058 | fallback, sin penalización |
| Un solo ID muy repetido | 97.532 | 97.532 | fallback, sin penalización |
| 255 celdas con IDs casi únicos | 55.358 | 55.358 | fallback, sin penalización |

**Todos los escenarios: 0 diferencias de bitmap o colores durante los 11 estados, sin error de opcode.** El PRG distribuido conserva tamaño de **43.265 bytes**, con ASM de **596 bytes** y **194 IDs especializados**. No se agregó atlas de fases.

**Estas cifras NO son FPS reales de VICE.** Se mide el costo de instrucciones 6502 simuladas sin ciclo a ciclo exacto del VIC-II. La ganancia perceptible puede ser menor y todavía no equivale a 8 píxeles por cuadro PAL.

## Prueba de validación del usuario

1. Abrir [TEST298 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test298-bitmap-early-dispatch/).
2. Cargar **el mismo proyecto real** del último TEST297 PASS. No cambiar mapa, cantidad de tiles, colores, ni parámetros.
3. Activar SCREEN Bitmap Multicolor con un único Group Animate horizontal y **Pixels/Tick = 8**, como en TEST297.
4. Exportar desde el menú habitual **Export PRG**. Archivo `RICO_TEST298_MC_EARLY_DISPATCH_256TILES.prg`.
5. Ejecutar en VICE y comparar movimiento con el PRG del TEST297 PASS, buscando **mayor velocidad sin reaparición del parpadeo**.
6. Si no hay diferencia perceptible, inspeccionar `window.RICO_TEST298_LAST_EXPORT` para comprobar si el motor optimizado realmente fue seleccionado.

## Alcance protegido

- La referencia para volver a la última mejora aprobada es `release/test297-pass-2026-10-24`.
- TEST298 no reemplaza ni TEST297 PASS ni el MASTER.
- La ruta ASM rápida es solamente para un **grupo horizontal Bitmap MC a 8 píxeles/tick**. No agrega scroll vertical, Ping Pong, SID, mapa scroll u otros animadores simultáneos.

## Entregables

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test298-bitmap-early-dispatch/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test298-bitmap-early-dispatch.zip
- Fuente: `TEST/test298-bitmap-early-dispatch/js/RICO_BITMAP_MC_EARLY_TEST298.js`
