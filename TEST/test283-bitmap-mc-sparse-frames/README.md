# TEST283 — Motor Bitmap Multicolor: frames + animación de tiles por cambios de celda

**Fecha:** 24 de octubre de 2026.
**Base:** TEST282 PASS en VICE según usuario. TEST281 PASS. **MASTER, TEST282 y demás motores intactos.**
**Estado actual:** exportador publicado, validaciones sintácticas y de CPU simulada PASS; **pendiente PASS visual en VICE**.

## OBJETIVO
Primer paso para adaptar a Bitmap Multicolor el motor de animaciones de LVLLVL, manteniendo el formato editor por índice de **hasta 256 tiles** y tres colores por celda.

## Funciones implementadas
- Exportación PRG que arranca en BASIC `SYS2064` y configura hardware VIC **Bitmap Multicolor real**, usando TEST282 como base.
- Exporta **todas las frames de mapa** (hasta 255) con los `Frame Duration` del documento (`graphic.getFrameDuration`), de 1 a 1024 ticks.
- Exporta animaciones **Tile Editor → Animated Type: Frames**, con sus `Frame Count` y `Ticks Per Frame`; combinaciones de frames de mapa y tiles animados se repiten por un ciclo completo.
- Patrón de tile (8 bytes cada variante) almacenado una sola vez en un **atlas reutilizable**, y las celdas de pantalla referencian ese patrón: no guarda todo el bitmap repetido por frame.
- Por cada cambio, una **lista dispersa de registros de 6 bytes**: índice de celda (2 bytes), puntero al patrón (2 bytes), C1/C2 (1 byte), C3 (1 byte).
- Runtime ASM 6502 calcula la posición destino de cada celda en $6000 y copia **solo los ocho bytes de las celdas modificadas**, más su Screen RAM y Color RAM. Evita redibujar todo el bitmap.
- La comparación de estados considera también los colores locales, la fase del tile animado y el fondo global.
- Bucle 6502 con lectura de raster ($D012), recuento de ticks y repetición, sin activar IRQ ni música. Cada tick es un frame físico PAL/NTSC (no garantiza todavía una actualización de 1 tick ante stress).
- Mantiene el botón de la imagen fija de TEST282 como referencia y lo distingue claramente del nuevo botón **Exportar Bitmap MC ANIMADO .PRG**.

## En VICE: cómo probar
1. Abrir [TEST283 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test283-bitmap-mc-sparse-frames/).
2. Activar `SCREEN → Multicolor Bitmap (Experimental)`.
3. Crear dos frames sencillas de mapa, cambiando el tile/color en solo algunas celdas. Ejemplo: frame 1 cuadro verde en (0,0); frame 2 cuadro rojo en (0,0). `Frame Duration` de 8 ticks en cada frame.
4. Pulsar **Exportar Bitmap MC ANIMADO .PRG**, abrir el PRG en VICE. Debe alternar entre ambas frames con los colores correctos.
5. Opcional: elegir un carácter usado en pantalla, configurarlo `Animated Type = Frames`, agregar dos frames de glifo y `Ticks Per Frame = 4`; reexportar y verificar las dos animaciones a la vez.

**Comparación:** el botón `TEST282: Exportar imagen FIJA .PRG` conserva el resultado estático como test control.

## Validaciones realizadas (sin VICE)
- `new Function(JS)`: sintaxis PASS.
- Ejecución de CPU 6502 simulada por opcodes reales, con mapa 40×25, dos frames de documento y un tile con dos fotogramas internos: emulación de 8 transiciones consecutivas; **sin opcode inválido**, se ejecutó el cargador de ~40.000 instrucciones y las transiciones periódicas.
- Simulación: registros $D011=$3B, $D016=$18, $D018=$78, $DD00=$02; cambios BG y bitmap.
- Prueba adicional con **256 IDs diferentes**, 2 frames y 32 celdas modificadas: atlas de 2048 bytes, 32 actualizaciones por paso, programa 14731 bytes, sin errores de assembler ni memoria: **PASS**.

## Limitaciones reales de TEST283
- **No** exporta Map Scroll, Group Animate, scroll individual desplazado (Right/Left/Up/Down), Ping Pong, Move In/Out ni SID todavía. Estas opciones se adaptarán en pasos posteriores.
- Solo admite animación propia de tile configurada como **Frames**. Los tipos Blink/Left/Right/Up/Down generan error explícito, para no exportar un PRG engañoso.
- Usa la pantalla física fija de 40×25 celdas. Mapas mayores se recortan temporalmente al sector superior izquierdo; no respeta aún Window Dimensions/viewport/scroll.
- El archivo fuente precalcula los **cambios** de todo el ciclo. Si hay muchas celdas distintas o muchos frames puede agotar la RAM disponible para los datos en $3800..$5BFF; la exportación informa el límite en vez de sobreescribir los datos del VIC.
- Máximo **255 pasos temporales** por ciclo y un período combinado de hasta 4096 ticks. Si se superan, aparece un error explícito.
- El visor aún no mide el presupuesto de ciclos por raster. Más de ~64 celdas modificadas por paso activa aviso de posible pérdida de velocidad; NO es un límite físico validado.
- El motor actual evita las actualizaciones de celdas sin cambios, pero **todavía no reproduce a nivel ASM los motores de scroll existentes**. Es una base nueva para adaptar sus técnicas, no una reutilización binaria del motor viejo.
- Hasta comprobar en VICE: **no marcar TEST283 PASS definitivo**.

## Memoria
| Componente | Dirección | Tamaño |
|---|---|---|
| Código 6502 | $0810 | variable, anterior a $1000 |
| Bitmap inicial (origen) | $1000 | 8000 B |
| Screen inicial (origen) | $2F40 | 1000 B |
| Color RAM inicial (origen) | $3328 | 1000 B |
| Atlas de tiles y variantes | $3800 | 8 B por patrón |
| Registros de cambios por paso | después del atlas | 5 + 6×n cambios |
| Límite de datos de animación | $5C00 | no se permite superarlo |
| Screen VIC / C1/C2 (destino) | $5C00 | 1000 B |
| Bitmap VIC (destino) | $6000 | 8000 B |
| Color RAM C3 (destino) | $D800 | 1000 B |

## Entregables
- [WEB TEST283](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test283-bitmap-mc-sparse-frames/)
- [ZIP completo TEST283](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test283-bitmap-mc-sparse-frames.zip)
- Código: `TEST/test283-bitmap-mc-sparse-frames/js/RICO_BITMAP_MC_SPARSE_FRAMES_TEST283.js`
