RICO / LVLLVL — TEST135 — 18 OCT 2026
ESTADO: PRUEBA EXPERIMENTAL / VICE PENDIENTE / MASTER TEST134 INTACTO

PROBLEMA DEMOSTRADO POR EL USUARIO:
- LVLLVL previsualiza correctamente el scroll de caracteres y el mapa a 1 tick.
- En VICE el PRG exportado con ambos a 1 tick avanza a saltos, en vez de un movimiento uniforme.
- Ambas animaciones a 6 ticks ya pasan en TEST134.
- Evidencia visual: 2026-10-18 15-58-08.mkv (2,784 segundos, 60fps).

CAUSA EN RUNTIME TEST134:
- El buffer nuevo se solicitaba al llegar al ultimo pixel fino (0 o 7), demasiado tarde.
- El bloque de preparacion en main_loop activa main_busy; durante ese tiempo la IRQ omite frame_tick, congelando el desplazamiento fino hasta que el buffer esté listo.
- A 1 tick esa pausa aparece a cada paso entre celdas de 8 pixeles.

CAMBIO AISLADO DE TEST135:
- Solo en exportacion de UN FRAME y Map Scroll normal UP/DOWN/LEFT/RIGHT con ticks/step=1 y pixels/step=1.
- Adelanta el pedido de buffer al PRIMER pixel fino del grupo (fine=1 o 6), dando seis ticks de tiempo antes del intercambio.
- Permite que el scroll fino siga avanzando durante main_busy con acceso directo a $D011/$D016 y sin interferir con tmp_byte ni punteros del preparador.
- Intercambia las pantallas SOLO al 8vo pixel y cuando prep_ready esta activo.
- Si el buffer sigue sin terminar al alcanzar el limite, aguarda sin corromper datos.
- Se conservan animate_chars_native, los datos de los glifos, colores y el sistema TEST134 de Color RAM; las velocidades mayores, otras animaciones y modos conservan la ruta anterior.

VALIDACIONES AUTOMATICAS:
- Ensamblador interno original de LVLLVL: 6/6 regresiones PASS.
- Escenarios reales de usuario (26 arrobas, bancos/colores conservados), cuatro direcciones a 1 tick y 6 ticks: 8/8 ensamblados PASS.
- Emulacion de LAS INSTRUCCIONES 6502 generadas, 4 direcciones: fine-scroll de un pixel por IRQ durante cuatro IRQ ocupadas y swap solo en el paso 8: PASS 4/4.
- No es un PASS de VICE: confirmar usuario con su mismo proyecto a 1 tick y a 6 ticks.

INSTRUCCIONES:
1. Abrir el index.html de este ZIP, o la web TEST135 una vez desplegada.
2. Exportar el MISMO proyecto: animacion de char 1 tick; Map Scroll 1 tick, 1 pixel/step.
3. Revisar VICE: movimiento continuo arriba/derecha y ausencia de errores de color y caracteres fantasma.
4. Probar 6 ticks como regresion.
5. Informar PASS/FAIL. Si aun salta, enviar PRG generado con TEST135 para medir el siguiente cuello de botella.

VERSION ANTERIOR CONSERVADA:
MASTER_LVL_RICO_TEST134_PASS_18_OCT_2026.zip
SHA256 095be926a55414057428f42fe3311bf64b5b5d46a2ce2e64dc46083345e47fce
