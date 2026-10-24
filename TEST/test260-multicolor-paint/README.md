# TEST260 — Pintar en Multicolor C64, no volver a Hi-Res

**Fecha:** 23/10/2026. **Estado:** prueba lista; pendiente PASS real del usuario.

## Error confirmado

TEST259 logró que el índice de 512 caracteres de BANK1/BANK2 se *vea* correctamente en C64 Multicolor. Sin embargo, al elegir uno de esos caracteres y pintarlo sobre el mapa, el área de trabajo volvía a Hi-Res.

## Causa raíz

En el VIC-II C64, **los códigos de carácter no son por sí mismos Hi-Res o Multicolor**. En modo de pantalla `c64multicolor`, cada celda usa el bit 3 del valor de **color RAM** (0–7: Hi-Res; 8–15: Multicolor), por lo que el color que guarda `LayerGrid.setCell` en `cell.fc` determina cómo se interpretan los bits.

El código fuente base LVLLVL confirma esta cadena:

- `src/js/textMode/currentTile.js`: `CurrentTile.setColor` guarda `this.color`; `setTiles` cambia el carácter seleccionado.
- `src/js/textMode/layers/layerGrid.js`: `setCell` toma `fc` de `editor.currentTile.color` cuando no recibe un `args.fc` explícito.
- `src/js/textMode/tileSet/tileSet.js`: `drawCharacter` regresa a Hi-Res si está en Multicolor y `cellColor < 8`.
- `TEST259` alteraba el color **sólo al dibujar el índice**, por eso no corregía el pincel.

## Corrección TEST260

`RICO_MULTICOLOR_BRUSH_TEST260.js` agrega un wrapper pequeño a los métodos `CurrentTile.setColor`, `CurrentTile.setTiles` y `CurrentTile.setScreenMode`:

1. Si la capa seleccionada está en SCREEN `c64multicolor`, el pincel utiliza `(color & 7) | 8`: 0–7 → 8–15 manteniendo los 3 bits del color seleccionado.
2. Elegir caracteres del índice (cualquier banco), cambiar de color y cambiar de SCREEN sincroniza automáticamente el pincel.
3. En SCREEN Text, se respeta el valor original y vuelve Hi-Res normalmente.
4. Los sprites se excluyen para conservar su semántica particular de color.
5. **No se reescriben las celdas existentes del mapa** ni los bitmaps del charset. Los nuevos trazos del pincel sí usarán color RAM Multicolor.
6. Las operaciones de copia/pega o historial que transmiten `args.fc` explícito al `LayerGrid.setCell` no se interceptan.

Se conserva TEST256 (UI compacta), TEST257 (índice redibujado), TEST258 (SCREEN sin el bloqueo ECM), TEST259 (render Multicolor del índice) y todo el motor GROUP TEST247. ONDAS y MASTER del 23/10 permanecen intactos.

## Validación realizada

- Sintaxis JS: PASS.
- Modelo aislado de los métodos del pincel: al seleccionar carácter en modo Multicolor se convierte el color 2→10; cambiar color 6→14; regresar a Text permite color 6; volver a Multicolor restaura 14; sprite con color 2 sigue 2. **PASS de lógica**, no de navegador.
- Se preserva la lista de caracteres seleccionados y no se tocan los píxeles del TileSet.
- Pendiente ejecutar con editor y render C64 real (y exportar PRG si se desea).

## Prueba manual

Con el mismo dibujo y SCREEN → Multicolor: elegir caracteres de BANK1 y BANK2, pintar varias celdas y comprobar que **los trazos nuevos se ven en Multicolor**, no en Hi-Res. Cambiar el color desde la paleta de 16 colores y repetir. Volver a SCREEN → Text y verificar que vuelva el comportamiento de dibujo correspondiente.

- **Web:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test260-multicolor-paint/
- **ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test260-multicolor-paint.zip
- **Código TEST260:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test260-multicolor-paint/TEST/test260-multicolor-paint
