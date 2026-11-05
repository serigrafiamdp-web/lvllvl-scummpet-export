# TEST333 — Diagnóstico de líneas horizontales al agregar un SID

> **TEST333 FAIL funcional (05/11/2026):** el usuario volvió a observar basura gráfica con SID, incluso después de priorizar video en la IRQ. No atribuir PASS a esta prueba. La investigación continúa en [TEST334, aislamiento de Zero Page](../test334-sid-zp-sandbox/). Sin SID la imagen funciona.


**Estado: EXPERIMENTAL. NO PASS en VICE.** La imagen sin SID está bien, pero al agregar SID aparecen franjas horizontales tanto con **Map Scroll Left/Right** como en **las diagonales**. El problema es común a la rutina musical y no específico de una dirección.

## Hipótesis principal
El adaptador original `RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` ejecuta `sid_play_protected211` al entrar en la IRQ raster, antes de ejecutar el commit de colores VIC-II y del intercambio de los screen buffers. Una rutina SID costosa puede desplazar ese commit más allá de la posición del haz en PAL y crear líneas horizontales de Color RAM.

## Cambio aislado
- Para PSID VBlank y selección manual **50 Hz/100 Hz**, mantiene la IRQ original salvo que reubica `JSR sid_play_protected211` **después de `group182_irq_tick` y después del commit gráfico**, antes de restaurar A/X/Y.
- En PSID con **CIA Timer A hardware**: IRQ solo CIA continúa ejecutando PLAY inmediatamente; si CIA y VIC coinciden, confirma video primero y hace PLAY al final del IRQ.
- No altera el archivo SID, el tempo elegido, el motor de scroll, el mapa, el charset, el repack ECM TEST331 ni los datos de Color RAM.
- El sistema de aislamiento de Zero Page `$F0–$FF` y el cálculo de memoria del TEST229 se conservan; **no se modifica todavía la protección de otros registros ZP**.
- Si el motor no expone la etiqueta de salida IRQ gráfica reconocida, se devuelve un error explícito, no una exportación silenciosa distinta.
- El diagnóstico `window.RICO_TEST333_LAST_PATCH` muestra `mode`, `engineTail` y las direcciones SID.

## Validación
**Ocho pruebas de generación ASM**: Horizontal y Diagonal con velocidad 50/100/fallback 60 Hz y CIA Timer A; se comprobó que el audio se desplaza al final del turno gráfico y que las interrupciones exclusivamente CIA conservan PLAY. Se comprobó sintaxis JavaScript. **No equivale a ensamblado 6502 real ni a VICE.**

## Comparación para VICE
1. Abrir TEST332 y TEST333 en dos pestañas. Usar **la misma imagen y el mismo SID**.
2. Exportar horizontal y diagonal, primero SID en **50 Hz manual**. Comparar si desaparecen las líneas.
3. Después probar **Auto/CIA**, ya que SIDTracker64 y otros PSID pueden usar su propio Timer A.
4. Si aparecen franjas en TEST333, proporcionar el **SID exacto y el PRG con música**, para inspeccionar escrituras a Zero Page fuera de `$F0–$FF`, colisiones de memoria y ciclos PAL.

Enlace: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test333-sid-graphics-first/

**TEST332 original:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test332-unified-120x120/

No se modifica la raíz TEST329 ni el archivo del motor SID original.

## Prueba integrada Export PRG

Además de las ocho pruebas sintéticas del fragmento de IRQ, se ejecutó la cadena real de envoltorios JS con el botón `createPRG` y un **SID PSID de prueba artificial** (INIT/PLAY válidos pero música vacía) usando un ensamblador simulado:

| Ruta | Sin SID | Con SID | ECM | 4 fondos VIC | PLAY en salida IRQ posterior al grupo |
| --- | --- | --- | --- | --- | --- |
| Horizontal Left 100×25 | ASM generado | ASM generado | Sí | Sí | Sí |
| Diagonal Up-Left 120×120 | ASM generado | ASM generado | Sí | Sí | Sí |

En diagonal se verificó que permanece la sección de Color RAM compactada en `$8000`. En ambos motores el PRG con SID contiene `SID_ORIGINAL_LVLLVL_TEST211` y `RICO_TEST333_LAST_PATCH.mode='raster video-first'`. Se corrigió también un salto CIA puro que podía exceder el alcance relativo del 6502: ahora usa una rama local y un salto absoluto a la salida de audio.

**Limitaciones:** este test NO simuló los tiempos de una canción auténtica ni compiló 6502 ejecutable; la causa del defecto sigue siendo una hipótesis hasta probar en VICE con el SID que produce las franjas. Si persisten, prioridad a analizar ZP y escrituras VIC del SID real.
