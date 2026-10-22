# TEST210 — CIA SIDTracker64 real + raster independiente

Estado: EXPERIMENTAL, pendiente de VICE. TEST208 es PASS confirmado por el usuario, TEST209 es FAIL: WEB reproducia minimercado acelerado, ZIP reproducia audio con pantalla azul BASIC. TEST210 no consolida TEST209.

## Archivo real analizado
- `minimercado(1).sid`, PSID v2 de SidTracker64, LOAD/INIT/PLAY = $1000/$1000/$1003.
- Timer A latch escrito en $187A: `LDA #$37 / LDX #$60 / STA $DC04 / STX $DC05`.
- $6037 = 24631; frecuencia del timer PAL 985248/(24631+1) = 39.9987 Hz.
- El fichero SID del usuario NO se añade al repositorio.

## Cambio frente a TEST209
- No usar llamadas SID aproximadas a ~40Hz dentro de un único IRQ de video.
- INIT del SID conserva sus escrituras $DC04/$DC05. Una vez instalado el vector IRQ, habilitar CIA1 Timer A ($DC0D=$81, $DC0E=$11); el hardware ejecuta PLAY exactamente cuando vence el timer de la canción.
- IRQ unificado: guardar A/X/Y y reconocer CIA1 desde $DC0D; reconocer VIC desde $D019. Si es IRQ VIC, ejecutar solo scheduler de imagen, map scroll, cambios de Color RAM y Group Animate; si es CIA exclusivamente, no mover ni cambiar ningún frame; al final de ambas rutas, ejecutar SID PLAY si había CIA pendiente. Esto protege la prioridad de la imagen.
- Registro temporal del origen CIA en ZP $58 (fuera de ZP ya usada por nuestro motor).
- Cuando el PSID no presenta un timer único detectable, conservar el comportamiento original TEST208 (~60 Hz CIA); cuando no requiere CIA, conservar VBlank 50 Hz. El selector manual 50/100 Hz sigue disponible.
- El exportador conserva 1,2,... frames sujeto a RAM real, no impone mínimo 8.
- Identidad visible TEST210 en etiqueta de dialogo y salida de export: `window.RICO_TEST210_LAST_EXPORT` registra velocidad real elegida, cantidad de frames y timer.
- No se modifican los motores de scroll/color TEST203/204/205/206.

## Validacion ejecutada
- 54 combinaciones simuladas de exportacion: 1,2,8 frames; 1 frame estatica, horizontal y diagonal; Group Scroll None/Up/Right; SIDTracker64 CIA y PSID VBlank.
- Revision estatica de fuente 6502: 0 saltos relativos fuera de rango, 0 etiquetas duplicadas y código bajo $3000.
- No es prueba de VICE ni audio en hardware. La pantalla azul reportada en TEST209 tiene causa aun no demostrada.

## Prueba VICE
- WEB y ZIP deben mostrar `TEST210` en la seccion SID. Elegir `Auto: usar CIA Timer A real cuando esté disponible`.
- Empezar con 1 frame + `minimercado(1).sid`, despues 8 frames + scroll.
- Verificar tanto sonido a tempo correcto como imagen/color visibles. Si ZIP difiere de WEB, compartir PRG generado para inspeccion binaria.
- TEST208 de referencia: `release/test208-web-local-clean`.
