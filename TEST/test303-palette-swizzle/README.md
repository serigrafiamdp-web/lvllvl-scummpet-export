# TEST303 — Palette Swizzle / remapeo de tintas por carácter

**25 de octubre de 2026. Estado:** PASS interno de conversión sin pérdida y ejecución 6510 simulada; **pendiente PASS visual y velocidad en VICE con el arte real**.  
**Rollback:** `release/test297-pass-2026-10-24`. TEST302, TEST297 PASS y MASTER intactos.

## Problema que soluciona

TEST302 no permitía convertir el proyecto real a modo **Multicolor Character** cuando el índice de píxel %11 utilizaba C3 superior a 7. Pero eso es una limitación del **canal local** Color RAM, no de los 16 colores del VIC-II: $D022 y $D023 admiten todos los colores.

En vez de modificar los colores del arte, TEST303 intenta **reordenar los índices de dos bits dentro de cada glifo**. Ejemplo:

- Origen Bitmap MC: píxel %01 = C1 color 2; %10 = C2 color 7; %11 = C3 color 12.
- Si el arte permite compartir ese 12, se convierte el glifo para representarlo usando %01 o %10 global; uno de los índices de color bajo 0–7 ocupa el %11 local.
- La operación no cambia el C64 ink observado en pantalla y no toca el documento del editor.

**No es una cuantización ni una reducción de colores.**

## Qué hace el analizador antes de exportar

- Reutiliza TEST302 para calcular todas las fases del grupo Right/Left con 8 px Multicolor por paso y Ticks/Frame=1; admite el ancho del grupo hasta 31 caracteres (hasta 31 fases).
- Recorre los 256 glifos y los usos reales de sus 4 índices de píxel, en las **1000 celdas físicas** durante todas las fases.
- Prueba las **6 permutaciones** de C1/C2/C3 para cada glifo utilizado, dejando %00 como fondo.
- Busca parejas de colores globales posibles para $D022 y $D023 (0..15).
- Exige que cualquier valor en Color RAM para %11 esté entre **0 y 7** y sea **constante por celda física a lo largo de TODAS las fases**; de lo contrario, el remapeo de pantallas sin actualizaciones de Color RAM no sería equivalente.
- Selecciona permutaciones **por tile** con heurísticas deterministas; este paso **no resuelve todas las combinaciones posibles mediante búsqueda combinatoria completa**, pero toda solución aceptada se comprueba exhaustivamente.
- Crea un **atlas nuevo de 2048 bytes SOLO dentro del PRG exportado**, a partir de los originales, más un Color RAM estático de 1000 bytes calculado para la nueva codificación.
- Compara cada uno de los 4 píxeles MC por fila × 8 filas, en cada celda y en todas las fases, asegurando **cero diferencias de índices de color C64 visibles**.
- Genera el PRG character rápido solo si esa comparación da exactamente 0. En caso contrario, la opción habitual **Export PRG** sigue al motor TEST297 PASS, con un mensaje claro y un informe en `window.RICO_TEST303_LAST_EXPORT`.
- No agrega paneles de exportación ni modifica el modo del documento.

## Ensayos automáticos realizados

| Escenario | Resultado |
|---|---|
| Bitmap MC con C3=12 uniformemente, C1=2, C2=7 | **PASS** de conversión sin pérdida |
| Bitmap MC con C3=12 y 13 alternados incompatiblemente entre celdas | **Fallback seguro a TEST297** |
| C3=3 dentro del rango nativo | **PASS** |
| C1 variable 2/4, C2=7, C3=12 | **PASS** usando C1 local |
| **Dos familias de glifos con distintos usos de C1/C2 y C3=12** | **PASS usando DOS permutaciones distintas**, sin pérdida |
| Grupo ancho 30, 15 fases, 1000 celdas | PRG de **20.737 bytes**, ASM **326 bytes** |
| 6510 simulado: 19 flips seguidos, dos pantallas, vuelta del período | **0 diferencias en 1000 códigos y 1000 colores por estado** |
| Comparación de píxeles en 19 estados, 1000 celdas, 8 filas, 4 píxeles MC | **0 diferencias de color visible** |
| Raster de los 19 flips | Línea 251, fuera de la imagen visible PAL |
| Errores de opcode/contadores | Ninguno en los ensayos |

### Restricciones reales

- La ganancia de velocidad **todavía NO está comprobada en VICE**. No atribuir FPS reales a la simulación CPU: faltan las pérdidas de ciclos por badlines/DMA del VIC-II.
- Si C3 alto varía demasiado, si C1/C2 no admiten paletas globales, o si la tinta local de una celda cambia entre fases, la conversión no es posible bajo este motor. **Esto puede ocurrir en el arte del usuario.**
- No hay raster-splits por bandas todavía, ni paletas globales dinámicas durante una fila; TEST303 es un modo Multicolor Character con dos globales estáticos, no un motor híbrido de Bitmap + Character a la vez.
- Solo un grupo horizontal de matriz completa, 8 px Multicolor/tick, Ticks/Frame=1. No implementa SID ni animaciones simultáneas, ni scroll vertical o diagonal.
- Las soluciones de per-tile permutations se buscan con tres estrategias de selección; un FAIL significa **no se encontró una conversión** con el algoritmo implementado, no una prueba matemática de que no exista ninguna.
- La misma pantalla se actualiza cada fase leyendo la visible, transformando 1000 códigos con una tabla de 256 entradas y escribiendo la oculta; se conserva Color RAM física por celda durante el scroll.

## Prueba con el proyecto original del usuario

1. Abrir [TEST303 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test303-palette-swizzle/).
2. Importar **exactamente el mismo proyecto Bitmap Multicolor** de las pruebas anteriores: sin reducir 256 tiles, 1000 celdas ni recolorear.
3. Dejar Group Animate Right/Left, `Pixels/Tick=8`, `Ticks/Frame=1` y exportar mediante **Export PRG normal**.
4. **Si dice `TEST303 ACTIVADO`**: se generó `RICO_TEST303_MC_PALETTE_SWIZZLE_LOSSLESS.prg`. Probar en VICE la imagen completa, los colores y la velocidad comparados con TEST297 PASS.
5. **Si dice `TEST303 NO ACTIVADO`**: se generó el PRG anterior de TEST297, sin cambios de velocidad. Consultar `window.RICO_TEST303_LAST_EXPORT.paletteSearch` para los colores y motivos de compatibilidad.
6. Informar el resultado real antes de promover TEST303 al MASTER.

## Código

- [WEB TEST303](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test303-palette-swizzle/)
- [ZIP COMPLETO TEST303](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test303-palette-swizzle.zip)
- `TEST/test303-palette-swizzle/js/RICO_MC_PALETTE_SWIZZLE_TEST303.js`
