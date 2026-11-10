# TEST347 – REMISERIA EBCM con raster disperso y frames fijas

**Estado: experimental, pendiente de VICE.** No modificar editor principal ni motores con PASS.

## Hallazgo específico

TEST346 consigue reproducir las frames, pero el usuario observa cambios de color incorrectos en la letra K durante la frame 9, y el blink de 1 carácter de frames 1–8 parece un cambio de color. También observa artefactos parecidos a basura raster.

El reproductor TEST346 NO utiliza compresión RLE. Genera bytes sin comprimir para 64 glifos 8×8 (512 bytes), 1000 códigos de pantalla iniciales, 1000 bytes de color, y parches directos LDA inmediato/STA absoluto por frame. Nada se descomprime en runtime.

Problema diagnosticado: TEST346 genera 25 IRQ por frame y reescribe los registros de fondo $D021–$D024 en todas las 25 filas, aun cuando solo 7 filas requieren un cambio de slots. Es innecesario y dificulta la sincronización del raster.

## Modificación aislada de TEST347

- Reutiliza exactamente el mismo recolector, glyphs, delta ASM, duraciones y representación EBCM de TEST346. No se modifica el JSON.
- IRQ mantiene A/X/Y intactos antes de cualquier operación.
- Raster IRQ solo se ejecuta en filas 8, 10, 15, 16, 18, 19, 23: raster $70,$80,$A8,$B0,$C0,$C8,$E8.
- Cada uno de esos 7 IRQ aplica la paleta completa de esa fila y agenda el próximo evento.
- VBlank en raster $FC: resetea la paleta de la primera fila, reinicia el índice de evento, descuenta timer, aplica solo las celdas que cambiaron y prepara el próximo evento raster.
- Se eliminan 18 IRQ redundantes por frame. El charset sigue fijo en $3800–$39FF y la pantalla visible en $0400.
- Programa aislado de los motores Map Scroll; NO RLE, NO render_to_dst, NO diagonal.

## Pruebas internas con REMISERIA 64 (1).json

- Sintaxis JavaScript: PASS.
- Generación ASM con el JSON auténtico: PASS.
- JSR/JMP y saltos relativos del ASM sintético: no faltan etiquetas, no hay ramas fuera del rango 6502.
- Secciones: $0801-$080C BASIC, $2000-$2191 kernel, $3800-$39FF fuente, $4000-$4B02 delta ASM, $6000-$67FF screen+color fuente, $7000-$7023 scheduler raster. No se solapan.
- Las transiciones a las frames 2 a 8 contienen 1 celda de pantalla y 0 cambios de Color RAM. A frame 9 contiene 152 celdas de pantalla y 126 colores; retorno a frame 1 contiene 151 cambios de pantalla y 126 de color.
- **No pasó el ensamblador real ni VICE**. El usuario debe probar y enviar video/captura y PRG si queda anomalía.

URL: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test347-ecm-sparse-raster/

La interfaz muestra etiqueta `TEST347 · EBCM · RASTER 7 · V347-A1` abajo a la derecha.