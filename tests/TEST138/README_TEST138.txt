RICO / LVLLVL — TEST138 — 18 OCTUBRE 2026
ESTADO: MILESTONE PASS — VICE VISUAL CONFIRMADO POR USUARIO; 48/48 COMPILACIONES PASS

OBJETIVO
- Corregir el movimiento ocasional lateral cuando Map Scroll UP 1tick/1px + Animated Char RIGHT 1tick.
- Mantener fluidez, velocidad configurable por char y MASTER TEST134 inalterado.

INVESTIGACION EN REPOSITORIO PROPIO
- SCUMM-PET-C64 README.md: MASTER IRQ raster $FA para SID, Visual ScrollStep y eventos; un scheduler visual.
- milestones/ECM_SINGLE_SCHEDULER_PASS_13_OCT_2026/README.md: animacion continua dentro de una unica sesion de scheduler (PASS).
- releases/MASTER_13_OCT_2026_ECM_BORDER_ANIMATED_CHARS_V056/README.md: Animated Chars tienen ticks/counters individuales (PASS).
- docs/SCUMM_HIBRIDO_MAPA_MILESTONES.txt: flujo front -> back -> screen swap -> Color RAM; el scheduler define timing de frames.
- NO se copiaron direcciones o binarios SCUMM: motor y memoria del exportador LVLLVL son distintos. Se reusa el principio de reloj maestro con subcontadores.

CAMBIOS AISLADOS EN EL EXPORTADOR TEST77
1. Gear de desplazamiento: cuando el modo es un solo frame, scroll cardinal, 1tick/1px y hay Animated Chars, muestrear fine_pos antes y despues de procesar Map Scroll en la misma IRQ.
2. Si fine_pos cambio, llamar a animate_chars_native (que conserva su contador original por caracter y su tipo/direccion/ticks configurados en editor). Si no cambio, no avanzar el tick del caracter. Los 6ticks y otros modos emiten ASM identico a TEST137.
3. Optimizar SOLO pantallas 40x25 con TODOS los screen codes y colores identicos en TODO Scroll Area: map periodico de 8x8. No se necesita nuevo front/back por cada ciclo; actualizar D011/D016 un pixel por tick y repetir modulo 8. Nunca para pantallas con diferencias reales.
4. Contadores de diagnostico: $48 = avance real registrado (modulo 256), $49 = ticks sin avance (modulo 256). $47 guarda posicion anterior. Son contadores de diagnostico solo en modo engranado.

DATOS DE PRUEBA REALES
- TEST SCROLL NUEVO.prg: mapa 40x25 con 1000 glifos $00 celestes, scroll UP 1tick 1px, char $00 RIGHT 1tick, frame duration 12.
- PRG TEST138_REAL_USER_1T_UP_CHAR_RIGHT.prg generado usando chars/colores reales.
- PRG TEST138_NONUNIFORM_1T_RIGHT_CHAR_3T.prg fuerza ruta general con celda distinta y char 3ticks.

VERIFICACION AUTOMATICA
- Assembler original de LVLLVL: 48/48 PASS (4 direcciones, 1/6 ticks, char 1/3/6 ticks, uniforme/no uniforme).
- Compilacion 6tick identica byte por byte al TEST137.
- TEST138_CPU_GEAR_AND_UNIFORM_CHECK.cjs: 32/32 pasos consecutivos a 1px/tick SIN pedido de nuevo buffer para mapa uniforme. Simulacion de espera de mapa: 13 eventos, 9 avances, 4 esperas; la llamada a animate_chars_native ocurre solo cuando el mapa avanzo.
- Importante: la prueba de engranaje intercepta llamadas a animate_chars_native para verificar el gate, NO es validacion grafica C64 real.
- PASS visual en VICE confirmado en el proyecto real del usuario con mapa uniforme UP 1tick/1px y char RIGHT 1tick. Mapas no uniformes y otras combinaciones conservan solo validacion automatica hasta nuevas pruebas.

REGLAS
- TEST134 es MASTER estable y NO se toca.
- TEST137 fue el ultimo test experimental anterior. TEST138 queda CONGELADO como milestone PASS en rama dedicada.
- Este milestone PASS se conserva separado de main por decision de preservar el MASTER TEST134 y el milestone TEST138 sin mezclar trabajo experimental.

CONFIRMACION FINAL / 18 OCT 2026
- Usuario confirma expresamente: 'esa solucion es perfecta'.
- PASS del engranaje a 1 tick, diagonal fluida, sin movimientos laterales periodicos apreciables en el caso validado.
- ZIP congelado: MILESTONE_LVL_RICO_TEST138_PIXEL_GEAR_PASS_18_OCT_2026.zip.
- SHA256: a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227.
- MAIN conserva MASTER TEST134. Rama milestone es nuevo punto de retorno.
