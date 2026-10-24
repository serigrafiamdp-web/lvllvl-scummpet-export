# TEST258 — SCREEN Multicolor y ECM sin bloqueos (23 de octubre de 2026)

**Estado:** código publicado en prueba aislada, pendiente de comprobación visual y funcionamiento real por el usuario. No es PASS.

## Problema reportado

1. SCREEN → Multicolor no actualizaba adecuadamente el índice lateral BANK1/BANK2 (persistía modo visual anterior).
2. Al intentar cambiar SCREEN apareció un `alert('LVLLVL TEST01 - ECM REPACK...')` indicando **240 caracteres distintos en las frames**, más de 64 glifos físicos ECM, y se canceló la conversión.
3. El usuario quiere **poder cambiar de modo aunque el nuevo modo pierda fidelidad visual**; no desea prohibiciones ni mensajes de alerta.

## Causa localizada

El módulo `js/SCUMM_ECM_LIVE_REPACK_TEST01.js` antiguo intercepta `LayerGrid.prototype.setMode`; en líneas 42–50 de la versión conservada aborta si los caracteres usados superan 64. Otros tres módulos (TEST04–06) también interceptan `setMode` y pueden abrir selectores ECM.

En el código original de James, `LayerGrid.prototype.setScreenMode` simplemente llama a `this.setMode`; y `TextModeEditor.prototype.setScreenMode` finaliza llamando a `setInterfaceScreenMode` tras ese callback. Así, al abortar TEST01, no se ejecutaba correctamente la transición ni la reconstrucción del índice de TEST257.

## Corrección TEST258

- El módulo `RICO_SCREEN_MODE_UNBLOCK_TEST258.js` se ejecuta **después de TEST01/04/05/06** y reemplaza únicamente la ruta de `LayerGrid.prototype.setMode` para `'c64multicolor'` y `'c64ecm'`, llamando al método **nativo** `LayerGrid._setMode`.
- Con ello no se ejecuta el repaqueo ECM obligatorio ni sus `alert`; se cumple la selección explícita del usuario.
- Se conserva el cambio Text y la ruta de tilesets vectoriales del LVLLVL original. No se destruyen bytes del charset ni se escribe BANK2; ECM presenta los alias de 64 glifos propios del hardware, aunque visualmente pierda fidelidad respecto de una pantalla de 256 caracteres.
- TEST257 repinta **completo** el bitmap del índice lateral tras el cambio de modo (tanto Multicolor como Text/ECM).
- TEST256 conserva la paleta compacta y las opciones Background/Border accesibles.
- Exportación Group/Map/ONDA y PRG sin cambios. MASTER del día 23/10 y todos los PASS anteriores intactos.

## Verificaciones

- El código JS supera prueba de sintaxis.
- Mock con `LayerGrid.setMode` legado que aborta ECM: secuencia Multicolor → Text → ECM → Text → Multicolor **sin invocar bloqueo**; editor y layer cambian a modo solicitado; cinco actualizaciones completas del índice, BANK1/BANK2 preservados.
- Comprobación de scripts: prueba web TEST257 + único nuevo módulo TEST258.
- **Pendiente** navegador real, cambio SCREEN del usuario y VICE.

## Prueba recomendada

1. Abrir TEST258 con el mismo proyecto.
2. SCREEN → Multicolor: confirmar cambio de pantalla y del índice visual.
3. SCREEN → Text → Multicolor: confirmar que vuelve a cambiar.
4. SCREEN → ECM con 240 caracteres: debe cambiar **sin el cartel TEST01**, aunque ECM muestre alias/pérdida de fidelidad.
5. Comprobar que Background/Border se mantienen accesibles y BANK1/2 siguen seleccionables.

**Web:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test258-screen-mode-force/

**ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test258-screen-mode-force.zip
