# TEST343 — EBCM 64 glifos + Multiframe (sin Map Scroll)

**Fecha:** 09/11/2026. **Estado:** experimental; sin PASS en VICE.

## Diagnóstico con archivo real

Archivos: REMISERIA 64 .json (9 frames 40×25 c64ecm) y remiseria fail.prg (15.237 bytes).

- PRG con carga $0801, fin $4384, BASIC SYS 2080.
- Los 512 bytes de las primeras 64 fuentes del JSON coinciden con $3800–$39FF en el PRG fallido: el charset fue grabado correctamente.
- El byte de configuración $0811 vale 0 (modo normal), aunque el proyecto está en c64ecm.
- Adaptadores anteriores TEST104 y TEST264 fuerzan modo standard salvo multicolor, anulando ECM.
- El proyecto usa los 64 códigos físicos t & 63, BANK 1 y 9 frames: primeras 8 de 16 ticks, última de 256.
- Los fondos originales incluyen más de cuatro colores para toda la pantalla, pero cada fila de 8 píxeles necesita como máximo cuatro fondos entre las celdas que muestran píxeles de fondo.

## Solución experimental

- Solo intercepta c64ecm + 2–10 frames + 40×25 + Map Scroll OFF.
- Reutiliza la recolección y el motor de duración/cambio de pantalla de TEST342 (PASS del usuario). No cambia el JSON.
- Respeta los primeros 64 glifos; convierte cada celda a (t & 63) | (slot_fondo << 6), conservando fc.
- Genera una paleta de cuatro colores **por fila raster**, preservando todos los colores visibles: el VIC-II recibe $D021–$D024 antes de cada fila (raster 48, 56, ... 240).
- En el raster $FA reutiliza el reloj de frames y commit de colores TEST342.
- Activa ECM en el VIC-II ($D011 bit6), habilita 40 columnas y conserva la fuente de BANK 1.
- Los mapas usan $4000–$6FFF y los colores $7000–$9FFF. Para REMISERIA hay 9000 bytes por banco (límite 12288).
- Si una fila requiere más de cuatro fondos, o hay SID, Group Animate o Map Scroll, informa el conflicto y no produce un PRG parcial.

## Verificación interna

- Sintaxis JavaScript PASS.
- Smoke test ASM generado con nueve frames 40×25, duraciones 16×8 y 256: PASS.
- Rutinas multiframe, IRQ raster y actualización de color presentes; referencias JSR/JMP/branches resueltas.
- Estimación sintética de final de código en $2A03, dentro del límite previo a $3000; saltos relativos dentro de rango.
- **Sin prueba del ensamblador real del editor ni ejecución en VICE.** No declarar PASS todavía.

## Prueba en VICE

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test343-ecm-multiframe/
2. Importar REMISERIA 64 .json; confirmar EBCM, nueve frames, 40×25.
3. Exportar PRG; su nombre terminará en _TEST343.prg.
4. Confirmar que la primera frame es correcta, siguen ocho cambios animados con duraciones originales, los colores no se deforman y se repite el ciclo.
5. Si no funciona, enviar el nuevo PRG y el mensaje literal para depurarlo.

TEST339 y TEST342 (PASS), TEST341 (FAIL) y página principal sin modificaciones.