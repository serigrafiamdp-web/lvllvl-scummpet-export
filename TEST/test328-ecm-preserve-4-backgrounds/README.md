# TEST328 — Export ECM horizontal con compactación no destructiva
Basado en TEST327 y publicado en ruta aislada. **PASS informado por el usuario el 04/11/2026 para su prueba ECM MEGASOFT 100×25**. Ver [registro](PASS_04_NOV_2026.md); no atribuir automáticamente PASS a Group Scroll o multiframe.

## Causa verificada
El exportador horizontal generado por TEST327 fuerza `LDA #$1B / STA $D011` en el controlador, que **desactiva ECM**, y solo inicializa `$D021`. Por eso un PRG solicitado en Extended Background Color acaba mostrando un solo fondo.

## Qué corrige
- Detecta `mode:extended` en la exportación, o modo de Screen `c64ecm`.
- Examina los caracteres realmente usados **en el área horizontal exportada** (las 25 filas y ancho completo), añade los caracteres del Group Scroll configurado y los compacta en los primeros 64 glifos para el PRG, sin modificar TileSet, frames ni JSON.
- Reescribe cada código de pantalla como `(selectorBG<<6) | indiceFisico0a63`, manteniendo el glifo y el fondo por celda.
- Para un documento Text Mode, toma los fondos `bc` del mapa o el fondo general donde `bc=-1`. Rechaza más de cuatro fondos efectivos, sin inventar pérdida de color.
- Para un documento ECM ya convertido, conserva los cuatro registros globales, usa `cell.bc` como slot ECM y, cuando no hay fondo explícito, los dos bits altos de `cell.t`.
- Coloca bit 6 en `$D011` (`#$5B`) y carga `$D021-$D024` con los cuatro fondos.
- Remapea los punteros de Group Scroll y animaciones individuales a la nueva posición física, en ambos bancos. Conservar la posición original en el editor.
- **No se tocan otras exportaciones**. Si `args.mode` no es Extended y el proyecto no está ya en ECM, se usa el motor TEST327 original.

## Caso MEGASOFT 100 filas.json
Screen 100×25; Window 40×25; Scroll Area 100×25; scroll de mapa Left 1px/2 ticks, 1 frame. Textmode original, 22 glifos usados; fondos de celdas `0`, `8`, `14` y `-1` (fondo general 14). No supera los límites 64 glifos / 4 fondos. Hay ocho glifos animados Left; el motor individual debe conservar sus nuevos punteros. No hay Group Scroll configurado.

## Protocolo
1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test328-ecm-preserve-4-backgrounds/ y recargar Ctrl+F5.
2. Cargar directamente **MEGASOFT 100 filas.json**. No convertir el documento si no es necesario.
3. Export PRG: seleccionar **Extended Background Color**.
4. Ejecutar PRG en VICE PAL y comprobar (a) scroll 100 columnas (b) tres fondos de MEGASOFT, (c) las ocho animaciones individuales. **Usuario informó PASS para TEST328**; falta validación específica de otras combinaciones.
5. Diagnóstico de consola: `window.RICO_TEST328_ECM_EXPORT.last`, `.lastError`, `.exportCount`.
6. Añadir un Group Scroll de glifos distintos y repetir. Si un mismo glyph está en el grupo e individual, se mantiene el guard de integridad.

## Restricciones genuinas
- ECM permite 64 glifos físicos y 4 fondos simultáneos; no se pueden omitir glifos o fondos silenciosamente.
- El motor horizontal de ancho variable funciona actualmente en la ventana **40×25 y un frame**.
- Group Scroll y animación individual sobre el mismo carácter físico requieren un compositor, no están desbloqueados por este test.
- TEST328 **PASS comunicado por el usuario** para el caso MEGASOFT. Group Scroll real, multiframe, BANK2 y cuatro fondos simultáneos requieren prueba individual adicional.
