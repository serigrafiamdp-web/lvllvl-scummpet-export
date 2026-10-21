# TEST180 — Limitar color del borde al borde real de la C64

Fecha: 20 de octubre de 2026. **Node PASS. Validación visual pendiente.**
Base TEST179: máscaras de Scroll vertical y horizontal aprobadas visualmente, pero color del borde desbordaba al área completa del editor.

## Error
TEST179 tomaba el color de borde del VIC-II para tapar toda el área exterior a Rico's Window. Parecía correcto con borde negro; con turquesa inundaba todo el lienzo fuera de la pantalla y no respetaba las dimensiones originales del borde C64.

## Solución
- Exterior del viewport: negro neutro del editor, sin cuadrícula.
- Borde C64: anillo de **32 píxeles lógicos a cada lado**, multiplicado por `displayScale`, alrededor de Rico's Window (top/bottom/left/right). Solo se pinta si `grid.border.visible` es true.
- Dentro de Window, columnas sin Scroll Area: usan el Background de pantalla, no el color del borde, evitando transparencia y cuadros ajenos al contenido.
- Grilla recortada a Window. No altera scroll vertical u horizontal, Map Scroll OFF ni Screen 40x25 legado.
- No cambia mapas, fuentes, colores almacenados, selección de Window, Scroll Area, PRG ni IRQ.

## Tests
PASS `node --check js/RICO_MAP_PREVIEW_BORDER_MASK_TEST178.js`
PASS `node TEST180_C64_BORDER_NODE_TEST.js`: turquesa visible sólo como anillo 32px a zoom2; exterior negro, interior sin arte con Background; Scroll Left/Right/Up/Down/PingPong/Move; Border disabled; Map Scroll OFF; 40x25 legacy.
PASS regresión: sólo `index.html` y `js/RICO_MAP_PREVIEW_BORDER_MASK_TEST178.js` modificados, todos los exportadores PRG idénticos.
Pendiente PASS/FAIL visual en navegador.
Atención: TEST176 mantiene su problema independiente de PRG ghost bytes; no está resuelto en TEST180.

Paquete: `LVLLVL_TEST180_BORDE_C64_32PX_FONDO_NEGRO_WEB_LOCAL.zip`
SHA256: `6eabb94f03f0afd55191e271558e9b75045ce0c4314ea87afac6614fa376bf06`
MASTER protegido: `release/master-lvl-rico-20-oct-2026`.
