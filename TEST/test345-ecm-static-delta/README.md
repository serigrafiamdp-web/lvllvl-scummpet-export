# TEST345 — REMISERIA: EBCM 64 glifos + 9 frames fijas, delta por carácter

**Estado: experimental, sin PASS en VICE.** Fecha 09/11/2026.

## Qué se corrigió

TEST344 (FAIL) reutilizaba el exportador de scroll diagonal, modificaba el acumulador antes de guardarlo en su raster IRQ y cambiaba las cuatro paletas por cada fila y frame. REMISERIA NO USA Map Scroll: este TEST345 tiene un runtime C64/6510 propio y NO llama los motores de scroll TEST342/344.

## Archivo real comprobado

- JSON: REMISERIA 64 (1).json, pantalla 40×25 en modo c64ecm, 9 frames, todas BANK1, 64 glifos físicos (0–63).
- Frames 1–8 duran 16 ticks; frame 9 dura 256 ticks.
- Entre cada una de las primeras 8 frames hay una sola celda diferente (X8,Y15: los códigos 14 y 88).
- En la transición a la última frame hay 152 celdas modificadas, incluyendo Color RAM.
- En la **unión de las nueve frames**, ninguna fila de 8 píxeles necesita más de cuatro colores de fondo. Por tanto se asigna UNA paleta EBCM POR FILA COMPARTIDA entre todas las frames; no se renumeran caracteres de otros lugares al parpadear.

## Arquitectura

- Kernel 6510 propio: BASIC SYS8192 ($2000), IRQ de raster que conserva A/X/Y antes de cualquier instrucción que use esos registros; máscara CIA y IRQ VIC configurados.
- Modo VIC-II EBCM $D011=$5B, 40 columnas $D016=$08, screen RAM $0400, charset físico de **512 bytes $3800–$39FF** y VIC puntero $D018=$1E. VIC bank0.
- Se inicializan 1000 bytes de pantalla, 1000 de Color RAM y 64 glifos 8×8. No existe cámara, redibujado de mapa ni planificador de pixels.
- 25 paletas por fila, con un único esquema de cuatro slots compartido entre todas las frames, se aplican con interrupciones raster cada 8 scanlines. Las sustituciones de slots ocurren solo cuando su color anterior NO aparece en la fila visible previa, evitando cambios cromáticos a mitad de dibujos.
- El VBlank en raster $FC descuenta 16 bits de duración y ejecuta **STA absolutos generados exclusivamente para los bytes cambiados**. No reescribe las otras 999 celdas ni vuelve a copiar el charset.
- Kernel $2000–$219D, fuente $3800–$39FF, parches de frames $4000–$4B02, pantalla fuente inicial $6000–$63FF, foreground inicial $6400–$67FF, tablas raster $7000–$7383; no hay solapamientos.
- Se verifica el charset físico y los primeros 1000 bytes de pantalla y color después del ensamblado del editor antes de permitir descargar PRG.
- No se cambia el JSON ni el estado del editor. Si SID, Group Animate, animaciones individuales, BANK2 o Map Scroll están activos, muestra un error explícito sin eliminar efectos.

## Resultados de prueba sintética con el JSON exacto

| Frame de destino | Bytes/celdas de pantalla cambiados | Color RAM cambiado | Duración |
|---|---:|---:|---:|
| 1 (retorno desde 9) | 151 | 126 | 16 |
| 2 | 1 | 0 | 16 |
| 3 | 1 | 0 | 16 |
| 4 | 1 | 0 | 16 |
| 5 | 1 | 0 | 16 |
| 6 | 1 | 0 | 16 |
| 7 | 1 | 0 | 16 |
| 8 | 1 | 0 | 16 |
| 9 | 152 | 126 | 256 |

- Siete cambios de paleta por ciclo de raster, compartidos por todas las frames: filas 8, 10, 15, 16, 18, 19, 23. Ningún slot retirado se usaba en la fila anterior.
- Mayor transición: ~1868 ciclos de instrucciones 6510 estimados, dentro de los ~6800 ciclos disponibles entre VBlank y primer raster de la siguiente pantalla.
- Sintaxis JS PASS; recopilación de 9 frames y generación ASM PASS; verificación estática de 14 saltos relativos 6502 (ninguno fuera de ±127), todas las etiquetas declaradas y no solapamiento de secciones.
- **NO se ejecutó el ensamblador real del navegador ni VICE.** No marcar como PASS todavía.

## Probar

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test345-ecm-static-delta/ .
2. Importar REMISERIA 64 (1).json sin modificarlo y exportar PRG.
3. Confirmar que descargue un PRG terminado en _TEST345.prg; si hay error de ensamblado enviar su texto.
4. En VICE PAL comprobar imagen intacta, pequeño parpadeo de una celda de las primeras ocho frames, novena imagen con sus cambios y 256 ticks, y retorno a frame 1 sin corrupción.
5. Para depurar el plan: en la consola del navegador inspeccionar window.RICO_TEST345_LAST_REPORT y window.RICO_TEST345_LAST_ERROR.

NO se modifica gh-pages/index.html, TEST339 PASS, TEST342 PASS ni TEST344 FAIL.