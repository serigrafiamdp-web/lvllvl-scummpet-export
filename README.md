# LVLLVL SCUMMPET EXPORT — RICO MOD

**MASTER ACTUAL (18/10/2026): TEST138 — SCUMM PIXEL GEAR — PASS VICE.**
Scroll horizontal perfecto en 40 columnas y vertical perfecto en 24 de 25 filas, confirmado por usuario. Sincronizacion de Animated Char y Map Scroll a 1 tick sin movimiento lateral intermitente. El motor SCUMM-PET-C64 aporta el principio de scheduler/IRQ maestro; no es un port completo del motor.

**ZIP MASTER byte-identico al TEST138 aprobado:** `MASTER_LVL_RICO_SCUMM_PIXEL_GEAR_TEST138_PASS_18_OCT_2026.zip` (SHA256 `a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227`). Documentacion y limites: [releases/MASTER_LVL_RICO_TEST138_SCUMM_PIXEL_GEAR_18_OCT_2026/README.md](releases/MASTER_LVL_RICO_TEST138_SCUMM_PIXEL_GEAR_18_OCT_2026/README.md).

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

### MASTER TEST138 — INICIO IMPLEMENTACION ARQUITECTONICA SCUMM (18/10/2026)

- **PASS VISUAL adicional:** scroll horizontal perfecto con las **40 columnas de ancho**; vertical perfecto con **24 filas de 25**. Una fila queda fuera de la zona de scroll vertical fluido (sin asumir posicion ni implementacion de la fila excluida).
- **Reloj visual compartido:** Animated Chars conserva sus ticks, pero solo los contabiliza cuando hay movimiento fino real de Map Scroll. A 1 tick se mantiene la diagonal fluida.
- **Pantallas uniformes:** modo VIC modulo 8 evita preparar buffers identicos, reduciendo bloqueos.
- **SCUMM-PET-C64:** adopcion de principios comprobados de IRQ maestra / scheduler unico; no se han integrado sus binarios ni reemplazado el motor LVLLVL completo.
- **Reversion segura:** rama milestone TEST138 congelada, MASTER TEST134 respaldado. ZIP TEST138 promovido a MASTER sin tocar ni un byte del runtime.
- **Detalles y proximas pruebas:** [release MASTER TEST138](releases/MASTER_LVL_RICO_TEST138_SCUMM_PIXEL_GEAR_18_OCT_2026/README.md). Otras configuraciones siguen pendientes de PASS visual.


### MILESTONE TEST138 PIXEL GEAR PASS (18/10/2026)

**Estado: PASS visual confirmado en VICE.** Soluciona el movimiento lateral periodico al combinar **Map Scroll UP 1 tick / 1 px** y **Animated Char RIGHT 1 tick**, manteniendo el movimiento diagonal fluido.

- **Engranaje:** cada Animated Char conserva su contador configurable, pero recibe el tick al confirmar un avance fino real del mapa.
- **Pantallas uniformes 40×25:** avance fino VIC continuo sin preparar pantallas identicas para cada bloque de 8 pixeles.
- **Verificacion:** 48/48 compilaciones y 32 avances finos consecutivos sin espera en la simulacion; PASS visual del usuario en VICE con su mapa real.
- **Rama congelada:** `milestone/lvl-rico-pixel-gear-test138-pass-18-oct-2026`.
- **Snapshot de Biblioteca:** `MILESTONE_LVL_RICO_TEST138_PIXEL_GEAR_PASS_18_OCT_2026.zip` — SHA256 `a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227`.
- **Punto de regreso:** `milestones/TEST138_PIXEL_GEAR_PASS_18_OCT_2026/`.
- **MAIN PROMOVIDO A MASTER TEST138 PASS**. MASTER TEST134 se conserva en `backup/master-lvl-rico-test134-before-test138-18-oct-2026`. Los mapas no uniformes siguen pendientes de PASS visual con esta mejora.



**18/10/2026 — MASTER ANTERIOR: LVL-RICO / TEST134 PASS VISUAL EN VICE**

- **NUEVO MASTER APROBADO:** TEST134; exportacion PRG combina animacion original de caracteres y Map Scroll.
- Corregidos destellos blancos y artefactos de color (Color RAM $D800 nibble bajo de 4 bits, prioridad de glifos visibles por charset).
- **PASS confirmado por usuario con proyecto real:** sin blink blanco, sin caracteres fantasma ni saltos incorrectos; color de caracteres, borde y fondo del editor se mantienen en el PRG.
- Web activa: `https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/` (gh-pages TEST134).
- Codigo fuente principal `dist/index.html` y `dist/js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` igual a la version TEST134 de gh-pages.
- El MASTER del 17/10 (TEST120) se conserva en la rama `backup/master-lvl-rico-17-oct-before-test134-pass`.
- Registro tecnico y regresiones en `tests/TEST129/` a `tests/TEST134/`.


**17/10/2026 — MASTER ANTERIOR: LVL-RICO / TEST120 PASS**

- Base validada por ZIP: `LVLLVL_TEST120_ISOLATED_CHAR_RENDER.zip`.
- MASTER consolidado: `MASTER_LVL-RICO_17_OCTUBRE_2026.zip`.
- SHA256: `7b98cb59532394b99410a9d26c5b90259b04ec21666f0c7ec6006479c96f709d`.
- `main/dist/` es copia exacta del payload del ZIP PASS (622 archivos).
- GitHub Pages se publica reemplazando el payload completo desde el mismo ZIP; no se reconstruyen tests a mano.
- TEST120 elimina el flicker general del editor durante Animated Chars: el tick modifica el glyph, silencia Current Tile/paletas/redraw global y redibuja sólo las celdas del mapa que usan los IDs realmente modificados.
- Export/VICE mantiene el fix de animación nativa: BANK 1 en `$3800`, BANK 2 en `$3000`.
- MAP SCROLL, UI TEST80 y runtime large-map TEST89 permanecen integrados.

**15/10/2026 — promoción actual a main: TEST59B PASS**

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
- La documentación técnica actual está en `RICO_FEATURES_MILESTONES_17_OCT_2026.txt`; el archivo del 14/10 se conserva como histórico.


## Milestone 15/10/2026 — TEST55 PASS

El estado promovido incorpora las features desarrolladas desde TEST30 hasta TEST55.

### Remix y biblioteca local
- TEST30: importación/edición de fuentes verticales dobles 8x16 como pares de caracteres C64.
- TEST31: importación de módulos 16x16 como bloques reales 2x2 de caracteres 8x8.
- TEST32: biblioteca local de TileSets con export/import JSON y fuentes custom para Rico's Remix.

### Animación y edición
- TEST33: preview animada en la paleta.
- TEST34: Group Animate, animación de una selección de caracteres como una superficie continua.
- TEST38: refresh correcto de la paleta después de editar un carácter.

### MAP SCROLL
- TEST35-37: configuración por frame `ricoMapScrollV1`, tipos Scroll/Ping Pong, Ticks / Step y Pixels / Step.
- El MAP SCROLL es una transformación de pantalla completa independiente de Group Animate.
- El runtime C64 usa un viewport limpio de **38 x 24 caracteres** durante el scroll, ocultando las costuras del VIC-II mediante 38-column mode y 24-row mode.
- Scroll normal soportado: Left / Right / Up / Down.
- Ping Pong soportado: Left / Right / Up / Down.
- Frame Duration es de 16 bits y el estado promovido permite **1..1024 ticks**.
- Cada frame conserva su propia dirección, velocidad, duración y charset bank.
- En una animación de varias frames, al vencer Frame Duration se carga la siguiente configuración de MAP SCROLL.
- En una sola frame Ping Pong, el rollover de Frame Duration ya no reinicia el desplazamiento: el movimiento continúa y vuelve en sentido contrario.

### Export PRG C64 validado
TEST55 queda **PASS confirmado en VICE**. La ruta de export PRG usa el runtime MAP SCROLL dedicado en lugar de intentar encajar el efecto dentro del player clásico de LVLLVL.

Para scroll horizontal con `Ticks / Step = 1` y `Pixels / Step = 1`, una vuelta completa de 40 caracteres requiere 320 ticks. Para vertical, 25 caracteres requieren 200 ticks.

Checkpoint promovido: **TEST55 / MAP SCROLL PING PONG CONTINUOUS**.


## Milestone 15/10/2026 — TEST56 / TEST57 PASS

### TEST56 — MOVE OUT
- Se agrega movimiento de salida no-wrap en Left / Right / Up / Down.
- La pantalla sale una sola vez y queda fuera hasta finalizar Frame Duration.
- El nombre visible final de esta familia es **Move Out**.

### TEST57 — MOVE IN
- Se agrega **Move In Left / Right / Up / Down**.
- La pantalla comienza fuera del viewport, entra desde la dirección opuesta al movimiento y termina en su posición normal.
- No reinicia ni vuelve a salir al completar el recorrido.
- Se mantienen los límites validados: 319 px horizontal y 199 px vertical.
- Compatibilidad con metadata `ricoMapScrollV1` y con los códigos MOVE de TEST56.

Checkpoint promovido: **TEST57 / MAP SCROLL MOVE OUT + MOVE IN**, PASS confirmado en VICE.


## Milestone 15/10/2026 — TEST58 PASS

- Preview MAP SCROLL sincronizado a reloj PAL de 50 Hz.
- Pixels / Step se calcula en píxeles C64 y luego se escala visualmente con el zoom.
- Activar MAP SCROLL ya no vuelve negro el borde del editor: se preserva Border Color nativo.
- El runtime PRG de TEST57 se mantuvo sin cambios.

Checkpoint promovido: **TEST58 / MAP SCROLL PREVIEW SYNC + BORDER FIX**.


## Milestone 15/10/2026 — TEST59B PASS / MASTER

### Clean Move In transition
- Se elimina la microframe de tearing al pasar de una frame Move Out a una frame Move In.
- Causa: `load_frame` reconstruía `$0400/$0800` mientras VIC-II todavía podía mostrar una de esas screens.
- Solución: tercera screen de staging vacía en `$0C00-$0FFF`.
- Durante la preparación de una nueva frame Move In, VIC-II muestra la screen vacía y sólo conmuta a la screen real cuando la construcción terminó.

### MAP SCROLL menu restore
- TEST59 inicial tuvo una regresión de integración: el menú no mostraba Move Out / Move In.
- TEST59B agrega un módulo UI dedicado y restaura las 8 opciones:
  - Move Out Left / Right / Up / Down
  - Move In Left / Right / Up / Down
- Se conservan preview PAL 50 Hz, zoom sync y border fix de TEST58.

**TEST59B = PASS confirmado y nuevo MASTER seguro en main.**
