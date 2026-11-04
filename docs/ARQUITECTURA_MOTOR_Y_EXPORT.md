# Arquitectura del motor LVLLVL RICO — MASTER 22/10/2026

## Actualización — TEST326 a TEST328 (04/11/2026)

**Último PASS usuario:** TEST328 en exportación ECM de MEGASOFT 100×25, Window 40×25, 1 frame, scroll Left 1px/2ticks, 22 glyphs, fondos 0/8/14 y 8 caracteres configurados para animación individual. La prueba no incluye Group Scroll real.

- TEST326, `TEST/test326-horizontal-map-limits/js/`: retira 96 columnas como techo artificial; RAM permite calcular máximos 245 monoframe / 102 compacto (estos máximos no tienen PASS en VICE).
- TEST327, `TEST/test327-horizontal-animated-map/js/`: planifica Map Scroll horizontal + caracteres individuales + Group Scroll para caracteres diferentes.
- TEST328, `TEST/test328-ecm-preserve-4-backgrounds/js/RICO_ECM_EXPORT_REPACK_TEST328.js`: corrige la llamada del **exportador PRG real** a la recopilación de animadores; genera charset temporal con hasta 64 glyphs usados y reescribe códigos como `(slotBG<<6) | glyph0a63`, con punteros de grupo/individual remapeados, sin alterar JSON.
- El PRG TEST328 activa ECM con `$D011=$5B` (en vez de `$1B`) e inicializa los **cuatro fondos `$D021–$D024`**. Si hay más de 64 glyphs o cuatro fondos se informa error sin descarte silencioso.

La triple combinación real Group + individual + mapa, multiframe, diagonal, SID y los demás modos requieren PASS separado. Los MASTER y el TEST297 principal no fueron modificados. [Documento técnico actualizado](FEATURES_EXPORT_PRG_ECM_TEST326_328.md).

---

## Reglas del sistema

La web se compone desde `index.html`. Los módulos `js/RICO_*.js` suelen **envolver** `ToPRGAdv.prototype.createPRG` o un `buildSource/build` ya existente. El **orden real de los scripts en index.html es parte de la arquitectura**. No reemplazar un JS suelto sin inspeccionar sus wrappers posteriores.

**Web/MASTER actual:** rama `gh-pages` / checkpoint `MASTER_LVLLVL_RICO_22_OCTUBRE_2026`. La rama `main` diverge y contiene código histórico.

## Motor de exportación por dirección

| Ruta | Códigos responsables | Arquitectura y estado |
| --- | --- | --- |
| **Up/Down** | `RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` y overlays verticales TEST221, 222, 222B, 223, 224, 225, 226/227 | `RICO_TEST168_PRG_LARGE_MAP.buildSource(d)`, buffers `$0400/$0800`, scroll fino VIC `$D011`, 40 columnas, altura del mapa hasta índices de fila de 8 bits. **TEST227 PASS** para 8 px. |
| **Left/Right** | `RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js` con parches TEST219/220 | `RICO_TEST186_HORIZONTAL.build(d)`, copia incremental, inyección columna, Color RAM RLE y fallback. **TEST220 PASS**. |
| **Cuatro diagonales** | `RICO_PRG_DIAGONAL_TEST196.js` + TEST221 | `RICO_TEST196_DIAGONAL.build(d)`, movimiento de columnas+filas, preparación y color adaptativos. Generación verificada; registrar PASS en VICE por separado. |
| **Horizontal multiframe** | `RICO_PRG_HORIZ_MULTIFRAME_TEST205.js` / `RICO_PRG_HORIZ_COMPACT_FRAMES_TEST206.js` | Frame y datos empaquetados, fallback según RAM; no confundir con todas las direcciones multiframe. |
| **SID (cualquier ruta nativa que exporte)** | `RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` **con implementación TEST228** | Intercepta el ASM que entrega el generador visual, inserta SID y ensambla una sola vez; no sustituye el motor de scroll. **TEST228 PASS**. |

### Cadena vertical exacta

En `index.html` se cargan: `RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` → `RICO_PRG_VERTICAL_COLOR_RLE_TEST221.js` → `RICO_PRG_VERTICAL_STALL_RECOVERY_TEST222.js` → `RICO_PRG_VERTICAL_FAST_ROW_ADDRESS_TEST222B.js` → `RICO_PRG_VERTICAL_STALL_COUNTERS_TEST223.js` → `RICO_PRG_VERTICAL_GLYPH_DELTA_TEST224.js` → `RICO_PRG_VERTICAL_ATOMIC_PHASE_TEST225.js` → `RICO_PRG_VERTICAL_DIRECT_COLOR_8PX_TEST226.js`.

**ATENCIÓN:** el último archivo aún se llama *TEST226*, pero su código contiene la corrección **TEST227 PASS**. No restaurar una versión anterior que ejecuta `JMP $0000`. Los overlays optan por rutinas rápidas solo en condiciones seguras y conservan fallback.

## Memoria C64 (orientativa; varía por motor)

| Dirección | Uso |
| --- | --- |
| `$0400 / $0800` | buffers alternos pantalla VIC-II |
| `$0C00–$0FFF` | color shadow/staging según ruta |
| `$1000–$1FFF` | PSID embebido en la ruta conocida |
| `$2000–$2FFF` | código ejecutable 6502, IRQ y helpers |
| `$3000 / $3800` | charset BANK1 y BANK2 (2 KB cada uno) |
| `$4000+` | datos de mapa o buffers del exportador |
| `$7000+` | datos de color, tablas u optimizaciones según motor |
| `$A000+` | Group Animate o código auxiliar según motor |
| `$B000–$B7FF` | reserva de Color RAM relocada para coexistir con SID en rutas que la requieren |
| `$D800–$DBE7` | Color RAM visible, 25×40 |
| `$D011 / $D016 / $D018` | scroll fino y pantalla/charset |
| `$D019 / $D01A` | IRQ VIC-II |
| `$DC04/$DC05, $DC0D/$DC0E` | CIA1 Timer A para PSID que lo requiere |

**No asumir un rango libre global.** El layout cambia por exportador y configuraciones. Evitar PRG lineal que atraviese I/O `$D000-$DFFF`. Validar acceso a memoria real y código ensamblado.

## SID universal TEST228

1. Se selecciona PSID compatible: LOAD/INIT/PLAY tomados de su cabecera; la ruta probada reserva `$1000–$1FFF`. RSID y otros entornos no están prometidos.
2. El adaptador invoca **el exportador visual que corresponda**, con `download:false`, e intercepta `g_app.assembler.assemble`.
3. `makeSource207` agrega el binario SID, `sid_init_protected211`, `sid_play_protected211`, IRQ raster o CIA; restituye wrappers y función ensambladora aun si ocurre un error.
4. Solo se descarga el PRG cuando contiene audio integrado. Si falla, **no exportar uno silenciosamente**.
5. La zero-page privada del SID `$F0–$FF` se salva/restaura frente al estado del motor. Modo AUTO CIA respeta latch cuando detectado; manual 50/100 Hz permanece disponible.
6. La cadencia de audio y la de vídeo deben permanecer **independientes** del número de frames, Ticks/Step y Pixels/Step.

El motor SCUMM-PET-C64 es **otro repositorio**; se comparte la idea de aislamiento/contrato SID, no se copian direcciones de memoria ni rutinas sin adaptar.

## Fallos conocidos que NO reintroducir

- TEST214: la copia acelerada perdía parte de la pantalla.
- TEST222: los frenazos verticales persistían; las búsquedas de filas no eran toda la causa.
- TEST223: contadores de `$0028` busy, `$0029` wait, `$002A` commits; son **8 bits**, con overflow: no deducir rendimiento entre mediciones de distinta duración.
- TEST225: experimento 1–7 px; no declarado PASS.
- TEST226: el ensamblador interpretó el salto indirecto hacia tabla de colores como `JMP $0000`. TEST227 lo sustituyó por salto **absoluto autoparcheado**, validado en VICE.

**Regla:** conservar imagen completa 40×25, colores, velocidad seleccionada y SID. No tocar rutas aprobadas sin test de regresión; publicar web+ZIP y registrar PASS real.
