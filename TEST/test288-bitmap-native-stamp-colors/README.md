# TEST288 — Estampado normal Bitmap Multicolor con los colores de origen

**Fecha:** 24 de octubre de 2026  
**Base:** TEST287 (Rico's Decolorize), TEST286 (Bitmap procedimental) y TEST282 (exportación Bitmap estática PASS).  
**Estado:** PASS en pruebas funcionales aisladas, pendiente PASS visual en navegador y en VICE.  
**Aislamiento:** MASTER y todos los TEST previos intactos.

## Problema

Al seleccionar un bloque, incluso un índice completo 16×16 de 256 tiles, y usar Pencil para estamparlo sobre el arte, los wrappers de TEST279/TEST280 sobrescribían `ricoBmpColors` de cada celda con el pincel C1/C2/C3 vigente. Si ese pincel estaba en `0,0,1` (negro, negro, blanco), la selección se convertía en una decoloración involuntaria, aun con la opción Rico's Decolorize desactivada.

## Corrección TEST288

- **Estampado normal (Pencil):** copia tanto los IDs de tiles (patrones bitmap 8×8) como las paletas Bitmap Multicolor locales, sin depender por defecto del último preset negro y blanco.
- Al seleccionar tiles en el índice, captura una **instantánea por ID** de sus colores desde las celdas del arte que ya utilizan ese tile. La captura ocurre ANTES de estampar y permanece estable hasta la próxima selección.
- Cuando un tile tiene varias paletas en distintas apariciones, elige la más frecuente de las fuentes con color; evita que un relleno monocromo agregado anteriormente por Decolorize eclipse el original coloreado. La decisión es por tile, no por posición de origen.
- Si no existen celdas fuente que contengan ese tile, usa el color explícito por tile (`props.ricoBmpColors`, `ricoBitmapColors`, etc., cuando exista), o los C1/C2 del modo multicolor nativo y C3 del propio tile (`getTileColor`), respetando el rango completo **0–15**.
- Permite seleccionar un tile individual o la matriz completa **16×16**. Mantiene el tamaño del pincel del propio LVLLVL y optimiza su identificación con un mapa de IDs.
- Si el usuario cambia **intencionalmente** los controles C1/C2/C3 DESPUÉS de seleccionar el origen, el nuevo color del pincel tiene prioridad.
- **Rico's Decolorize solamente** fuerza `C1=0, C2=0, C3=1` si se ha activado expresamente desde **EDIT → Rico's Decolorize**. Con la opción desactivada no se aplica la decoloración.
- No agrega paneles ni controles de exportación. Se sigue utilizando **Export → C64 PRG / D64...**.
- Los tiles originales del tileset no se modifican: únicamente se copian índices y paletas al destino. Los exportadores Bitmap leen las paletas locales y generan los colores correspondientes para VICE.

## Validaciones

Pruebas JavaScript aisladas sobre un mapa 40×25 y un bloque seleccionado completo 16×16:

| Prueba | Resultado |
|---|---|
| Sintaxis JS | PASS |
| Captura de 256 colores originales distintos | PASS |
| Estampar los 256 tiles y comparar cada `ricoBmpColors` | **256/256 PASS** |
| Color C3 permitido en todo 0–15 | PASS |
| Decolorize activado fuerza 0x100 | PASS |
| Decolorize desactivado conserva la tinta original | PASS |
| Nuevo color C3 escogido después de seleccionar se respeta | PASS |
| Selección grande con identificación optimizada por ID | PASS |

Estas pruebas **no equivalen a un PASS de imagen en VICE**, pendiente de revisión del usuario.

## Limitación de modelo

Un índice de tile tiene su patrón (8 bytes) pero NO dispone intrínsecamente de tres colores Bitmap MC para cada aparición en pantalla. Una misma ID puede usarse en celdas con diferentes C1/C2/C3. En este primer test el pincel elige una paleta representativa por ID, basada en apariciones existentes, o los metadatos del tileset. Para clonar *dos apariciones de un mismo tile con colores diferentes* exactamente necesitaríamos una selección/copia de celdas de origen, conservando sus paletas por posición, en lugar de una selección de índices.

**También queda pendiente verificar Undo/Redo de `ricoBmpColors`, ya que el historial nativo de LVLLVL conoce `fc`/tiles pero no necesariamente toda esta paleta experimental.**

## Cómo probar

1. Abrí [TEST288 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test288-bitmap-native-stamp-colors/).
2. Activá **SCREEN → Multicolor Bitmap (Experimental)**.
3. Conservá una composición multicolor con varios colores distintos.
4. Seleccioná varios caracteres o todo el índice **16×16** y, **sin activar Rico's Decolorize**, pintá sobre otra zona del mapa con el lápiz normal.
5. El área resultante debe tomar los **dibujos y sus colores de origen**; no debería quedar automáticamente blanca y negra.
6. Activá **EDIT → Rico's Decolorize** y repetí: solamente entonces el área estampada debe tener los valores negro/negro/blanco.
7. Exportá por el menú habitual **Export PRG** y comprobá el resultado en VICE.

## Enlaces

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test288-bitmap-native-stamp-colors/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test288-bitmap-native-stamp-colors.zip
- Script aditivo: `TEST/test288-bitmap-native-stamp-colors/js/RICO_BITMAP_STAMP_SOURCE_COLORS_TEST288.js`
