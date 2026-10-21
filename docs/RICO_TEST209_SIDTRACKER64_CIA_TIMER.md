# RICO TEST209 — SIDTracker64 CIA Timer A

**Estado:** EXPERIMENTAL. Validación visual/audible pendiente en VICE. TEST208 queda conservado como referencia y no se modifica MAIN.

## Diagnóstico basado en el archivo `minimercado(1).sid`

- PSID v2, autor `LOS PAT MORITAS`, canción `MINIMERCADO`.
- LOAD=$1000, INIT=$1000, PLAY=$1003; PAL, velocidad de subtune marcada CIA.
- Las instrucciones en $187A..$1883 son:
  `LDA #$37 / LDX #$60 / STA $DC04 / STX $DC05`
- Latch CIA Timer A=$6037=24631. Frecuencia PAL real: 985248/(24631+1) = **39.9987008769 Hz**.
- TEST208 utilizaba 60 Hz aproximados para cualquier PSID CIA: +50% sobre la cadencia de esta canción.

## Corrección
- Analizar el **contenido** del PSID para localizar escrituras 6502 inmediatas a $DC04/$DC05 (LDA/LDX/LDY y STA/STX/STY), verificando que se pueda inferir un único latch.
- Si existe latch único, usar PAL 985248 / (latch+1) o NTSC 1022727 / (latch+1) para la tasa de PLAY.
- Programar el PLAY fraccional con acumulador de 8 bits en el IRQ PAL a 50 cuadros/s; para MINIMERCADO: incremento 205/256, **200 plays en 250 cuadros (5 segundos)**.
- Forzar 50 o 100 Hz manualmente sigue disponible en el selector.
- PSID VBlank sigue a 50 Hz y PSID CIA cuyo latch no se puede detectar mantiene la aproximación anterior de TEST208 (~60 Hz) sin error ni regresión silenciosa.
- Sin SID, los exportadores PASS existentes no cambian.
- Sin límite mínimo de frames; 1 frame (estática/horizontal/diagonal) o varias hasta la RAM efectiva del mapa.
- La canción real del usuario **no se publica en el repositorio**; sólo su lectura analítica.

## Comprobaciones
- SID cargado: latch único $6037 en direcciones $187E (low)/$1881 (high).
- Simulación de temporización a 50 Hz: 4 plays durante 5 cuadros y 200 en 250 cuadros.
- 20 combinaciones simuladas de exportación con 1/2/8 frames, VBlank, CIA 40Hz, CIA 60Hz y sin latch.
- Pendiente prueba audible de MINIMERCADO a velocidad correcta, frames y colores en VICE.
