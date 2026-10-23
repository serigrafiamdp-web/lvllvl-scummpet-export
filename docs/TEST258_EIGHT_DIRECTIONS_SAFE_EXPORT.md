# TEST258 — VIC-II estable para las ocho direcciones de Map Scroll

**Estado: preparado para validar en VICE.** BASE: TEST257 (PASS provisional de usuario), basado en el MASTER viernes 23/10/2026 TEST254. El MASTER y TEST257 permanecen inalterados.

## Pedido

Aplicar el principio del TEST257 (no reescribir $D011/$D016 si la fase fina no cambia) a todos los movimientos y permitir exportar otros sentidos sin utilizar por fuerza un motor rápido incompatible.

## Arquitectura y criterios

**La modificación no convierte por arte de magia los motores de otras direcciones en el raster-chaser TEST254.** El motor de tres IRQ de TEST254 copia caracteres **ascendentes** tras el haz; el mismo orden en movimiento Down podría corromper el mapa y romper colores. Por eso se conservan sus condiciones de seguridad: solo diagonal Up Left / Up Right a 8 px, cuando cumple requisitos de caches y 16 colores. Los demás sentidos usan los motores que **ya los soportaban** (las diagonales originales con doble pantalla; horizontales anchos y verticales 40 columnas) y reciben una optimización de escrituras finas independiente.

### Matriz de funcionamiento

| Movimiento | 8 px por tick — TEST258 | 1..7 px por tick |
|---|---|---|
| Diagonal Up Left | TEST257 sin cambios (si fast path), o commit genérico sin reescritura redundante | Exportador diagonal previo; se conservan escrituras fine cuando realmente cambian |
| Diagonal Up Right | Igual | Igual |
| Diagonal Down Left | Motor genérico doble pantalla, sin `jsr apply_fine` repetido al completar cámara | Motor diagonal previo, sin modificaciones |
| Diagonal Down Right | Igual | Igual |
| Left | Motor horizontal compatible, sin `jsr apply_horizontal` en commit | Horizontal anterior, scroll fino intacto |
| Right | Igual | Igual |
| Up | Motor vertical con `commit_fast8` sin `jsr apply_scroll_regs` redundante | Motor vertical, scroll fino intacto |
| Down | Igual | Igual |

Las 8 opciones de 8 px restablecen siempre fase fina 7 (sentido negativo) o 0 (sentido positivo). La inicialización VIC-II sigue configurando $D011/$D016 una vez correctamente. No se toca hardware en cada commit si no cambió la fase. Para pasos parciales, se mantienen llamadas al VIC-II porque **sí** cambian los 3 bits finos entre cuadros.

## Edit preciso en ASM

- **Diagonal**: salvo TEST257 ya aprobado, eliminar el `jsr apply_fine` entre `sta fine_y` y `lda #$00` dentro del bloque IRQ de commit. Esta ruta se activa para diagonales 8px si el bloque original es el esperado; si no se reconoce, se conserva sin cambios.
- **Horizontal** (Left/Right ancho, simple map scroll): eliminar únicamente `jsr apply_horizontal` tras `jsr swap_screens` en commit de pantalla completa a 8px. No tocar `apply_horizontal` de arranque ni los updates de velocidades 1..7px. Para mapas complejos group/multiframe, usar fuente original.
- **Vertical** (Up/Down, motor TEST168 + patches TEST226/232): eliminar solamente `jsr apply_scroll_regs` después de `commit_fast8_fine` al terminar un cambio completo de fila a 8px. Mantener el bloque de inicialización y el `commit_prepared` para velocidades fraccionarias.

## Restricciones y fallbacks

Se elimina la dependencia artificial de la ruta veloz en la elección del movimiento: **las diagonales Up/Down con velocidades 1..8 exportan por el motor compatible que existía**. Horizontales y verticales tienen sus respectivos pipelines. No se eliminan guardas reales de ancho de mapa, 8x8 charset, RAM, SID/group ni tiempos, porque hacerlo rompería gráficos o memoria. Tampoco se afirma haber hecho una sola rutina 3-IRQ para todas las direcciones: queda como desarrollo diferente.

## Validaciones

- **256 combinaciones diagonales**: 4 direcciones × 8 velocidades (1,2,3,4,5,6,7,8) × 2 bancos × colores mono/multi × anchuras 45/55. **8 casos** conservan TEST257 optimizado bit a bit; **24 casos 8px** reciben exactamente una eliminación de `JSR` del commit; **224 configuraciones** de 1..7px quedan byte a byte iguales a TEST257. 0 discrepancias.
- **32 configuraciones cardinales**: Up,Down,Left,Right × 8 velocidades (1..8). Los cuatro casos 8px generan un ASM con exactamente una llamada redundante menos, 28 casos parciales generan ASM idéntico. 0 discrepancias.
- **Total 288 casos de generación ASM**, verificando que cada modificación sea una sola eliminación del `JSR` correcto, y manteniendo las instrucciones de inicialización VIC.
- No se cambian moldería/glyph, charsets, índices reales de tiles, colores del mapa ni máscaras, colores C64 0..15, 936 pares en fast diagonal ni posiciones raster 86/132/218.
- Los nuevos cambios no incluyen la instrumentación adicional de TEST256. En diagonal TEST254+257 se conserva el profiler CIA TEST253 para diagnosticar cuando corresponda.
- El programa aún necesita **validación real en VICE** para cada familia de motor. Que genere ASM no equivale a que haya pasado ejecución en C64.

## Enlaces

- [TEST258 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test258/)
- [TEST258 ZIP completo](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test258-vic-stable-eight-directions.zip)
- [MASTER congelado del 23/10/2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026)
- [TEST257 PASS provisional (rollback)](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test257/)

## Protocolo visual

En VICE C64 PAL y mismo TERRY, primero validar **Diagonal Up Left y Up Right 8px/1tick** (deben ser idénticos a TEST257). Luego **Diagonal Down Left y Down Right 8px/1tick**, y después Left/Right/Up/Down 8px. Comparar los bordes, colores, paso uniforme y que no aparezca pantalla estática. Finalmente verificar en las ocho direcciones un ejemplo a 4px: **no debe variar** frente a TEST257, porque esos pasos requieren scroll fino real.

Si falla una familia, registrar dirección, mapa y velocidad y volver inmediatamente al motor específico anterior. No promover a MASTER hasta realizar estas pruebas.
