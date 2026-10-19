RICO / LVLLVL / TEST142 — 18 OCT 2026 — C64 FAST GROUPED ANIMATED CHARS
ESTADO: COMPILACION + CPU INSTRUCTION / PIXEL EQUALITY PASS; VISUAL EN VICE PENDIENTE

CONTEXTO
- El usuario nota TEST141 mas rapido pero mucho mas lento que la preview al poner todos los 256 glyphs en Animated Char, tick 1.
- Diagnostico de la rutina TEST141, basada en instrucciones C64 ensambladas:
  RIGHT 1 visible 366 ciclos; 16: 5436; 32: 10844; 64: 21660; 256: 86556.
- Un C64 PAL tiene cerca de 19656 ciclos nominales / cuadro; VIC-II, IRQ y scroll quitan parte del presupuesto. 256 glyphs independientes a 1 tick no se pueden completar con el algoritmo TEST141.

CAMBIO TEST142
- Ruta especializada SOLO para grupos de 8+ caracteres de CODIGOS CONTIGUOS, mismo tipo de animacion y mismo tick, en un mismo banco.
- Tipos cubiertos por aceleracion: LEFT, RIGHT y BLINK.
- Un contador por grupo sincroniza exactamente las fases de glyphs que antes tenian contadores individuales identicos. Ticks elegidos NO cambian.
- Procesar cada byte del charset directamente con instrucciones 6502 absolutas,X, evitando 8 accesos indireccionales + dispatcher por glyph.
- No modificar los pixels exportados, paleta o editor. UP/DOWN, chars sueltos y grupos con tipo/ticks distintos mantienen el codigo TEST141 original.
- BANK1/BANK2 se agrupan por separado, sin eliminar animaciones necesarias de bancos realmente utilizados.
- Limite de 3 grupos acelerados por exportacion; cualquier trabajo restante sigue con la rutina anterior.
- Seguridad $3000: se comprueba final de codigo frente a charset; si los grupos causan overflow, exportacion vuelve a compilar SIN grupos. Nunca pisar charset silenciosamente.

CICLOS MEDIDOS TEST142 (equivalencia CPU 6502 y pixels comprobados en cada prueba)
Animacion RIGHT, BANK1:
               TEST141     TEST142
   16 visibles   5.436     2.849
   32 visibles  10.844     5.153
   64 visibles  21.660    10.529
  128 visibles  43.292    20.771
  256 visibles  86.556    41.255
Animacion LEFT 256: 85.276 -> 37.159 ciclos; BLINK 256: 72.220 -> 33.063.
Esto acelera el caso homogéneo, pero NO asegura 50 Hz con los 256 visibles. Variaciones sin grupos usan el codigo anterior.

REGRESIONES
- TEST142_FAST_GROUP_CHECK.cjs: 14/14; con assembler ORIGINAL LVLLVL. BANK1 / BANK2, gear, tick3, tick6, tipos y colores.
- ANALISIS_CICLOS_TEST142.cjs: 30/30 CPU simulations con bitmap resultante exacto por byte frente a las rotaciones originales.
- TEST141_VISIBLE_CHAR_IRQ_WORKSET_CHECK.cjs: 12/12 tests + matriz 48/48 compilaciones, sin regresion para tipos mezclados.
- TEST140_CUSTOM_TILESET_EXPORT_CHECK.cjs: 10/10.
- TEST139_PREVIEW_ISOLATION_CHECK.cjs: 10/10.
- TEST138 SCUMM Pixel Gear intacto en los modos de scroll.
- TEST142_FAST_RIGHT_64_VISIBLE_1T_UP.prg y TEST142_FAST_RIGHT_256_VISIBLE_1T_UP.prg: ensamblados de referencia, NO proyecto real del usuario.

AISLAMIENTO
- ZIP completo basado en TEST141, solo cambian index.html y el exportador PRG.
- Se agregan pruebas, notas y PRG de referencia.
- No cambia la preview del indice, ni el canvas/fondo, ni el motor SCUMM TEST138, ni los colores, ni TEST140 full256.
- MASTER TEST138 permanece congelado en main; TEST139 PASS permanece en milestone; TEST140 y TEST141 se preservan.

TEST VISUAL
- Probar mismos glyphs y mismos ticks en el proyecto de TEST141 y TEST142.
- Comprobar que LEFT / RIGHT / BLINK sean mas rapidos sin artefactos ni cambios de bancos.
- Comprobar el Scroll SCUMM, borde, fondo y Color RAM.
- Si sigue siendo lento a 1tick, enviar el PRG exportado por TEST142 para medir el conjunto exacto de glifos visibles y si se activó el fast group.
- Pendiente PASS o FAIL visual en VICE. No promover sin confirmacion.
