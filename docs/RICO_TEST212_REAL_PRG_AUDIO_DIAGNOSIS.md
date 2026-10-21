# TEST212 — Corrección comprobable de AUTO CIA de SIDTracker64

**Estado:** EXPERIMENTAL, pendiente de VICE. TEST208 PASS confirmado; TEST209/TEST210/TEST211 no lograron la velocidad esperada de MINIMERCADO.

## Evidencia de archivos suministrados por el usuario (NO subir los archivos personales)

- Audio de referencia: captura SIDPLAY64 de MINIMERCADO, duración 30,485 s.
- Audio de TEST211: captura 2026-10-21 18-31-31.mkv, duración 16,750 s.
- PRG analizado: TERRY NUEVO 2 (5)(1).prg, LOAD $0801, final $A002.
- SID original: minimercado(1).sid, PSID v2 PAL, INIT $1000 / PLAY $1003, subtune CIA, latch Timer A $6037 (24631), ~39,9987 Hz PAL.
- La canción embebida en PRG coincide con el SID original.

### Medición de aceleración

- Patrón repetitivo: SIDPLAY64 2,00 segundos vs TEST211 1,60 segundos.
- Factor 2/1,6 = 1,25, un **25 % más rápido**.
- Corresponde a 50/40 = 1,25, compatible con modo **50 Hz raster** en lugar del CIA real.
- La grabación TEST211 muestra imagen y colores correctos; el problema observado es principalmente de selección de reloj musical.

### Verificación de instrucciones del PRG REAL

- IRQ en $20A2; en $20A7 comienza `LDA #$01 ; STA $D019` para reconocer IRQ VIC-II.
- En $20B3 aparece `JSR $2311`, entrada del wrapper `sid_play_protected211` (PLAY directo en cada IRQ de video).
- El wrapper llama `JSR $1003` cerca de $232A.
- **NO** aparecen `STA $DC0E`, `LDA #$81 ; STA $DC0D`, ni el gate de Timer A para música.
- Por ello el PRG exportado por TEST211 está realmente en modo raster, NO CIA, aunque el PSID contiene el latch correcto.
- La inspección de código JS original encontró la ruta `args.sidSpeed===1||2 ? args.sidSpeed : SID_STATE.speed`: un valor antiguo enviado por LVLLVL puede imponerse sobre la selección Auto de la UI SID.

## Cambios mínimos TEST212

- Selección de modo SID separada de `args.sidSpeed` (valor legado no confiable).
- Leer el valor **actual** del select `#ricoSid207Speed`: 0=Auto, 1=50 Hz manual, 2=100 Hz manual.
- Para exportación programática, aceptar `args.sidPlaybackMode212` explícito (no reutiliza `sidSpeed` legado).
- Cuando Auto + PSID CIA + un único Timer A válido, **siempre** generar IRQ hardware CIA.
- Si la elección contradice la ruta CIA esperada, cancelar con error: no degradar silenciosamente.
- Mostrar `TEST212 AUTO / CIA1 Timer A hardware` en el diálogo y `window.RICO_TEST212_LAST_EXPORT` en consola, incluyendo `legacyArgsSidSpeedIgnored`.
- VBlank PAL sigue 50 Hz; 50 y 100 Hz elegidos manualmente siguen funcionando.
- Ninguna regla de cantidad de frames; sin cambios al scroll ni al contrato ZP compartido compatible con SCUMM-PET-C64 de TEST211.

## Pruebas técnicas, no hardware

- 60 escenarios simulados con 1,2,8 frames, static/horizontal/diagonal, Group Scroll, VBlank vs CIA, Auto/50/100.
- Todos PASS en selección de ruta al suministrar intencionalmente `args.sidSpeed:1`: AUTO CIA activa Timer A, manual 50 y 100 permanecen manuales; no reemplaza automáticamente el modo elegido.
- Prueba definitiva pendiente en VICE: medir 2,00 s por patrón (en lugar de 1,60) y comprobar imagen estable en los dos exportadores WEB/LOCAL.
- No modificar la ROM ni los archivos de canciones; los medios del usuario permanecen fuera de GitHub.

## Referencia SCUMM

https://github.com/serigrafiamdp-web/SCUMM-PET-C64/blob/main/engine/main.ras

`engine/assets/porro_slot1_dual_irq.bin`: IRQ VIC/CIA separado y protegido, compatible con el player compartido de TEST211.
