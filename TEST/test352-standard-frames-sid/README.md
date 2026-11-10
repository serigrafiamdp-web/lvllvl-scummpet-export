# TEST352 — Multiframe + SID sin dependencias de anclas TEST206/207

Estado: EXPERIMENTAL, ASM generado y auditado; pendiente de ensamblado real y VICE con el SID del usuario. 09/11/2026.

## Fallo recibido

Al elegir SID para exportar frames aparece `TEST327: TEST207: cambió una ancla de TEST206: lda #$01 / sta $d01a / lda #$fa / sta $d012`. Es un fallo de integración: TEST207 injerta audio mediante reemplazos de cadenas rígidas y no encuentra la secuencia en el ASM visual actual. No demuestra una incapacidad del C64, ni RLE.

El usuario confirmó antes PASS para REMISERIA EBCM sin SID en TEST349. TEST350 evitó bloqueos indebidos pero delegó SID al motor TEST207 antiguo, por lo que reapareció este error. La captura también muestra selección de texto estándar (256 caracteres); es necesario integrar ambos modos.

## Integraciones aisladas

- TEST351: modo EBCM 64 glifos, 2–10 frames 40×25 fijas, con PSID seleccionado. Reutiliza el motor visual TEST349 a través de TEST350 y añade INIT/PLAY sin ninguna búsqueda por el texto ASM de TEST206.
- TEST352: modo standard/textmode de 256 glifos, 2–255 frames 40×25 fijas (según RAM real), con el mismo SID. Incluye una fuente compartida de 2 KB en `$3800–$3FFF`, dos buffers fuente de 1 KB para pantalla y foreground, y parches directos de solo celdas cambiadas. Fondo y borde se actualizan por frame.
- El PSID se conserva en su dirección original (rango compatible con TEST207 `$1000–$2FFF`). Se carga un pequeño BASIC SYS2061 en `$0801` con stub bancario en `$080D`, el núcleo gráfico en `$8000`, y los mapas/charset/patches en zonas sin conflicto.
- El reproductor se inicia una sola vez, con PLAY temporizado en la IRQ de VBlank `$FC`, evitando reproducir audio en cada evento raster de EBCM. Protege ZP `$02–$06` y `$F0–$FF`, y desactiva IRQ CIA del SID cuando se utiliza temporización por software.
- Modos manuales de 50 y 100 Hz; AUTO respeta el bit de velocidad del PSID y la frecuencia CIA si pudo deducirse de su INIT, mediante promedio de ticks PAL (no instala IRQ CIA hardware en esta fase). No se altera el archivo SID.
- Comprueba el contenido del SID, los 512 o 2048 bytes de charset y 1000+1000 bytes de pantalla y Color RAM después de ensamblar, antes de descargar.
- El selector del nuevo TEST no impone límites a otros exportadores: no intercepta scroll en cualquiera de las ocho direcciones, BANK2, Group Animate, animación individual, mapas de otras dimensiones ni otro modo de pantalla. Esas configuraciones se delegan intactas al motor anterior; esto no garantiza que el motor anterior ya soporte todas las combinaciones.

## Validación efectuada

- Prueba con el JSON real REMISERIA 64 (1).json y un PSID sintético legal de INIT/PLAY mínimos, parseado con la función real TEST207.
- EBCM: 9 frames, blink físico 14/24, K fondo negro, charset 512 bytes, 4 cambios raster, SID aislado y runtime en `$8000–$822A`. Sin saltos relativos fuera del rango 6502 ni referencias a etiquetas inexistentes.
- Standard 256: 9 frames, charset 2048 bytes, mapa original, motor `$8000–$81FC`, fuente `$3800–$3FFF`, cambios directos; sin ramas fuera de rango ni etiquetas inexistentes.
- Se confirmó que TEST352 no intercepta proyectos estándar con Scroll Left/Right, diagonales, BANK2, tamaño 120 ni el modo EBCM (que gestiona TEST351).
- Se confirmó que este código NO llama `makeSource207` ni utiliza la secuencia `$D01A/$D012` que causó el error.
- **No se corrió el ensamblador real de la página ni VICE.** El audio de SID real puede usar condiciones especiales de IRQ o ZP: prueba obligatoria con la canción que elija el usuario.

## Prueba del usuario

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test352-standard-frames-sid/ .
2. Cargar el JSON real de la animación. Elegir Standard 256 o EBCM según su diseño original (no cambiar el modo para sortear el error).
3. Abrir Export PRG, seleccionar el SID y activar la casilla SID de TEST229, y exportar.
4. Se espera PRG con sufijo `_TEST352_SID.prg` para Standard o `_TEST351_SID.prg` para EBCM.
5. En VICE PAL verificar primero que aparecen las frames y la música, luego la sincronización, raster y estabilidad del color.
6. En caso de fallo compartir el PRG y, para analizar música real, el archivo SID exacto utilizado.

## Aislamiento de cambios

TEST349 PASS, TEST350 routing, TEST342 y `gh-pages/index.html` no fueron modificados. Solo TEST351 y TEST352 experimentales.
