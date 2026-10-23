## Análisis de movimiento subpixel de nueva captura PAL 50 FPS

**Nueva captura:** `2026-10-23 11-10-04.mkv`; ffprobe width1920/height1080, H.264, frame rate exacto **50/1**, 808 fotogramas nominales (16.16 s). VICE x64sc configurado PAL 50fps y Speed 100% según usuario. El usuario detecta 'saltos bastante regulares' al avanzar frame por frame.

Se han decodificado y medido **los primeros 520 fotogramas** (~10,4 s). Para evitar atribuciones arbitrarias por sola diferencia de color, se midió la traslación espacial de cada par de fotogramas sobre el área interior del juego (crop original x400:1510,y245:889 y escala 555×322). Mínimo de diferencias absolutas con posiciones candidatas (0,0), (-16,-17), (-31,-33), (-47,-50) en imagen reducida. Comprobación con correlación de fase en primeros 24 cuadros corroboró desplazamientos de -15.6/-16.8 para un paso y -31.1/-33.1 para dos.

**Resultados en 519 transiciones:**

- **407 pasos simples** (un incremento por cuadro grabado).
- **61 imágenes repetidas** (desplazamiento 0).
- **51 saltos dobles** (dos pasos en un único intervalo entre cuadros grabados).
- **0 saltos triples**. El clasificador de desplazamiento no tuvo empates/ambigüedad: diferencia del mejor y segundo score siempre >=3 unidades.
- Total ~509 pasos en 519 transiciones de 50fps, equivalente a **49.04 pasos/segundo** con ese criterio; el número no implica la tasa de commits exacta del C64 porque estamos midiendo el video.
- Saltos dobles al inicio de la captura en frames **6,15,22,30,38,46,54,62**; separación **de 8 fotogramas en 26 ocasiones** entre los dobles registrados en los primeros 520 cuadros. Este ritmo repetitivo es compatible con desfase/replicación/omisión de cuadros en el renderizado/captura.
- Repetidos al principio: frames **1,4,8,16,25,36,39,45,53**, etc. La secuencia de imágenes no representa un paso por cada intervalo aunque PAL y OBS estén ambos a 50fps nominales.

**Hallazgo de ASM:** En el generador `TEST196`, `plan_step` con `pixels=8` y dirección Up Left decrementa `fine_x/fine_y` y **incrementa `pending_x/pending_y` exactamente una celda** (con wrap); la fase final TEST250/251 copia `pending_x/y` a `camera_x/y` solo una vez por tercer IRQ y programa el siguiente paso. No existe instrucción que sume dos celdas por un solo commit. Por eso un salto de dos posiciones en un cuadro **no equivale necesariamente a doble paso del motor**; es más probable que OBS esté mostrando el siguiente frame disponible tras omitir uno intermedio, aunque sería necesario una captura interna del emulador para probarlo definitivamente.

**Limitación importante:** solo los primeros ~10.4 segundos procesados, no afirmar que las últimas 5.8 s carezcan de anomalías. Los contadores TEST256 agregan código en interrupciones y habían reportado final superior raster133 para segunda programada132 y final media225 para tercera programada218; una costura subtile sigue siendo un problema **distinto** a las duplicaciones/saltos de fotograma.

**Próxima prueba de aislamiento sin tocar MASTER:** usar la grabación interna de VICE, si la versión/configuración la ofrece (`Snapshot` → `Record Media` / `Record Video`), mientras se desactiva OBS para comparar la salida por PAL frame. El manual de VICE incluye las acciones media-record-video y media-stop. Alternativamente activar sincronización de presentación y comprobar si el monitor de Windows corre a 50Hz. No asumir que seleccionar 50fps nominal en OBS sincroniza sus dos relojes.

**MASTER del 23/10 permanece sin cambios.**

---
## Archivo de vídeo recibido tras prueba TEST256 — procedencia por confirmar

El usuario adjuntó un MKV llamado **2026-10-22 20-29-03.mkv** después de informar VICE al 100% y 50fps, pero el nombre/timestamp corresponde a **22 OCT 20:29**, anterior a TEST254 y TEST256. No hay indicación comprobable dentro del video de que el PRG sea TEST256.

Datos verificados con ffprobe/OpenCV: **1920×1080, H.264, 60 fotogramas/s de grabación, duración 11,35 segundos, 681 fotogramas decodificados.** El juego muestra aproximadamente **293 cambios visuales** con umbrales de diferencia media 4..12 (≈25,8 cambios/s), lejos de TEST254 (~47,16/s) y TEST255 (~47,13/s) medidos en capturas anteriores.

**IMPORTANTE:** No deducir que TEST256 perdió rendimiento ni que sus fases raster estén incorrectas basándose solo en este archivo: probablemente es una captura anterior adjuntada por error, o un fragmento de una prueba distinta. Los registros VICE auténticos de TEST256 ($A050=56, etc.) sí confirman que el módulo diagnóstico arrancó y que sus franjas superior/media acababan un poco tarde; la captura aportada no ha sido asociada a ese PRG.

Acción siguiente: verificar que se ejecuta en VICE el PRG exportado desde TEST256 y adjuntar una nueva captura con fecha posterior a su generación (preferiblemente incluir brevemente indicador Speed 100%, PAL). Si VICE dice 50 FPS, eso no significa que el MKV tenga 50 FPS: este MKV registra a 60 FPS. Distinguir ambas tasas.

**MASTER 23 OCT conservado**, no modificar a partir de una medición de procedencia no confirmada.

---
## VICE real: primeras lecturas TEST256 — 23 octubre 2026

Usuario confirmó VICE x64sc **Speed 100 % / 50 FPS** y prepara grabación. Lecturas de TEST256:

```
(C:$ea09) m a050 a061
>C:a050  56 01 56 85  88 e1 e3 32  64 61 61 85  e1 32 61 61
>C:a060  00 01
(C:$a062) m a020 a028
>C:a020  02 26 60 02  00 34 00 50  01
```

**Interpretación exacta (raster decimal):**

- Firma A050/51 = 56 01, instrumentación TEST256 activa.
- Fase superior: inicio A052=0x56=86; final A053=0x85=133 (vs siguiente raster programado 132).
- Fase media: inicio A054=0x88=136; final A055=0xE1=225 (vs próximo raster programado 218).
- Fase inferior: inicio A056=0xE3=227; final A057=0x32=50 del cuadro PAL siguiente, antes de la próxima primera IRQ a línea 86.
- Primeras fases A058=0x64=100, fases medias A059=0x61=97, terceras A05A=0x61=97. Primera IRQ sin solicitud registrada A061=0x01=1 y busy A023=0x02=2; diferencia de 3 primeras fases coincide con esos casos iniciales. Consistencia: 100+97+97 = 294, módulo 256 = 38 = A021 0x26.
- Retrasos A05E=0x61=97 superior y A05F=0x61=97 medio, **todos los 97 movimientos completos terminan la primera fase después de 132 y la segunda después de 218**. A060=0, fase final no alcanza raster 86 siguiente.
- A022=0x60=96 commits módulo 256, una fase de actualización en curso (A020=0x02), lo que explica los 97 ingresos de fase inferior y 96 commits.

**Conclusión:** las IRQ de las fases 2 y 3 llegan cuando todavía está ocupada la CPU con la fase previa; por eso se despachan efectivamente en raster 136 y 227, respectivamente, en vez de 132 y 218. Esto no prueba tearing, pues las escrituras están ordenadas para seguir al haz. La fase final aún deja 36 líneas PAL nominales hasta la siguiente IRQ. **No alterar todavía franjas ni la rutina gráfica sin revisar captura 100 % / 50 FPS**. El cronómetro TEST256 agrega overhead a los IRQ, de modo que el artefacto observado podría ser específico de la versión instrumentada; para calibrar, contrastar TEST254 de referencia sin instrumentar.

**Siguiente prueba fundamentada** si el video de 50 FPS muestra realmente una costura: adelantar selectivamente la entrada de la fase media y/o repartir el trabajo respetando el haz, o usar una pequeña marca VIC/contadores que no añadan muchos ciclos; evaluar minuciosamente en VICE. Si video queda limpio, priorizar TEST254 intacto y atribuir el judder observado previamente a frame pacing/captura.

---
# TEST256 — Diagnóstico de sincronización raster y cadencia de captura

**Estado: EXPERIMENTAL.** Parte del MASTER VIERNES 23 OCTUBRE 2026 (TEST254), sin cambiar el motor gráfico. TEST255 no se incorpora. El objetivo es calidad visual, no forzar 50 FPS.

## Hallazgo al analizar ambos videos

- TEST254: 584 cambios en 743 fotogramas de video a 60 FPS (~47,16 cambios/s); 427 separaciones de un fotograma, 155 de dos, una de tres.
- TEST255: 1066 cambios en 1357 fotogramas de video a 60 FPS (~47,13 cambios/s); 775 separaciones de un fotograma, 290 de dos y ninguna de tres entre cambios detectados.
- Una segunda medición por correlación espacial detectó ~36 saltos aparentes de dos desplazamientos en TEST254 y ~66 en TEST255. No demuestra un defecto del motor: puede deberse a fotogramas intermedios no capturados.
- Un único salto aparente de tres desplazamientos de TEST255 ocurrió en el ULTIMO fotograma decodificado, frame 1356 a los 22,6 s, justo en el corte del MKV.
- En TEST255, interrupciones=0xB6 (182 módulo 256), commits=0x3C (60 módulo 256); 182 = 3*60+2, compatible con tres IRQ por desplazamiento.
- Una máquina PAL actualiza cerca de 50 Hz, mientras las capturas fueron a 60 FPS. Esta diferencia puede introducir judder. Aún falta medir Speed% real en VICE y comprobar que ninguna franja raster se atrase.

## Cambios exactos

Se añade en tiempo de exportación una instrumentación 6502 de raster sin tocar ninguna copia de los 936 pares de caracteres/color, sus bordes, máscaras, scroll, cámara, fases programadas (86,132,218), ni el profiler CIA1 existente en TEST254.

**Solo para diagnóstico**: las pequeñas lecturas y escrituras de memoria dentro de las ISR añaden algún coste; no comparar directamente los FPS de TEST256 con los de TEST254.

## Monitor VICE

m a050 a061
m a020 a028

| Dirección | Información |
|---|---|
| A050 | Firma 56 (TEST256) |
| A051 | Versión 01 |
| A052 | Raster inicial de primera franja, nominal 86 |
| A053 | Raster final de primera franja |
| A054 | Raster inicial de segunda franja, nominal 132 |
| A055 | Raster final de segunda franja |
| A056 | Raster inicial de tercera franja, nominal 218 |
| A057 | Raster final de tercera franja, normalmente ~49 del cuadro siguiente |
| A058 | Veces que entró primera franja (módulo 256) |
| A059 | Veces que entró segunda franja (módulo 256) |
| A05A | Veces que entró tercera franja (módulo 256) |
| A05B | Máximo raster al finalizar primera franja |
| A05C | Máximo raster al finalizar segunda franja |
| A05D | Máximo raster al finalizar tercera franja |
| A05E | Número de ocasiones en que primera franja terminó en o después de raster 132 |
| A05F | Número de ocasiones en que segunda franja terminó en o después de raster 218 |
| A060 | Número de ocasiones en que tercera franja terminó en o después de raster 86 del cuadro siguiente |
| A061 | Primera IRQ sin movimiento solicitado (normal durante la inicialización) |

Los máximos y contadores de A05B a A061 permiten identificar una excepción aunque la lectura se realice varios segundos más tarde. Los contadores son módulo 256. El raster A057/A05D es solo byte bajo; presupone la ejecución normal de la tercera fase que cruza el raster 255.

## Prueba

- WEB aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test256/
- ZIP del branch: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test256-raster-seam-diagnostics.zip
- TERRY multicolor, Diagonal Up Left, Bank1, 8px / 1tick, sin SID. VICE x64sc PAL, Warp OFF.
- Ejecutar unos 3-5 segundos, parar en monitor y leer las dos órdenes. Confirmar firma 56 01. Repetir desde RESET si se necesita contar eventos exactos sin desborde.
- Si contadores late son cero, hay evidencia de fases correctas y conviene comparar captura nativa 50 FPS o monitor 50 Hz con VICE Speed 100%. Si alguno crece, investigar una costura/IRQ tardía del motor.
- Ningún resultado de TEST256 debe reemplazar el MASTER automáticamente.

## Verificaciones sintéticas

- 32 combinaciones del generador: 4 activan TEST256; 28 pasan intactas a TEST254.
- Código ASM de motor ocupa $2000–$2F02; los contadores nuevos A050–A061 no solapan el CIA A030–A049.
- Cero saltos 6502 fuera de rango y cero solapamientos de memoria verificados estáticamente.
- Aún no se ha ejecutado en VICE: no declarar PASS.
