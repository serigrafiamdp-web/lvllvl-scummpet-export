RICO / LVLLVL TEST140 — CUSTOM TILESET FULL256 EXPORT FIX — 18/19 OCT 2026
ESTADO: 10/10 TESTS + 48/48 ASSEMBLER + TEST139 PREVIEW 10/10 PASS; VISUAL VICE PENDIENTE

SINTOMA
Al cargar un tileset personalizado, EXPORT C64 PRG puede mostrar:
"RICO TEST76: MAP SCROLL necesita un caracter libre para representar el fondo expuesto."

CAUSA
TEST138/139 chooseBlankChar() siempre exigia al menos un screen code 0..255 que
no estuviera presente en ninguna frame ni marcado Animated Char. Un mapa 40x25
puede utilizar legitimanente los 256 indices. La rutina impedia exportar incluso
Scroll circular de una sola frame que no dibuja fondo expuesto.

TEST140 - CORRECCION CONSERVADORA
1) Si habia un codigo no usado, conservar EXACTAMENTE el contrato TEST138:
   seleccionar el mas alto, limpiar solo su glyph en BANK1/BANK2, reservarlo.
   Codigo PRG de proyectos que ya exportaban queda identico en su algoritmo.
2) Si los 256 indices estan ocupados, reutilizar un glyph realmente vacio (8 filas
   de bits = 0 en ambos bancos), que no sea Animated Char; puede aparecer en mapa
   pues ya era transparente. No borrar ni reindexar ningun glyph existente.
3) Si no existe glyph vacio pero se trata de 1 frame + Map Scroll cardinal
   circular (UP/DOWN/LEFT/RIGHT), NO hay fondo nuevo expuesto y el buffer de
   presentacion temporal nunca es visible. Usar un codigo de marcador SIN borrar
   su charset. Se validaron las cuatro direcciones con el assembler original.
4) En Ping Pong, Move In/Out y otras transiciones con fondo genuinamente expuesto,
   si no hay codigo libre ni glyph vacio, dar error explicativo y NO corromper arte.
5) Cambiar solamente el prefijo visible de diagnostico a RICO TEST140 para
   verificar que se usa la version mas reciente.

REGLAS DE AISLAMIENTO
- Se modifica UNICAMENTE dist/js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js y
  dist/index.html (cache-bust/version y titulo).
- Todos los demas archivos TEST139 se mantienen IDENTICOS.
- TEST138 SCUMM Pixel Gear, PREVIEW TEST139, fondo, color RAM, geometria,
  rutinas IRQ, banco de char anim y orden de frames no se modifican.
- El ARCHIVO PRG TEST140_CUSTOM_FULL256_WRAP_UP_1T.prg es un ejemplo tecnico:
  1000 celdas usando los 256 codigos con ambos charsets llenos y sin glyph vacio.
  No reemplaza el proyecto del usuario.

VERIFICACION
- TEST140_CUSTOM_TILESET_EXPORT_CHECK.cjs: 10/10 tests:
  full256 wrap, glyph vacio usado, bank2 distinto, Move In sin glyph,
  Move In con glyph, Ping Pong sin glyph, 4 direcciones cardinal,
  backward compatibility con codigo libre, glyph animado excluido,
  ausencia de cambios en las rutinas SCUMM.
- Compilador Assembler ORIGINAL de LVLLVL (incluye casos FULL256): PASS.
- TEST138_ASSEMBLER_MATRIX.cjs: 48/48 PASS, 6T source identico.
- TEST138_CPU_GEAR_AND_UNIFORM_CHECK.cjs: 32/32 fine steps y 13/13 gear gate.
- TEST139_PREVIEW_ISOLATION_CHECK.cjs: 10/10 PASS.
- VALIDACION VISUAL EN VICE PENDIENTE, NO PROMOVER MASTER ANTES DE PASS.

GitHub: rama test/rico-custom-tileset-export-140
GitHub Pages: misma URL habitual con ?v=test140.
MASTER TEST138 y MILESTONE TEST139 congelados/respaldados.
