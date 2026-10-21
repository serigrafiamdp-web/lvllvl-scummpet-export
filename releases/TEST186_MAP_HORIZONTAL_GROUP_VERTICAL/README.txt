TEST186 — RICO LVLLVL
Map Scroll horizontal (Left/Right) para Screen 45x32 + Group Scroll vertical (Up/Down)
21 de octubre de 2026 — PRUEBA EXPERIMENTAL, NO PASS EN VICE

Motivo:
TEST181 resuelve TERRY 45x32 + Map Scroll Up/Down. El usuario invirtió las direcciones:
Map Scroll horizontal, Group Scroll vertical. TEST185 bloqueaba con mensaje
"Map Scroll horizontal ... 45 columnas necesita un motor de ancho variable".
Ese error es una restricción del exportador, NO una incompatibilidad VIC-II.

Implementación nueva, NO destructiva:
- RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js instalado después de TEST185.
- Ruta dedicada para 1 frame, Screen >40 columnas, Scroll Area >=40 columnas,
  Rico Window 40x25 contenida; permite Map Scroll LEFT o RIGHT, 1 tick/1 px.
- Usa todo el ancho de Scroll Area de TERRY (45 columnas), con duplicación horizontal
  por fila para el wrap, y lee 25 filas desde la Window (no cambia Screen JSON).
- VIC: dos pantallas $0400/$0800, charset1 $3000, charset2 $3800,
  mapa horizontal duplicado en $4000, colores en $7000, group code $A000,
  group source $A800. El scroll horizontal usa $D016 (modo C64 de 38 columnas
  visibles durante desplazamiento, con 40 caracteres de buffer).
- Map Scroll prioritario: el main loop prepara el buffer tras los saltos gruesos;
  el IRQ mantiene el scroll fino y agenda el Group Scroll vertical, que se
  actualiza fuera del IRQ para proteger el mapa.
- Group Scroll Up/Down reutiliza el código de TEST182; Down usa el paso de fase
  inverso. Se respeta BANK 1 o 2 y la protección de caracteres vacíos.

Alcance estricto de la primera prueba:
- Solo Group Scroll vertical único, Up/Down.
- Si hay animaciones individuales o Switch Bank, muestra error explícito (todavía
  no implementadas en este NUEVO motor horizontal); no las descarta en silencio.
- Color por carácter uniforme en el área visible (TERRY usa color 14). Los
  mapas multicolor requieren actualización de Color RAM por desplazamiento.
- Solo 1px / 1 tick para Map Scroll en TEST186.
- No se cambia ningún archivo del exportador TEST185, no se toca MASTER.
- La velocidad real y los bordes en VICE siguen sin validación visual.

Pruebas:
PASS node TEST186_TERRY_HORIZONTAL_REAL_ASSEMBLER_NODE_TEST.js:
Mapa original TERRY 45x32, Window X2/Y0/40x25, Scroll Area 45x32.
4 PRG ensamblados con el ensamblador 6502 real:
  TEST186_TERRY45X32_MAP_LEFT_GROUP_UP.prg
  TEST186_TERRY45X32_MAP_RIGHT_GROUP_UP.prg
  TEST186_TERRY45X32_MAP_LEFT_GROUP_DOWN.prg
  TEST186_TERRY45X32_MAP_RIGHT_GROUP_DOWN.prg
PASS datos del mapa 45 cols y wrap por fila, originales sin alteración.
PENDIENTE: 30 s de VICE sin ghost bytes, ritmo y composición visual.

BACKUP estable: TEST181 PASS (vertical), TEST180 PASS (preview).
MAIN MASTER 20 OCTUBRE INTACTO. TEST185 queda protegido.
