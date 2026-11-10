# TEST348 — EBCM frames fijas, raster temprano y un solo registro por IRQ

09-11-2026. **Experimental — requiere prueba real en VICE PAL**.

El usuario confirmó que TEST347 reduce algo los artefactos de raster, pero todavía observa basura horizontal y una diferencia en caracteres/colores. TEST347 NO se considera PASS. El proyecto REMISERIA usa 9 frames, 64 glifos físicos, ningún Map Scroll y ningún RLE.

## Diagnóstico verificable del JSON original

- Blink frames 1–8: solo cambia celda X=8, Y=15, screen byte 14 en frame impar y 88 en frame par. Son glifos físicos #14 y #24 respectivamente, con fondo directo 0 y 1. Foreground permanece 10.
- El fondo distinto es parte del JSON: ambas modificaciones ocurren juntas. Un cambio percibido de color NO demuestra que el screen byte no cambie.
- El generador de TEST348 mantiene la comprobación de bytes de pantalla físicos; genera 14/88 exactamente en X=8, Y=15 (dirección $0660).
- Las transiciones a frames 2..8 cambian un único byte de pantalla y cero de Color RAM; a frame 9 son 152 códigos de pantalla y 126 de Color RAM.

## Cambio aislado respecto de TEST347

- Sin RLE. Sin scroll. Parches directos LDA #byte / STA $0400+offset.
- Los 7 eventos raster se adelantan a la **fila anterior**, cuando el slot sustituido no estaba visible en esa fila; así el cambio ocurre antes de llegar a la fila que lo necesita.
- Líneas de raster de eventos: 107, 123, 163, 171, 187, 195, 227. VBlank en 252.
- En cada evento solo se escribe el registro EBCM que realmente cambia; no se reescriben los cuatro ($D021–$D024) como en TEST347.
- Para realizar la escritura dinámica se usa secuencia 6502 legal: LDA event_color,X; LDY event_slot,X; STA $D021,Y.
- Al comenzar cada nuevo frame de video se restauran los cuatro fondos iniciales y se mantiene la secuencia de parches.
- Se publica en ruta JS completamente nueva y etiqueta visible `TEST348 · EBCM · EARLY IRQ · V348-A1`.

## Validación interna

- Generación del ASM desde REMISERIA 64 (1).json: PASS sintético. Ambas formas físicas [14,24] corresponden a bytes EBCM [14,88].
- Reporte de las 9 frames: transiciones pequeñas 1 glifo/0 color, frame9 152 glifos/126 colores.
- Etiquetas usadas por JMP/JSR/branches todas declaradas; mapa de memoria y longitudes conservan margen.
- El ensamblador real del navegador/VICE no se ejecutaron; no marcar PASS ni presuponer que se eliminaron todos los problemas.

## Probar

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test348-ecm-early-irq/
2. Verificar etiqueta TEST348 abajo a la derecha; cargar REMISERIA 64 (1).json y exportar PRG con _TEST348.
3. VICE: comparar basura horizontal de raster frente a TEST347 y observar glifo X=8 Y=15, frame9 y el color de la K.
4. Si hay fallo, enviar PRG de TEST348 o una captura/video para comparación.

No se alteran TEST342 (PASS), TEST346/347 ni el editor de producción.