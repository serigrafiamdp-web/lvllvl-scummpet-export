# RicOS / LVLLVL / SCUMM-PET — Demoscene C64 Engineering Notes
## Fuentes Trident / Fairlight y otros coders, 25 octubre 2026

Documento técnico de referencia para **optimización de rutinas C64 en general**, no limitado a Group Scroll o Bitmap Multicolor. Registrado inicialmente en TEST299; requiere revisión y validación por motor antes de integrarse al MASTER.

## Referencias originales revisadas

1. **Trident / Fairlight (2026), A Simple Technique for Overlapping IRQ Handlers**: https://trident64.github.io/overlapping-irq-handlers/ . Su técnica arma el siguiente IRQ, reconoce el actual, activa IRQs de nuevo y permite que el trabajo prolongado continúe en el tiempo restante; evita reentrancia mediante un flag. El propio autor cifra el coste de su macro en 12 bytes y 19 ciclos por uso. Importante: esto **no hace más rápida la copia** de un bitmap; evita bloquear otros eventos cuando se diseña correctamente.
2. **Trident / Fairlight (2026), Anonymous IRQ Handlers**: https://trident64.github.io/anonymous-irq-handlers/ . Secuencias de eventos de raster mantenidas juntas con macros; simplifican programación y cambios de la cadena de IRQ. **Fuente ASM auténtica**: https://github.com/trident64/c64/blob/main/anonymous-irq-handlers-example.s .
3. **Trident / Fairlight (2023), Multicolor Ghostbyte Shine-through**: https://trident64.github.io/ghostbyte-shinethrough/ . Demuestra formas creativas de producir imagen sin software-blitting tradicional. Su restricción de bordes y sprites significa que NO es una sustitución directa del bitmap MC arbitrario.
4. **Raistlin/Sparta (2022), Side Border Bitmap Scroller**: https://c64demo.com/side-border-bitmap-scroller/ . Separa en fases el bitmap, Screen RAM y Color RAM; usa raster-aware update, 1/15 de los datos por cuadro para ocultar costo entre presentaciones. El hardware $D016 sigue siendo global por región, por lo que no equivale a scroll de grupo arbitrario.
5. **Cruzer/Camelot, Speedcode a.k.a. Loop Unrolling**: https://codebase.c64.org/doku.php?id=base:speedcode . Reduce costo administrativo de bucles al generar instrucciones dedicadas, a cambio de espacio de memoria. TEST297 PASS ya aplica esta idea por ID.
6. **Codebase64, Speeding Up and Optimising Demo Routines**: https://codebase.c64.org/doku.php?id=base:speeding_up_and_optimising_demo_routines . Evitar ROM/KERNAL en loops críticos y medir rastertime con color de borde (no confundir ciclo simulado con medición VICE).

## Reglas comunes para TODOS nuestros motores

- **Separar lógica / render / presentación.** Renderizar en memoria oculta; hacer cambios VIC solo en una ventana segura. No usar la ejecución completa del render como un IRQ monolítico si necesitamos SID a 50 Hz.
- **No reentrancia.** Si usamos IRQ superpuestos de Trident, prohibir invocaciones anidadas de una misma rutina mediante flag y preservar A/X/Y/P y stack. Si una rutina excede varios cuadros, el audio sigue recibiendo sus IRQ correctos, sin llamar otra vez al mismo render.
- **Fases y presupuesto.** Medir costo de ASM por fase, CPU cycles y también tiempo de raster real; incluir badlines y steals VIC. Una reducción del 8% de ciclos puede tener 0% mejora visual si el próximo flip disponible sigue estando en el mismo cuadro.
- **Generar speedcode SOLO con beneficio medido.** Dispatch por ID y dispersión real de celdas, uso de RAM, costo de reload/relocation y fallback seguro. TEST297 PASS demostró que distribuir handlers por IDs de 3+ apariciones sirve mejor que especializar un solo ID 745 veces para el arte real.
- **Respetar memoria y colores.** El VIC-II tiene bancos de 16K; Bitmap MC tiene 2 bits por pixel visible horizontal. Doble bitmap y dos Screen RAM pueden alternarse, pero Color RAM $D800 es compartida y no se doble-bufferiza con $DD00. No desplazar colores por celda implícitamente.
- **Timing abstracto reutilizable.** Librería de emisión de raster windows, con contrato sencillo sobre un mini-ensamblador (label/imm/abs/branch/ref). Candidatos futuros: programador de IRQ, protección de no reentrancia, instrumentación de borde, slots SID, profiler de badlines.
- **Equivalencia primero.** 256 IDs de atlas y el máximo físico de apariciones: verificar TODO el bitmap (8000 B), Screen RAM (1000 B) y ambos bancos, al menos dos vueltas de fases, antes de intentar mejor FPS real.
- **Rutas conservadoras.** TEST297 PASS es el rollback del Bitmap MC grupal. No mezclar exportadores SID o motores SCUMM antes de pasar pruebas específicas. Nunca cambiar el MASTER por un porcentaje de ciclos sintéticos.
- **Perfiles PAL/NTSC.** 312 líneas×63 ciclos =19656 en PAL-B (nominal). NTSC difiere en líneas y timing: NO reutilizar sin adaptar la ventana de flip de TEST299. TEST299 es solo PAL.
- **Preservar reloj SID.** En un motor con música, el SID debe tener su frecuencia prevista, típicamente 50 Hz PAL en las músicas de 50 Hz. No vincular música a la latencia de scroll ni a número de celdas.

## Hoja de ruta propuesta

| Módulo futuro | Basado en | Proyecto objetivo | Estado |
|---|---|---|---|
| Planificador PAL de flip seguro + pruebas CPU | Gestión de raster | TEST299 Bitmap MC | **Implementado como experimento** |
| IRQ anónimas + IRQ superpuestos con guardas | Trident/Fairlight 2026 | Player SID LVLLVL y SCUMM futuro | **Solo investigado**, NO instalado |
| Scheduler de larga duración cooperativo | Raster/IRQ Trident | Scroll de mapa + grupos + SID | Pendiente |
| Speedcode selectivo / generador de ASM | Cruzer/Camelot + Raistlin | Todos los modos de exportación | Arquitectura identificada; la ruta TEST297 implementa caso Bitmap MC |
| Copias de memoria intercaladas entre cuadros | Raistlin/Sparta | Map Scroll, bitmap y escenas completas | Pendiente |
| Bench ciclo a ciclo + border profile | Codebase64 y Trident | PRG player y futuros motores | Pendiente de validación VICE |

## Contrato implementado TEST299

Módulo: `TEST/test299-trident-raster-scheduler/js/RICO_C64_RASTER_LAB_TEST299.js`.

Expone `window.RICO_C64_RASTER_LAB_299.emitSafeWindow(asm,{prefix})`. El objeto `asm` aporta las funciones de emisión `label,imm,abs,branch,ref`. El generador:
- Reconoce líneas 251–311 o 0–34 PAL como ventana de presentación elegida.
- Revisa $D011 bit 7 para raster de 9 bits y $D012 para el byte bajo.
- Salta a continuación **una vez que la imagen oculta ya está completa**.
- NO instala IRQ ni toca $D019/$FFFE. Esta implementación no pretende ser una copia de las macros de Trident.

En TEST299 el blitter sigue siendo el de TEST297 PASS con los mismos 256 tiles y colores. Para `Ticks/Frame=1` comienza la fase siguiente inmediatamente después del flip, quitando una espera fija de raster 250. Para otros valores de Ticks/Frame vuelve al TEST297 sin modificaciones de timing.

### Validación disponible

Prueba simulada PAL con lector $D011/$D012 de 9 bits y contador de ciclos:
- Grupo 16×16 de 256 IDs distribuidos por 1000 celdas: Left/Right PASS.
- Comparación de 11 estados consecutivos: 0 diferencias en bitmap o Screen RAM.
- Todos los flips TEST299 entre línea 251–311 y 0–34: PASS.
- Comparación estimada en un simulador de CPU sin steals VIC: **6,25 Hz TEST297 frente a 7,70 Hz TEST299**, ~23% de mejora en esa carga SINTÉTICA.
- Fallback Ticks/Frame=2 y carga dominada por un ID: preserva PRG del motor previo.
- **NO se ha probado todavía VICE REAL.** No afirmar ganancias de FPS hasta recibir PASS del usuario.

Este documento es un catálogo de pautas y ejemplos para reutilizar; nunca una autorización para cambiar otros motores sin pruebas.
