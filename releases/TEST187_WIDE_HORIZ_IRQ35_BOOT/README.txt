TEST187 — reparar inicializacion de IRQ en motor horizontal ancho + grupo vertical
21 de octubre de 2026 — PRELIMINAR, REQUIERE VICE PASS

Hallazgo: en el PRG original TEST186, SYS 8192 invoca start con SEI pero no ajusta $01.
Se escriben los vectores de interrupcion en $FFFE/$FFFF sin ocultar KERNAL ROM.
Con la configuracion normal $01=$37 al ejecutar BASIC SYS, los vectores del KERNAL
son visibles al CPU y el raster IRQ nuevo no se atiende correctamente.

Correccion estricta: tras SEI agregar LDA #$35 / STA $01, antes de configurar el
VIC/IRQ. Se toma la inicializacion ya usada por TEST181 (vertical PASS).

No cambia: codigo Map Scroll Left/Right, Group Scroll Up/Down, mapa TERRY 45x32,
BANKs, color, ticks ni proteccion de caracteres vacios. No cambiar el MASTER.
La prueba compilada verifica en los PRG la secuencia 78 A9 35 85 01 en $2000.

Compilacion 6502 + regresion: node TEST187_TERRY_IRQ_BOOT_NODE_TEST.js
Video VICE no comprobado; falta inspeccion visual de mapa y grupo en movimiento.

Nota: si tras esta inicializacion hay un segundo defecto en el calculo de
scroll, corregirlo SOLO tras verificar TEST187 en VICE.
