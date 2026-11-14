# Auditoría de exportación ASM 64tass + datos binarios — 14/11/2026

**Veredicto técnico:** LVLLVL tiene **los datos originales del proyecto** y motores que ya producen fuentes 6502 para varios PRG, así como un **Export Assembly → TASS** de datos. **NO se ha verificado un exportador completo y universal “64tass + todas las animaciones + todos los scrolls”** listo para un coder externo. No confundir convertir `!byte` en `.byte` con exportar toda la lógica ejecutable.

Referencia externa: [Manual oficial 64tass](https://tass64.sourceforge.net/). Soporta `.byte`, `.word`, `.binary`, `.include`, `*= <dirección>`, listados y salida `--cbm-prg`.

## 1. Lo que existe hoy

En el **código fuente original** (`main/src/js/textMode/export/exportC64Assembly.js`) el diálogo de `Export C64 Assembly` permite el radio **TASS** (`main/src/html/textMode/exportC64Assembly.html`). El código selecciona `.byte`, `.word`, comentarios `;` y `* =` para el formato. Puede producir datos de caracteres, mapas, atributos y frames elegidos. **No produce por sí solo** el runtime exportado de `RICO_TEST196_DIAGONAL`, `RICO_TEST247_STANDALONE`, SID, grupo, doble buffer y todos los overlays.

Los exportadores **PRG avanzados** y módulos RICO suelen producir **fuente ACME** (líneas `!byte`, `*=$xxxx`) y llamar a `g_app.assembler.assemble` para escribir un PRG. Muchas rutas ensamblan su propio `source` pero solo exponen la descarga del **PRG final**, no una API estable de **TASS ejecutable + assets externos**.

## 2. Respuesta a la pregunta: ¿hay que entregar binarios?

**Sí, para una salida práctica de código fuente reutilizable se recomienda empaquetar `*.asm` con `*.bin` y un manifiesto.** No es obligatorio en términos absolutos: una salida `.asm` monolítica con miles de `.byte` puede contener todo, pero será difícil de mantener, editar y reensamblar.

| Entrega del ZIP (propuesta, aún NO implementada) | Qué representa |
|---|---|
| `main.asm` | Entrada, inicialización VIC, IRQ, composición y llamadas a rutinas |
| `engine/map_scroll.asm` | Cámara, fine scroll, copia de filas/columnas y swapping |
| `engine/group_animate.asm` | Reglas de desplazamiento de bitmap de grupo y actualización del charset |
| `engine/individual_chars.asm` | Scheduler por glyph, si ese modo se usa |
| `engine/frame_scheduler.asm` | Duración y cambios de frame/banco; compatibilidad con scroll/grupos |
| `engine/sid_driver.asm` | Solo si la exportación utiliza música SID, con init/play y protección de ZP |
| `data/charset_bank1.bin` | 256 × 8 = **2048 bytes** del banco 1 en el caso estándar |
| `data/charset_bank2.bin` | 256 × 8 = **2048 bytes** del banco 2, si está presente |
| `data/map.bin` | Códigos de caracteres de la zona de scroll; formato y stride especificados |
| `data/colors.bin` | Colores por celda; no confundir con bytes de Color RAM ya visibles |
| `data/frame_*.bin` | Datos por frame, cuando hay datos distintos |
| `data/group_*.bin` | Bitmap/fases/tablas de grupo o datos comprimidos, según motor |
| `data/sid.bin` | Música seleccionada, si procede y con direcciones de carga verificadas |
| `manifest.json` | Dimensiones, Window, Scroll Area, modo, bank, velocidades, clocks, offsets, tamaños, hashes, tabla de segmentos |
| `README.md` | Cómo instalar 64tass, compilar, ejecutar VICE y diagnosticar diferencias |

### Dos estrategias válidas

- **Standalone source:** `main.asm` incluye todos los datos con `.byte`. Un solo archivo puede producir un PRG, pero puede ser gigantesco.
- **Source + binary assets:** `main.asm` incluye datos con `.binary "data/charset_bank1.bin"`, etc. Permite a otro coder intercambiar assets y mantener rutinas limpias. **Recomendado**.

```asm
; Ejemplo ilustrativo de estructura 64tass, NO un motor completo ni
; una plantilla que pueda compilar sola el proyecto de LVLLVL.
.cpu "6502"

* = $3000
charset_bank1
    .binary "data/charset_bank1.bin"

* = $3800
charset_bank2
    .binary "data/charset_bank2.bin"

* = $4000
world_map_data
    .binary "data/map.bin"

* = $7000
world_color_data
    .binary "data/colors.bin"
```

Comando de referencia (requiere `main.asm` y todos sus datos/rutinas coherentes):
```sh
64tass --cbm-prg -o output.prg main.asm
```

**AVISO importante:** este ejemplo usa el mapa de memoria *de la ruta diagonal TEST196* como referencia. No utilizarlo como layout rígido para EBCM, multicolor/bitmap, mapa superior a RAM disponible, motores de bancos VIC alternos o SID. El exportador futuro debe generar otro layout cuando sea necesario. Especificar endianess, compresión y formato de cada asset en el manifiesto.

## 3. Pipeline que falta para garantizar salida completa

1. **Captura de la ruta seleccionada:** el mismo router/planificador usado para generar PRG debe devolver `plan`, `sourceParts`, `assets`, `memoryMap`, `entryPoint` y `diagnostics`, sin volver a interpretar diferente el proyecto.
2. **Fuente común/intermedia de ensamblador:** dejar de producir solo un string ACME opaco; identificar bytes, etiquetas, símbolos, relocalizaciones, rutinas y bancos. Adaptador 64tass para `!byte` → `.byte`, `!word` → `.word`, directivas y sintaxis específica; validar etiquetas y expresiones con **64tass real** (no sustituir texto a ciegas).
3. **Assets en orden determinista:** por índice/banco y por fila/columna; color/palette y flags de video; tabla de glyph mapping en ECM; distinguir datos de base del cache animado.
4. **Group Animate:** exportar `cells`, grupo/banco/orden, bitmap base, pasos, `ticksPerFrame`, `pixelsPerTick`, fases, offsets de destino, protección de empty chars; incluir el *runtime* que modifica glyph RAM y la estrategia VIC usada por la ruta.
5. **Map Scroll:** exportar `ricoWindowDimensionV1`, `ricoScrollAreaV1`, 8 direcciones, ticks, pixels, cropping y jump/phase, además de código incremental y doble buffer; no reducir a fotografías de 40×25.
6. **Multiframe:** exportar **todos** los frames y sus duraciones, BANK 1/2 y mapas/colores distintos, y tablas de transición; no descartar silenciosamente el resto para lograr compilar.
7. **Coexistencia:** renderizar o programar Group+Individual+Map, fondos ECM, modos multicolor, SID/raster en orden libre de conflictos; los casos aún no soportados deben quedar explícitamente **pendientes de implementación**, no convertirse en una restricción nueva al exportador actual.
8. **Linker/memory planner:** validar rangos realmente ocupados, ZP, $D018 y selección VIC bank, Color RAM, IRQ, recursos, destinos del código y SID. Generar `memory-map.md` y comprobación de solapamiento física por modo.
9. **Comprobación de equivalencia:** reensamblar los archivos en 64tass y comparar contra el PRG del motor que eligió la misma ruta. Si no es bit-a-bit idéntico (por padding/layout), comparar memoria cargada, glyphs/bancos, mapas, colores, timing/rutinas y VICE.
10. **Empaquetado ZIP:** `main.asm` + `engine/` + `data/` + manifiesto + instrucciones + hashes. El archivo fuente JSON debe conservarse sin modificaciones y ofrecerse como referencia si se incluye explícitamente.

## 4. Criterios de aceptación por niveles (no confundirlos)

- **Nivel A — Export de datos TASS:** selector ya existe para algunas clases de datos en el editor; validar caso a caso.
- **Nivel B — Fuente TASS del PRG escogido:** 64tass ensambla todo el runtime y reproduce el resultado de una ruta (por ejemplo, diagonal del caso TEST362).
- **Nivel C — ZIP reutilizable:** scripts + datos binarios + mapa de memoria y binarios comprobados; otro coder puede reconstruirlo sin entrar en LVLLVL.
- **Nivel D — Cobertura funcional completa:** matriz de Map Scroll/Group/Individual/SID/frames/modes según definición del editor y PASS real en VICE. **No alcanzado.**

La evolución más segura es añadir esta funcionalidad **a un planificador de exportación compartido**, sin tocar para ello los PRG que ya tienen PASS ni imponer restricciones globales.

## 5. Prueba inicial propuesta para 64tass

Usar el caso reproducible **TEST362** (mismo JSON, mapa 50×35, diagonal up-left, 8 px/step, 1 tick, BANK1, color 14). Pedir al exportador futuro el PRG de referencia y ZIP 64tass; reensamblar en local y comprobar `$3000..$37FF`, `$D018`, memoria y VICE. Continuar después con BANK2, color variable, Group, frames múltiples y otros modos: **sin declarar PASS antes de la prueba real**.

Documentación de arquitectura: [Map Scroll y Group Animate](ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md).
