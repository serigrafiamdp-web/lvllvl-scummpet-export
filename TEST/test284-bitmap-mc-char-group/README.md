# TEST284 — Bitmap Multicolor: animación individual + Group Animate

**Fecha:** 24/10/2026
**Base:** TEST282 imagen fija PASS en VICE; TEST283 motor sparse experimental; TEST281 editor PASS.
**Estado:** pruebas funcionales aisladas y emulador de instrucciones 6502 PASS; **pendiente PASS en VICE**. MASTER y TEST282 preservados.

## Pedido del usuario

> Esos menús son confusos: exportar desde el menú normal, sin botones especiales; primero animar los caracteres individuales y grupales, no frames completos del mapa.

## Interfaz simplificada

- Oculta completamente el panel añadido `rico279Panel` (toggle y dropdowns duplicados).
- Oculta `TEST282: Exportar imagen FIJA`, `TEST283: Exportar Bitmap MC ANIMADO`, y textos de ayuda largos.
- Conserva solamente cuatro pequeños selectores de tinta **BG/C1/C2/C3** en Tile Editor. Son necesarios para pintar el bitmap experimental (seleccionan los 2 bits reales del pincel), sin paneles de exportación.
- Se activa el modo desde **SCREEN → Multicolor Bitmap (Experimental)**. Solo hay un lugar para activarlo.
- Se exporta desde el **menú habitual Export PRG**:
  - Sin animación activa de caracteres usados → PRG estático automático (`RICO_BITMAP_MC_STATIC.prg`).
  - Con animación individual o Group Animate → PRG animado automático (`RICO_BITMAP_MC_ANIM.prg`).
- No hay que escoger modo extra ni activar un botón especial de exportación.

## Animación implementada

**No anima frames completos del documento.** El motor usa la **frame actual como mapa fijo** (40x25 visibles).

- Animación individual de carácter: **Left, Right, Up, Down, Blink y Frames internos del glifo**, usando el Ticks/Frame existente.
- Group Animate: **Scroll Left, Right, Up, Down, Ping Pong Left/Right/Up/Down, Blink y Frames del grupo**, usando `Ticks/Frame` y `Pixels / Tick` del grupo.
- Combinación simultánea: cada carácter y grupo mantiene su propio reloj; se construye el ciclo común de las animaciones visibles.
- Lee grupos de `tileSet.getDocRecord().data.ricoGroupAnimationsV1.bank1 / bank2`, incluyendo el banco activo asignado a la frame.
- Respeta exclusión de caracteres vacíos cuando la opción global `animateEmptyCharacters` está desactivada.
- Los 256 índices siguen siendo IDs de tiles. Se convierten a bytes de bitmap 2 bits/píxel; cada patrón único se guarda una sola vez en el atlas. El runtime ASM actualiza solo las celdas visibles cuyo patrón cambia (8 B/celda), sin duplicar todo el bitmap por tick.
- Colores C1/C2/C3 y BG se conservan como en TEST282.
- Reutiliza solo el runtime 6502 y el formato de listas dispersas de TEST283, **no** su reproducción de frames del mapa.

## Memoria

Igual a TEST283: PRG en $0801, bitmap inicial $1000, Screen inicial $2F40, Color inicial $3328, atlas/streams $3800 hasta $5BFF; VIC Screen $5C00, Bitmap $6000, Color RAM $D800.

## Validaciones internas

- Sintaxis JS e inyección de menú: PASS.
- Exportación automática estática sin animaciones: PASS mediante prueba aislada con TEST282 simulado.
- Animación individual solamente: PASS, 8 pasos, período 16 ticks.
- Group Animate solamente: PASS, 8 pasos.
- Individual + Group Animate: PASS, 8 pasos combinados, cambios dispersos reales de bitmap.
- Simulación de CPU con instrucciones 6502 reales, copia y actualizaciones de patrones durante 8 transiciones: PASS, 42.698 instrucciones simuladas, registros VIC `$D011=$3B/$D016=$18/$D018=$78`, sin código de operación desconocido.
- **El test aislado no garantiza temporización en raster real de VICE ni velocidad máxima sostenida**.

## Cómo probar VICE

1. Abrir [TEST284 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test284-bitmap-mc-char-group/).
2. Elegir **SCREEN → Multicolor Bitmap (Experimental)**.
3. Dibujar un único mapa; seleccionar un carácter **que aparezca en el mapa**, configurar `Tile Editor → Animated Type: Left` y `Ticks/Frame: 4`.
4. Exportar por **el menú normal Export PRG** y abrir el archivo `RICO_BITMAP_MC_ANIM.prg` en VICE. Debería moverse ese carácter sin cambiar toda la frame ni los colores de las demás celdas.
5. Seleccionar en Tile Editor un grupo de 2 o más tiles presentes en el mapa; en `Group Animate` seleccionar `Scroll Right`, por ejemplo 2 píxeles/tick y 2 ticks/frame. Reexportar por el menú normal. Deberían funcionar simultáneamente el individual y el grupo.
6. Comparar los resultados del editor y el PRG exportado.

## Limitaciones de esta primera adaptación

- Map Scroll, movimiento de mapa, SID, switch bank global en medio de un ciclo, y cambio entre frames completos del documento: **no incluidos**.
- Los tipos de movimiento admitidos usan las transformaciones nativas de píxeles de LVLLVL; si un proyecto usa varios grupos con períodos incompatibles, puede alcanzar el límite de ciclo (4096 ticks / 255 pasos).
- Sin presupuesto garantizado de ciclos de CPU por tick. Los grupos grandes pueden ralentizar la reproducción. Cuando el atlas o los cambios exceden $5C00, exportación rechazada explícitamente.
- En mapas mayores que 40x25, el motor solo muestra la primera ventana superior izquierda; aún no integra Window Dimensions.
- `Group Animate Switch Bank` no funciona en el mismo ciclo Bitmap: aparece error en vez de generar un PRG engañoso.
- El TEST284 no cambia el modo carácter tradicional, la ruta de exportación nativa de otros modos, ni TEST281/282 PASS.

## Entregables

- [TEST284 — WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test284-bitmap-mc-char-group/)
- [TEST284 — ZIP COMPLETO](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test284-bitmap-mc-char-group.zip)
- Código fuente: `TEST/test284-bitmap-mc-char-group/js/RICO_BITMAP_MC_CHAR_GROUP_TEST284.js`
