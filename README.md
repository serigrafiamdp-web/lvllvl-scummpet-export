# LVLLVL RICO — editor PETSCII / C64 y exportadores (estado 14/11/2026)

**Editor único:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/  
**Código que se ejecuta realmente:** rama [`gh-pages`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages).  
**Último PASS confirmado:** **TEST362**, charset correcto en VICE para el caso reproducible de scroll diagonal. Ver [alcance exacto de los PASS](docs/PASS_Y_REGRESIONES_2026-11-14.md).

> **Nuevo coder:** antes de modificar cualquier exportador, abrir [Arquitectura Map Scroll + Group Animate](docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md) y el [manifiesto de scripts activos](docs/MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md). **No trabajar desde `main` por accidente:** diverge del editor publicado. No mover pruebas a otra URL para validarlas: la portada canónica es la única dirección de pruebas del usuario.

## Qué es este proyecto

Extensión de LVLLVL para edición de arte de caracteres Commodore 64 y PETSCII, con **BANK 1 / BANK 2**, editor de tiles y grupos, efectos individuales, animación de bitmap compuesto, mapas de scroll, modo multicolor, ECM, bitmap, frames y exportadores PRG C64. Se han acumulado motores especializados, overlays y rutas de prueba. **Que aparezca una opción en el editor no significa que todas sus combinaciones ya tengan PASS de ejecución en VICE.**

### Mapa de funcionamiento para otro programador

```text
 index.html                     <- orden de scripts CRÍTICO (127 externos+locales)
    │
    ├── js/main.js              <- base LVLLVL empaquetada
    ├── js/RICO_*.js            <- extensiones RICO y wrappers originales
    └── TEST/testNNN-.../js/    <- módulos actualmente CARGADOS desde la portada
         │
   JSON / TileSet / Frame / Layer
         ├── BANK1: 256 caracteres (8×8); BANK2: 256 caracteres (8×8)
         ├── Group Animate: selecciones y geometría por banco
         ├── Window + Scroll Area por frame
         ├── Map Scroll: dirección, ticks, píxeles, bordes
         └── Frame Duration / SID / colores / modo
         │
   ToPRGAdv.prototype.createPRG(args)  <- cadena de wrappers (último sobre primero)
         │
         ├── Vertical Up/Down
         ├── Horizontal Left/Right
         ├── 4 diagonales
         ├── Map + Individual / Group (según compositor)
         ├── Standalone Group / Group multiframe
         ├── ECM / Multicolor Text / Bitmap (motores propios)
         └── integración SID (si se seleccionó)
         │
   buildSource / build (ASM 6502, mayormente sintaxis ACME)
         ↓
   g_app.assembler.assemble
         ↓
   PRG C64 -> VICE (comprobar glyphs, raster, colores, tiempo, SID)
```

La fuente de verdad para el mapa de dependencias es el [manifiesto de scripts](docs/MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md); esta figura solo resume el flujo.

## Principales rutinas y archivos activos

| Área | Ubicación / responsabilidad |
|---|---|
| **Group Animate (editor)** | `TEST/test242-ondas-pingpong/js/RICO_GROUP_ANIMATE_TEST34.js`. Almacena `ricoGroupAnimationsV1` en el documento del Tileset, compone bitmap `widthTiles×heightTiles`, mueve fases y redistribuye píxeles en caracteres 8×8. |
| **Group-only C64** | `TEST/test247-group-scroll-fast/js/RICO_GROUP_STANDALONE_TEST247.js`, `TEST/test243..247-*/js/` para aceleradores y optimizaciones. |
| **Group + múltiples frames** | `TEST/test355-export-combinations/js/RICO_GROUP_MULTIFRAME_TEST355.js`. Tiene rutas especializadas y casos pendientes; no asumir soporte universal. |
| **Map Scroll / tamaño de pantalla** | `js/RICO_WINDOW_DIMENSION_SCROLL_AREA_TEST75.js`, `js/RICO_MAP_SCROLL_PREVIEW_SCROLL_AREA_TEST79.js`: Window, Scroll Area y estado por frame. |
| **Up / Down** | `TEST/test242-ondas-pingpong/js/RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` más overlays verticales 221–232. |
| **Left / Right** | `TEST/test327-horizontal-animated-map/js/RICO_PRG_HORIZ_WIDE_TEST327.js`, `TEST/test326-horizontal-map-limits/js/RICO_PRG_HORIZ_COMPACT_TEST326.js`. |
| **4 diagonales** | `TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js` y componentes incrementales TEST221; **fix TEST362** ya integrado. |
| **Diagonales multiframe** | `TEST/test354-calaca-diagonal-frames/js/RICO_DIAGONAL_MULTIFRAME_TEST354.js`. Ruta especializada, no todas las combinaciones. |
| **Caracteres individuales + horizontal** | `TEST/test327-horizontal-animated-map/js/RICO_HORIZ_CHAR_SCHEDULER_TEST327.js`. |
| **SID integrado** | `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js`, con evolución documentada de TEST211/228/229. |
| **ECM / bitmap y colores** | `TEST/test328-ecm-preserve-4-backgrounds/`, `TEST/test350-ecm-safe-router/`, `TEST/test279..297-*/js/` según orden real. |
| **Panel derecho** | `TEST/test358-native-right-dock/js/RICO_NATIVE_DOCK_TEST358_C17.js`, `TEST/test359-full-height-right-sidebar/js/RICO_FULL_HEIGHT_RIGHT_SIDEBAR_TEST359.js`. |
| **Diagnóstico PRG** | `TEST/test361-diagonal-charset/js/RICO_DIAGONAL_CHARSET_AUDIT_TEST361.js`: auditoría pasiva, no bloquea exportación. |

**Advertencia:** un mismo archivo puede contener correcciones de TEST posteriores al número de su nombre. Los wrappers necesitan el orden de carga de `index.html`. No eliminar un archivo por su nombre, ni declarar nuevas restricciones para “arreglar” otra combinación.

## Estado de las pruebas

| Checkpoint | Qué está confirmado |
|---|---|
| **TEST362 — PASS usuario / VICE** | Corrigió la selección errónea del charset BANK1 en scroll diagonal con color uniforme; se preservan las demás rutas. El caso 50×35, 8 px/tick, up-left está documentado. |
| **TEST358 C17 — PASS usuario** | Distribución 50/50 del editor derecho Tile Editor / Tiles. |
| **TEST359 / TEST360 / TEST361** | Cambios publicados o diagnósticos, sin un PASS general registrado en esta auditoría. |
| **TEST328 / TEST264 y otros históricos** | PASS de casos específicos de ECM, multicolor y scroll; consultar el [registro](docs/PASS_Y_REGRESIONES_2026-11-14.md). |
| **Todas las combinaciones de exportación** | **No certificadas.** Objetivo actual: recuperar combinaciones, no agregar límites artificiales. |

## ¿Puede exportar animaciones completas como ASM 64tass?

**Datos en formato TASS:** sí hay selector TASS en **Export Assembly**, procedente de la herramienta original, para datos de charset/mapas/colores. **Código ejecutable completo de Map Scroll + Group Animate + individuales + frames + SID en ZIP 64tass:** **aún no está completo ni verificado** como función exportadora de esta versión.

Un paquete útil a otro coder debe incluir ASM de rutinas, **binarios ordenados** de BANK1/BANK2, mapas, colores, frames, grupos y SID según corresponda, más un **manifiesto con direcciones, modo, dependencias, offsets y hashes**. Técnicamente puede ser monolítico con `.byte`, pero recomendamos separar los assets en `data/*.bin` con `.binary` y reensamblar en 64tass. [Estudio técnico, estructura propuesta y checklist](docs/PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md).

## Documentación principal (empezar aquí)

- **[Arquitectura actual — Map Scroll, bancos y Group Animate](docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md)**
- **[Manifiesto de los 127 scripts activos (orden de carga)](docs/MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md)**
- **[PASS recientes y regresiones pendientes](docs/PASS_Y_REGRESIONES_2026-11-14.md)**
- **[64tass ASM + binarios — auditoría de viabilidad](docs/PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md)**
- **[Limpieza de tests y cómo recuperar el histórico](docs/LIMPIEZA_TESTS_Y_ARCHIVO_2026-11-14.md)**
- **[Arquitectura anterior, mapa de memoria y SID](docs/ARQUITECTURA_MOTOR_Y_EXPORT.md)**
- **[Auditoría previa de combinaciones](docs/AUDITORIA_MODOS_Y_EXPORT_TEST330_2026-11-05.md)**
- [Índice general](docs/README.md) · [Historial de tests](TEST/README.md)

## Política de conservación

- Versión web: `gh-pages`; `main` es código legado divergente.
- Antes de limpiar, se congeló **todo** en [`archive/tests-pre-audit-2026-11-14-test362-pass`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass).
- Se retiraron **39 carpetas numéricas antiguas** (`TEST/test150..165` y `TEST/test238..260`), **199 archivos**, solamente de `gh-pages`; todos recuperables en la rama archivada. No se eliminó ningún script de la portada.
- Las carpetas de laboratorio con nombre descriptivo, aunque no se carguen, se conservan mientras sus resultados y rutas técnicas se auditan.
- **No subir sin autorización** JSON, PRG o SID privados aportados por usuarios. La documentación usa parámetros, hashes y diagnósticos en lugar de publicar muestras privadas.

## Flujo de trabajo sugerido para contribuir

1. Crear rama de trabajo basada en **`gh-pages`**, nunca fusionar `main` sin auditoría.
2. Abrir el **manifiesto**, identificar `ToPRGAdv`, `build` y wrappers que cambian esa ruta.
3. Agregar solución con alternativa real para la combinación afectada; no quitar features ni introducir bloqueos arbitrarios.
4. Ejecutar pruebas JS/ASM y comparar el PRG, pero registrar como PASS únicamente la combinación verificada visualmente en **VICE**.
5. Actualizar documentación de ruta, memoria, qué combinaciones cubre, casos FAIL/PASS y commit; publicar siempre la **misma URL principal**.

**Punto de partida histórico completo:** [README anterior a esta auditoría](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/archive/tests-pre-audit-2026-11-14-test362-pass/README.md). Se mantiene intacto en la rama archivada para consultar los MASTER y la cronología detallada.
