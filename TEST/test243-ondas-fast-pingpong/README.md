# TEST243 — Ping Pong grupal FAST8 (23 de octubre de 2026)

**Base:** TEST242 aislado, conservado sin modificaciones. TEST243 de color (ruta `TEST/test243/`) también permanece intacto.

## Evidencia del problema
Video recibido: `2026-10-23 14-31-03.mkv`, 1920×1080, 50 fps, 12,42 segundos. El Ping Pong atómico elimina la deformación ONDAS pero avanza muy lento incluso seleccionando 8 píxeles por tick.

## Implementación
- **ONDAS:** la misma ruta de TEST242; no se acelera ni se transforma su comportamiento.
- **Ping Pong vertical:** motor de TEST242 sin cambios en esta prueba.
- **Ping Pong horizontal LEFT/RIGHT a 8 píxeles/tick:** añade compositor especializado cuando se exporta únicamente la animación grupal, sin Map Scroll.
- Para los grupos que caben en RAM ($A000..$CFFF, sin tocar I/O), se precalculan los 8 desplazamientos subpíxel del bitmap original de cada carácter seleccionado, incluido el recorte en los bordes.
- El ASM obtiene el glifo predesplazado por dos índices (columna origen y residuo de píxeles) y copia los ocho bytes de un carácter con un bucle corto; **no recalcula shifts dentro de cada raster row**.
- Fases y giro Ping Pong siguen el contador original, incluso si un rebote de 8 píxeles llega a una posición no múltiplo de ocho.
- Si el cache completo no entra en RAM segura, usa una copia directa en fases alineadas a 8 píxeles y vuelve a TEST242 en las no alineadas. Si tampoco cabe la copia mínima, emplea TEST242.
- El charset de destino sigue siendo el banco no visible; el IRQ intercambia $D018 únicamente al concluir el trabajo. No cambia el editor, el SID ni las rutinas de mapas.

## Verificaciones realizadas
- Sintaxis JavaScript: PASS.
- Generación de fuentes ASM del exportador estático: ocho modos (Ping Pong + ONDAS) sin etiquetas duplicadas.
- Matriz 3×4 de ejemplo: los bytes de todas las fases 0–7 de LEFT y RIGHT coinciden con el compositor recortado píxel por píxel.
- Memoria de caché: aborta el camino rápido antes de invadir $D000–$DFFF.
- **Pendiente:** validación del ensamblado real en LVLLVL y rendimiento / fidelidad visual en VICE. NO declarar PASS ni prometer 8px efectivos en cada cuadro para grupos grandes.

## Enlace
https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test243-ondas-fast-pingpong/

## Retroceso
TEST242 original:
https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test242-ondas-pingpong/
