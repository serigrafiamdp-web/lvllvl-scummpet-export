# TEST273 — Activar Custom automáticamente después de Import C64

**Base:** TEST272 (vista previa), TEST271 (atlas único Oil's Well), TEST269 (Warp PASS), TEST268 y TEST267.
**Estado:** PASS en simulación del evento UI; pendiente confirmación visual por usuario. El MASTER del 24/10 no se modificó.

## Cambio solicitado

Tras importar correctamente un nivel con **Import → C64 Formats**, el índice lateral de caracteres se cambia automáticamente a la ordenación nativa **Custom**. Es el mismo cambio que el usuario comprobó manualmente en el selector y que corrige la preview sin alterar los caracteres ni los índices de edición.

Implementación: `ImportC64Formats.prototype.importPrg` envuelve el método TEST272 existente y, **solo cuando devuelve true**, llama a `editor.sideTilePalette.selectTilePaletteMapType('custom')`, que actualiza ambos selectores de paleta e invoca el ordenamiento nativo. Luego fuerza `sideTilePalette.tilePaletteDisplay.draw({redrawTiles:true})` para evitar la miniatura cacheada.

No toca el PRG, la selección de caracteres, el mapa, el charset, los bytes de tiles, Bank1/Bank2, el Warp ni las frames.

## Cómo probar

1. Abrir [TEST273 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test273-auto-custom-after-c64-import/).
2. Proyecto vacío → **Import → C64 Formats**, elegir `ricos oil.prg`.
3. Warp a cualquier nivel y pulsar **Import**.
4. Cerrar el emulador y revisar que el selector de orden de caracteres del lateral marque **Custom** automáticamente, mostrando los caracteres en el orden esperado.
5. Importar otro nivel y confirmar que se agrega una nueva frame, el índice continúa en **Custom** y el mapa sigue correcto.

En el caso de una importación fallida, el selector no cambia. Otros formatos conservan su comportamiento original.

## Entregables

- [WEB TEST273](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test273-auto-custom-after-c64-import/)
- [ZIP TEST273](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test273-auto-custom-after-c64-import.zip)
- [MASTER 24/10 intacto](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026)

## Verificación interna

Simulación JS del ciclo Import: evento de importación exitosa → cambio nativo de orden `custom` → actualización completa de miniaturas. Ante resultado false no se activa. No se realizaron pruebas visuales en el navegador del usuario.
