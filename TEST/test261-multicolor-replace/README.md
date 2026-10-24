# TEST261 — Edit → Replace Color para C64 Multicolor y selección

**Fecha:** 23 de octubre de 2026. **Estado:** listo para prueba en navegador. No es PASS hasta validación del usuario.

## Necesidad

El Replace Color original de LVLLVL modifica los colores `fc` y `bc` de todas las celdas del frame actual o de todos los frames, **sin respetar la selección**. En modo C64 Multicolor, los colores visibles no son solo `fc`: existen tres registros compartidos por frame (Background, Multicolor 1 y Multicolor 2) y el Color 3 de celda (`fc` con bit 3 activado).

## TEST261 implementado

Mantiene el diálogo original **Edit → Replace Color**, sus dos muestras de color y su selector de frames; añade:

- **Alcance:** Área de trabajo completa o Solo selección.
- **Canales Multicolor:** Color 3 de celda (checkbox FG original), Fondo compartido (checkbox BG original), Multicolor 1 y Multicolor 2 (dos checkbox nuevos).
- **Intercambiar A ↔ B:** conmutación bidireccional opcional, sin pérdida, o reemplazo A→B habitual.
- **Frame actual / todos:** se respetan los radios nativos.
- **Historial:** cambios de celda por `LayerGrid.setCell` con Undo/Redo nativo; cambios en registros compartidos con nueva acción de historia `rico261MultiRegister` y adaptación de Undo/Redo.

En Multicolor, la pantalla mezcla caracteres Hi-Res y Multicolor. Para evitar destruir los que deliberadamente siguen en Hi-Res, **Color 3** solo reemplaza `fc` en el rango 8..15, comparando los 3 bits bajos. Cambiar 4→6 o 12→14 mantiene el bit de habilitación Multicolor. El Color 3 del VIC-II está limitado a la paleta de 8 colores bajos (0..7); los otros colores de la paleta se interpretan por sus tres bits bajos en este canal. Los registros compartidos aceptan los 16 colores C64.

### ¿Área completa o selección?

- **Área completa:** las celdas afectadas se cambian en toda la pantalla; también se pueden cambiar los valores Background, Multicolor 1 y Multicolor 2 compartidos por frame.
- **Solo selección:** se actualizan únicamente los colores de las celdas del rectángulo de selección visible. Los registros compartidos se deshabilitan **para evitar modificar otras zonas del dibujo**. No se hacen transformaciones ocultas de bitmaps o replicación de caracteres.
- Con «Todos los frames» y «Solo selección», el mismo rectángulo de coordenadas se utiliza para cada frame.
- Si no hay selección activa, «Solo selección» no está disponible y el motor no cambia nada silenciosamente.
- SCREEN Hi-Res con «Área completa» mantiene el Replace Color original; con «Solo selección» usa la misma edición de celdas con soporte Undo.

## Alcance técnico y regresiones

No se tocan TileSet bitmap, BANK1/2, ani/scroll/export ASM, ONDAS ni MASTER. Se añade un módulo JS al final de la misma pila de scripts del TEST260. El trabajo sobre memoria de pantalla se efectúa con el API del editor.

## Comprobaciones automatizadas

- Sintaxis JS correcta.
- Ejemplo Multicolor `fc=12` reemplazando color 4→2: `fc=10`; `fc=4` Hi-Res preservado.
- Reemplazo sobre selección de 1 columna en dos frames: solo las celdas dentro del marco cambiaron; los tres registros compartidos permanecieron iguales.
- Reemplazo de color compartido 5→9: BG y Multi1 actualizados; Undo y Redo restauran y aplican los valores.
- Intercambio bidireccional 5↔6: BG, Multi1 y Multi2 permutados correctamente; Undo y Redo funcionan.
- **Pendiente:** verificar el diálogo real, el scroll de opciones, los pickers de colores y el render en navegador con VICE/PRG si corresponde.

## Enlaces

- **WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test261-multicolor-replace/
- **ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test261-multicolor-replace.zip
- **Código:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test261-multicolor-replace/TEST/test261-multicolor-replace
