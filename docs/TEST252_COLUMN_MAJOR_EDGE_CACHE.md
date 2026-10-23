# TEST252 — Caché transpuesto de columnas (6502, CHAR + Color RAM)

**Estado: experimental, sin VICE real.** Base exacta: TEST251 / TEST250 / TEST249. Referencia estable TEST244. No modificar MASTER ni raíz gh-pages.

## Diagnóstico motivador

En TEST251 el usuario leyó:
```
(C:$2090) m a020 a028
>C:a020  00 a5 29 29  00 31 00 50  01
```
- Último commit en raster **49**; primer raster siguiente a 86, sólo 37 líneas = 2.331 ciclos nominales (menos badlines).
- Tasa visual observada hasta TEST249/250 ≈25 avances/s; no afirmar que TEST251 aceleró sin MKV.
- `prep_edges249` reconstruía direcciones por cada una de las **25 filas** entrantes, tanto para caracteres como para colores. Calcula 50 punteros basados en tabla de filas y cámara, sumando instrucciones, sumas, acarreo, wrap, y bucle.
- El resto de raster y copia en pantalla están ya optimizados y no se tocan aquí.

## Cambio puntual

Crear al exportar un formato auxiliar de mapa **column-major**, duplicado verticalmente (para solucionar de forma natural el wrap de cámara):

- Cada columna `x` contiene `2×H` bytes de caracteres en secuencia vertical `y=0..2H-1`, rellenados a partir del mapa original `d.map[(y%H)*rowStride+x]`.
- Otro bloque paralelo de `2×H` bytes contiene los mismos colores, normalizados a valores 0..15.
- El caché se construye **una vez en JavaScript durante exportación**: cero trabajo de transposición al arrancar el C64.
- Para cada posición horizontal de cámara se generan cuatro LUTs de direcciones de 8 bits (`char_lo, char_hi, color_lo, color_hi`), ya corregidas a `pending_x+edgeX` con wrap.
- La rutina en 6502 **`prep_edges249` se sustituye in situ**, de modo que sólo consulta las LUTs y suma `pending_y` UNA vez por columna; después copia 25 caracteres y 25 colores consecutivos usando `LDA (src),Y / STA buffer,Y`.
- La fila entrante de 40 posiciones queda EXACTAMENTE igual a TEST251; tampoco cambian las 936 copias de pantalla/caracteres, la copia de Color RAM, los tres raster IRQ (86,132,218), ni el planificador de movimiento.
- Sólo se selecciona cuando TEST251 está activo y se cumple el límite de cache `4×W×H <= 8192`; de lo contrario fallback byte por byte a TEST251.

### TERRY 45×32

- Caché CHAR: $8000–$8B3F (2.880 bytes).
- Caché Color: $8B40–$967F (2.880 bytes).
- Total 5.760 bytes, dentro del hueco $8000–$9FFF; código del motor queda hasta $2AF3, antes del charset $3000.
- Archivo PRG termina $C340, como en TEST251; no atraviesa el área I/O $D000–$DFFF.
- Se admiten todos los índices char y los 16 colores. Bank1/Bank2 sin modificaciones.
- Estimación de ahorro **1.400–1.700 ciclos por preparación de bordes**. Es una estimación de análisis ASM, NO una mejora de FPS medida en VICE.

## Validación automática

1. 64 configuraciones de ejemplo, 8 casos optimizados y 56 fallbacks exactos a TEST251.
2. Simulación de acceso column-major para 40×25, 45×32, 57×35, 64×31, ambos sentidos horizontales y diseños de colores variables: **641.900 lecturas de columna** correctas.
3. Verificación independiente de duplicación horizontal de filas: **1.027.040 comprobaciones** correctas.
4. Fuente de ASM con cero colisiones en segmentos, cero ramas relativas fuera de rango, tabla de columnas debajo de $3000.
5. No se ejecutó ensamblador real ni VICE en estas verificaciones: el status es **candidato a probar**, no PASS gráfico ni de velocidad.

## Prueba en VICE

1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test252/
2. Usar el archivo TERRY original multicolor, Diagonal Up Left, Bank1, **8 píxeles / 1 tick**, sin SID nativo.
3. Exportar PRG y comprobar consola `window.RICO_TEST252_LAST_BUILD` ⇒ `selected:true`, `cachedBytes:5760`.
4. Ejecutar en x64sc PAL a velocidad real (sin Warp), grabar MKV de ~10s y observar colores, arte, saltos y velocidad.
5. Después del arranque: monitor VICE `m a020 a028`, especialmente últimos raster bytes A025–A026 y IRQ ocupadas A023; comparar con TEST251.
6. Si pantalla corrupta, arte/blink incorrectos, freeze o no hay mejora, NO modificar MASTER; volver a TEST244/251.

ZIP de rama: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test252-column-major-edge-cache.zip

## Técnica 6502

Antes (25 veces): obtener world_rows y color_rows, sumar pending_x con CLC/ADC y acarreo, dos lecturas indirectas de mapa, dos almacenamientos con índice, incrementar y wrap de la fila.

Ahora (1 vez): X = pending_x, 4 LUTs, sumas de pending_y (dos punteros); luego 25× dos LDA indirectas indexadas y dos STA absolutas indexadas.

Con ello trasladamos costo temporal del CPU 6510 a memoria y preparación del archivo PRG. El camino del scroll multicolor arbitrary sigue completo.
