# LVLLVL RICO — Commodore 64 Graphics, Animation & Export Tools

**Actualizado: 17 de noviembre de 2026** · Proyecto basado en [LVLLVL de James](https://github.com/jaammees/lvllvl) y ampliado por **RICO**.

**[Abrir LVLLVL RICO](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)** · **[Ver el código que se ejecuta (gh-pages)](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages)** · **[Inventario completo de features y módulos](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/FEATURES_RICO_2026-11-17.md)**

> **Para desarrolladores:** GitHub muestra esta portada desde `main`, pero el editor y sus motores activos viven en **`gh-pages`**. La rama `main` conserva código anterior; su README se mantiene sincronizado para mostrar las mejoras actuales. Probar siempre en el enlace del editor.

## Features RICO — nuevas funciones y mejoras

### 1. Dual Charset, Tileset y herramientas de dibujo

- **BANK 1 + BANK 2:** dos conjuntos independientes de **256 caracteres de 8×8** (512 caracteres disponibles para trabajar). Edición y previsualización por banco; selección de banco por frame.
- **BANK 2 Shifted:** inicialización con el charset C64 Shifted, que después se puede modificar sin sustituir BANK 1.
- **Rico's Remix Tileset:** reemplazo y mezcla de caracteres entre bancos, incluyendo fuentes **C64, Swedish y Japanese** y variantes Shifted.
- **Remix Double Height:** divide una fuente de **8×16** en dos caracteres C64 de 8×8. **Remix 16×16:** divide cada diseño en cuatro caracteres 8×8.
- **Biblioteca local de Tilesets:** guardar, importar y reutilizar conjuntos personalizados en el navegador.
- **Edit Group Chars:** editar conjuntos de caracteres como una superficie; selección y copiar/pegar bloques de varios caracteres.
- **Paletas C64 mejoradas:** Colodore, Pepto y VICE; lectura de los **16 índices de color** y conservación de la selección. Selector enfocado exclusivamente en C64.
- **ECM / EBCM:** herramientas de selección y reorganización de caracteres, fondos múltiples y corrección de la ruta de exportación Extended para preservar sus cuatro colores.

### 2. Animaciones de caracteres y grupos

- **Individual Animate:** animación de caracteres por banco, con desplazamientos y efectos disponibles según el modo.
- **Group Animate:** varios caracteres se animan como una superficie continua, con movimiento, variantes ping-pong y edición visual.
- **Control de velocidad:** ticks y desplazamiento de **1 a 8 píxeles por paso** donde la ruta lo admite.
- **Múltiples frames:** duración, secuencia, colores y selección de charset por frame; visualización animada en el editor.
- **Animación + scroll:** motores especializados para combinar movimiento de mapa y caracteres, sin reemplazar por defecto las animaciones con imágenes fijas.

### 3. Rico's Map Scroll, Window y Dimensions

- **Scroll en ocho direcciones:** Left, Right, Up, Down y las cuatro diagonales.
- **Ping Pong**, **Move In** y **Move Out** para los movimientos disponibles en el diálogo.
- **Pixels/Step (1–8)** y **Ticks/Step** para ajustar desplazamiento y velocidad.
- **Window Dimensions:** define lo que se ve en pantalla de forma independiente del tamaño total del mapa.
- **Scroll Area:** delimita la región fuente del movimiento, distinta del Window y del dibujo completo.
- **Dimensions por los cuatro lados:** ampliar o ajustar Left, Right, Top y Bottom sin limitar el proyecto a una única pantalla C64.
- **Configuraciones por frame**, previsualizaciones y guías de viewport para mapas mayores que el área visible.

### 4. Multicolor, Bitmap y música

- **C64 Text Multicolor** y **Extended Background Color Mode**, con herramientas de color adaptadas a cada modo.
- **Multicolor Bitmap (experimental):** pintura, remapeo de colores, previsualización en vivo y **Rico's Decolorize**.
- **Optimización bitmap:** buffers alternos, agrupación de tiles, tablas de búsqueda y speedcode especializado para rutas que lo soportan.
- **Música SID integrada** en algunos motores PRG, con opciones de sincronización de audio y vídeo; no todas las combinaciones de scroll, grupo y SID están certificadas.

### 5. Exportación de programas C64

- **Export PRG:** rutas específicas para texto, multicolor, EBCM, desplazamiento horizontal/vertical/diagonal, BANK, frames y algunas animaciones con SID.
- **Desplazamiento fino y optimizaciones de Color RAM:** actualizaciones incrementales, procesamiento especializado por dirección y doble buffer en los motores compatibles.
- **Exportación EBCM recuperada:** el modo Extended vuelve a respetarse en el caso reproducible de LILCHEB; los cuatro fondos no se deben sobrescribir con la conmutación de BANK.
- **Export C64 (NEW)** y **Export C64 Assembly** del editor original siguen disponibles.
- **Interface → 64tass Export (experimental):** genera un ZIP con fuente ASM tomada de la ruta PRG activa, binarios y PRG de referencia para que un coder pueda reconstruirlo y revisarlo. **Todavía no es un exportador universal probado**: una animación reconstruida volvió a BASIC y falta validación de equivalencia con 64tass y VICE.

### 6. Interfaz de trabajo

- **Dock derecho** con paneles ajustables de Tile Editor / Tiles y disposición inicial **50/50**.
- Mejoras de previsualización de bancos, charset, frames, regiones visibles y controles de tiles.
- **Arranque optimizado:** eliminado el parpadeo inicial observado en el área de trabajo.
- Botón **SpotySID** junto a HELP para abrir el reproductor en una pestaña nueva.

## Mejoras recientes que ya se pueden probar

| Mejora | Resultado observado / objetivo de prueba |
|---|---|
| **Paletas C64** | Se recuperaron los 16 colores de Colodore/Pepto/VICE y el selector C64 dedicado; cambios aprobados en el editor. |
| **Editor más estable** | El área de trabajo dejó de parpadear al iniciar; confirmación del usuario. |
| **Exportación EBCM** | Corregida la pérdida de Extended y de los fondos EBCM en LILCHEB; confirmado para ese proyecto. |
| **64tass Export** | Ya aparece en Interface con el nombre definitivo; **reconstrucción ejecutable todavía en desarrollo**. |
| **Dock y bancos** | Ajustes de proporción y presentación de los dos bancos sin retirar las herramientas anteriores. |

## Cómo probar las funciones

| Qué probar | Pasos sugeridos | Qué verificar |
|---|---|---|
| **Dual BANK y Remix** | Abrir un proyecto C64, alternar BANK 1/BANK 2 y probar Remix Tileset con una fuente Shifted o Swedish/Japanese. | Los cambios quedan en el banco seleccionado; BANK 1 se conserva al editar BANK 2. |
| **Double Height / 16×16** | En Remix, elegir un carácter alto o un módulo 16×16 y colocarlo en el charset. | La composición usa dos o cuatro caracteres C64 de 8×8. |
| **Group Animate** | Seleccionar varios tiles, configurar una animación grupal y previsualizarla. | Movimiento coherente, velocidad y efecto sobre el conjunto. |
| **Map Scroll** | Crear un mapa mayor que Window, definir Scroll Area y cambiar dirección y Pixels/Step. | Movimiento en la previsualización sin alterar el dibujo exterior. |
| **Extended / EBCM** | Configurar fondos por celda, elegir **Extended** en Export PRG y comprobar el PRG en VICE. | Los cuatro fondos se mantienen durante los frames. |
| **Multicolor Bitmap** | Cambiar al modo gráfico experimental, pintar y probar Decolorize. | Edición y preview coherentes; comprobar PRG por separado. |
| **SID + animación** | Usar una ruta compatible, exportar PRG y ejecutarlo en VICE. | La música y los frames funcionan al ritmo esperado; registrar la combinación exacta. |
| **64tass Export** | Abrir **Interface → 64tass Export**, generar ZIP e intentar recompilar con 64tass. | Comparar el resultado con `reference.prg`; si vuelve a BASIC, registrar dirección de carga/arranque. **No declarar PASS sin ejecución.** |

**No todas las opciones visibles tienen un exportador PRG equivalente.** Para colaborar, informá modo C64, dimensiones, Window/Scroll Area, dirección, pixels/ticks, BANK, cantidad de frames, grupos, SID y qué ocurrió en VICE.

## Trabajo en curso

- Unificar combinaciones de **Map Scroll + Group Animate + Individual Animate + frames + BANK + SID** sin perder efectos.
- Completar las rutas de **ECM/EBCM con BANK 2 y otras combinaciones**, respetando la memoria y los registros VIC-II.
- Reconstruir correctamente el ZIP de **64tass Export** y comprobar el PRG real en VICE.
- Ampliar la matriz de exportación sin reintroducir bloqueos o límites arbitrarios.

## Para coders: dónde está cada cosa

El orden de scripts de **[`gh-pages/index.html`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/index.html)** es esencial. La base compilada es `js/main.js`; las extensiones viven en `js/RICO_*.js` y `TEST/.../js/` (muchos archivos con nombre TEST son **código activo**, no laboratorios descartables).

```text
JSON / TileSet / Layer / Frames / BANK 1 + BANK 2
          ↓
Individual Animate / Group Animate / Map Scroll / SID
          ↓
ToPRGAdv.prototype.createPRG(args)  ← cadena de motores y wrappers
          ↓
ASM 6502 → ensamblador integrado → PRG → VICE
```

**Documentación para continuar:**
- [Inventario técnico de features, módulos y límites](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/FEATURES_RICO_2026-11-17.md).
- [Arquitectura Map Scroll + Group Animate](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md).
- [Estado y pendientes de exportación](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/PROGRESO_2026-11-16.md).
- [Índice técnico y documentación de desarrollo](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/README.md).
- [Historial de pruebas y PASS/FAIL](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/TEST/README.md).
- [Checkpoint recuperable antes de nuevas exportaciones](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test372-pass-2026-11-16).

**Método de trabajo:** probar cambios contra la misma URL pública; conservar las rutas anteriores; comparar ASM, PRG y ejecución real en VICE. No publicar JSON, SID ni PRG privados sin permiso. El código original de James conserva su [crédito y repositorio](https://github.com/jaammees/lvllvl).

---

**[Abrir el editor online](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)** · **[Explorar features y código](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/FEATURES_RICO_2026-11-17.md)**
