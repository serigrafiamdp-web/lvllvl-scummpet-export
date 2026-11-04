# TEST326 — Restricciones de exportación horizontal: auditoría de RAM

**TEST326 se mantiene experimental, sin PASS independiente del rango completo.** Su corrección de 100 columnas fue incorporada a TEST328 (PASS del usuario 04/11). Los máximos 245/102 son valores calculados, no validados en VICE. [Registro TEST328](../test328-ecm-preserve-4-backgrounds/PASS_04_NOV_2026.md). Basado en el editor TEST297 (VICE PASS de su ruta Bitmap). No modifica la página principal, ni los motores originales, ni el MASTER.

## Límites artificiales retirados
1. **TEST186/203, un frame:** se retira el máximo antiguo de 96 columnas de Scroll Area horizontal. El límite se calcula con las dos regiones RAM de 12.288 bytes (mapa $4000–$6FFF y colores $7000–$9FFF). Cada columna necesita 50 bytes: máximo **245 columnas**. Los límites de la cámara horizontal de 8 bits se preservan.
2. **TEST206, varios frames compactos:** se retira el máximo antiguo de 96 columnas. Los buffers de trabajo de $4000–$53FF y $5400–$67FF tienen 5.120 bytes cada uno, por lo que el máximo del compacto es **102 columnas**. TEST205 conserva su límite total de 12 KB y se elige cuando los frames completos caben.

## Limitaciones REALES conservadas
- Rico's Window **40×25** en el exportador horizontal ancho actual; necesita hardware y lógica nueva para aceptar correctamente 38×24, no un cambio de una condición.
- TEST186 exporta **un frame**. TEST205/206 implementan la ruta multiframe.
- Los Group Scroll y animadores individuales no planificados permanecen bloqueados para evitar PRG corruptos.
- Un Screen de **60 filas no es un impedimento para el motor horizontal**: este lee únicamente las 25 filas seleccionadas por Rico's Window. No se inventa movimiento vertical ni se silencian filas descartadas en la pantalla visible.
- Un Screen de **40 columnas** usa la ruta horizontal histórica TEST168 (aunque tenga 60 filas). Para un desplazamiento horizontal sobre contenido más ancho es necesario Screen y Scroll Area mayores de 40 columnas.
- Los límites de RAM, del raster, de grupos y de índices de 8 bits permanecen activos.

## Pruebas sugeridas
- Abrir [TEST326](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test326-horizontal-map-limits/) y recargar Ctrl+F5.
- Cargar **copia del JSON**, configurar un frame, Map Scroll Left/Right, Rico's Window 40×25 dentro del Screen y Scroll Area de más de 40 columnas, con hasta 60 filas de Screen.
- Probar 96, 97, 120, 245 y 246 columnas de Scroll Area. 246 debe detener la exportación por RAM, no hacer truncamiento.
- Para multiframe compacto, probar 97, 102 y 103 columnas cuando la suma de frames exceda 12 KB.
- Si falla el motor horizontal de un frame, se muestra el motivo real solo al fallar y queda en `window.RICO_TEST326_HORIZONTAL_LAST_ERROR`. También se conservan `window.RICO_TEST200_HORIZONTAL_LAST_ERROR` y `window.RICO_TEST206_LAST_ERROR`.
- Ejecutar y validar cada PRG en **VICE PAL** antes de marcar PASS. Los límites calculados pasan validación lógica, **no son un PASS del código C64**.

No se altera el exportador original TEST168 de mapas verticales ni se prometen 245 columnas a rendimiento completo.