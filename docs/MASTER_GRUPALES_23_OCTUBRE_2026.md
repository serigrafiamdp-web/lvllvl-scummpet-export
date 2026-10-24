# MASTER LVLLVL RICO — 23 de octubre de 2026 · Group Animate TEST247 PASS

**Estado:** rama congelada de recuperación para Group Animate, validada en VICE por la persona usuaria el 23/10/2026. No sustituye el MASTER independiente de diagonales TEST254.

## Fuente y descargas

- **Snapshot fuente completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026_GRUPALES_TEST247_PASS
- **ZIP de la rama:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_23_OCTUBRE_2026_GRUPALES_TEST247_PASS.zip
- **Editor/PRG probado (web):** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test247-group-scroll-fast/
- **Referencia PASS anterior Ping Pong 8px:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test246-charset-remap/
- **MASTER diagonal TEST254 conservado (independiente):** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026
- **MASTER 22/10:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026

**Web principal:** sigue en `gh-pages` con el `index.html` previo; *este snapshot sí fija su propia raíz index.html* con **el orden exacto de scripts de TEST247**, quitando únicamente el <base href="../../"> propio del URL bajo /TEST y actualizando el título. Se puede descargar como ZIP y utilizar el index de la rama desde la raíz al desplegar por separado. No introducir módulos TEST254 sobre la ruta Group247 sin prueba de convivencia.

## Funciones preservadas / PASS

- **Group Scroll circular** Left / Right / Up / Down: Screen Remap FAST ASM, selector 1–8 píxeles/tick; el TEST247 recibió PASS general en VICE por el usuario.
- **Group Ping Pong** Left / Right / Up / Down 1–7 píxeles: remapeo TEST247; 8 píxeles conserva TEST246 PASS, utilizando charsets precalculados y cambios de pantalla.
- **ONDAS (4 direcciones):** motor de actualización progresiva de TEST242, conservado sin optimización destructiva.
- **Editor y extensiones anteriores** permanecen en código heredado. No convertir el PASS general en una afirmación de pruebas exhaustivas para las 60 combinaciones.
- **No se ha fusionado** el MASTER diagonal TEST254 en este reproductor Group247. Ambas ramas quedan independientes y se deben integrar en un test nuevo.

## Cadena exacta de exportación aprobada en Group247

`RICO_GROUP_ANIMATE_TEST34.js` (TEST242)
→ `RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` / `RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js` / `RICO_PRG_DIAGONAL_TEST196.js` (versiones TEST242)
→ `RICO_GROUP_FAST8_TEST243.js`
→ `RICO_GROUP_SPEED_TEST244.js`
→ `RICO_GROUP_DEMOSCENE_SPEEDCODE_TEST245.js`
→ `RICO_GROUP_SCREEN_REMAP_TEST246.js`
→ `RICO_GROUP_SCROLL_REMAP_TEST247.js`
→ `RICO_GROUP_STANDALONE_TEST247.js`
→ wrapper SID `RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js`.

El orden de scripts es funcional, no cosmético. No limpiar archivos históricos referenciados sin una revisión de dependencias. ONDAS se procesa aparte; al combinar Group Animate + Map Scroll se sigue la ruta previa, **no** se afirma remapeo TEST247 bajo scroll simultáneo.

## Auditoría de problemas y mejoras generales, sin modificar el PASS

| Prioridad | Área | Hallazgo comprobado | Prueba segura recomendada |
|---|---|---|---|
| Alta | Map Scroll + Group Animate | TEST247 usa ruta rápida cuando no hay Map Scroll; simultáneo sigue otra ruta con scheduler, charsets y buffers propios. | Test separado de planificador ASM compartido y arbitraje de $D018; comenzar Map Up + Group Left. |
| Alta | Animated Chars individuales + Group Animate + Map Scroll | Dos motores pueden escribir los mismos bytes de BANK1/2; hay protecciones parciales, no cobertura universal. | Matriz de coexistencia con glyphs diferentes y mismos glyphs; definir prioridad / error explícito. |
| Alta | SID + Group Remap | TEST247 usa dos banks VIC para velocidades impares y reserva RAM en $1000/$1800/$2800/$3000; las rutas de SID también suelen ocupar $1000–$1FFF. | Validador de mapa de memoria previo a ensamblar y fallback bien identificado. No asumir SID universal. |
| Alta | Interfaz vs PRG / fallback | Un selector puede mostrar un modo válido en preview y el exportador caer a otro engine; fallo previo TEST164 solo Up. | Mostrar motor real y causa del fallback en todas las rutas exportadoras, no solo 246/247. |
| Media | Límites de grupos múltiples | Código de Group-only requiere exactamente 1 grupo activo y un solo frame en la ruta rápida. | Test de 2 grupos disjuntos, BANK1/BANK2 y múltiple frame sin prometer simultaneidad actual. |
| Media | Rendimiento real | Estimaciones de ciclos y pruebas JS no equivalen a ciclo de raster en VICE, en especial 1–7 px. | Instrumentación opcional IRQ y captura VICE con Speed 100%, sin alterar rendering. |
| Media | Mapas grandes + recortes | Motor Group-only crea la vista temporal 40x25; el editor soporta dimensiones mayores y varias ventanas. | Validación con Screen 40x50 y Rico's Window y recortes de 4 lados. |
| Media | Estado proyecto / PRG | Variaciones por frame y guardado/restauración de campos de grupos y bancos pueden divergir del exportador. | Round-trip JSON, importación/exportación y comparación SHA de datos de dibujo antes/después. |
| Baja | UI / mantenimiento | Muchos wrappers sobre `createPRG` en orden específico crean regresiones cuando se reordenan o se pierden scripts cacheados. | Documentar catálogo único de rutas, separar módulo experimental del index activo, tests de carga de scripts. |

### Hallazgos confirmados leyendo el código

1. `TEST/test247-group-scroll-fast/js/RICO_GROUP_STANDALONE_TEST247.js`: la ruta standalone requiere **exactamente un grupo** y **un solo frame**, y delega a otro exportador cuando encuentra Map Scroll; por diseño TEST247 no es el planificador universal.
2. `TEST/test242-ondas-pingpong/js/RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js`: el combinador vertical rechaza **más de un grupo de movimiento** con Map Scroll. Esto protege los datos, pero limita proyectos complejos.
3. `TEST/test242-ondas-pingpong/js/RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js`: la ruta horizontal Map Scroll + Group detecta animación individual y **rechaza explícitamente la exportación**; no está resuelta la combinación triple.
4. `TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js`: `groupFromStore` elige el **primer** grupo compatible mediante `filter(...)[0]`. Si hubiera varios, existe riesgo de que alguno no se exporte sin aviso: prioridad alta para un veto explícito o planificador.
5. `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js`: la ruta SID usa un **planificador dinámico de memoria**. No debe darse por hecho que convive con los buffers de fuentes de dos bancos VIC que utiliza TEST247.
6. Root `index.html`: la aplicación utiliza múltiples wrappers del método `ToPRGAdv.prototype.createPRG` y el orden de carga determina qué ruta llega al ensamblador; comparar este orden antes de cualquier refactor.

**Advertencia:** la tabla enumera límites verificables, riesgos y pruebas propuestas; no significa que cada caso sea un bug reproducido en VICE.

## Regla de continuación

Este branch MASTER debe permanecer congelado. Crear futuras pruebas en una rama/carpeta separada y probar tanto la ruta Group247 como diagonal TEST254 antes de promocionar una integración. Nunca modificar ONDAS para ganar velocidad.
