# TEST286 — Bitmap Multicolor: movimiento procedimental en ASM

**Fecha:** 24/10/2026
**Base:** TEST282 PASS en VICE y TEST285 experimental. TEST281 PASS.
**Estado:** JS + generador PRG + simulación de CPU y stress de memoria PASS; **PENDIENTE PASS visual y velocidad en VICE**.
**Conservación:** MASTER, TEST282, TEST284 y TEST285 intactos.

## Qué soluciona
TEST284/285 creaban una variante de cada patrón por fase del movimiento. Un grupo de solo 16 tiles visibles podía agotar hasta 20 KB de RAM, pese a que LVLLVL utiliza un máximo de 256 tiles de 8×8.

TEST286 ahora conserva **un solo atlas de 256 tiles (2048 bytes)**. El ASM 6502 desplaza píxeles horizontalmente **al ejecutarse** a partir de los patrones originales; no almacena las posiciones sucesivas de cada tile.

## Memoria
| Componente | Dirección | Bytes |
|---|---|---:|
| Imagen bitmap inicial para carga | $1000 | 8000 |
| Screen RAM inicial | $2F40 | 1000 |
| Color RAM inicial | $3328 | 1000 |
| Atlas ORIGINAL (256 × 8) | $8000 | 2048 |
| Atlas de trabajo, calculado por 6502 | $8800 | 2048 |
| Matrices de grupos + lista de ocurrencias | $9000 en adelante | variable, sin fases precalculadas |
| VIC Screen | $5C00 | 1000 |
| VIC bitmap | $6000 | 8000 |
| Color RAM C3 | $D800 | 1000 |

El loader configura $D011=$3B, $D016=$18, $D018=$78, $DD00 bits0-1=2 y usa $01=$36 para acceso directo a RAM bajo BASIC ROM, manteniendo I/O.

## Funciones incluidas AHORA
- **Individual → Scroll Left / Scroll Right**, usando Ticks/Frame del Tile Editor (1..255).
- **Group Animate → Scroll Left / Scroll Right**, respetando Ticks/Frame y Pixels/Tick (1..8).
- Animación individual y grupal **simultánea**, con relojes independientes.
- Repeticiones de un tile en diversas celdas del mapa se actualizan cuando su textura cambia.
- 256 IDs originales posibles, sin consumir espacio adicional por fase.
- Soporta grupos de hasta 31 columnas × 255 filas de tiles; se limita a 1024 celdas de geometría en esta prueba (en la práctica solo 256 IDs disponibles, por lo que la superficie suele ser menor).
- Respeta BANK 1 o BANK 2 seleccionado por la frame visible, sin alternancia dinámica de bancos.
- Exportación automática desde el **menú habitual Export PRG**, sin añadir botones ni controles. Sin animaciones activas exporta la imagen fija TEST282.

El motor usa **una sola frame de documento como mapa estático**. No reintroduce la exportación de animaciones de frames completos de TEST283.

## Funcionamiento ASM
1. Copia el bitmap de arranque de TEST282, sus 3 colores por celda y el BG.
2. Copia el atlas base de 2048 bytes al buffer de trabajo (2048 bytes).
3. En cada tick, cada animador actualiza su fase si le corresponde por tiempo.
4. Para cada miembro animado, calcula columnas de origen con posición actual y lee dos bytes adyacentes del atlas original.
5. Realiza corrimientos con `ASL`/`ROL` de 16 bits y guarda **8 bytes por tile** en el atlas de trabajo.
6. Sólo cuando hay movimiento, copia los tiles afectados a sus posiciones bitmap visibles en $6000.

## Validaciones realizadas
- Compilación de JavaScript y generación del ASM 6502: PASS.
- Simulador 6502 con scroll grupal **Right** (10×16 tiles), 16 tiles visibles y **Scroll Left individual** simultáneo: 6 ticks, **128 bytes del grupo + 8 bytes individual verificados por tick** contra la operación de desplazamiento esperada. Cero diferencias. PASS.
- Registros VIC y acceso a memoria: $D011=$3B, $D016=$18, $D018=$78, $DD00=$02, $01=$36. PASS.
- Prueba de estrés: **256 IDs en el mapa, grupo de 160 tiles animados, 319 celdas visibles a actualizar**, atlas 2048 bytes + buffer 2048 bytes, metadatos 2404 bytes, PRG 37.221 bytes. **No aparece el error del atlas. PASS (generación)**.

> Todavía no está medida la velocidad real. Actualizar 160 tiles/319 celdas durante un tick puede exceder los ciclos disponibles del C64 y el movimiento puede perder velocidad. Este TEST demuestra ahorro de memoria y movimiento en ASM, no el rendimiento final bajo máximo estrés.

## Movimientos pendientes
En **TEST286** se implementaron exclusivamente **Scroll Left/Right** individual y grupal. Para Up/Down, Ping Pong, Blink, Frames internos o Group Switch Bank se muestra **error explícito**, no se generan PRG incompletos. Tampoco incluye Map Scroll, SID, cambio de frames completos ni Window Dimensions.

No se modificó ningún modo de exportación de caracteres tradicional.

## Cómo probar en VICE
1. Abrí [TEST286 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test286-bitmap-mc-procedural/).
2. En SCREEN elegí **Bitmap Multicolor (Experimental)**.
3. Dibujá algunos tiles y configurá un carácter individual con `Scroll Left`, 2–4 ticks.
4. Configurá un grupo de 2 o más tiles con `Group Animate → Scroll Right`, Ticks/Frame y Pixels/Tick existentes.
5. Usá únicamente **el menú normal Export PRG**. El resultado se llama `RICO_TEST286_BITMAP_MC_PROCEDURAL.prg`.
6. Abrí el PRG en VICE, comprobá las dos animaciones y su velocidad.
7. Si funciona, probá un grupo mayor con **el mismo mapa** que antes daba error de atlas.

## Enlaces
- [TEST286 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test286-bitmap-mc-procedural/)
- [TEST286 ZIP completo](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test286-bitmap-mc-procedural.zip)
