# TEST299 — Resultado de VICE, 25/10/2026

**Comentario del usuario después de probar TEST299:** "no veo cambios". Se respeta esta evaluación: **no es PASS de mejora perceptible**. No se incorpora al MASTER ni se reemplaza TEST297 PASS.

## Medición independiente de las capturas entregadas

Se midió el contenido cambiante del dibujo en las capturas H.264 de VICE. Ambas capturas son de **1920×1080 a 50 fps**.

- Base TEST297 PASS: `2026-10-24 23-46-06.mkv`, 604 cuadros (~12.08 s). **87 actualizaciones detectadas**, mediana **7 cuadros** entre cambios, **~7,155 cambios/s**.
- Nuevo TEST299: `2026-10-25 00-16-01.mkv`, 519 cuadros leídos (~10.38 s). **87 actualizaciones detectadas**, mediana **6 cuadros** entre cambios, **~8,350 cambios/s**.
- Mejora de frecuencia medida: **~16,7 %** respecto de TEST297 PASS.
- Distribución de separaciones: TEST297: 12×6 cuadros, 63×7, 11×8. TEST299: 11×5, 65×6, 10×7.
- Comprobación cruzada: los cambios coinciden **exactamente** en las zonas superior e inferior del bitmap y permanecen idénticos al variar el umbral de detección entre 3, 5 y 8 niveles medios de gris. No corresponden a bordes del emulador ni cambios aislados de UI.
- La separación depende de la sincronización de la captura a 50 fps y se informa como **estimación de cadencia de la grabación**, no como una medición de ciclos del VIC-II ni de hardware real.
- En la grabación proporcionada no se observan cambios de imagen de grupos independientes fuera de sincronía. El doble buffer parece permanecer visualmente íntegro; no equivale a una validación de todos los estados en todas las máquinas.

## Conclusión

**TEST299 acelera modestamente la frecuencia objetiva de actualización (7.15→8.35 Hz), pero no lo suficiente para que el usuario lo perciba como un cambio significativo.** No calificarlo como PASS de velocidad perceptible. No afirmar `+23%` como mejora real: ese valor se refería a una simulación CPU sin steals del VIC-II; la captura indica ~16.7%.

**TEST297 sigue siendo el último PASS claramente aprobado por el usuario.** TEST299 permanece como una prueba experimental de un scheduler PAL reutilizable para futuros proyectos.

## Próximo experimento recomendado

No intentar más microajustes a la ventana raster, que ya aportó una mejora limitada. Evaluar técnicas de Trident/Fairlight relacionadas con **gestión de secuencias IRQ y coexistencia SID** por separado, y técnicas de reordenamiento/precálculo de datos para una reducción sustancial de los 256 tiles distribuidos en 1000 apariciones. Diseñar un benchmark basado en el JSON REAL del proyecto cuando esté disponible, además del simulador sintético. Antes de cualquier integración, conservar el doble buffer y el MASTER.
