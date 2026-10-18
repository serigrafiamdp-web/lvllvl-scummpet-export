LVLLVL -> RICO — TEST130 — 18 OCT 2026
CORRECCION DE ERROR AL EXPORTAR EN VERSION ONLINE TEST129

ERROR REPORTADO POR USUARIO:
RICO TEST76: Error ensamblando runtime TEST75:
unknown value: frame_color_0 | unrecognised byte: <frame_color_0
unknown value: frame_color_0 | unrecognised byte: >frame_color_0

CAUSA:
TEST129 se compilo con ACME WebAssembly, pero el exportador online usa
el ensamblador interno de LVLLVL (new Assembler). Este ensamblador no
resuelve la referencia adelantada !byte <frame_color_0 / >frame_color_0.

CORRECCION EXCLUSIVA TEST130:
- Los punteros de color se calculan numericamenente (low/high) en JS.
- Direccion inicial = $4000 + 1000*numeroDeFrames + bytesAnimaciones.
- bytesAnimaciones = 10*numeroDeCharsAnimados + 1 terminador, si hay animacion.
- Cada frame ocupa otros 1000 bytes de colores.
- Guard de overflow de memoria de 64K; error explicativo al exceder rango.
- No se modifica la rutina native animate_chars, el Map Scroll,
  ni el comportamiento visual de los caracteres.

VALIDACION ESTATICA (NO VICE):
- Reproduccion exacta del error TEST129 en el Assembler interno: FAIL confirmado.
- 1 frame con 3 arrobas animados: PASS ensamblador interno.
- 1 frame sin animacion de chars: PASS.
- 2 frames con 2 chars animados: PASS.
- 6 frames con 3 chars animados: PASS.
- 20 frames: PASS.
- 26 frames: PASS guard overflow, sin generar datos incorrectos.
- Comprobacion exacta de direccion del label frame_color_N y de los 1000 colores: PASS.
- PRG demo generado desde el ensamblador interno de LVLLVL.

ESTADO:
- TEST128: PASS (animacion original de chars y Map Scroll en VICE)
- TEST129: PENDIENTE/FAIL de ensamblado en web online (sin verificacion visual de colores)
- TEST130: PASS ensamblado local y pendientes de prueba visual en VICE.
- MASTER LVL-RICO 17 OCT: SIN CAMBIOS.

ARCHIVOS:
- index.html -> identifica TEST130 y nueva cache key
- js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js -> exportador TEST77 corregido
- TEST130_DEMO_3ARROBAS_COLORES_SCROLL.prg -> demo generado con assembler interno
- TEST130_BUILTIN_ASSEMBLER_CHECK.cjs -> prueba reproducible con node.
