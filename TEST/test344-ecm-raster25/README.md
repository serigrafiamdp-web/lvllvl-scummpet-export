# TEST344 — REMISERIA EBCM 64 caracteres, 9 frames, 25 paletas raster

Estado: experimental, pendiente de validación real en VICE PAL.

## Motivo de nuevo test

El usuario probó TEST343 y vio una alerta antigua: «Frame 1 necesita 1 colores extra de fondo en 5 celdas». Esa alerta pertenece al primer algoritmo que intentaba representar la pantalla completa con una sola paleta EBCM de 4 fondos. El código vigente de TEST343 ya usa una paleta por fila y no contiene esa cadena de error.

Para evitar que GitHub Pages o el navegador entreguen el JavaScript anterior, TEST344 utiliza una **ruta de HTML y archivo JS nuevos**, separados de TEST343.

## Verificación del JSON REMISERIA 64

- 9 frames, resolución 40×25, modo c64ecm, duración 16 ticks para las primeras 8 y 256 para la última.
- Frames 1, 3, 5, 7: 5 colores de fondo en total entre celdas con píxeles de fondo visibles.
- Frames 2, 4, 6, 8: 6 colores de fondo en total.
- Frame 9: 7 colores de fondo en total.
- **Máximo 4 fondos distintos por fila de 8 píxeles en todas las frames.** La representación raster por fila no necesita descartar celdas o sustituir fuentes.
- No se altera el JSON ni el tileset.

## Implementación

Se reutiliza el scheduler multiframe TEST342 y el código raster25 de TEST343, publicado en ruta JS distinta. El programa cambia los registros $D021–$D024 por fila, conserva índices de los primeros 64 glifos y recodifica los códigos de pantalla para cada paleta raster. Se limita a EBCM estático 40×25 con 2–10 frames y sin Map Scroll/SID/Group Animate.

## Para probar

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test344-ecm-raster25/ y comprobar la pestaña TEST344.
2. Importar REMISERIA 64 .json, no cambiar la configuración.
3. Exportar PRG; verificar que el nombre descargado termina en _TEST344.prg.
4. Si aparece el error antiguo «colores extra de fondo», significa que sigue cargándose una página anterior, porque el JS TEST344 no contiene ese mensaje.
5. Si compila, probar en VICE PAL: primera frame correcta, las 9 frames y sus duraciones, colores y caracteres sin corrupción.

No se tocó gh-pages/index.html, TEST342 PASS, TEST339 PASS, ni TEST343.