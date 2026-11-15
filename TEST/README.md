# TEST — pruebas activas e historia de LVLLVL RICO

**Estado 14/11/2026.** La portada ejecutada por el usuario es **[LVLLVL en /](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)** desde `gh-pages/index.html`. **No es necesario entrar en /TEST/ para probar la versión actual.**

## Las carpetas TEST cargadas no son descartables

Varios módulos de producción conservan el nombre TEST en su ruta. Ejemplos:

- `test242-ondas-pingpong/`: Group Animate del editor, motor diagonal y motor de mapa grande (incluye **fix TEST362**).
- `test243-ondas-fast-pingpong/`, `test244-ondas-pingpong-fast/`, `test245-demoscene-speedcode/`, `test246-charset-remap/`, `test247-group-scroll-fast/`: optimizaciones de grupo, fuentes y compatibilidad.
- `test326-horizontal-map-limits/`, `test327-horizontal-animated-map/`: horizontal, compactación y scheduler de glyphs animados.
- `test328-ecm-preserve-4-backgrounds/`: preservación de fondos ECM, histórico PASS.
- `test350-ecm-safe-router/`, `test351-ecm-frames-sid/`, `test352-standard-frames-sid/`: routing de ECM, frames y audio.
- `test354-calaca-diagonal-frames/`: diagonal multiframe.
- `test355-export-combinations/`: Group Animate multiframe standalone.
- `test358-native-right-dock/`, `test359-full-height-right-sidebar/`: dock y altura de sidebar.
- `test361-diagonal-charset/`: prueba pasiva de fuente y documentación del caso TEST362.
- `test363-diagonal-multiframe-unlocked/`: recuperación del kernel TEST342 PASS para 2+ frames, direcciones, mapas, colores, velocidades y BANK independientes; **TEST363 todavía pendiente de prueba VICE en portada**.

Para **todos** los scripts que se ejecutan, no usar esta lista parcial: consultar [manifiesto exacto de index.html](../docs/MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md).

## Limpieza de laboratorios históricos

El 14/11/2026 se archivaron y retiraron de la rama `gh-pages` **39 carpetas numéricas sin nombre**: `test150..165` y `test238..260`, **199 archivos**. **NINGUNO se carga desde la portada actual.**

- **Recuperación del histórico completo:** [`archive/tests-pre-audit-2026-11-14-test362-pass`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass)
- [Informe de limpieza y su carácter reversible](../docs/LIMPIEZA_TESTS_Y_ARCHIVO_2026-11-14.md).
- Los antiguos links /TEST/test150/, /TEST/test254/ etc. ya no funcionan desde la web canónica; recuperar su contenido desde el branch archivado o los MASTER congelados, sin sobrescribir motores nuevos.

## PASS, experimentos y prioridades

- [PASS y pendientes actualizados](../docs/PASS_Y_REGRESIONES_2026-11-14.md): TEST362 PASS de VICE para el PRG corregido de scroll diagonal; TEST358 C17 PASS de layout; otros modos se mantienen separados.
- [Arquitectura de Map Scroll y Group Animate](../docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md).
- [64tass — por qué los datos ASM existentes todavía no implican exportación completa del motor](../docs/PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md).
- [Auditoría TEST330 (historia de limitaciones y trabajos pendientes)](../docs/AUDITORIA_MODOS_Y_EXPORT_TEST330_2026-11-05.md).

**Reglas para nuevas pruebas:** reproducir fallo, aislar motor y recursos, no añadir topes artificiales ni omitir efectos; no tratar compilación JS/ASM como PASS de VICE; después de la validación integrar en **la misma URL principal** del editor. Conservar nuevas pruebas históricas en ramas etiquetadas, no multiplicar clones sin utilidad.
