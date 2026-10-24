# TEST269 — Oil's Well Level Warp (Experimental)

**Fecha:** 24/10/2026 · **Base:** TEST268 C64 Compact Controls sobre TEST267 2× y TEST264 Multicolor PASS. **No se modificó MASTER 24/10 ni ningún TEST anterior.** Esta prueba tiene solo un módulo de JavaScript adicional.

## Objetivo

Agregar debajo del emulador una opción **Oil's Well · Nivel [1..8] [Warp]**, para poder llegar a otros niveles sin completar la partida y, en futuros TEST, capturar la pantalla como frame LVLVL.

## Investigación del PRG concreto

Se inspeccionó **el archivo del usuario** `ricos oil.prg` COPY SOFT, 38.405 bytes. El cargador copia el juego a `$8000–$D0FF`.

- `$22`: número de nivel interno (0 a 7).
- `$23`: índice de nivel por 4 (`nivel*4`).
- `$8B5E-$8B74`: rutina de avance; `INC $22`, dos `ASL`, `STA $23`, `JSR $946D` y regreso al flujo del juego.
- `$946D`: prepara introducción al nivel y deja `$33 = 3`, `$3C = 7`.
- `$86BD`: durante el estado de preparación, `JSR $8E81`.
- `$8E81`: carga mapa desde `$A000 + 0x400*stage` hacia `$6000`, inicializa Color RAM `$D800+` mediante las tablas `$965D` / `$967D` y otras variables.
- Cada mapa ocupa 1024 bytes, 8 niveles consecutivos en `$A000-$BFFF`. La paleta depende del índice por 4.

**Estrategia TEST269:** en el emulador **activo**, si la firma de 11 bytes del código coincide, pausar, escribir las variables `$22 = nivel-1`, `$23 = (nivel-1)*4`, `$33 = 3`, `$3C = 1`, y reanudar. Se solicita así al controlador del juego que entre en su fase de carga. **No se cambia PC, no se salta manualmente a una subrutina con stack desconocido, no se modifica código 6502, no se reemplaza PRG en disco**. Esta solicitud podría no bastar para ejecutar correctamente la transición completa y requiere comprobación visual.

La firma verificada del ejecutable se comprueba en `$8004-$8008`, `$8B63-$8B66` y `$8E81-$8E82`. Si el PRG no está ejecutándose, se rechaza el comando.

## Cómo probar

1. Abrir [TEST269 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test269-oils-level-warp/).
2. Menú **Import → C64 Formats**.
3. **Choose...**, cargar `ricos oil.prg` y dejar que se inicie.
4. Empezar a jugar hasta ver el primer nivel estable, sin quedarse en BASIC ni en la pantalla inicial del loader.
5. Al pie, seleccionar **Nivel 2** y pulsar **Warp**.
6. Observar si el motor regenera el mapa y los colores, si los sprites funcionan y si el juego sigue respondiendo; repetir con **Nivel 8** solo si el primer salto va bien.
7. Registrar captura de la pantalla y decir **PASS** o **FAIL**; en caso de fallo, indicar si cambió el mapa, los colores, si volvió al menú o si quedó congelado.

**Nota:** el mensaje `Warp nivel N solicitado` significa únicamente que se escribieron las cuatro variables en memoria, **NO confirma un salto real ni un PASS de VICE**. Los otros juegos quedan protegidos por la firma. Si la emulación se bloquea, usar **Reset** y recargar el PRG; no es persistente.

## Protección de regresión

- 89 scripts de TEST264 + 1 TEST267 (pantalla grande) + 1 TEST268 (joystick compacto) + 1 TEST269 (Warp): 92 scripts.
- `c64/c64/c64.js`, `c64/c64/c64.wasm`, `js/c64/c64.js`, `js/main.js` y `js/html/htmlcache.js` permanecen sin cambios.
- El código nuevo ocupa `TEST/test269-oils-level-warp/js/RICO_OILS_LEVEL_WARP_TEST269.js` y la nueva página `TEST/test269-oils-level-warp/index.html`.

## Verificación interna efectuada

Simulación de DOM + emulador en memoria:
- Selector crea las opciones 1–8.
- Warp a nivel 8 desde 1 escribe `$22=7`, `$23=28`, `$33=3`, `$3C=1`.
- El emulador se pausa y reanuda.
- Un juego sin la firma correcta recibe **cero escrituras**.
- **PASS de simulación**; prueba de ejecución real pendiente del usuario.

## Enlaces

- **WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test269-oils-level-warp/
- **ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test269-oils-level-warp.zip
- **Release:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test269-oils-level-warp
