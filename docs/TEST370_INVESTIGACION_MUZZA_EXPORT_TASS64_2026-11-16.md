# TEST370 — Investigación para "Muzza's Export Tass 64"

**Fecha:** 16/11/2026, Argentina.  
**Página de producción:** \`gh-pages/index.html\`.  
**Checkpoint de regreso:** \`release/test369-pass-2026-11-16\` (TEST369 PASS).  
**Estado:** auditoría documental y código fuente; **no implementado, no probado en 64tass ni VICE**. No asociar el número TEST370 con un PASS.

## 1. Fuentes consultadas, reales

1. James: https://github.com/jaammees/lvllvl/blob/main/src/js/textMode/c64export/exportC64.js — motor histórico "Export C64 (new)" y ZIP original; clase \`ExportC64\`, métodos \`doExport\`, \`downloadZip\`, \`loadSource\`.
2. James: https://github.com/jaammees/lvllvl/blob/main/src/js/textMode/c64export/exportC64Dialog.js — opciones, frames, modo color, SID y llamada a \`ExportC64.doExport\`.
3. James: https://github.com/jaammees/lvllvl/blob/main/src/js/textMode/export/exportC64Assembly.js — selector TASS existente; \`getByteLabel\` retorna \`.byte\`, \`getWordLabel\` retorna \`.word\`, \`getSetPCSymbol\` usa \`* =\`; **datos, no el motor entero de reproducción**.
4. James: https://github.com/jaammees/lvllvl/blob/main/src/html/textMode/exportC64Assembly.html — controles y formato TASS.
5. Manual oficial 64tass v1.60 r3243: https://tass64.sourceforge.net/ — gramática \`.cpu "6502"\`, \`.include\`, \`.binary\`, \`.byte\`, \`.word\`, \`* =\`, selección PRG \`--cbm-prg\`, listings/etiquetas.
6. CSDb: https://csdb.dk/release/?id=252813 — 64TASS v1.60.3243, release de Singular, 10/05/2025; referencia de versión **no una especificación de export ZIP de LVLLVL**.
7. Ejemplo comunitario compilado con 64tass: https://github.com/jtompuri/mandelbr8 — comando real con fuente y ejecución en emulador. Otro ejemplo 64tass con CI y pruebas: https://github.com/illobo/sidj .
8. Revisión ya guardada en el proyecto: \`docs/PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md\`.

## 2. Qué hace realmente "Interface → Export C64 (new)..."

El menú original de James usa ID \`export-c64\`; en \`Editor.menuClick\` llama \`textModeEditor.exportC64.start()\`. \`ExportC64Dialog\` recopila formato, frames, música y rejilla; \`ExportC64.doExport\` construye:
- Archivo raíz \`main.asm\` en sintaxis **ACME**, más \`asm/*.asm\` incluidos con \`!source\`.
- \`data/charset.asm\`, \`data/frame_N_map.asm\`, \`data/frame_N_colors.asm\`, \`data/animatedCharsTable.asm\`, \`data/animatedCharsData.asm\`, \`data/frameTable.asm\`.
- \`data/sid.bin\` opcional, incluido mediante \`!binary\`.
- \`downloadZip\` usa JSZip/DEFLATE para el ZIP de fuentes.
- El botón PRG usa otro camino, \`g_app.assemblerEditor.assemble\`.

**Advertencia de compatibilidad:** esta clase original limita la anchura a 40 y la altura a 25 cuando \`scrolling=false\`, y no describe las extensiones RICO de Map Scroll/Group/BANK/ECM posteriores. Por lo tanto, NO usar \`ExportC64.doExport\` directamente como supuesto motor "universal" ni asumir que sus fuentes reproducen todas las combinaciones del exportador RICO.
**Verificación de despliegue:** en el árbol actual de \`gh-pages\` no aparece un directorio \`c64export/\` con los 16 módulos \`.asm\` que carga \`ExportC64.loadSource\` por XHR. En el GitHub público de James tampoco aparecen esos archivos independientes como tal en el árbol revisado. Se necesita contrastar el ZIP real aportado por el usuario y resolver la procedencia de dichos módulos ANTES de generar un paquete "recompilable".

## 3. Formato correcto de un ZIP "Muzza's Export Tass 64"

Estructura propuesta, **condicional a los recursos realmente usados** (no crear archivos vacíos ni simulaciones de engines que no existen):

\`\`\`
Muzza-Export-Tass64/
  main.asm               ; punto de ensamblado con codigo 6502 REAL
  engine/*.asm           ; runtime verdadero de la ruta PRG seleccionada
  data/charset_bank1.bin ; glifos originales de BANK 1, si se usan
  data/charset_bank2.bin ; glifos originales de BANK 2, si se usan
  data/frame_*.bin       ; datos de mapas/colores/timing reales por frame
  data/group_*.bin       ; fuentes/fases/tablas grupales si existen
  data/sid.bin           ; payload SID sin cabecera PSID, si se usa, en su direccion real
  manifest.json          ; export path, estado de modos, assets, offsets, memoria, versiones y checksum
  build.bat              ; ensamblar desde Windows
  build.sh               ; ensamblar desde Linux/macOS
  README.md              ; herramientas, recompilacion y condiciones verificadas
  reference.prg          ; PRG del MISMO motor si se obtuvo y validó
\`\`\`

La estructura no fija direcciones universales: dependen del router PRG real y del planificador de RAM/VIC/SID.

Sintaxis ilustrativa documentada oficialmente:

\`\`\`asm
.cpu "6502"
* = $0801
; codigo BASIC real, si el motor lo requiere
.include "engine/entry.asm"

* = $3000
.charset_bank1
    .binary "data/charset_bank1.bin"
\`\`\`

Los nombres \`.charset_bank1\` y \`engine/entry.asm\` del ejemplo son ilustrativos: **no se debe publicarlos en un ZIP sin archivos y símbolos reales**.

Comando documentado para el proyecto compilado:
\`\`\`
64tass -a --cbm-prg -o output.prg main.asm
\`\`\`
Al reconstruir de verdad se valida el load address little-endian del PRG, la dirección de entrada, labels, RAM, ZP, IRQ, Color RAM, VIC bank y SID.

## 4. Qué debe hacer el nuevo menú y cómo probar

**Ubicación exacta:** bajo \`Interface → Export C64 (new)...\`, antes del separador / Mobile Mode. Texto exacto pedido: **\`Muzza's Export Tass 64\`**.

Al pulsarlo, un nuevo diálogo de exportación para ZIP 64tass debe recopilar el estado **sin modificar el JSON original**, generar código desde la **misma ruta PRG que el editor selecciona realmente**, y producir un ZIP con ASM y binarios editables.

**No basta** con convertir \`!source\` → \`.include\`, \`!byte\` → \`.byte\`, \`!binary\` → \`.binary\`: hay que verificar macros, operadores, scopes, subrutinas, relocation, SID, ficheros, labels y tamaño del PRG con 64tass real. En particular, **un PRG simplemente incrustado en \`.binary\` no sustituye el código fuente humano** y no cumple el objetivo del usuario.

**Secuencia de pruebas:**
1. Recibir el ZIP real de ejemplo generado con la función NEW; comprobar inventario, links relativos, bytes de data, dependencias y si ensamblaba originalmente.
2. Implementar ruta nueva aislada y menú sin tocar el exportador original.
3. Probar un PRG estático simple y reensamblar con 64tass real; comparar el PRG y correr VICE.
4. Usar un proyecto PRG ya PASS (TEST362) con mapa diagonal; conservar todas sus rutinas y datos.
5. Sumar multiframe, BANK 1/2, 8 direcciones, Group, Individual, ECM, Bitmap y música SID con diagnósticos concretos para lo que falte.
6. Auditoría de equivalencia PRG vs ZIP: contenido, temporización visual, SID, bancos, colores. No llamar "completo" antes de pasar la matriz.

**Restricciones de calidad:** No sustituir animaciones con snapshots ni borrar grupo/SID para entregar un ZIP. No inventar motor ni asignar memoria fija que rompa una ruta distinta. Si faltan recursos de composición, documentar el motor pendiente sin imponer restricciones globales al editor existente.

## 5. Estado del archivo de ejemplo del usuario

Se recibió el mensaje "source de ejemplo generado con EXPORT C64 NEW", pero **no aparece ningún archivo ZIP adjunto en la conversación hasta este punto**. La investigación de código y manual está documentada; el contenido exacto del ZIP de ejemplo está pendiente y no se debe adivinar.
