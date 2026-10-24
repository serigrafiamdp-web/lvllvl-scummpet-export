# TEST275 — El índice lateral sigue el modo de pantalla

**Fecha:** 24/10/2026.
**Base:** TEST274 (preview MC uniforme), TEST273 (Custom automático), TEST271 (importación secuencial) y TEST269 (Oil's Well Warp PASS).

## Problema

Al cambiar SCREEN de **C64 Multicolor** a **HiRes / Standard Character Mode**, el dibujo del mapa sí cambia pero el índice lateral se queda mostrando una preview anterior o regresa al orden anterior. La caché `tilePaletteImageData` y el orden del índice no se reconstruyen correctamente en la misma transición.

## Hallazgo en el código original de LVLLVL

- `LayerGrid._setMode(screenMode)` hace `tileSetManager.updateSortMethods()` al cambiar el modo.
- `TileSetManager.updateSortMethods()` reconfigura el ordenamiento de las paletas a **Columns of 16** en vez de preservar **Custom**.
- `TilePaletteDisplay.draw()` reutiliza `tilePaletteImageData` salvo que se llame a `draw({redrawTiles:true})`.
- TEST257 ya re-renderiza la caché cuando se cambia de modo, pero no conserva el selector Custom al finalizar el cambio.
- TEST274 fuerza **Multicolor** únicamente cuando el modo actual de la capa es `c64multicolor`; en `textmode` o `c64standard` usa el dibujante HiRes nativo.

## Solución TEST275

El archivo `TEST/test275-index-follows-screen-mode/js/RICO_SIDE_INDEX_MODE_SYNC_TEST275.js` envuelve **solo** `TextModeEditor.prototype.setInterfaceScreenMode`.

Después de que termina el cambio normal de modo:
1. Lee el modo real de la capa (sin confiar en el modo solicitado).
2. Si se han importado frames C64 en esta sesión, ejecuta `editor.sideTilePalette.selectTilePaletteMapType('custom')` **después** del `updateSortMethods` interno.
3. Fuerza `sideTilePalette.tilePaletteDisplay.draw({redrawTiles:true,screenMode:modoActual})` para regenerar el atlas visual.
4. Al estar la capa en **C64 Multicolor**, TEST274 representa todas las miniaturas como MC; en **Standard / HiRes** deja que LVLVL las dibuje en modo HiRes, respetando los mismos bits originales.
5. Al repetir el cambio, se sincroniza Custom y las miniaturas de ambas mitades del índice. No se alteran los mapas, índices, caracteres originales, Bank 1/2, Color RAM, emulador ni exportadores.

**Alcance:** la restauración automática de Custom se limita a sesiones con importación C64, señaladas por el módulo TEST272. Para otros proyectos se respeta la ordenación elegida por el usuario.

## Prueba sugerida

1. Abrir [TEST275 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test275-index-follows-screen-mode/).
2. Crear un proyecto vacío, importar un nivel de `ricos oil.prg` y cerrar el emulador. Debe quedar el índice en **Custom**.
3. Cambiar SCREEN a **Standard Character Mode / HiRes**. El mapa y el índice lateral deben cambiar juntos, sin perder **Custom**.
4. Volver a SCREEN → **C64 Multicolor**. El índice tiene que volver a mostrar todas las miniaturas MC, conservar Custom y la misma selección de caracteres.
5. Repetir 2–3 veces y revisar que al pintar con un índice el carácter y código sean los mismos.

## Validación

Simulación JS con módulos reales TEST274/275 y setter original simulado que reconfigura la paleta en Columns:
- Cambiar a `textmode`: el orden queda **Custom**, caché totalmente actualizada y glifos dibujados en HiRes.
- Volver a `c64multicolor`: el orden queda **Custom**, caché actualizada y todos los glifos dibujados en MC (bit3 del color forzado **solo para miniaturas**).
- Cambiar a `c64standard`: **Custom + HiRes**.
- **PASS simulación.** Aún no hay PASS visual del usuario en navegador.

## Enlaces

- **WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test275-index-follows-screen-mode/
- **ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test275-index-follows-screen-mode.zip
- **MASTER congelado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026

**No se modificaron TEST274, TEST273 ni el MASTER.**
