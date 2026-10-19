RICO / LVLLVL / TEST143 — 19 OCTUBRE 2026
ESTADO: PRUEBAS AUTOMATICAS PASS; PRUEBA VISUAL EN VICE PENDIENTE.

OBJETIVO EXCLUSIVO
Calibrar el scroll NORMAL individual de caracteres de 8x8 sin Map Scroll ni Group Animate. Prioridad: 1 tick. NO modifica la preview, el motor SCUMM TEST138, la paleta TEST139 ni la herramienta Group Animate.

DIAGNOSTICO EN PRG DEL USUARIO
Los 4 PRG de tick1/2/3/4 exportados sin Map Scroll usaban el PLAYER clasico SYS2080; el exportador moderno TEST142 no estaba activo. Tick4 era copia binaria de tick3. 256 caracteres NORMAL UP a 1 tick exceden el presupuesto de 19656 ciclos nominales PAL por raster.

CAMBIOS TEST143
1. Con un solo frame, Character Animation NORMAL, 40x25, 8x8 y Map Scroll desactivado, se usa la ruta moderna con BASIC SYS8192. Configuraciones multi-frame sin Map Scroll siguen su ruta original hasta tener pruebas propias.
2. Grupos de codigos CONSECUTIVOS con MISMA direccion/ticks/banco reciben una rutina C64 6502 mas rapida. Es una optimizacion interna del bucle NORMAL; NO usa ni cambia Group Animate del editor.
3. Fast-path UP/DOWN exclusivo cuando no hay Map Scroll. Cada caracter sigue rotando solamente sus 8 bytes propios. LEFT/RIGHT/BLINK conservan optimizacion previa TEST142.
4. Si el codigo crece mas alla del espacio disponible antes de charset $3000, el ensamblador activa retorno a la rutina por caracter. No sobrescribe los bitmap originales.
5. Conserva las reglas de tileset completo TEST140 y el refresco del indice TEST139.

VALIDACIONES LOCALES
- TEST143_NORMAL_NO_MAP_EXPORT_CHECK.cjs: 20 exportaciones reales con ensamblador original LVLLVL. 16/64/128/256 caracteres UP a ticks 1,2,3,4; y DOWN/LEFT/RIGHT/BLINK a 1 tick.
- ANALISIS_CICLOS_TEST143.cjs: bytes/pixeles identicos a la referencia; 64 caracteres UP = 9250 ciclos en rutina medida, 256 UP = 37159 ciclos.
- TEST142_FAST_GROUP_CHECK.cjs: 14/14 PASS.
- TEST140_CUSTOM_TILESET_EXPORT_CHECK.cjs: 10/10 PASS.
- TEST139_PREVIEW_ISOLATION_CHECK.cjs: 10/10 PASS.
- Exportes demo: TEST143_NORMAL_UP_64_VISIBLE_TICK1_NO_MAP.prg y TEST143_NORMAL_UP_256_VISIBLE_TICK1_NO_MAP.prg.

LIMITACIONES
- Los 37159 ciclos de 256 UP siguen siendo mas de un cuadro PAL; 1 tick real para 256 glyphs visibles simultaneos no esta garantizado.
- La preview del navegador usa 50Hz aproximados; no tiene la misma limitacion de CPU que un C64 real.
- El hecho de que compilen y produzcan pixeles correctos en CPU simulada NO sustituye la verificacion visual en VICE del usuario.
- Segun el usuario, cuando se combina Character Animation y Map Scroll, ambos se desaceleran. Ese caso combinado es una SEGUNDA ETAPA, y NO es el alcance de TEST143.

CONSERVACION
- MASTER TEST138 congelado en main y rama master dedicada.
- TEST139 PASS y TEST140-142 ramas experimentales conservadas.
- TEST143 es experimental; NO promocionar a master sin PASS visual.
