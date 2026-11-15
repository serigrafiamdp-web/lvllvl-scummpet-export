# TEST363 — Recuperación de Map Scroll diagonal + multiframe

**Estado:** fuente JS y ASM generados y comprobados. **VICE de la integración actual: pendiente de PASS.**

## Proveniencia y resultado anterior

TEST341: FAIL confirmado (09/11), porque el parche ASM borró accidentalmente las rutinas de Color RAM prepare_sparse_colors203 y commit_sparse_colors203.

TEST342: **PASS confirmado por el usuario (09/11)**. Resolvió el problema y ya permitía mapas, colores, velocidades, direcciones y BANK distintos por frame. [Registro original](../test342-diagonal-multiframe/PASS_2026-11-09.md).

TEST354: experimento especial CALACA, limitado a exactamente 4 frames, geometría fija, ventana de origen, scroll area reducida, mismo mapa y BANK. Si no coincide, retorna false. **Esas condiciones eran del test, NO de todo el C64.**

**TEST363 recupera el núcleo 6502 de TEST342** y usa el exportador diagonal TEST196 con su corrección de charset TEST362. Conserva los nombres ASM internos frame342 para minimizar el riesgo.

## Selección de rutas

- Entra para **2+ frames en texto estándar** con uno o más movimientos diagonales y el resto diagonales o quietos; configura de forma independiente cada dirección, Pixels/Step, Ticks/Step, duración, mapa, colores, cámara, fondo, borde y BANK.
- El proyecto **monoframe** continúa por el motor TEST362 PASS sin ninguna modificación.
- Las combinaciones con Scroll Area menor de 40×25 siguen en el motor especial TEST354 cuando corresponda.
- SID, Group Animate, animación individual, ECM, Bitmap, Multicolor Text y mezclas diagonales + cardinales se **delegan sin descartarse** a las rutas previas. No se declaran compatibles si falta el compositor; no se añaden vetos al resto del producto.
- El código no transforma ni modifica el documento JSON original.

## Auditoría: restricciones artificiales vs condiciones técnicas

| Caso | Naturaleza | Estado |
|---|---|---|
| Solo 4 frames | Restricción histórica TEST354 | Se recupera 2+ frames con motor TEST342 |
| Mismo mapa, misma dirección, mismos colores, mismos BANK/velocidades | Restricción histórica TEST354 | Se usan tablas y mapas independientes por frame |
| Window 40×25 | Contrato del renderer TEST196/342, **no global** | Requiere otras rutinas para ventanas de otros tamaños |
| Scroll Area y mapa indexados por un byte | Arquitectura de este kernel | Una versión 16 bits/segmentada puede ampliar el rango |
| Mapas + colores sumados dentro de bloques de 12 KB | Layout actual $4000–$6FFF y $7000–$9FFF | Colisión real para este layout, pero es posible compresión/reubicación |
| Grupo + individual escribiendo un mismo glyph | Conflicto de escritura sin compositor de fases | Necesita motor común, no está prohibido por hardware |
| Group + diagonal + multiframe / SID | Falta de integración del scheduler | Delegados a rutas anteriores, aún por resolver |
| BANK 1/2 | Selección VIC mediante $D018 | Ya se corrigió un fallo en TEST362; hay que revalidarlo en multiframe |
| Color RAM, IRQ y raster | Recurso real de ejecución | Perfilar y sincronizar en VICE por combinación |

## Pruebas sintéticas

JSON basado en el caso TEST362 50×35 (solo análisis en memoria; no se publica el JSON aportado por el usuario): 2, 3 y 4 frames con mapas/colores distintos, direcciones distintas y BANK alternos.

- 2 frames: 3500 bytes para mapas y 3500 para colores
- 3 frames: 5250 bytes de cada clase
- 4 frames: 7000 bytes de cada clase
- ASM generado en los 3 casos; rutinas de Color RAM conservadas; instrucción de selección del charset TEST362 conservada.
- Delegación monoframe, SID, Group, ECM y Scroll Area reducida probada con mocks.
- **El ensamblador de prueba era simulado; no afirma compilación real ni PASS de VICE.**

## Prueba VICE propuesta

En la URL única https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/ cargar dos o cuatro frames con Window 40×25 y Scroll Area por ejemplo 50×35. Exportar PRG y verificar movimiento, contenido de todos los mapas, velocidad, duración, BANK1/BANK2, colores y ausencia de PETSCII no deseado. Repetir luego el JSON monoframe TEST362 para regresión.

No marcar TEST363 PASS hasta confirmar el resultado en VICE.

**Recovery:** [rama estable TEST362](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test362-pass-audit-2026-11-14).
