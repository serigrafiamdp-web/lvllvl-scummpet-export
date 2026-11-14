# Checkpoint LVLLVL RICO — 14 noviembre 2026

**Rama ejecutada:** `gh-pages` · **web canónica:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/

## PASS confirmados en la conversación reciente

| Caso | Evidencia | Alcance |
|---|---|---|
| TEST358 C17 | **PASS usuario** | Dock derecho Tile Editor arriba / Tiles abajo, proporción inicial 50/50; medir altura del splitter real, no `eastTilesPanel` (contenedor sin altura). No retirar `RICO_NATIVE_DOCK_TEST358_C17.js`. |
| TEST362 | **PASS usuario en VICE** | PRG corregido que restaura charset personalizado en el caso de mapa 50×35, diagonal up-left 8 px/tick, BANK1, color uniforme. Diagnóstico en `TEST/test361-diagonal-charset/README.md`. Corrección del generador: commit `a8cda2ca4e6118abd554f54334996d0d01ec8374`. |
| TEST328 (04/11) | **PASS histórico usuario** | ECM horizontal del caso MEGASOFT; no usarlo como prueba global de otros modos. |
| TEST264 (24/10) | **PASS histórico usuario** | Export Multicolor simple con 1 frame, no extrapolable al resto. |
| TEST232, TEST228, TEST227, TEST220 | **PASS históricos según documentación** | Vertical/color, SID, velocidades y horizontal: consultar [arquitectura anterior](ARQUITECTURA_MOTOR_Y_EXPORT.md) para los archivos exactos. |

## Publicado / pendiente de PASS completo

| Caso | Estado real |
|---|---|
| TEST359 — extensión de sidebar | Integrado en portada; no hay un PASS final explícito posterior al despliegue dentro de este registro. |
| TEST360 — dos textos Group Animate en inglés | Integrado; sin PASS explícito en este registro. |
| TEST361 — inspector de fuente diagonal | Instrumentación pasiva, verificada con datos sintéticos; no corrige el motor. |
| TEST362 — 128 combinaciones del generador | **128/128 checks de fuente ASM**, NO 128/128 ejecuciones de VICE. |
| Motor unificado todas las combinaciones | **Pendiente**: no hay prueba exhaustiva de todos los modos de exportación, frames, grupos, bancos, música y scroll. |
| Exportación de PRG completo como ASM ejecutable 64tass | **No implementada/verificada**; solo existe selector TASS en exportación clásica de datos. |

## Caso de regresión TEST362

**JSON original:** `LVLLVL TEST.json` aportado por el usuario (no republicar en un repo público sin autorización). `tileMap` 50×35, ventana 40×25, Scroll Area 50×35; diagonal up-left, 1 tick, 8 px, BANK1. PRG original del usuario `_lvllvl full print (8).prg` (no subir sin autorización). El PRG ya tenía el charset correcto en `$3000`, pero la rutina `TEST196` eliminaba `LDA #$0C` durante la optimización de color uniforme y ocasionaba selección de fuente VIC incorrecta. Se suprimió el filtro global de esa instrucción. **PASS de VICE del PRG corregido**, no presumir automáticamente la validación visual de una exportación nueva para todas las variantes.

## Reglas para próximos cambios

1. No agregar restricciones artificiales a las exportaciones. Si una ruta no sirve, aislar recurso y composición faltante y corregir el motor.
2. No esconder una función que no se puede representar en el PRG; registrar fallo claro y continuar la cobertura.
3. Separar **prueba de JS**, **ASM compilado**, **PRG cargado** y **PASS visual/musical VICE** en la documentación.
4. Mantener `gh-pages` como única portada y conservar checkpoints / archivos históricos en ramas de archivo.
