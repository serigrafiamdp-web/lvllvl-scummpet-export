LVLLVL / RICO — TEST137 — FRAME DURATION ROLLOVER / 18 OCTUBRE 2026
ESTADO: PRUEBA EN VICE PENDIENTE. MASTER TEST134 INTACTO.

OBSERVACION CONFIRMADA:
- TEST136 mejora la fluidez a 1 tick pero persisten desplazamientos laterales ocasionales: el movimiento deja de ser diagonal.
- Video del usuario: 2026-10-18 19-13-53.mkv (13.8 segundos, 1920x1080, 60 fps).

CAUSA DE CODIGO IDENTIFICADA:
- frame_tick / frame_tick_next para un solo frame repone frame_remaining (duration) y ejecuta RTS sin continuar frame_tick_scroll.
- En esa IRQ la rutina animate_chars_native SI se ejecuta: el caracter se mueve pero el Map Scroll pierde un pixel/tick.
- Esa diferencia de fases es especialmente visible con ambos a 1 tick, y se repite cada vez que expira la duracion del frame.

CAMBIO MUY LIMITADO TEST137:
- Solo para frame unico + scroll cardinal + 1 tick/step + 1 pixel/step (el alcance existente de TEST136).
- Tras cargar la duracion, ejecutar JMP frame_tick_scroll en lugar de RTS.
- Conserva exactas las rutas de 6 ticks, multi-frame, Ping Pong, Move In/Out, animacion de caracteres, colores, geometria y prefetch.
- NO cambia el temporizador; solo impide descartar el tick del mapa en su rollover.

PRUEBAS REPRODUCIBLES:
- TEST137_ASSEMBLER_REGRESSION.cjs: 24/24 PASS (4 direcciones x 2 velocidades x 3 duraciones: 1, 12 y 1024).
- Comparacion source ASM: con 6 ticks es byte por byte IDENTICO a TEST136.
- A 1 tick solo cambia el retorno al terminar la duracion del frame por un salto a frame_tick_scroll.
- TEST137_CPU_DURATION_ROLLOVER_CHECK.cjs: 6/6 PASS; ejecuta instrucciones 6502 reales ensambladas, y comprueba que en la IRQ de rollover fine_pos aumenta y se solicita el siguiente buffer.
- La demostracion compilada TEST137_REAL_USER_1T_RIGHT_CHAR_UP_1T.prg usa los datos del PRG real enviado en TEST134 (26 arrobas celestes).

PRUEBA EN VICE:
1. Desde la web TEST137 exportar el proyecto actual con animacion de caracteres UP 1T y Map Scroll RIGHT 1T 1px/step.
2. Confirmar una diagonal continua, incluso cuando vence Frame Duration. Si no, aportar el nuevo PRG real.
3. Comprobar regresion a 6 ticks; borde, fondo y colores deben permanecer correctos.
4. No promover a MASTER sin PASS visual del usuario.
