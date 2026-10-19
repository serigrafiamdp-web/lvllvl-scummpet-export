RICO / LVLLVL — TEST141 — C64 ANIMATED CHAR IRQ WORKSET — 19 OCT 2026
ESTADO: 12/12 tests especificos, 48/48 matriz assembler, TEST140 10/10,
TEST139 10/10, TEST138 CPU 32/32 + 13/13 PASS. VICE VISUAL PENDIENTE.

PROBLEMA
- Cuando se marcan Animated Char los 256 glifos, el runtime exportado puede
  procesar 512 entradas (256 glifos de BANK1 y 256 glifos de BANK2) dentro
  de cada IRQ aunque la pantalla dibujada use solamente unos pocos.
- El exceso de trabajo 6502 puede hacer que el movimiento exportado aparente
  menos velocidad que la preview HTML, incluso si los ticks estan en 1.

CAMBIO AISLADO DEL EXPORTADOR TEST141
- NO reduce los ticks configurados, NO subdivide los frames, NO cambia
  SCUMM Pixel Gear, Map Scroll, colores ni la preview del indice TEST139.
- ANTES de producir la rutina 6502, calcula un mapa de screen codes usados
  por cada BANK 1/BANK 2 a lo largo de TODAS las frames exportadas.
- Solo genera registros de animacion para caracteres REALMENTE presentes
  en pantallas exportadas y en sus respectivos bancos de charset.
- Si un glifo tiene sus 8 filas vacias y su animacion es ROTACION/DESPLAZAMIENTO
  (LEFT/RIGHT/UP/DOWN), omite su registro: no puede producir movimiento.
- BLINK sobre un glyph vacio se preserva, porque alterna de cero a unos.
- El trabajo de un caracter utilizado en BANK1 y BANK2 se mantiene en ambos
  bancos, con ticks independientes, para no desincronizar cambios de frame.
- Se recalculan los punteros a Color RAM por el numero REAL de registros
  exportados (5 bytes cada uno), evitando apuntar a datos incorrectos.
- El tileset editable ORIGINAL no se altera. La compilacion de 6502 usa un
  conjunto reducido unicamente en el PRG exportado.

PERFORMANCE: ALCANCE DE LA MEJORA
- Caso 256 caracteres seleccionados, mapa uniforme que usa $00, BANK1:
  de 512 registros por tick a 1 (= 99,8% menos entradas de IRQ).
- Mismo mapa en BANK2: 1 registro en BANK2, no procesa BANK1.
- Con 256 codigos distintos en el mapa usando BANK1: 256 registros en lugar
  de 512 (50% menos entradas; NO asegura 50Hz/1tick en C64 real).
- Con 256 distintos en ambos bancos usados por distintas frames: 512
  registros necesarios; limitacion real del CPU C64. No es una solucion
  confirmada para 256 caracteres visibles con tick 1.
- La vista previa HTML puede usar otra cadencia y no mide el tiempo CPU 6502.

AISLAMIENTO
- Solo cambia index.html (titulo/cache) y
  js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js (compactacion pre-export).
- TEST140 se conserva como base experimental; el MASTER TEST138 y el
  MILESTONE TEST139 permanecen intactos. No promover este TEST sin VICE PASS.
- TEST140: seleccion de blank char para tilesets custom full256 intacta.
- TEST139: preview index BANK1/BANK2 byte-identica.
- SCUMM TEST138: movimiento fino, ticks efectivos y ruta IRQ de scroll intactos.

VERIFICACIONES
- TEST141_VISIBLE_CHAR_IRQ_WORKSET_CHECK.cjs: 12/12 casos + 48/48
  compilaciones con ensamblador ORIGINAL de LVLLVL.
- Chequea que cada puntero frame_color N corresponda a la direccion real
  del dato y que los 1000 bytes de colores de cada frame sean correctos.
- TEST140_CUSTOM_TILESET_EXPORT_CHECK.cjs: 10/10 PASS.
- TEST139_PREVIEW_ISOLATION_CHECK.cjs: 10/10 PASS.
- TEST138_CPU_GEAR_AND_UNIFORM_CHECK.cjs: 32/32 + 13/13 PASS.
- PRG demo TEST141_FULL256_ENABLED_ONE_VISIBLE_1T_UP.prg: 256 marked
  animated, mapa de caracter $00, animacion efectiva solo del glyph visible.
  Es una DEMOSTRACION tecnica, no un proyecto original del usuario.

PRUEBA REQUERIDA EN VICE
1. Abrir la web TEST141, importar tu tileset, marcar Animated ALL (si queres).
2. Exportar el MISMO proyecto que en TEST140 con mismos Map Scroll y ticks.
3. Comprobar velocidad en VICE, especialmente si pocos glyphs estan en mapa.
4. Comprobar que siguen bien colores, fondo, scroll y BANK2 si lo usas.
5. Indicar PASS / FAIL y cuantos caracteres diferentes se dibujan en mapa.
