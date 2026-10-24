# TEST277 — Rellenar líneas verticales al pasar MC → HiRes

**24/10/2026.** Base **TEST275**, incluye importación secuencial TEST271, Warp TEST269 y Custom automático TEST273. **MASTER intacto**. No modificar TEST276 (FAIL comunicado).

## Objetivo único

Quitar franjas verticales vacías provocadas por leer un carácter **C64 Multicolor (4 parejas de bits)** en **HiRes (8 bits individuales)**. Los colores no son prioridad. NO se busca preservar el esquema de cuatro colores: el objetivo es completar píxeles horizontales.

### Motivo del fallo de TEST276

TEST276 convertía **solo** códigos que aparecían en celdas con `FC=8..15`, lo que podía omitir caracteres visibles en otros colores. También cancelaba todo si encontraba un solo carácter animado, y ubicaba los controles en el área inferior de ordenación del índice, no necesariamente visible.

### Corrección concreta TEST277

1. **Los 256 glifos** del Bank1 se convierten sin depender del FC. Las animaciones de origen no se alteran; el nuevo set es un *snapshot estático* del frame 0.
2. La transformación original para cada pareja `00→00`, `01→11`, `10→11`, `11→11` completa huecos de 1 píxel.
3. Una segunda pasada opcional del propio TEST277 también rellena **una pareja completa 00 si está en medio de dos parejas sólidas 11** dentro de la misma fila. No completa huecos de borde ni puede adivinar líneas que cruzan distintas celdas del mapa.
4. El nuevo charset se guarda en un tileset de **256 caracteres nuevo e independiente**, se asigna a la capa seleccionada y se cambia SCREEN a Standard/HiRes; las mismas frames/mapas/índices permanecen.
5. **Restaurar MC** devuelve el charset original y el modo Multicolor.
6. Se vuelve a enlazar el renderer del Bank1/Bank2 de TEST19 después de cambiar de tileset y se fuerza redraw.
7. Los controles **Rellenar líneas → HiRes** y **Restaurar MC** están en una franja visible justo **encima del índice** del panel lateral Tiles, reservando 30px para no tapar la primera fila.
8. Si existe Bank2 separado, se clona y se transforma en el nuevo tileset; el Bank2 original se conserva.

**Limitaciones conocidas:** Los glifos animados se congelan en frame 0 en la copia HiRes (no se modifica el original). Convertir todos los glifos puede engrosar letras y detalles, no solo el terreno. La conversión tampoco preserva el color de fondo/multicolor. Las franjas provenientes de secuencias completas de `00`, de un borde entre dos caracteres o de un error de formato distinto requerirán otro algoritmo.

## Verificación en PRG real

Archivo original subido `ricos oil.prg`, 38.405 bytes: el bloque de charset de 128 glyphs `$9A00-$9DFF` tiene:

- 73 índices diferentes usados en la unión de ocho mapas estáticos.
- **67 de esos 73 índices** tienen al menos una fila que cambia con la conversión.
- **522 filas** de los 128 glifos tienen un byte distinto en el resultado.
- **1.470 nuevos píxeles encendidos** dentro de los 128 glifos originales (pares 01/10 y cierre de huecos internos).

Esto es una medición de datos reales del PRG, **no** un PASS de navegador. Las demás entradas 128..255 quedan convertidas también desde el estado actual del proyecto cuando existan.

## Prueba visual

1. Abrir [TEST277 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test277-mc-hires-all-glyphs/).
2. Import C64 → `ricos oil.prg`; Warp nivel 1 → Import. Cerrar diálogo.
3. En **Tiles**, en la barra nueva encima del índice, clicar **Rellenar líneas → HiRes**.
4. Confirmar que el terreno pierde parte de las franjas verticales de 1px/2px y que Standard Mode está seleccionado. El resumen debe indicar píxeles rellenados **mayor que cero**.
5. Pulsar **Restaurar MC**, comparar con el original; volver a rellenar si se desea.
6. Confirmar que Warp y capturas sucesivas no cambian con el test. **No dar PASS antes de ver una captura comparativa del usuario.**

## Enlaces

- [WEB TEST277](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test277-mc-hires-all-glyphs/)
- [ZIP TEST277](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test277-mc-hires-all-glyphs.zip)
- [TEST276 anterior, sin modificaciones](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test276-mc-to-hires-fill/)
- [MASTER 24/10 sin modificaciones](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026)
