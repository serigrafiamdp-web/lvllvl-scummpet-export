# LVLLVL RICO — editor de gráficos y animaciones C64 / PETSCII

**Actualizado: 17/11/2026 (Argentina)** · **[Abrir el editor](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)**

Extensión de [LVLLVL de James](https://github.com/jaammees/lvllvl), con herramientas y motores añadidos por RICO para crear, animar y exportar gráficos de Commodore 64.

## Nuevas features RICO

### Caracteres, bancos y colores
- **BANK 1 / BANK 2:** dos bancos de hasta 256 caracteres de 8×8, selector de banco por frame, edición y previsualización independiente.
- **Remix Tileset** y herramientas para organizar caracteres, reconstruir composiciones y editar tiles individuales.
- **Paletas C64 Colodore, Pepto y VICE:** los 16 índices se conservan; selector dedicado exclusivamente a Commodore 64.
- **Modos C64:** texto estándar, multicolor, Extended Background Color Mode (**EBCM/ECM**) y herramientas experimentales de **Multicolor Bitmap**.
- Herramientas gráficas adicionales como **Rico's Decolorize**.

### Herramientas adicionales de tilesets
- **Remix con fuentes C64 estándar, Swedish y Japanese**, incluidas sus versiones Shifted.
- **Double Height (8×16)** dividido en dos caracteres 8×8, y **módulos 16×16** divididos en cuatro caracteres 8×8.
- **Biblioteca local de tilesets personalizados** y copiar/pegar bloques de varios caracteres.
- **Dimensions por los cuatro lados** (Left / Right / Top / Bottom), manteniendo la separación entre Screen, Window y Scroll Area.

### Animaciones y Map Scroll
- **Individual Animate** y **Group Animate**, desplazamientos de caracteres y grupos y efectos como ping-pong.
- **Múltiples frames**, temporización por frame, variaciones de banco y colores.
- **Map Scroll** horizontal, vertical y diagonal (**8 direcciones**), con **Pixels/Step 1–8**, Ticks/Step, Ping Pong y opciones Move In / Move Out; **Window** y **Scroll Area** configurables.
- Rutas especializadas que combinan animación, scroll y música **SID**, con alcance distinto según el motor. **No todas las combinaciones tienen PASS en VICE.**

### Interfaz y productividad
- **Dock derecho** con paneles de tiles y edición, vista 50/50, mejor previsualización y controles compactos.
- **Inicio estable:** corregido el parpadeo transitorio del área de trabajo.
- **SpotySID** junto a HELP: abre el reproductor en otra pestaña.

### Exportación
- **PRG C64:** exportadores especializados para texto, EBCM, multicolor, desplazamientos, bancos, frames, animaciones y algunos casos SID.
- **Export C64 (NEW)** original de James y **Export C64 Assembly → TASS**, que exporta principalmente datos.
- **64tass Export (TEST371, experimental):** acceso nuevo desde Interface, captura de ASM del motor PRG, binarios y `reference.prg` en un ZIP. **No está certificado como exportador 64tass completo**: se reportó una animación cuyo PRG vuelve a BASIC. La comprobación real de ensamblado y ejecución sigue pendiente.

**[Lista detallada de funciones RICO, con comprobación de scripts y límites por exportador](docs/FEATURES_RICO_2026-11-17.md)**. El README antiguo de `main` documenta 62 funciones de etapas anteriores; no todas son PASS actual de PRG.

**Actualización del 17/11:** **TEST373** renombró el acceso de Interface a **64tass Export** (integrado; aún sin PASS visual independiente). Se mantiene **TEST372** como último PASS del usuario.

## Progreso reciente — 16/11/2026

| TEST | Mejora | Estado |
|---|---|---|
| **364** | Correcta lectura de 16 índices de color C64 | **PASS del usuario** |
| 365 | Mantiene la paleta C64 elegida | Integrado; sin PASS aislado |
| **366** | Selector solo C64, sin pestañas adicionales | **PASS del usuario** |
| 367 | Primer botón SpotySID | FAIL; sustituido por TEST368 |
| 368 | SpotySID junto a HELP, nueva pestaña | Integrado |
| **369** | Solución del parpadeo al iniciar | **PASS del usuario** |
| 370 | Detección de nueve módulos ASM que eran páginas 404 en ZIP C64 NEW | Diagnóstico confirmado; reemplazado por 371 |
| **371** | ZIP con ASM de la ruta PRG activa y binarios | Experimental; PRG 64tass todavía no funcional en todos los casos |
| **372** | Recuperación de exportación PRG **Extended/EBCM** | **PASS confirmado por el usuario** (LILCHEB) |

**TEST372** restaura la ruta Extended para el caso probado; no significa que EBCM + BANK 2, SID, Group y Map Scroll ya estén todos combinados. Las pruebas simuladas o de ensamblado no sustituyen pruebas reales de VICE.

**[Ver el progreso detallado, hallazgos y pendientes del 16/11](docs/PROGRESO_2026-11-16.md)** · **[Checkpoint TEST372 PASS](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test372-pass-2026-11-16)**

---

## Información técnica para coders

**Código en producción:** rama [`gh-pages`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages), archivo `index.html`. **No editar `main` suponiendo que publicará los cambios:** contiene código legado divergente.

### Funcionamiento y exportadores

```text
gh-pages/index.html           ← orden de scripts crítico
  ├─ js/main.js               ← LVLLVL original empaquetado
  ├─ js/RICO_*.js             ← extensiones y wrappers históricos
  └─ TEST/testNNN-.../js/     ← otros módulos de producción
       ↓
JSON / Layer / TileSet / BANK1 y BANK2 / Frames
       ↓
Individual + Group + Scroll Area / Map Scroll + SID / modos C64
       ↓
ToPRGAdv.prototype.createPRG(args)
       ↓
motor específico → ASM 6502 → g_app.assembler.assemble
       ↓
PRG → prueba real en VICE
```

El orden de carga de `<script>` determina qué wrapper intercepta cada exportación. **No retirar carpetas TEST por su nombre ni asumir soporte universal.**

### Componentes importantes

| Área | Referencia |
|---|---|
| Group Animate | `TEST/test242-ondas-pingpong/` y optimizadores 243–247 |
| Map vertical | `TEST/test242-ondas-pingpong/js/RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` y TEST221–232 |
| Map horizontal | `TEST/test326-horizontal-map-limits/`, `TEST/test327-horizontal-animated-map/` |
| Diagonal y multiframe | `TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js`, `TEST/test363-diagonal-multiframe-unlocked/` |
| Group con frames | `TEST/test355-export-combinations/` |
| SID | `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` |
| EBCM | `TEST/test328-ecm-preserve-4-backgrounds/`, `TEST/test350-ecm-safe-router/`, `TEST/test351-ecm-frames-sid/` |
| EBCM restaurado | `TEST/test372-restore-ebcm-export/` — corrige los wrappers Dual BANK 104 y 264 |
| Dock y layout | `TEST/test358-native-right-dock/`, `TEST/test359-full-height-right-sidebar/`, `TEST/test369-startup-workspace-flicker/` |
| Muzza TASS | `TEST/test371-muzza-live-asm/` — prototipo, no compilación VICE certificada |

### Documentación, pruebas y seguridad

- [Índice técnico actualizado](docs/README.md) · [Historial de TEST](TEST/README.md)
- [Progreso 16/11 — TEST364 a TEST372](docs/PROGRESO_2026-11-16.md)
- [Arquitectura de Map Scroll y Group Animate](docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md)
- [Manifiesto de scripts del **14/11**](docs/MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md) — foto histórica: cotejar con el `index.html` actual.
- [PASS y regresiones hasta el 14/11](docs/PASS_Y_REGRESIONES_2026-11-14.md)
- [Auditoría 64tass y módulos ASM](docs/TEST370_INVESTIGACION_MUZZA_EXPORT_TASS64_2026-11-16.md)
- [Inventario auditado de funciones RICO (17/11)](docs/FEATURES_RICO_2026-11-17.md)

**Reglas:** crear checkpoint antes de cambiar motores; mantener JSON intacto; corregir fallos sin eliminar efectos ni imponer restricciones artificiales; distinguir test JS, ASM, PRG y PASS visual de VICE; no publicar archivos privados JSON, PRG ni SID sin autorización.

### Copias de recuperación
- [TEST372 PASS — 16/11/2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test372-pass-2026-11-16)
- [TEST369 PASS — cierre anterior](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test369-pass-2026-11-16)
- [Archivo histórico TEST362 previo a la limpieza del 14/11](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass)

La limpieza histórica del 14/11 archivó 39 carpetas numéricas (199 archivos) inactivos sin quitar los scripts que se cargaban en la portada. [Informe reversible](docs/LIMPIEZA_TESTS_Y_ARCHIVO_2026-11-14.md).

**Editor habitual:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/ — **Original:** [James / LVLLVL](https://github.com/jaammees/lvllvl).
