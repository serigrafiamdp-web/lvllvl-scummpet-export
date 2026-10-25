# TEST302 — Sin límite de 8 fases: remapeo MC Character progresivo

**Fecha:** 25/10/2026. **Estado:** PASS interno de exportación y ejecución 6510 simulada; **pendiente PASS visual en VICE del usuario**.  
**Último PASS del scroll Bitmap Multicolor real:** TEST297, respaldado en `release/test297-pass-2026-10-24`. MASTER, TEST301 y TEST297 intactos.

## Problema real detectado por el usuario
En TEST301 el cuadro de exportación decía:

```
TEST301 NO ACTIVADO. Se exporta TEST297 sin mejora de velocidad.
Filas compatibles: 0/25.
Motivo: Período fuera del límite de 2–8 fases que caben en $6000–$7FFF.
```

El valor **0/25 no era un resultado del análisis de colores**: el analizador abandonaba antes, al detectar más de ocho fases. Este límite lo impusimos por guardar imágenes precalculadas de 1000 bytes/fase en $6000–$7FFF, no es una restricción del VIC-II.

## TEST302: nueva arquitectura de 256 bytes, no N×1000

En vez de almacenar una pantalla por fase, el exportador construye una permutación única de los 256 IDs de caracteres para **un paso de 8 píxeles multicolor**. Durante la ejecución:

- Lee cada celda de la pantalla VIC actualmente visible.
- Si esa posición física pertenece a la selección animada, reemplaza el ID por `glyphRemap[ID]`; si no, lo conserva exactamente.
- Escribe el resultado en la otra pantalla VIC (doble buffer).
- Presenta la imagen completa mediante $D018 únicamente en el borde vertical seguro del PAL y repite.
- La misma tabla genera cualquier cantidad de fases del período del grupo. No necesita un atlas por fase ni versiones repetidas del charset.

Al repetir la misma permutación se obtiene el desplazamiento de la fase siguiente, preservando incluso los IDs que aparecen como resultado de la animación pero que no estaban seleccionados originalmente: la **máscara fija de 1000 posiciones físicas** impide que se animen zonas no seleccionadas.

El período de un grupo de ancho `W` con avance de 2 columnas es `W/gcd(W,2)`. El exportador TEST290 original limita grupos a **31 columnas**, por lo que TEST302 cubre las **31 fases** posibles.

## Mapa de memoria del PRG compatible

| Dirección | Uso |
|---|---|
| $0801–$0FFF | BASIC SYS 2064 + ASM streamer |
| $2C00–$2FE7 | 1000 IDs iniciales de pantalla |
| $3000–$33E7 | 1000 bytes: máscara de celdas animadas |
| $3400–$37E7 | 1000 bytes: Color RAM C3, bit de modo MC encendido |
| $4400–$47E7 | Screen VIC 1 |
| $4800–$4BE7 | Screen VIC 2 |
| $5000–$57FF | 256 glyphs originales × 8 bytes |
| $5800–$58FF | Tabla de remapeo de 256 bytes |

El PRG generado mide **20.737 bytes**, independientemente de la cantidad de fases (10, 15 o 31). El ASM cabe en ~325 bytes. No hay memoria de fases $6000–$7FFF, y no es necesario modificar los caracteres originales.

## Colores y compatibilidad: NO se pierden colores

Esta optimización exige que el dibujo completo pueda representarse exactamente en el modo **Multicolor Character** del VIC-II:

- BG en $D021.
- C1 y C2 deben ser globalmente compatibles con $D022 y $D023 para todos los píxeles donde se usan, durante todas las fases.
- C3 puede variar por celda pero, donde se use el índice de píxel %11, debe estar entre 0 y 7; Color RAM pone el bit de modo multicolor en 1.
- Se respetan las 25 filas, no se altera ninguna tinta y no se cambia SCREEN en el editor.
- Si hay incompatibilidad, **Export PRG vuelve directamente a TEST297** y muestra el motivo. Ya se retiró del HTML el script interceptor de TEST301 para que no aparezcan dos alertas contradictorias.

**Importante:** arreglar el límite de fases **no garantiza que el arte del usuario sea compatible en color**. Ahora el diagnóstico real mostrará cuántas filas cumple y cuál es la limitación, en vez del antiguo bloqueo por memoria.

## Pruebas internas

1. **Compilación:** 16, 18, 20, 24, 30 y 31 columnas; períodos 8, 9, 10, 12, 15 y 31 fases: PASS.
2. Máscara de selección: todas las posiciones elegibles y selección parcial de IDs: PASS, igualdad con todas las pantallas de fases teóricas y vuelta al inicio.
3. **CPU 6510 simulada**, variante `20 columnas Right`: 13 flips de pantalla consecutivos, 0 diferencias en 1000 bytes de Screen RAM y 1000 bytes de Color RAM por estado, incluyendo vuelta del período.
4. CPU simulada `30 columnas Right, selección parcial`: **18 flips**, mismas comprobaciones con 0 diferencias.
5. CPU simulada `31 columnas Left, selección parcial`: **34 flips**, 0 diferencias y vuelta completa del período.
6. Todos los flips fueron fuera de imagen visible (raster 251 o línea del margen superior en la simulación).
7. Los dos primeros diseños adversos detectados: C1 diferente entre celdas: 0/25 filas, ruta TEST297; C3=12 en una celda usada: 24/25, ruta TEST297.
8. **Alerta de motor**: exactamente una por Export PRG. No se ejecuta el interceptor de TEST301 heredado.
9. Durante la primera simulación se detectó y **corrigió un error de contador de páginas sobreescrito por TAX**; la versión final de GitHub no contiene esa falla.
10. La simulación sin ciclos robados por el VIC-II indica un máximo de ~25 flips/s en escenas compatibles. **NO es una velocidad comprobada en VICE.**

## Cómo probar

1. [TEST302 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test302-mc-char-stream-remap/).
2. Abrí **exactamente el mismo proyecto Bitmap MC** que produjo el error de TEST301. Conservá los 256 tiles, mapa y colores; mismo grupo Left/Right, `Pixels/Tick=8`, `Ticks/Frame=1`.
3. Usá **Export PRG normal**, sin botones adicionales.
4. Ahora recibirás uno de dos resultados:
   - **TEST302 ACTIVADO**: los colores son compatibles, se descarga `RICO_TEST302_MC_CHAR_STREAMING_LOSSLESS.prg`. Ejecutarlo en VICE y comprobar gráficos/velocidad.
   - **TEST302 NO ACTIVADO**: el análisis completo de colores encontró una incompatibilidad; se exporta TEST297 y se indica razón, con filas compatibles reales en lugar del límite anterior de fases.
5. En consola navegador podés inspeccionar `window.RICO_TEST302_LAST_EXPORT`, campos `phaseCount`, `rowsCompatible`, `reasons`, `candidateBands`, `actualExporter`, `prgBytes`.

No se ha incorporado la conversión parcial por raster-splits, IRQ superpuestas, SID, map scroll ni más de un grupo. Se mantienen como investigaciones separadas.

## Archivos

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test302-mc-char-stream-remap/
- ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test302-mc-char-stream-remap.zip
- JS: `TEST/test302-mc-char-stream-remap/js/RICO_MC_CHAR_STREAMING_TEST302.js`
