# TEST229 — SID hasta 8 KB sin reubicar el archivo musical

**Fecha:** 22 de octubre de 2026 · **Estado:** experimental, pendiente de PASS en VICE.  
**Base protegida:** `MASTER_LVLLVL_RICO_22_OCTUBRE_2026` (TEST228 PASS).

## Problema

El adaptador TEST228 reservaba solo `$1000–$1FFF` para archivos PSID con LOAD fijo. Un archivo con LOAD `$1000` y 4.875 bytes alcanza `$230A`, entrando en conflicto con el código visual en `$2000–$2FFF`. No se debe reubicar a ciegas un SID no relocatable.

## Qué modifica TEST229

- Reserva para PSID no relocatable `$1000–$2FFF` (**hasta 8.192 bytes con LOAD $1000**). `$3000` inicia los charsets, y continúa siendo límite estricto.
- Solo si el SID se superpone con el motor original `$2000–$2FFF`, calcula una franja libre de 4 KB para el motor (prioridad: `$C000`, `$9000`, `$8000`, `$6000`, `$5000`), verificando datos y otras secciones ASM antes y después de añadir INIT/PLAY.
- Traslada **el código de LVLLVL**, no el SID. Recalcula la instrucción BASIC `SYS` y su puntero de enlace de línea; mantiene `LOAD/INIT/PLAY` originales del PSID.
- Si no cabe con seguridad, **muestra error y no exporta** un PRG que podría corromper pantalla, colores o audio.
- Para SID que caben sin superposición (`$1000–$1FFF`), la salida ASM queda idéntica a TEST228.
- Reutiliza los mismos wrappers universales, reloj CIA / raster y las rutas de scroll originales. No cambia `index.html` más allá de nombre y caché del JS SID.

## Mapa de memoria

| Rango | Uso |
| --- | --- |
| `$0801+` | programa BASIC SYS recalculado (salto al nuevo motor) |
| `$1000–$2FFF` | PSID original si usa esa carga; máximo 8 KB para LOAD $1000 |
| `$3000/$3800` | charsets BANK1/BANK2, intactos |
| `$4000+` | mapa, intacto |
| `$7000+` | datos de colores, intactos |
| `$9000` o `$C000` en muestras verificadas | núcleo y helpers SID reubicados, con comprobación de solapamiento |
| `$D000–$DFFF` | E/S de C64: nunca utilizar como banco de código |

El destino real depende de todos los segmentos emitidos por el exportador; no siempre será `$C000`.

## Pruebas de generación efectuadas

**135 casos PASS de fuente ASM**, combinando 9 rutas (8 direcciones + multiframe), tamaños de 4.096 / 4.875 / 5.120 / 6.144 / 8.192 bytes y tres modos de reloj (PAL 50, PAL 100, CIA). Se verificaron encabezados BASIC, SYS, preservación de audio e inexistencia de colisiones de memoria entre secciones conocidas. Los casos de 4 KB se compararon **texto a texto** con el ensamblado TEST228 y fueron idénticos.

**No implica PASS de VICE.** Todavía no se confirmó que el PRG con SID de 4.875 o 6.144 bytes se ejecute y reproduzca correctamente en el emulador.

## Cómo probar

1. Abrir la web de la rama TEST229 y cargar el mismo SID que antes mostraba **4.875 bytes**.
2. Exportar Up, 8 píxeles/tick, 1 tick, y probar en VICE.
3. Repetir con Left y luego Down/Right y diagonales si funciona.
4. Observar la consola: `[RICO TEST229] SID ampliado sin reubicacion` indica rango SID, base real del código y nuevo SYS.
5. Comparar visualmente fluidez de scroll, colores y tempo musical con MASTER TEST228 cuando sea posible.
6. Si hay error/freeze, conservar PRG y SID exactos y estudiar LOAD, BIN y rutinas antes de promover.

El MASTER permanece sin modificar. Nunca atribuir PASS musical por pasar los tests de fuente.
