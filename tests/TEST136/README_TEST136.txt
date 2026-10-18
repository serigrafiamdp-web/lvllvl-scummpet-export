RICO / LVLLVL — TEST136 — 18 OCT 2026
ESTADO: PRUEBA / VICE PENDIENTE / MASTER ESTABLE TEST134 INTACTO

OBSERVACION USUARIO:
- En TEST135, animacion char UP + Map Scroll RIGHT ambos a 1 tick mejora, pero cada varias frames se ve un movimiento lateral en lugar de diagonal constante.
- Video de evidencia: 2026-10-18 18-49-47.mkv (8.434 s, 1920x1080 a 60 fps).

HIPOTESIS / CAUSA PLAUSIBLE EN EL CODIGO:
- TEST135 ya adelanta la preparacion de la pantalla y mantiene el fine scroll mientras main_busy.
- La rutina build_sparse_colors (heredada de TEST133/134) recorria 1000 celdas DOS veces: primero visibles y despues vacias. Durante ese trabajo main_busy impide la ruta frame_tick regular.
- El presupuesto de 6 pasos finos para preparar la siguiente pantalla puede quedarse corto a 1 tick, con una pausa en el limite del bloque de 8 pixels.

CAMBIO AISLADO TEST136:
- Solo un unico frame, mapa cardinal Up/Down/Left/Right, 1 tick/step y 1 pixel/step.
- Se genera build_sparse_colors de una sola pasada (1000 celdas en vez de 2000).
- Mantiene la comparacion correcta de Color RAM con AND #$0F y la lista de parches de maximo 40 celdas por IRQ.
- No modifica animate_chars_native, los glifos, las rutinas VIC fine scroll, ni el intercambio anticipado de buffers de TEST135.
- A velocidades distintas o configuraciones fuera de este alcance, se emite EXACTAMENTE el mismo codigo ensamblador que TEST135.
- CONSIDERACION: Si >40 celdas cambian de color simultaneamente en 1 tick, pueden existir colores transitorios mientras se aplican las siguientes IRQs; ese comportamiento debe validarse con proyectos de colores muy variados.

PRUEBAS:
- Compilacion original de LVLLVL 6/6 regresiones PASS.
- 8/8 pruebas de ensamblado (4 direcciones, 1tick y 6ticks) PASS.
- 4/4 pruebas de ejecucion del desplazamiento fino en 6502 PASS (comportamiento heredado de TEST135).
- Verificacion diferencial: en 6 ticks el texto completo del codigo ASM generado coincide byte por byte con TEST135, en 4 direcciones.
- 1 tick: se elimina la fase de doble recorrido, conserva bytes originales del screen ($4000) y colores ($43f3) del caso real recibido.
- Pendiente: video/VICE a 1 tick. TEST134 sigue MASTER hasta confirmacion.

PRUEBA:
1. Abrir esta WEB de TEST136 (en ZIP o Github Pages).
2. Exportar el mismo proyecto con animate chars 1 tick UP y Map Scroll 1 tick RIGHT, 1px/step.
3. Observar si desaparece el movimiento lateral aislado cada 8 pixels. Verificar tambien los colores.
4. Probar de nuevo a 6 ticks como regresion.

RESPALDOS:
- MASTER TEST134 PASS: MASTER_LVL_RICO_TEST134_PASS_18_OCT_2026.zip
- TEST135: LVLLVL_TEST135_FAST_1T_PREFETCH_CHAR_MAP_SCROLL.zip
