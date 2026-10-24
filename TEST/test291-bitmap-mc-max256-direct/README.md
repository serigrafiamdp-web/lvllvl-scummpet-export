# TEST291 — Scroll grupal Bitmap MC: 8 píxeles efectivos y estrés máximo de 256 tiles

**Fecha:** 24 de octubre de 2026.
**Base:** TEST289 PASS (editor + color brush), TEST290 LUT (prueba anterior), TEST286 procedural.
**MASTER intacto. TEST289 y TEST290 sin modificar.**
**Estado:** PASS funcional simulado en CPU y memoria, **FAIL del objetivo de velocidad 8 MC píxeles / 1 frame PAL en stress máximo**, pendiente control visual en VICE.

## Motivo

Video usuario: `2026-10-24 15-50-46.mkv` (11,7 segundos, 1920×1080, 50 fps). Se observa un mapa extenso con múltiples diseños de colores independientes animados como grupo. El usuario detectó que reducir la selección de tiles del índice no incrementa apreciablemente la velocidad: en Bitmap MC no basta contar los IDs de charset; hay que contar **las APARICIONES físicas de cada ID en el bitmap** que el motor debe reescribir.

### Solución implementada

- TEST291 toma los mismos 256 tiles base que TEST290 y mantiene el editor, colores, Rico's Decolorize y menú nativo Export PRG.
- En un único Group Animate `Left` o `Right` con `Pixels/Tick=8`, activa un blitter especializado. Las demás configuraciones siguen en TEST290, aisladas.
- **8 píxeles multicolor efectivos = 16 bits bitmap = 2 columnas de tiles**, porque un tile 8 bits contiene 4 píxeles multicolor horizontales.
- No hace desplazamientos parciales `ASL/ROL` ni consultas LUT por fila cuando el paso es de 8 MC píxeles.
- En lugar de generar cada patrón animado y copiarlo desde WORK, calcula la referencia al **tile original** para cada fase, y copia directamente los 8 bytes de ese tile a su celda de bitmap VIC. Mantiene los tres colores C1/C2/C3 de cada celda intactos.
- **Tabla compartida por ID, no por aparición**: 256 entradas de puntero fuente por fase (1 página de bytes bajos + otra de altos). Cada celda visible necesita solo 3 bytes (ID + destino de bitmap).
- Una selección de 16×16 = 256 tiles necesita 8 fases para completar un ciclo a 8 MC píxeles por paso. Las tablas fuente ocupan 8×256×2 = **4096 B**, independientemente de si los tiles aparecen 255 o 1000 veces.
- La lista de destinos ocupa 3 bytes por aparición física (765 B para 255 apariciones o 3000 B para 1000). Se preserva el atlas de 2048 bytes y NO se guarda un atlas de variaciones de imagen.
- Código ASM 6510 genera un `LDA abs,X` por tabla fuente y usa punteros indirectos para copiar cada bloque 8-byte. BASIC ROM se deshabilita vía $01=$36 para leer las tablas en RAM alta, manteniendo los registros VIC de TEST282.

## Resultados de la prueba máxima

| Configuración | IDs en índice | IDs animados | Apariciones realmente escritas | Tabla + destinos | PRG |
|---|---:|---:|---:|---:|---:|
| 16×16, tile 0 transparente/vacío, `animateEmptyCharacters=false` | 256 | 255 | 255 | 5120 B de datos (incluye alineación) | 39937 B |
| 16×16, los 256 tiles con datos, tile 0 repetido de fondo, `animateEmptyCharacters=true` | 256 | 256 | **1000** | 7168 B | 41985 B |

Ambos escenarios generan PRG y pasan comparación de punteros/fases para los ocho pasos del ciclo, sin errores de RAM. La segunda prueba es el verdadero caso de estrés extremo, **porque un tile animado puede aparecer cientos de veces en el mapa** fuera del rectángulo principal.

### Emulación de CPU

En el segundo escenario el emulador de instrucciones 6502 ejecutó dos actualizaciones completas:

- **207.159 ciclos de CPU por actualización** de las 1000 apariciones (secuencia ASM ejecutada e instrumentada).
- Todos los bytes de las 1000 celdas corresponden a sus fuentes de atlas para la fase esperada. **0 errores**.
- Registros VIC: $D011=$3B, $D016=$18, $D018=$78, banco CIA2 $DD00=2, $01=$36: PASS.
- Un cuadro C64 PAL físico dispone de **19.656 ciclos teóricos como máximo** antes de steals VIC, badlines y otros trabajos. Por tanto **207.159 > 19.656**: no puede mantenerse el objetivo de **8 píxeles multicolor nuevos CADA cuadro físico** para 1000 apariciones. Como mínimo necesita más de 10 cuadros de presupuesto teórico (y en la práctica más).
- Para 255 apariciones la generación y los ocho punteros de origen pasan; todavía **no existe medición de CPU en VICE**, por lo que no se afirma velocidad real.

Importante: `Pixels/Tick=8` ahora significa el DESPLAZAMIENTO correcto de ocho píxeles MC en cada paso generado. NO implica que la CPU concluya ese paso en un tick de VIC bajo carga máxima. Se preservó la semántica del C64: no se debe alterar el color bit-pair de 2 bits entre píxeles.

## Cómo probar en VICE

1. Abrí [TEST291 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test291-bitmap-mc-max256-direct/).
2. En SCREEN elegí Bitmap Multicolor Experimental.
3. Seleccioná un rectángulo de **16×16 (256 IDs)** de tiles dibujados, aplicalo al mapa y configurá `Group Animate → Scroll Right`, `Pixels/Tick=8`, `Ticks/Frame=1`.
4. Exportá mediante el menú normal Export PRG. TEST291 produce `RICO_TEST291_MC_8PIX_256TILES.prg` si hay exactamente un grupo horizontal a 8 píxeles y ningún otro animador. Las demás situaciones se exportan por la ruta TEST290.
5. Abrilo en VICE. El movimiento horizontal debe saltar exactamente dos columnas de bitmap/tiles por paso, manteniendo C1/C2/C3.
6. Inspeccioná `window.RICO_TEST291_LAST_EXPORT` en la consola del navegador para comprobar `visibleCells`. El valor puede ser mucho mayor que el número de tiles elegidos.
7. Para diagnóstico, compará el caso con tile 0 vacío y sin animación de vacíos, frente al caso con tile 0 animado y repetido.

## Observaciones y próximos motores

**La optimización de LUT por fila del TEST290 no resolvía el caso máximo porque el refresco de bitmap costaba más que la operación de shift.** TEST291 suprime una de las dos copias por tile y el costo de fabricar patrones para pasos alineados a tile, pero no puede eliminar el costo de actualizar la RAM bitmap física. La solución siguiente debe considerar la frecuencia de apariciones, un blitter especializado por destino, amortizar escrituras entre cuadros o el hardware scroll `$D016` cuando se pueda aplicar a toda la pantalla (no a un grupo aislado sin afectar el resto).

**Este TEST291 NO es PASS de velocidad**, no sustituye TEST289 estable y no oculta la saturación. El experimento establece una base matemática y ASM para 8 píxeles MC exactos en el peor caso.

Enlaces:
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test291-bitmap-mc-max256-direct/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test291-bitmap-mc-max256-direct.zip
- Código: `TEST/test291-bitmap-mc-max256-direct/js/RICO_BITMAP_MC_MAX256_DIRECT_TEST291.js`
