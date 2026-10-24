# TEST271 — Oil's Well: charset compartido estable entre los ocho niveles

**Fecha:** 24 de octubre de 2026 · **Base:** TEST269 Warp PASS + TEST267 Big Screen + TEST268 controles compactos + TEST270 capturas secuenciales (**TEST270 original intacto**).

## Problema registrado

En TEST270 la segunda captura podía rechazar la operación con “El juego cambió caracteres usados”, aunque los mapas de los ocho niveles de `ricos oil.prg` comparten los mismos caracteres. TEST270 comparaba el charset del editor contra una **lectura instantánea del VIC-II**, susceptible de observar el raster de bitmap en vez del charset del mapa.

## Auditoría reproducible: PRG proporcionado por el usuario

Archivo `ricos oil.prg`, 38.405 bytes, inicio $0801, COPY SOFT. La carga del juego sitúa datos originales en direcciones $8000+. Para leer esos bytes **del archivo PRG**: `offset = 257 + (dirección - $8000)`.

- Charset original **único**: `$9A00-$9DFF`, **1024 bytes**, 128 caracteres de 8x8; relleno a 256 slots dentro de la representación LVLLVL de 2048 B.
- Mapas de nivel: **8 × 1024 bytes** consecutivos `$A000-$BFFF`. Las primeras 1000 posiciones de cada bloque forman un mapa 40×25.
- Colores específicos por nivel recuperados de las mismas tablas ASM que documentó RICOS-PRG-TO-LVLLVL: `$963D + 4*nivel` (border, background, MC1, MC2); `$965D + 4*nivel` y `$967D + 4*nivel` para Color RAM estática.
- **Los 8 mapas utilizan 73 índices distintos en total** (del 0 al 81). No hay ningún índice usado superior a 127, y los 73 glifos utilizados tienen bitmaps distintos.
- En el charset estático asociado a estos ocho mapas hay **cero cambios de bitmap por nivel**, porque todos utilizan exactamente el mismo conjunto de bytes, no ocho charsets diferentes.
- El banco LVLLVL de 256 entradas puede alojarlos **sin reindexación ni compresión**. Usando solo los 73 índices referenciados se liberarían **183 posiciones** para posibles variantes, aunque no es necesario reasignar los índices originales.

| Nivel | Índices de caracteres usados en ese mapa | Nuevos índices frente a los niveles anteriores |
|---:|---:|---:|
| 1 | 33 | 33 |
| 2 | 36 | 3 |
| 3 | 43 | 13 |
| 4 | 46 | 6 |
| 5 | 48 | 8 |
| 6 | 46 | 1 |
| 7 | 37 | 7 |
| 8 | 29 | 2 |
| **Unión de los ocho** | **73** | **73** |

**Alcance de la medición:** datos estáticos contenidos en el PRG original. No constituye una comparación de ocho dumps completos de RAM del emulador durante toda la partida, ni demuestra ausencia de animaciones, sprites, efectos raster o cambios de charset dinámicos fuera de estos mapas.

## Corrección aplicada en TEST271

El nuevo módulo `TEST/test271-oils-stable-charset/js/RICO_C64_IMPORT_FRAMES_TEST271.js` sustituye **solamente** al módulo TEST270 de la página de prueba; conserva sin cambios TEST269 y todas las funciones básicas del editor.

- Al seleccionar un PRG, inspecciona **en el navegador y únicamente en memoria local** la firma COPY SOFT + mapas con índices 0–127. No se sube ni incorpora ningún dato del PRG comercial a GitHub.
- Si el archivo es exactamente el `ricos oil.prg` reconocido **y** el emulador está ejecutando la firma Oil's Well del TEST269, el importador usa el **charset original compartido** del PRG y los mapas/colores estáticos por nivel (`$22`, 0–7). Esto evita falsos conflictos por la fase raster del VIC-II.
- Cada captura usa Frame 1 vacía o inserta una frame al final, y preserva la primera.
- Para otros títulos, el código de captura genérico de TEST270 permanece activo y mantiene su protección contra sobrescrituras de charset incompatibles.
- Si el PRG se está leyendo todavía, se muestra un aviso y no se importa un mapa inconsistente.
- Esta prueba **NO** implementa la solución general de fusionar charsets de múltiples juegos ni recupera raster-splits/sprites. Es la vía de referencia para validar los ocho niveles.

**Importante:** en el modo específico Oil's Well, “Import” importa el **mapa y Color RAM estáticos originales asociados al número de nivel actual del juego**, no una copia pixel-perfect del estado visual con los sprites y raster dinámicos.

## Prueba visual requerida

1. Abrir [TEST271 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test271-oils-stable-charset/) e iniciar un **proyecto nuevo/vacío** de LVLLVL.
2. Import → C64 Formats → `ricos oil.prg`; ejecutar el juego y dejar terminar la carga.
3. Capturar nivel 1 → Frame 1, Warp nivel 2 → Frame 2, Warp nivel 3 → Frame 3, repetir hasta nivel 8 → Frame 8.
4. Comprobar que ya **no aparezca el aviso falso de cambio de charset**, que las ocho frames mantengan mismo tileset, y que fondos/MC1/MC2 sean diferentes según las tablas de cada nivel.
5. Cerrar Import y recorrer las ocho frames en el editor; confirmar que no se pisan y que las imágenes estáticas corresponden a los ocho niveles.

## Validaciones realizadas

- Inspección real del PRG del usuario: **73 índices y un mismo charset**.
- Mock de emulador, HTML y estructura de frames con PRG sintético reconocido: **8 importaciones consecutivas PASS**. Frame 1–8, 8 fondos, mismo tileset; nunca se lee el charset de un VIC simulado alterado por raster; el importador permanece abierto.
- Falta PASS de navegador real, no adjudicarlo antes de la prueba del usuario.

## Referencias / recuperación

- [TEST271 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test271-oils-stable-charset/)
- [TEST271 ZIP](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test271-oils-stable-charset.zip)
- [TEST270 anterior intacto](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test270-c64-import-frames/)
- [MASTER 24/10 intacto](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026)
- [Análisis y conversor anterior de referencia](https://github.com/serigrafiamdp-web/RICOS-PRG-TO-LVLLVL)

## Próximo paso (todavía sin implementar)

Para otros juegos, hacer un atlas de 256 con **deduplicación de patrones de 8×8 y remapeo de índices por frame**, empezando por confirmar el charset real que ve el VIC cuando está en modo caracteres. Separar bitmaps/sprites/raster y avisar si la unión excede los 256 patrones distintos; nunca reescribir charsets antiguos a ciegas.
