# LVLLVL RICO — arquitectura actual de Map Scroll y Group Animate
**Auditoría:** 14/11/2026 · **base real:** `gh-pages/index.html` · **último PASS comunicado:** TEST362 (glifos diagonales en VICE).

> Esta es la guía para otro coder. El nombre TEST de un fichero **no** indica que esté inactivo. Consultar el [orden de 128 scripts](MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md), el [inventario de capacidades](ESTADO_MASTER_22_OCTUBRE_2026.md) y [casos PASS](../TEST/test361-diagonal-charset/README.md). `main` y `gh-pages` tienen historias divergentes: la portada **ejecuta gh-pages**.

## 1. Flujo completo

```text
Documento JSON / TileSet / frames
  ├─ tileSet.tiles[0..255]                   = BANK 1, cada glyph 8×8
  ├─ tileSet.ricoCharsetBank2.tileData      = BANK 2 (almacenamiento de la extensión)
  ├─ tileSet.ricoGroupAnimationsV1          = grupo(s) por BANK, persistente
  └─ tileMap.frames[n]
       ├─ charsetBank                      = banco para ese frame
       ├─ ricoWindowDimensionV1            = ventana visible x/y/w/h
       ├─ ricoScrollAreaV1                 = área de lectura / recorrido
       ├─ ricoMapScrollV1                  = tipo, ticks, pixels, borde
       └─ duration                         = duración temporal de frame

   UI / preview (TileEditor + TileSet.update)
       ↓
   ToPRGAdv.prototype.createPRG(args)
       ↓  [wrappers encadenados, orden del index.html decisivo]
   Router/colección por modo + compositor(es)
       ↓
   fuente 6502 ACME nativo
       ↓
   g_app.assembler.assemble(asm, $0801)
       ↓
   PRG con memoria C64, código, charsets, mapas, colores y tablas
       ↓
   VICE: validación real de render, audio, scroll y timing
```

El material histórico puede usar diferentes nombres de slots y rutas para `BANK 2`. La estructura exacta se confirma con `getDocRecord().data.ricoCharsetBank2.tileData`; no tratar dos bancos de 256 glyphs como si el VIC mostrara simultáneamente 512 índices: la ventana de caracteres visible es de 256 códigos en texto estándar, y un cambio de banco exige selección adecuada del charset en $D018 (o estrategia específica del motor).

## 2. Map Scroll: dos dimensiones que no deben confundirse

- **Screen/Map:** ancho y alto reales de la grilla en el editor; puede superar el viewport.
- **Window:** región visual del mapa definida por frame (`ricoWindowDimensionV1`), independiente de la dimensión total; los motores clásicos C64 utilizan frecuentemente 40×25, con variaciones según ruta.
- **Scroll Area:** rectángulo fuente (`ricoScrollAreaV1`). El motor ajusta los offsets dentro de ese ámbito; el mapa editado fuera de ese rectángulo no tiene por qué entrar en el recorrido.
- **Plan por frame:** `ricoMapScrollV1.type` identifica cardinal, diagonal, Ping Pong u otro movimiento; `ticksPerStep` es cadencia y `pixelsPerStep` es la cantidad de píxeles por actualización.
- **Fino vs grueso:** VIC `$D016` horizontal y `$D011` vertical realizan scroll fino; al cruzar el borde de carácter deben actualizarse códigos de pantalla y sus colores. Un desplazamiento diagonal puede exigir **fila y columna** en el mismo paso.

Se conserva **doble buffer** de pantalla cuando la ruta lo implementa: el main loop prepara el buffer oculto, y la IRQ intercambia solo cuando está preparado. El acceso a Color RAM `$D800+` requiere régimen propio porque no tiene doble buffer visible de hardware.

### Rutas exportadoras actualmente conectadas

| Modo/campo | Módulo(s) en raíz | Contrato y notas |
|---|---|---|
| Vertical Up/Down | `TEST/test242-ondas-pingpong/js/RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` + overlays `js/RICO_PRG_VERTICAL_*TEST221..232.js` | Núcleo de mapa grande, scroll fino, Color RAM incremental y color directo; varios parches posteriores redefinen la ruta; inspeccionar todos |
| Horizontal Left/Right | `TEST/test327-horizontal-animated-map/js/RICO_PRG_HORIZ_WIDE_TEST327.js`, `TEST/test326-horizontal-map-limits/js/RICO_PRG_HORIZ_COMPACT_TEST326.js`, `js/RICO_PRG_HORIZ_MULTIFRAME_TEST205.js` | Motor wide/compact, colector de animaciones por glyph y versiones multiframe; TEST327 inyecta scheduler |
| Diagonal 4 direcciones | `TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js` y su TEST221 embebido | `RICO_TEST196_DIAGONAL.collect(self)`, `.build(d)`: `render_to_dst`, `plan_step`, `update_d018`, buffers y optimizaciones de color |
| Diagonal multiframe | `TEST/test363-diagonal-multiframe-unlocked/js/RICO_DIAGONAL_MULTIFRAME_TEST363.js` y `TEST/test354-calaca-diagonal-frames/` | TEST363 recupera TEST342 PASS con mapas/colores/direcciones/bancos independientes; TEST354 conserva ruta especial de área reducida. TEST363 pendiente de VICE en portada. |
| Map Scroll + individual (horizontal) | `TEST/test327-horizontal-animated-map/js/RICO_HORIZ_CHAR_SCHEDULER_TEST327.js` | Compila cambios de bytes sobre glyphs de pantalla; detecta conflictos de escritura; la versión actual puede rechazar ciertas superposiciones |
| SID de exportación | `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` (evolución 211/228/229) | Enlaza fuente del exportador visual con música si está habilitada; no mezclar relojes sin revisar IRQ y CIA |
| EBCM, bitmap multicolor | `TEST/test328-ecm-preserve-4-backgrounds/`, `TEST/test350-ecm-safe-router/`, `TEST/test282..297/` | Diferentes representaciones físicas y módulos especializados; **no** aplicar directamente supuestos del modo estándar a estas rutas |

Los distintos wrappers se resuelven en el **orden del HTML**, no en orden numérico de TEST. Un módulo posterior puede elegir su propia ruta, modificar una fuente ASM o delegar a la función anterior.

### Mapa de memoria *ejemplo comprobado* — ruta diagonal TEST196 (texto estándar)

| Región | Significado |
|---|---|
| `$0801` | Cabecera BASIC SYS de entrada del PRG |
| `$2000` | Núcleo 6502/IRQ y auxiliares |
| `$0400, $0800` | Pantallas VIC alternas |
| `$0C00–$0FE7` | Shadow de Color RAM en ruta que lo necesita |
| `$3000–$37FF` | Charset BANK 1, 256×8 bytes |
| `$3800–$3FFF` | Charset BANK 2, 256×8 bytes |
| `$4000+` | Mapa y datos asociados; stride variable en modo fastRows |
| `$7000+` | Datos de color |
| `$A000+` | Kernel/tabla Group de esta ruta, cuando corresponde |
| `$D018` | Pantalla + fuente VIC; `$D011/$D016` scroll fino |

**No generalizar estas direcciones a todos los exportadores.** Otros motores cambian banco VIC, usan fuentes predesplazadas, reservan SID, frame data o tablas temporales. En especial, `$D000–$DFFF` representa I/O, no RAM ordinaria mientras I/O está mapeado.

## 3. Group Animate: datos, reloj, composición, exportadores

**Editor y persistencia:** `TEST/test242-ondas-pingpong/js/RICO_GROUP_ANIMATE_TEST34.js`.

```js
// Esquema representativo, no documentación exhaustiva de tipos:
tileSetDoc.ricoGroupAnimationsV1 = {
  bank1: [{
    id: "g...", selectionKey: "...", version: 1,
    widthTiles: 2, heightTiles: 8,
    cells: [{tile: 2, x: 0, y: 0}, /* ... */],
    type: "left", ticksPerFrame: 1, pixelsPerTick: 1
  }],
  bank2: [/* grupos equivalentes */],
  animateEmptyCharacters: false
};
```

1. **Selección:** `TileEditor` identifica la matriz, banco, celdas (índice de glyph, x/y). `createGroup` registra forma, tipo, ticks y velocidad.
2. **Superficie compuesta:** `buildComposite` ensambla los glyphs de 8×8 en un bitmap lógico continuo de `widthTiles*8 × heightTiles*8`. No son animaciones inconexas de cada tile.
3. **Efecto:** `renderGroup` desplaza el bitmap con wrap (`wrappedShift`), clipping/pingpong (`clippedShift` / `pingDisplacement`), frames, blink, etc., según el tipo.
4. **Descomposición:** `splitComposite` vuelve a escribir las partes resultantes en sus glyphs correspondientes; `TileSet.update(tick)` coordina estado de fase y previsualización. La opción **Animate empty characters** controla si los glyphs de bitmap vacío son protegidos.
5. **Al exportar:** el PRG debe tener **todas** las escrituras en RAM de fuente, fases/ticks, referencias de banco y posible compositor con Map Scroll y animación individual. Guardar solo la foto del primer frame **no** exporta una animación.

**Group-only:** `TEST/test247-group-scroll-fast/js/RICO_GROUP_STANDALONE_TEST247.js` expone `RICO_TEST247_STANDALONE.build(self)` e `isStandalone(self)`; selecciona plan de fuentes y grupos, compone `RICO_TEST186_HORIZONTAL.groupASM` y usa transformaciones de `TEST243..247` cuando corresponda. `TEST/test355-export-combinations/js/RICO_GROUP_MULTIFRAME_TEST355.js` extiende el caso grupal multiframe sin Map Scroll. `TEST/test327-horizontal-animated-map/js/RICO_HORIZ_CHAR_SCHEDULER_TEST327.js` integra rutinas de caracteres individuales cuando la ruta lo admite.

**ATENCIÓN a la cobertura actual:** el código inspeccionado conserva especializaciones explícitas (p. ej. un grupo en el standalone, conflictos de escritura del mismo glyph para Group+Individual, ciertas condiciones de TEST354). Son *faltantes de composición* a investigar, **no un criterio de producto para prohibir combinaciones**. Nunca resolver una combinación perdiendo efectos, omitiendo frames o exportando silenciosamente una versión estática.

## 4. Regresión TEST362 — por qué aparecían letras en diagonal

Caso: `LVLLVL TEST.json`, mapa 50×35, ventana 40×25, área 50×35, diagonal arriba-izquierda, 8 px/step, 1 tick, BANK 1, color uniforme.

El fuente diagonal contenía la instrucción correcta `LDA #$0C / STA charset_bits` en el arranque. La optimización de color uniforme eliminaba por **igualdad textual global** `LDA #$0C`, creyendo que solo inicializaba un puntero de color. El VIC terminaba apuntando a otra fuente, aunque el PRG ya contenía glyphs correctos en `$3000`.

**TEST362** suprime únicamente ese filtro demasiado amplio. A nivel del generador: **128/128** pruebas de 4 diagonales × 8 velocidades × BANK 1/2 × color uniforme/variable conservaron la instrucción correcta. El usuario confirmó **PASS en VICE de su PRG corregido**. No extrapolarlo a una certificación de los 128 casos ni de todas las rutas.

Para investigar: [TEST361 diagnóstico y caso](../TEST/test361-diagonal-charset/README.md), y comprobar siempre `$D018`, `$DD00`, `$3000`, el banco activo y el código compilado además del JSON.

## 5. Reglas de ingeniería antes de editar

- Priorizar un compositor común capaz de planificar recursos (charset/screen/color/SID), tiempos, overlays y coexistencia de efectos **sin desactivar funciones**.
- Validar solapamientos verdaderos de memoria, límites físicos VIC/6502, coste raster y propiedades del modo (ECM/text/bitmap). Si una representación no cabe, informar exactamente el recurso faltante y buscar otra estrategia; no imponer techos arbitrarios globales.
- No modificar JSON ni compactar/reubicar glyphs de manera destructiva; establecer un mapeo reversible a la representación C64.
- Probar matriz de modos **y** caso real de VICE. Un test sintético de assembler o JavaScript no equivale a PASS de un PRG en VICE.
- Usar siempre [portada canónica](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/) para comprobar el editor.
