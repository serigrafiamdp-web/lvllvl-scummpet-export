# LVLLVL SCUMMPET EXPORT — RICO MOD

Fork de LVLLVL orientado al flujo **RICO / SCUMM / Commodore 64**.

La idea principal de esta versión es mantener el editor cómodo para dibujar, pero
agregar herramientas específicas para trabajar con **dos charsets C64 de 256
caracteres**, edición por grupos, animaciones por carácter y export directo a PRG.

## Funciones principales

### 1. Dual Charset — BANK 1 + BANK 2

Cada proyecto puede trabajar con dos bancos independientes:

- **BANK 1:** 256 caracteres.
- **BANK 2:** 256 caracteres.
- Los screen codes siguen siendo siempre **0..255**.
- Cada frame decide qué banco interpreta esos códigos con **Charset Bank: 1 / 2**.
- BANK 2 usa C64 Shifted por defecto y puede ser reemplazado o mezclado.

Esto permite disponer de hasta **512 diseños de caracteres** sin convertir el mapa
en índices 256..511.

### 2. Rico's Remix a Tileset

Nueva herramienta para mezclar fuentes carácter por carácter.

- SOURCE a la izquierda.
- CUSTOM TILESET a la derecha.
- Click sobre una posición SOURCE reemplaza la misma posición del banco destino.
- BANK 1 y BANK 2 pueden modificarse de forma independiente.
- Incluye navegador lateral de fuentes.
- Actualmente integra fuentes **8x8** y **7x8**.
- Las fuentes 7x8 se adaptan a C64 real **8x8** agregando una columna vacía, sin
  estirar ni deformar el glyph.
- Las familias C64 Normal/Shifted, Swedish y Japanese conservan sus pares de banco.

### 3. Paleta dual-bank

La paleta lateral puede mostrar los dos bancos juntos.

- **Columns of 16:** vista vertical clásica.
- **Banks 32 x 8:** BANK 1 arriba y BANK 2 debajo, cada uno como 32 columnas x 8 filas.
- El banco activo queda disponible para selección.
- El banco inactivo se muestra atenuado.
- BANK 2 sigue traduciendo visualmente 256+N al screen code real N.

### 4. Tile Editor compatible con BANK 1 y BANK 2

El editor de caracteres nativo ya entiende el banco activo.

- Doble click sobre un glyph de BANK 2 abre el glyph real de BANK 2.
- Pencil, erase, clear, paste, flip, shift e invert modifican el banco correcto.
- Las selecciones múltiples también se renderizan desde el banco activo.
- Cambiar de BANK con el editor abierto refresca la vista sin tocar el otro banco.

### 5. EDIT GROUP CHARS

El botón lateral **Choose Tile Set...** fue reemplazado por **Edit Chars**.

Primero se selecciona un grupo de caracteres en la paleta principal y luego
**Edit Chars** abre una vista independiente para trabajarlos como un pequeño lienzo.

Características:

- conserva la geometría 2D de la selección;
- muestra solamente los caracteres elegidos;
- edición pixel a pixel atravesando límites entre glyphs;
- compatible con BANK 1 y BANK 2;
- Pencil y selección rectangular;
- Cut / Copy / Paste;
- Zoom independiente y Fit;
- los cambios vuelven inmediatamente al editor principal y a la paleta.

Shortcuts de EDIT GROUP CHARS:

- **N** — Pencil
- **S** — Select
- **Z** — Zoom in
- **Shift+Z** — Zoom out
- **Ctrl+A** — Select All
- **Ctrl+C** — Copy
- **Ctrl+X** — Cut
- **Ctrl+V** — Paste
- **Delete** — Clear selection
- **Esc** — Close

### 6. Animaciones de caracteres

Las animaciones son independientes entre BANK 1 y BANK 2.

Modos disponibles:

- Scroll Left
- Scroll Right
- Scroll Up
- Scroll Down
- Ping Pong Left
- Ping Pong Right
- Ping Pong Up
- Ping Pong Down
- Blink
- Frames

Los Scroll fueron corregidos para hacer un loop circular limpio desde el glyph base.
Los nuevos Ping Pong desplazan el carácter hacia el borde y lo hacen volver por el
mismo recorrido, sin wrap-around.

El mismo screen code puede tener propiedades distintas según el banco activo.

### 7. Export PRG dual-bank para C64

Export directo validado para:

- **Standard Character Mode**
- sin SID/música
- BANK 1 en **$3000-$37FF**
- BANK 2 en **$3800-$3FFF**
- cambio de charset por frame mediante **$D018**
- screen codes siempre 0..255

El segundo charset agrega **2048 bytes** respecto de una configuración de un solo
charset. No duplica Screen RAM ni los mapas de cada frame.

### 8. C64 ECM RICO

También se conservan las herramientas ECM ya validadas:

- repack automático TEXTMODE -> C64 ECM;
- selección manual de los 64 glyphs físicos;
- reselección ECM -> ECM;
- interfaz nativa de Edit Tile Palette;
- protección de glyphs usados.

### 9. Choose Tile Set

La función original de LVLLVL sigue disponible desde el menú **Tiles**.

RICO corrige la regresión que impedía refrescar la preview y aplicar correctamente
el preset seleccionado con OK.

## Flujo recomendado

1. Crear o abrir un tileset C64 8x8.
2. Usar **Rico's Remix a Tileset** para preparar BANK 1 y BANK 2.
3. Elegir **Charset Bank 1/2** por frame.
4. Dibujar normalmente con screen codes 0..255.
5. Editar glyphs individuales con doble click o grupos completos con **Edit Chars**.
6. Aplicar Scroll, Ping Pong, Blink o Frames de forma independiente por banco.
7. Para pruebas C64 Standard, exportar PRG.

## Compatibilidad y alcance actual

La arquitectura dual-bank actual está centrada en **caracteres C64 8x8**.

Las fuentes 7x8 se convierten al entrar a 8x8. Las fuentes de mayor tamaño
(8x14, 8x16, 16x16, etc.) todavía no forman parte del contrato dual-bank y se
evaluarán por separado.

La combinación dual-bank con ECM/Multicolor y la exportación C64 de los nuevos modos
Ping Pong requieren validaciones específicas antes de considerarlas cerradas.

## Estructura del fork

El proyecto original de referencia es:

`jaammees/lvllvl`

Baseline upstream:

`b528e4c1d38faeadb0e24eb619705e4f0b8ab899`

Las extensiones RICO se mantienen, siempre que es posible, como módulos separados en:

- `src/js/rico/`
- `dist/js/rico/`

GitHub Pages utiliza `dist/`, por lo que cada feature promovida debe existir tanto
en `src` como en `dist`.

## Estado técnico / milestones

**14/10/2026 — promoción actual a main**

- TEST07 — Choose Tile Set regression fix: PASS.
- TEST14 — Rico's Remix 512 continuous: PASS.
- TEST15 — Charset Bank por frame: integrado y validado.
- TEST17 — preview real BANK 2 en paleta: PASS.
- TEST18 — BANK 2 C64 Shifted por defecto: integrado y validado.
- TEST19 — renderer real BANK 1/BANK 2 por frame: PASS.
- TEST21 — vista Banks 32 x 8: PASS.
- TEST23 — export PRG dual-bank Standard: PASS en VICE.
- TEST24 — navegador Remix 8x8 + 7x8: integrado en la rama promovida.
- TEST25 — Scroll corregido + Ping Pong + animación independiente por banco: PASS.
- TEST26 — redirección BANK-aware del Tile Editor: integrado.
- TEST27 — render BANK 2 real en Tile Editor: PASS.
- TEST28 — EDIT GROUP CHARS: promovido al estado principal actual.

### Nota TEST22

TEST22 fue FAIL porque el código agregado hizo crecer el player sobre la zona fija de
la tabla de frames alrededor de $0FFF/$1000, provocando un CPU JAM en $1009.

TEST23 lo corrigió sin aumentar el tamaño del player: se reemplazó una instrucción de
3 bytes por un JSR de 3 bytes y se ubicó la rutina auxiliar en $2FE0.

## Regla de desarrollo

- **main = estado RICO validado/promovido.**
- Los experimentos nuevos se prueban incrementalmente fuera de main.
- James/LVLLVL upstream sigue siendo la referencia para detectar regresiones.
- La documentación técnica ampliada está en `RICO_FEATURES_MILESTONES_14_OCT_2026.txt`.
