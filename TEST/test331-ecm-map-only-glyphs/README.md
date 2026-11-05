# TEST331 — ECM: contar solo glifos realmente utilizados en el mapa (05/11/2026)

**Candidato experimental, sin PASS en VICE.** Basado en TEST330, conserva TEST329 raíz y TEST328 PASS por separado.

## Corrección
El error **ECM: se necesitan 256 glifos físicos** proviene de tratar índices diferentes como glifos físicamente diferentes e incluir todos los índices de Group Scroll como destinos visibles. ECM sí tiene un máximo real de **64 patrones por charset activo**, pero el editor puede almacenar 256 índices.

El módulo compartido `RICO_ECM_64_ALLOCATOR_TEST331.js` genera una tabla única de compactación:

1. Examina las celdas del **mapa fuente completo** exportado: todo el Scroll Area horizontal, o 40×25 de la ventana en Group-only.
2. Solo los códigos realmente pintados reciben ranura física en el charset ECM. No importa que el tileset tenga 256 entradas.
3. Si varios índices estáticos tienen **bitmap idéntico en ambos bancos**, los fusiona en un único glifo físico.
4. Los destinos de **Group Scroll** y los glifos que tienen **animación individual** se mantienen independientes cuando aparecen en el mapa, incluso si el dibujo inicial coincide: los motores los modifican después y no pueden compartir sus ocho bytes.
5. Los miembros del Group Scroll usados como **fuente de animación pero no visibles en el mapa** siguen en `group.columns`, pero las escrituras de destino invisibles se dirigen a una dirección de descarte de RAM de CPU ($E000), sin consumir ranuras de los 64 glifos VIC.
6. Los códigos de pantalla siguen codificando `(fondo 0–3 << 6) | glifo 0–63`; se conservan `$D011=$5B` y los cuatro fondos `$D021–$D024`.
7. Ambos motores usan **la misma asignación** y preservan el JSON y el TileSet originales. Diagnóstico: `window.RICO_TEST328_ECM_EXPORT.last` y `window.RICO_TEST330_GROUP_ECM_LAST`.

## Restricción que sí es real

Si después de fusionar dibujos idénticos y reservar destinos animados quedan más de **64 glifos físicos simultáneos**, un único charset ECM no puede representarlos. La solución requerirá cambiar dinámicamente de bancos/charset o transmitir glifos por ventana, no eliminar el error. El mensaje ahora distingue índices utilizados, patrones necesarios y destinos animados.

## Pruebas prioritarias

- Proyecto con 256 índices de tiles **visualmente repetidos** y menos de 64 patrones reales: debe exportar.
- Map Scroll Left 100/120×25 + ECM + Group Ondas + scroll individual, sin perder las animaciones.
- Group-only Ondas con tiles de origen fuera de la ventana: conservar Ondas y no superar los 64 por fuentes invisibles.
- Dos dibujos iguales donde **uno es animado**: conservar ranuras diferentes; evitar efecto compartido accidental.
- 65 dibujos físicos verdaderamente distintos visibles: mostrar error técnico, no exportar un mapa truncado.
- 1–4 fondos ECM, con rechazo de más de cuatro; regresión con MEGASOFT, PARED y Bitmap TEST297.

**No se afirma compatibilidad ECM universal para diagonal, vertical, multiframe ni Bitmap en TEST331; esas rutas siguen necesitando portar el asignador y el compositor de fondos al pipeline propio.**

[Editor TEST331](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test331-ecm-map-only-glyphs/)


## Vertical Up/Down en TEST331 (ruta experimental)

Se incorporó adaptador ECM para **Map Scroll vertical 40×N** (Window 40×24/25, un frame) basado en TEST168. Utiliza el mismo asignador de glifos usados en el mapa, remapea caracteres individuales/grupales, y mantiene el bit ECM de `$D011` durante el Fine Scroll vertical. Genera `$D021–$D024` y espeja los 64 glifos en las cuatro regiones para la detección de glifos vacíos del motor de Color RAM. **Sin PASS de VICE; probar el PRG en PAL**. Los modos diagonales y multiframe aún requieren su propio motor ECM.
