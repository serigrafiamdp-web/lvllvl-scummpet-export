# TEST301 — Reaprovechar TEST247: Bitmap MC → Multicolor Character Remap (sin pérdida)

**Fecha:** 25 de octubre de 2026. **Rama experimental:** `release/test301-mc-char-remap-feasibility`.
**Referencia segura:** `release/test297-pass-2026-10-24`, confirmado PASS en VICE. MASTER y todos los demás TEST intactos.

**Estado:** análisis de compatibilidad PASS, generación de PRG y ejecución 6502 simulada PASS; **pendiente VICE real**. No declaramos que el dibujo concreto del usuario vaya a ser convertible: depende de los colores reales por celda.

## El hallazgo de los TEST246/247 Hi-Res

TEST247 PASS optimizó Group Scroll desplazando **códigos de pantalla**, con fuentes precalculadas, en lugar de recomponer todos los bytes de charset. Esta técnica puede ser todavía más rápida si un bitmap MC se convierte *exactamente* a **MC Character**. Pero **la pantalla de Bitmap MC no es un índice**, sino dos colores de 4 bits por celda, y cada celda tiene un tercero en Color RAM.

| Índice píxel | Bitmap MC | Character MC |
|---|---|---|
| %00 | $D021 global | $D021 global |
| %01 | C1 **local** en screen high nibble | $D022 **global** |
| %10 | C2 **local** en screen low nibble | $D023 **global** |
| %11 | C3 **local 0..15** en Color RAM | C3 **local 0..7** en Color RAM, con bit 3 encendido |

No son intercambiables sin restricciones. **No cambiamos ni un color**: si alguna condición falla, no convertimos.

Fuentes:
- https://github.com/bdgscotland/c64-kb/blob/main/docs/hardware/vic-ii-reference.md
- https://csclub.uwaterloo.ca/~pbarfuss/C64_Programmers_Reference_Guide.pdf

## Implementación TEST301

**Se instala como módulo después de TEST297 PASS y usa el MENÚ NORMAL Export PRG**, sin panel de exportación adicional.

1. Recupera las **1000 posiciones físicas del frame** y el atlas exacto de 256 glyphs de 8 bytes que usa el exportador Bitmap MC.
2. Reconstruye cada fase circular de Group Animate Left/Right con desplazamiento de **8 píxeles multicolor efectivos** (= 2 columnas de caracteres de 8 bits) por paso.
3. Inspecciona la **presencia de índices de píxel %01/%10/%11**, no solo los colores elegidos en la paleta. Una tinta que no se usa en los bits de ese tile no produce una restricción ficticia.
4. Para cada una de las 25 filas de caracteres, verifica durante **todas las fases** si C1 y C2 usados son constantes entre celdas, y si cada C3 efectivamente usado es <=7.
5. Devuelve `rowsCompatible`, `viableRows`, `candidateBands`, `colorConflicts`, `outOfRangeLocalC3`, `globalC1`, `globalC2`, `phaseCount`, `reasons`.
6. Detecta además **bandas contiguas** de filas con paletas compartidas compatibles. **Esta parte es DIAGNÓSTICA**: todavía NO intenta raster-splits o render híbrido parcial, que exigiría otra arquitectura segura de IRQ y pantallas simultáneas.
7. **Si LAS 25 filas** y todas las fases son convertibles con el mismo par de colores globales C1/C2, exporta un PRG nuevo en **Multicolor Character Mode real**:
   - VIC bank1 $4000-$7FFF; charset original de 256 tiles en **$5000-$57FF**.
   - Doble pantalla **$4400 y $4800**; `$D018=$14/$24`, con el bitmap de pantalla remapeado en lugar de copiar el bitmap.
   - Color RAM inicia con `8 + C3` por celda; $D022=C1, $D023=C2, $D021=BG.
   - Las fases completas se precalculan en **$6000-$7F3F**, máximo 8 fases, con **1000 bytes de códigos por fase**.
   - La rutina 6502 escribe la pantalla oculta de **1000 bytes** y la presenta en una ventana PAL fuera de la zona visible, con sincronización de raster.
   - Ya no modifica 8000 bytes de bitmap; los **256 glifos fuente** permanecen inmutables.
   - Nombre de salida: `RICO_TEST301_MC_CHAR_REMAP_LOSSLESS.prg`.
8. **En cualquier otro caso** el menú normal sigue exactamente al exportador TEST297 Bitmap MC, conservando la imagen. Se muestra una pequeña notificación de compatibilidad y un informe detallado en `window.RICO_TEST301_LAST_EXPORT`. Nunca obliga al editor a cambiar SCREEN, a recolorear, ni a seleccionar menos caracteres.

**Importante:** el motor character es pantalla completa y solo admite **un grupo horizontal de matriz completa, 8 MC píxeles/tick y Ticks/Frame=1**, con período de 2 a 8 fases. No hay conversión parcial automática en TEST301.

## Pruebas realizadas (simulador 6502, NO VICE)

| Ensayo | Resultado |
|---|---|
| Mapa sintético 40×25 / 256 IDs / 1000 celdas, todas las tintas exactas y C3=3 | Compatible (25/25 filas) |
| Grupo 16×16 / scroll derecha / 8 MC px por tick / 8 fases | Generación PASS |
| Charset $5000 (2048 bytes) | Coincide byte a byte |
| 1000 entradas Color RAM $D800 | 100% coinciden con 8+C3 |
| PRG autónomo con dos pantallas / 8 frames precompilados | **30529 bytes**, ASM **269 bytes** |
| **11 cambios reales de $D018** (8 fases + vuelta), pantalla destino contra datos exportados | **0 diferencias en 1000 códigos por cambio** |
| Raster de los 11 intercambios | Línea 251 (PAL), todos fuera del área visible |
| C1 variable por columna (01 usado) | Rechazo correcto, 0/25 filas; ruta TEST297 |
| C3=12 en una celda que dibuja %11 | Rechazo correcto, 24/25 filas; ruta TEST297 |
| Modo MC bitmap con hasta 256 glyphs no compatibles en colores | Permanece Bitmap MC sin pérdida |

**En la carga sintética compatible**, las 11 presentaciones se separaron por un cuadro PAL en el modelo de CPU **sin steals del VIC-II**. No afirmar 50 FPS reales sin VICE ni extrapolar a proyectos cuyos colores no cumplen los requisitos.

## Cómo probar

1. [Abrir TEST301 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test301-mc-char-remap-feasibility/).
2. Abrir **el mismo proyecto real de TEST297 PASS**, con los 256 tiles del atlas, las mismas 1000 celdas y Group Animate horizontal a `8 Pixels/Tick` y `1 Tick/Frame`.
3. Exportar desde **Export PRG** normal. No cambies SCREEN a Character: permanecé en Bitmap Multicolor en el editor.
4. Leer el aviso: `TEST301 · MC CHAR REMAP ACTIVO` si las 25 filas son convertibles, o `Bitmap MC conservado. Filas compatibles X/25` si usa la ruta segura de TEST297.
5. Abrir la consola del navegador y evaluar `window.RICO_TEST301_LAST_EXPORT` para ver las **razones exactas** y qué bandas podrían convertirse en el futuro.
6. Si se generó `RICO_TEST301_MC_CHAR_REMAP_LOSSLESS.prg`, ejecutarlo en VICE y comprobar la imagen, las 256 fuentes y la velocidad. Si se generó el PRG de TEST297, no esperar aceleración: prueba deliberadamente conservadora.
7. Para futuro TEST302: usar el informe para probar raster-splits por bandas, o reencodificación sin pérdidas con variantes de caracteres y presupuesto de códigos si el conjunto no ocupa todo el atlas.

## Límites y precauciones

- No hay SID/IRQ de música: este primer PRG character es una prueba autónoma, con IRQ deshabilitadas; no usarlo como base de soundtrack sin adaptar scheduler.
- La conversión no intenta reducir colores de 8..15 a 0..7, ni recolorear dos tintas que varían localmente.
- Las bandas compatibles se enumeran, pero no se muestran mezcladas con bitmap en el PRG todavía.
- Se preservan los datos del documento, la paleta y los 256 glyphs originales; la conversión se hace solo en la memoria del PRG exportado.
- No modifica MASTER, TEST247, TEST297 PASS ni TEST299/300.

## Entregables

- [TEST301 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test301-mc-char-remap-feasibility/)
- [ZIP completo TEST301](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test301-mc-char-remap-feasibility.zip)
- Código: `TEST/test301-mc-char-remap-feasibility/js/RICO_MC_CHAR_REMAP_TEST301.js`
