# RICO TEST211 — Contrato SID compartido LVLLVL / SCUMM

**Estado:** EXPERIMENTAL, requiere confirmación en VICE. TEST208 confirmado PASS por usuario; TEST209 y TEST210 FAIL. Estos tres estados se mantienen explícitos. No promover cambios a MAIN ni sobrescribir TEST208.

## Objetivo

Independizar la cadencia de audio del número de frames, Frame Duration, Group Scroll, scroll horizontal/diagonal y carga de trabajo gráfica. Conservar la misma ABI compatible con la demo SCUMM-PET-C64 para posterior integración.

## Fuente probada

Repositorio https://github.com/serigrafiamdp-web/SCUMM-PET-C64

- `engine/main.ras`: secuencia de init/boot y activación de CIA en primer raster, audio Slot A/B, carga de SID B.
- `engine/assets/porro_slot1_dual_irq.bin`: handler $2E89 y wrapper PLAY $2ECC.
- `engine/assets/porro_init_capture_zp.bin`: captura ZP $F0-$FF inmediatamente después del INIT.
- Protocolo SCUMM: LOAD original, INIT $1000 / PLAY $1003 en la demo, TIMER A nativo del SID, IRQ CIA para música y VIC raster para gráficos.
- En LVLLVL se respetan las direcciones INIT/PLAY obtenidas del encabezado PSID (sin suponer $1000/$1003 para cualquier canción).

## Interfaz de TEST211

- `sid_init_protected211`: copia $F0-$FF del motor a `sid_engine_zp211`, invoca el INIT con A=subtune, captura $F0-$FF en `sid_private_zp211` y restaura al motor.
- `sid_play_protected211`: guarda motor $F0-$FF, intercambia por valores privados SID, llama a PLAY y recupera ambos estados por separado.
- `sid_cia_pending211`: marca de IRQ CIA actual.
- `sid_start_gate211`: cero tras INIT; Timer A solo se habilita al llegar el primer VIC raster, una única vez ($DC0D=$81, $DC0E=$11).
- Temporizador SIDTracker64: la canción configura $DC04/$DC05 mediante INIT. La frecuencia del SID `MINIMERCADO` es $6037 (aproximadamente 39.9987 Hz PAL).
- Audio CIA se atiende ANTES de rutina raster si ambos IRQ están pendientes. IRQ CIA sin VIC no avanza el scroll ni Group Scroll.
- PSID VBlank o configuración manual 50/100Hz siguen por el IRQ raster, pero también usan el wrapper con ZP privado.
- Sin SID no se modifica el exportador previo. Ningún mínimo nuevo de frames: 1 o más hasta el límite real de RAM de cada proyecto.

## Memoria C64

- SID $1000-$1FFF, fuente PRG y código $2000-$2FFF.
- El wrapper, buffers ZP y contadores se ubican en el final libre del código bajo $3000, utilizando **etiquetas**, sin copiar las direcciones $34BE, $34CE o $43AF del SCUMM (conflictivas con LVLLVL).
- Los 16 bytes $F0-$FF son intercambiados temporalmente; las variables del motor se restauran después de cada INIT y PLAY.
- Listas de colores TEST203, si están presentes, reubicadas de $1000-$17FF hacia $B000-$B7FF (condicional). Comprobar conflictos de memoria antes de empaquetar.
- No requiere cargar ni copiar ningún binario SCUMM en el PRG.

## Diagnóstico musical independiente del video

Contadores de 16 bits generados en código C64:
- `sid_audio_ticks_lo211`, `sid_audio_ticks_hi211`: se incrementan solamente al llamar a PLAY.
- `sid_video_ticks_lo211`, `sid_video_ticks_hi211`: se incrementan exclusivamente en IRQ VIC.

Para una máquina PAL a 50Hz y un SID con Timer A=$6037: en 5 segundos esperar aproximadamente **200 llamadas PLAY** y **250 raster ticks**. La cantidad de frames no cambia esos totales; solo el trabajo visual. En VICE usar los símbolos/etiquetas del PRG o el código fuente exportado para ubicar y observar los contadores.

## Verificaciones realizadas (no son ejecución VICE)

- 54 combinaciones simuladas para 1,2,8 frames, estática/horizontal/diagonal, Group Scroll ninguno/up/right, PSID CIA nativo y VBlank.
- Fuentes 6502 inspeccionadas: 0 saltos relativos fuera de rango, 0 etiquetas duplicadas, 0 JSR/JMP sin resolver, código bajo $3000.
- No se confirma el tempo ni la imagen real hasta ejecutar el PRG en VICE.

## Test de aceptación

1. `MINIMERCADO` en Auto, 1 frame: SID audible a 40 Hz y pantalla visible.
2. Mismo SID, 8 frames y scroll horizontal: misma cadencia y colores, todas las frames correctamente rotadas.
3. Repetir PSID VBlank 50Hz de referencia; que no haya regresión.
4. Comparar aumento de contadores de AUDIO/VIC en VICE y comprobar si hay pérdida de ticks por carga gráfica.
5. Solo si pasa, considerar consolidar la ABI en el futuro motor SCUMM.
