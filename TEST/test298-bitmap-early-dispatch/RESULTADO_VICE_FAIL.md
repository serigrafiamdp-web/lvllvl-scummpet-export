# TEST298 — RESULTADO VICE: SIN MEJORA DE VELOCIDAD

**Fecha:** 24 de octubre de 2026 (Argentina). **Conclusión:** TEST298 **FAIL del objetivo de aceleración perceptible**; el doble buffer continúa sin parpadeos.

## Comparación real de capturas

- Base TEST297 PASS: `2026-10-24 23-46-06.mkv`, 1920×1080, 50 fps, 604 cuadros (~12,08 s).
- TEST298: `2026-10-24 23-55-20.mkv`, 1920×1080, 50 fps, 501 cuadros (~10,02 s).
- Se examinaron las diferencias de cuadros en la zona de bitmap del arte, excluyendo bordes y controles (ROI de video aproximada x=500…1100, y=180…900). Las transiciones fueron grandes (~29 puntos de diferencia media en escala de grises), separadas por cuadros prácticamente idénticos.
- TEST297: **86 transiciones** detectadas, separación media **~7,0 cuadros**, frecuencia **~7,1 actualizaciones/s**.
- TEST298: **71 transiciones** detectadas, separación media **~7,0 cuadros**, frecuencia **~7,1 actualizaciones/s**.
- No se observaron desgarros o parpadeos relevantes de imagen en TEST298; la imagen siguió moviéndose por pasos completos.

**FAIL de mejora real TEST298**: pese a reducir 7,8% ciclos simulados (121.960→112.424) frente a TEST297 en el estrés distribuido, no consiguió cambiar el número de cuadros de captura por paso en VICE. Posible cuantización por sincronización raster: el motor debe terminar un cuadro completo antes del flip, y un ahorro insuficiente puede no acortar la espera hasta el siguiente raster disponible.

### Estado protegido

Último PASS de velocidad real: `release/test297-pass-2026-10-24`. No incorporar TEST298 al MASTER, no reemplazar TEST297 PASS. El experimento queda archivado para consultar su código y benchmarks.

### Próximo objetivo

Disminuir de forma sustancial el número de ciclos por actualización y/o mejorar programación de los flips, de forma que el render complete antes de **otra** oportunidad de cambio de banco de video; validar siempre con el mapa real y contar cuadros efectivos por desplazamiento, no solo ciclos simulados. Mantener los 256 tiles y el doble buffer sin parpadeos.
