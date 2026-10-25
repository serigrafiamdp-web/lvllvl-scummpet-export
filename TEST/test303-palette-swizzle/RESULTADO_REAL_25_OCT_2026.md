# TEST303 — Resultado del proyecto real: conversion no activada

**25 de octubre de 2026. Estado: FAIL de aceleración sobre el arte real; fallback a TEST297 PASS.**

## Evidencia

El usuario ejecutó la WEB experimental TEST303 y compartió un diálogo de exportación que confirma:

> TEST303 NO ACTIVADO. Se exporta TEST297 sin mejora de velocidad.  
> Filas compatibles: 0/25.  
> Motivo: Ninguna asignación de C1/C2 globales y permutaciones de tiles conserva Color RAM 0–7 estática para todas las fases.

**Lo que esto prueba:** en el proyecto del usuario el buscador de permutaciones por tile de TEST303 no encontró una representación compatible con Multicolor Character (Color RAM local 0–7 fija en cada celda física a lo largo del ciclo). La WEB decidió correctamente **no modificar colores** y exportar con TEST297.

**Lo que NO prueba:** la imposibilidad matemática de cualquier conversión por raster, ni que realmente 0/25 filas sean compatibles después de aplicar swizzles. El indicador 0/25 heredaba la métrica de TEST302 ANTES de reorganizar tintas; el detector TEST303 investiga permutaciones completas por tile con heurísticas deterministas, no una búsqueda combinatoria exhaustiva. El texto del aviso fue corregido a **"filas compatibles sin reorganizar tintas"** para eliminar ambigüedad.

## Conclusión

- TEST303 no acelera el proyecto real actualmente. **No promover a PASS / MASTER.**
- La rama `release/test303-palette-swizzle` y el desplegado de la misma prueba quedan documentados, sin modificar el resultado del algoritmo ni el fallback.
- Último PASS explícito de mejora real en VICE: `release/test297-pass-2026-10-24`.
- **No achicar el atlas de 256 caracteres, el mapa o los colores solo para activar el experimento.** Mantener el modo Bitmap Multicolor que los representa correctamente.

## Siguiente dirección de rendimiento aconsejada

Volver a optimizar Bitmap MC nativo. Inspirarse en TEST247 y en los coders Trident/Fairlight en la **organización de datos** y los presupuestos de raster, no en convertir toda la imagen a MC Character. Antes de generar nuevas hipótesis optimistas, elaborar para el **mapa original** un perfil de cambios por banco VIC entre p y p−2, dispersión de IDs, bytes cambiados por fila/columna y ciclos de blitter para identificar si un **delta-frame generado durante exportación** supera de verdad el speedcode distribuido TEST297. Medir en VICE, no declarar ganancias por comparación sintética. Conservar el doble buffer, todos los colores y los 256 tiles.

## Enlaces

- WEB TEST303: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test303-palette-swizzle/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test303-palette-swizzle.zip
- PASS previo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test297-pass-2026-10-24.zip
