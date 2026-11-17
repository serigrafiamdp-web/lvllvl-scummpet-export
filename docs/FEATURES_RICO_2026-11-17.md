# Funciones de LVLLVL RICO — inventario revisado

**Auditoría documental: 17 de noviembre de 2026 (Argentina).**  
**Editor que ejecuta el usuario:** [LVLLVL RICO](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/) · **Fuente de verdad:** `gh-pages/index.html` (133 scripts externos, 120 extensiones o pruebas relacionadas con RICO/SCUMM).  
Este inventario describe **rutas presentes en la aplicación**, no afirma que todas las combinaciones generen un PRG funcional. Cualquier PASS se limita al caso efectivamente probado.

## 1. Bancos, tilesets y caracteres

| Función | Comprobación / alcance |
|---|---|
| BANK 1 y BANK 2, 256 caracteres 8×8 por banco | Scripts `RICO_FRAME_CHARSET_BANK_TEST15`, `RICO_SIDE_TILE_BANKS_TEST17`, `RICO_BANK2_TILE_EDITOR_TEST26`; soporte de edición |
| BANK 2 inicial con C64 Shifted | `RICO_C64_DEFAULT_SHIFTED_BANK2_TEST18`; inicialización, modificable |
| Selección de banco por frame y previsualización | `RICO_ACTIVE_FRAME_BANK_RENDER_TEST19`, `RICO_DUAL_BANK_ANIMATION_TEST25` |
| Remix Tileset: bancos de fuentes C64 estándar, Swedish, Japanese, y sus variantes Shifted | `RICO_REMIX_TILESET_TEST14`; **selección/importación en editor** |
| Remix Double Height 8×16 → dos caracteres C64 8×8 | `RICO_REMIX_DOUBLE_HEIGHT_TEST30`; 128 pares por banco |
| Remix 16×16 → módulos de cuatro caracteres C64 8×8 | `RICO_REMIX_16X16_TEST31`; 64 módulos/banco |
| Biblioteca local de tilesets, carga y guardado de fuentes personales | `RICO_LOCAL_TILESET_LIBRARY_TEST32`; almacenamiento local del navegador |
| Copiar y pegar bloques de múltiples caracteres | `RICO_MULTI_CHAR_CLIPBOARD_TEST174` |
| Edit Group Chars y animación en superficie de múltiples tiles | `RICO_EDIT_GROUP_CHARS_TEST28`, `RICO_GROUP_ANIMATE_TEST34` |
| Herramientas de remapeo ECM y selección de caracteres | `SCUMM_ECM_*_TEST01/04/05/06` |
| Selector de paletas **solo C64**, 16 colores; Colodore/Pepto/VICE | TEST364, TEST365, TEST366; PASS reportado para TEST364/366 |

## 2. Animación y Map Scroll

| Función | Comprobación / alcance |
|---|---|
| Animación de caracteres individual por banco | `RICO_DUAL_BANK_ANIMATION_TEST25` y editor original; exportaciones dependen del motor |
| Group Animate, modos de movimiento y ping-pong | `RICO_GROUP_ANIMATE_TEST34`; editor y motores dedicados |
| Velocidad de grupo por ticks/píxeles, hasta 8 píxeles en las rutas de scroll que lo permiten | `RICO_GROUP_ANIMATE_TEST34`; no generalizar a todos los motores |
| Mapa en **8 direcciones** (4 cardinales, 4 diagonales) | `RICO_MAP_SCROLL_PREVIEW_SCROLL_AREA_TEST79` |
| Ping Pong Left/Right/Up/Down | Opciones del diálogo Map Scroll; exportación depende de ruta |
| Move Out / Move In, 4 direcciones cardinales | Opciones del diálogo Map Scroll; **presencia en UI** no certifica PRG |
| Pixels/Step de **1 a 8** y Ticks/Step | `RICO_MAP_SCROLL_PREVIEW_SCROLL_AREA_TEST79` |
| Window y Scroll Area configurables por frame, viewport separado del mapa fuente | `RICO_WINDOW_DIMENSION_SCROLL_AREA_TEST75` |
| Dimensions: redimensionado por Left, Right, Top y Bottom | `RICO_DIMENSIONS_FOUR_SIDES_TEST79` |
| Scroll vertical fino, horizontal y diagonales, con motores PRG especializados | TEST168, TEST221–232, TEST326/327, TEST196 |
| Diagonal multiframe y Group multiframe | TEST363/TEST355 **integrados**, cobertura y ejecución VICE de esas rutas pendientes |

## 3. Edición de color, bitmap y SID

| Función | Comprobación / alcance |
|---|---|
| Texto estándar, C64 multicolor, ECM/EBCM | Modos y adaptadores, incluida restauración TEST372 |
| EBCM con cuatro colores de fondo (registro $D024 preservado) | **TEST372 PASS del usuario** para LILCHEB; EBCM+BANK2 no certificado |
| Multicolor Bitmap, herramientas de pintar, remapear y decolorizar | TEST279–289, incluido `RICO_DECOLORIZE_TEST287` |
| Motores experimentales de bitmap con LUT, double buffer y speedcode distribuido | TEST290–297; **TEST297 PASS histórico en su alcance** |
| SID integrado en algunas rutas PRG, reloj musical independiente donde está implementado | `RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207`; no universal |
| SID AUTO/CIA/50/100 Hz y tratamiento de PSID | Funciones documentadas en historial TEST207–229; confirmar cada PRG con VICE |

## 4. Interfaz

| Función | Comprobación / alcance |
|---|---|
| Dock derecho con tiles/editors, paneles ajustables y disposición 50/50 | TEST358 C17, TEST359 |
| Redimensionamiento inicial optimizado, sin parpadeo del área de trabajo | TEST369 **PASS del usuario** |
| Previsualización de tiles, bancos, frames y viewport | Módulos TEST33, TEST38, TEST81/83/84, TEST169/178, TEST339/353 |
| Acceso SpotySID junto a HELP en pestaña nueva | TEST368 |
| Paletas C64 filtradas y selección conservada | TEST364–366 |

## 5. Exportadores: estados que NO deben confundirse

| Exportador | Estado documentado |
|---|---|
| PRG clásico de James | Integrado; modo Extended corregido por TEST372, PASS en el caso LILCHEB |
| Map Scroll y Group | Motores específicos; no todas las mezclas frame/BANK/SID/ECM tienen PASS |
| Export C64 (NEW) | Heredado; ZIP de ejemplo del usuario tuvo nueve `asm/*.asm` que eran documentos HTML 404. No asumir que ese source ZIP recompila |
| Export C64 Assembly → TASS | Formato de **datos**, no motor PRG completo de todas las funciones |
| **Interface → 64tass Export** (nombre actualizado en TEST373) | TEST371: captura fuente ASM, BIN y PRG de referencia. **Experimental**: la animación de prueba reconstruida volvía a BASIC, sin PASS de reconstrucción 64tass/VICE |
| Multicolor Bitmap | Rutas hasta TEST297; PASS de casos históricos, no exportación universal |

## 6. Qué datos se conservaron como histórico, no como promesas actuales

El README anterior de `main` enumeraba **62 funciones** y fechaba el "estado actual" en **2/11/2026 / TEST297**. Ese documento representa una **etapa histórica** y se preserva en el historial de Git y en la copia `docs/historico/README_MAIN_2026-11-02.md` (rama `main`). Algunas cifras antiguas —por ejemplo máximo exacto de Frame Duration, cantidad de grupos exportables o FPS de un MASTER— dependen de ruta/versión y **no se reetiquetan como garantías vigentes** sin una prueba específica.

## 7. Fuentes y versiones

- `gh-pages/index.html`: carga de scripts confirmada el 17/11.
- [Progreso 16/11 — TEST364–372](PROGRESO_2026-11-16.md).
- [Prueba y causa de regresión TEST372 EBCM](../TEST/test372-restore-ebcm-export/README.md).
- [Experimento TEST371 64tass](../TEST/test371-muzza-live-asm/README.md).
- [Índice de pruebas](../TEST/README.md).
- [Histórico y arquitectura de Map Scroll / Group](ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md).

**Criterio de veracidad:** "cargado en la portada" significa código disponible; "PASS" significa solamente la prueba reproducible realmente confirmada. Para avanzar hay que validar en VICE los PRG de cada combinación y registrar limitaciones reales, sin imponer restricciones artificiales globales.
