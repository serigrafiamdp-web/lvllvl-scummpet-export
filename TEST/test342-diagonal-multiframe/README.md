# TEST342 — Corrección de TEST341: Map Scroll diagonal + Multiframe

Fecha: 2026-11-09. **Experimental, pendiente de VICE PAL**.

## Regresión reportada

El usuario probó TEST341 y confirmó **FAIL**: el PRG parecía quedar en la primera frame y no se apreciaba movimiento de Map Scroll diagonal.

## Error de generación identificado

En TEST341, al sustituir el bloque de tablas `world_rows_lo` hasta `*=$3000\ncharset_bank1`, se eliminaban **por accidente las rutinas completas** `prepare_sparse_colors203` y `commit_sparse_colors203`, que el código diagonal continuaba invocando. Esa fuente ASM no era válida. Los smoke tests previos solo habían comprobado sintaxis y estructuras JS, no ensamblado real.

**TEST342** conserva esas rutinas y reemplaza únicamente las tablas de filas anteriores a `prepare_sparse_colors203`. Las cuatro diagonales permanecen configurables independientemente en cada frame. Se mantiene el flujo de almacenamiento de mapas/colores y el commit diferido del framebuffer.

### Pruebas internas

- Sintaxis JS: PASS.
- Generación de ASM para dos frames con direcciones opuestas: PASS sintético.
- Todas las etiquetas de destino de `JSR`, `JMP` y ramas se encuentran declaradas en el ASM generado: PASS.
- Presentes `prepare_sparse_colors203`, `commit_sparse_colors203`, `frame342_tick`, `frame342_stage`, `frame342_commit`: PASS.
- Emulación simplificada de flujo de instrucciones 6502 con dos frames (no emulador VICE completo): se observaron ticks del desplazamiento X/Y, progreso del temporizador y solicitud de siguiente frame. **No equivale a un PASS de VICE ni prueba exacta de tiempo de raster**.

## Prueba en VICE

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test342-diagonal-multiframe/
2. Crear dos frames con Window 40x25 dentro de Scroll Area 50x30.
3. Frame 1: `Diagonal Up Left`, **Ticks/Step 1**, **Pixels/Step 1**, duración **100 ticks**.
4. Frame 2: `Diagonal Down Right`, Ticks/Step 1, Pixels/Step 1, duración 100 ticks.
5. Sin Group Animate, animación individual ni SID para el primer ciclo.
6. Exportar PRG y comprobar **movimiento de mapa dentro de cada frame** y **cambio de frame**. Si falla, registrar mensaje literal y nombre de PRG. Confirmar si el PRG fue recién exportado desde TEST342.
7. Después probar las cuatro direcciones entre cuatro frames y duración propia por frame.

## Límites actuales

Este TEST conecta Map Scroll diagonal multiframe **solamente**. No compone todavía Group Animate, animaciones individuales, SID ni ECM/bitmap; si están activados informa el límite y no pierde contenido silenciosamente.

TEST339 conserva PASS del índice visual; TEST340 experimental; TEST341 conserva registro FAIL. El editor principal permanece intacto.
