# TEST328 — PASS confirmado por el usuario · 04/11/2026

**Resultado:** el usuario respondió **pass** a la prueba TEST328 después de corregir la exportación horizontal en modo Extended Background Color (ECM). Esta es una confirmación del usuario del caso probado, no una verificación automática de todas las variantes.

**Proyecto de referencia:** `MEGASOFT 100 filas.json` (tamaño real: **100 columnas × 25 filas**); un frame, Rico's Window 40×25, Scroll Area 100×25, Map Scroll **Left, 1 píxel cada 2 ticks**; **22 glifos** del mapa, **tres fondos efectivos** (0, 8, 14), **ocho caracteres** configurados para scroll individual Left (8 frames, 16 ticks). El JSON **no contiene Group Scroll configurado**.

**Correcciones integradas en la versión del PASS:**
- TEST326: retiro del límite antiguo de 96 columnas (nuevo límite calculado por RAM).
- TEST327/328: integración real del colector de animaciones con Export PRG.
- TEST328: repaque temporal de glifos a slots 0–63, sin cambiar el TileSet ni el JSON.
- TEST328: activación ECM en VIC-II (`$D011=$5B`) e inicialización de `$D021-$D024`; dos bits altos del código de pantalla eligen el fondo.

**No hay PASS independiente** aún para Group Scroll real + individuales, cuatro fondos distintos en VICE, Bank 2 animado, multiframe, diagonal, SID, ancho mayor de 100 o superposición de efectos sobre el mismo glifo.

**Página:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test328-ecm-preserve-4-backgrounds/

**Commit funcional al anunciar el PASS:** `99f3e5983ca3aadcf1e8a879bcfc09a8ad01f9a3`. **Rama congelada:** `release/test328-ecm-horizontal-pass-2026-11-04` (se creará junto con la actualización documental). No se modifica el motor durante esta anotación.

[Estado general](../../docs/ESTADO_PROYECTO_2026-11-04.md) · [Funciones reparadas](../../docs/FEATURES_EXPORT_PRG_ECM_TEST326_328.md)
