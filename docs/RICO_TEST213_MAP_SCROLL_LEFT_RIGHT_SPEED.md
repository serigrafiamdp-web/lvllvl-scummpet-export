# TEST213 — Map Scroll Left/Right: recuperar tick del raster de intercambio

**Estado: experimental / pendiente de VICE.** TEST212 permanece PASS para audio SID. No modificar MAIN ni promover a MASTER sin confirmación del usuario.

## Pregunta: ¿funciona Pixels/Step?

**Sí, el valor se guarda y se exporta correctamente.**

- La UI en `js/RICO_MAP_SCROLL_PREVIEW_SCROLL_AREA_TEST79.js` guarda `ricoMapScrollV1.pixelsPerStep` entre 1 y 8; `ticksPerStep` es un parámetro independiente.
- Para una frame, `js/RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js` utiliza `d.pixels` como operando inmediato del scroll Left/Right.
- Para varias frames, `js/RICO_PRG_HORIZ_MULTIFRAME_TEST205.js` escribe la tabla `frame205_pixels`; el cargador de frame copia la velocidad a `speed205=$2d`, que es el argumento de avance horizontal.
- Con SID, TEST212 reutiliza esos mismos generadores de fuente. No fuerza Pixels/Step a 1.
- 144 combinaciones simuladas con 1,2,8 frames; Scroll Left/Right; Ticks/Step 1,2,4; Pixels/Step 1,2,4,8; con/sin SID: velocidad correcta embebida en la fuente 6502.

## Evidencia PRG suministrado

`TERRY NUEVO 2 (5)(1).prg` (archivo del usuario, **no subir al repositorio**):
- Carga $0801, motor ejecutable desde $2000.
- Rutina horizontal en torno a $20F0: `LDA fine_pos ; CLC ; ADC #$02 ; CMP #$08`: **Scroll Right, 2 Pixels/Step**.
- Contador en torno a $20DC: `CMP #$02`: **2 Ticks/Step**.
- Velocidad nominal PAL 50 cuadros/s: 2 px / 2 ticks = **50 px/s**.
- En TEST212 previo el IRQ descartaba el tick de movimiento durante el intercambio de backbuffer.

## Defecto de tiempo encontrado

En el motor común TEST203, cuando `prep_request && prep_ready`:
```asm
jsr swap_screens
jsr apply_horizontal
lda #$00
sta prep_request
sta prep_ready
jmp irq_only_group      ; descarta el tick presente
```

TEST213 cambia **únicamente ese destino del JMP**:
```asm
jmp irq_map_step
```

Esta única modificación mantiene el tamaño exacto del opcode JMP (3 bytes), la preparación de Color RAM y el doble buffer. Afecta al generador común para **1 frame o varias**, con SID o sin SID. No hay cambios en frame duration, modo de música, parser SID, CIA, vídeo diagonal o preview.

## Simulación idealizada (NO son medidas VICE)

Suponiendo que el backbuffer queda preparado antes del siguiente raster (sin congestión de CPU), para 50 cuadros PAL:
| Pixels/Step | Ticks/Step | Antes (px/50 cuadros) | TEST213 (px/50 cuadros) |
| --- | --- | --- | --- |
| 1 | 1 | 45 | 50 |
| 2 | 1 | 80 | 100 |
| 4 | 1 | 136 | 200 |
| 8 | 1 | 200 | 400 |
| 2 | 2 | 44 | 50 |
| 8 | 2 | 136 | 200 |

**Importante:** esto no demuestra que el C64 pueda renderizar 40×25 y preparar Color RAM entre cada IRQ a Pixels/Step=8. Si el backbuffer demora más de un raster, el motor espera por seguridad y la velocidad efectiva puede seguir cayendo. No eliminar esta protección a ciegas para forzar velocidad, porque podría introducir parpadeo o costuras.

## Prueba VICE solicitada

1. Exportar un PRG sin SID con 1 frame Scroll Right/Left, 1 Tick/Step y 1/2/4/8 Pixels/Step. Comparar el cambio visual de cada valor.
2. Conservar Ticks/Step y Pixels/Step; repetir con varias frames.
3. Repetir con SIDTracker64 MINIMERCADO (TEST212 PASS): tempo musical debe conservarse y el scroll no presentar saltos ni parpadeo.
4. Si 8px/1tick sigue limitado, instrumentar el costo del render y contar frames de `prep_ready` antes de proponer una optimización más profunda.

No se añaden restricciones mínimas de frames. TEST212 es la referencia para regresar si falla la velocidad o la imagen.
