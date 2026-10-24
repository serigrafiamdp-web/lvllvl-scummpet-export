# TEST287 — Rico's Decolorize

**Fecha:** 24 de octubre de 2026  
**Origen:** técnica descubierta en video del usuario `2026-10-24 14-03-42.mkv`, grabado sobre TEST286.  
**Estado:** PASS sintaxis + integración aislada del menú Edit, pincel nativo, cambio de color local y desactivación; **PENDIENTE PASS visual en navegador y VICE**. TEST286, TEST282 PASS y MASTER intactos.

## Observación y explicación

En el video, una selección de tiles del índice se estampa varias veces sobre un arte Bitmap Multicolor originalmente coloreado. El editor muestra siluetas blancas con detalle oscuro y las zonas repintadas pierden sus colores originales. El Tile Editor muestra `BG=0, C1=0, C2=0, C3=1`.

**No es un filtro RGB ni convierte cada píxel a luminancia.** El editor guarda para cada celda una paleta `ricoBmpColors[y*width+x]` de 12 bits con C1/C2/C3. Al pintar normalmente, los wrappers TEST279/280 reemplazan esa paleta local usando los valores actuales del pincel. Los patrones de 2 bits de cada tile mantienen su forma; el hardware VIC-II los interpreta así:

| Píxel Bitmap | Registro fuente | Resultado con Decolorize |
|---|---|---|
| `00` | Fondo global $D021 | Color de fondo existente (negro si BG=0) |
| `01` | Nibble alto de Screen RAM | Negro (C1=0) |
| `10` | Nibble bajo de Screen RAM | Negro (C2=0) |
| `11` | Color RAM $D800 | Blanco (C3=1) |

Esto explica por qué el mismo sello puede verse diferente en VICE: VIC representa los píxeles directamente mediante el bit-pair y la paleta de cada celda. El fondo es compartido; **el efecto es estrictamente blanco y negro cuando el fondo global es negro**, pero esta herramienta no lo cambia para evitar alterar el resto del mapa.

## Nuevo comando, sin paneles adicionales

En el menú habitual **EDIT → Rico's Decolorize**:
1. Seleccioná en el índice 1, 2 o más tiles (por ejemplo un rectángulo de 4×3).
2. Elegí **EDIT → Rico's Decolorize** para activarlo (se muestra ✓ en el comando).
3. El programa conserva esa matriz de tiles como pincel **nativo de Pencil**, con exactamente las dimensiones de la selección. La previsualización y el arrastre se realizan usando el cursor ya existente de LVLLVL.
4. Pintá sobre el mapa: se escriben los IDs de la selección y **solo en las celdas tocadas** C1=0,C2=0,C3=1.
5. Elegí otra selección en el índice para cambiar automáticamente el ancho/alto del sello.
6. Volvé a pulsar **EDIT → Rico's Decolorize**, cambiá de herramienta o pulsá Esc para desactivarlo. Las celdas ya estampadas conservan sus colores.
7. Exportá mediante el menú normal **Export PRG**. Los exportadores Bitmap TEST282/286 leen `ricoBmpColors` directamente, por lo que el efecto se conserva en el PRG.

Ningún bitmap ni tile del tileset original se modifica al aplicar el efecto; se modifican únicamente **las celdas del mapa seleccionadas con el pincel** y sus tres colores locales, no los demás colores del proyecto. La selección se utiliza como sello, *no* como máscara de recoloración de los tiles que ya estaban allí.

## Validación funcional aislada

Se ejecutó el script del repositorio con simulaciones de `Editor`, `CurrentTile`, `LayerGrid`, `DrawTools` y el menú real `Edit`:
- Menú instalado tras `edit-clearHiddenTiles`: PASS.
- Selección 3×2 produce stamp 3×2 de 6 tiles: PASS.
- La escritura de 2 tiles deja su ID intacto y graba `ricoBmpColors=0x100` en ambas posiciones: PASS.
- La celda contigua queda con paleta anterior: PASS.
- Nueva selección 4×1 actualiza automáticamente el pincel: PASS.
- Cambiar a `Erase` desactiva Decolorize y restaura las opciones originales del lápiz: PASS.
- Sintaxis JavaScript válida: PASS.

**Aún no se verificó el UI/VICE real.** En esta primera implementación, el Undo nativo de tiles y el registro adicional de paleta Bitmap no garantizan una restauración atómica del color; queda como asunto a verificar. El color de fondo global se respeta en vez de cambiar el mapa completo.

## Código y pruebas

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test287-ricos-decolorize/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test287-ricos-decolorize.zip
- Implementación aditiva: `TEST/test287-ricos-decolorize/js/RICO_DECOLORIZE_TEST287.js`
- Base intacta: TEST286
