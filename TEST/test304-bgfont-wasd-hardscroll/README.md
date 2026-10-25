# TEST309 — SID + Multicolor real sin prohibir HiRes/Mixed (25 OCT 2026)

Estado: código y rutas verificadas mediante pruebas JS/ASM textual; falta validación real en VICE del nuevo motor Bitmap+SID.

Parte únicamente del TEST308 (reproducción SID recuperada, usuario confirmado). TEST308, TEST307 PASS, TEST306, TEST305, TEST297 y MASTER no se modificaron.

## Causa del defecto y corrección

La ruta de SID para una sola frame detenida introducida en TEST308 usaba TEST186, un **reproductor de CHARACTERS** con Map Scroll horizontal a 0 píxeles. Esta rutina escribía $D016 con el bit 4 borrado, forzando HiRes global. El editor podía estar en multicolor y quedar distinto del PRG. Además, si la frame provenía del nuevo SCREEN → Bitmap Multicolor (TEST279), ese motor de caracteres era fundamentalmente incorrecto: el VIC-II necesita 8000 bytes de BITMAP, 1000 bytes de SCREEN para C1/C2 y 1000 bytes de COLOR RAM para C3.

### Ruta 1: Multicolor Character mixto + SID

- La copia aislada de TEST308 introduce el corrector ya probado `RICO_TEST264_MULTICOLOR.patch()` **solo si SCREEN es Multicolor Character** y no está activo Bitmap MC.
- Rehabilita el bit 4 de `$D016` y restaura `$D022/$D023` de la configuración real del layer.
- **No altera** `world_colors` ni fuerza el bit 3 en Color RAM. Las celdas con color 0–7 siguen HiRes (un píxel de ancho), y las celdas con color 8–15 siguen Multicolor (píxeles dobles). Esto deja usar HiRes + Multicolor mezclados cuando se desee.
- La música sigue procesándose por la **misma** rutina TEST207/229 de SID INIT/PLAY.

### Ruta 2: Bitmap Multicolor verdadero, una frame detenida + SID

- Un módulo independiente `RICO_BITMAP_SID_STATIC_TEST309.js` toma el modelo nativo del exportador **TEST282** mediante `RICO_TEST282_BITMAP.encode(editor)`.
- Produce ASM para VIC bank $4000 con bitmap en `$6000–$7F3F`, screen en `$5C00–$5FE7`, Color RAM $D800 alimentada desde `$3800–$3BFF` y modo VIC `$D011=$3B / $D016=$18 / $D018=$78`.
- No convierte el bitmap a caracteres. No altera el contenido de las tres matrices, salvo la copia necesaria de Color RAM a su región I/O.
- Se entrega a `makeSource207`, que añade el reproductor SID probado: INIT, PLAY y temporización raster/CIA, con protección de ZP. SID con carga $1000–$1FFF conserva core $2000; el planificador TEST229 reubica el core cuando la música invade $2000–$2FFF.
- El motor Bitmap MC soporta aquí **imagen fija sin scroll del mapa y una frame**, con la misma captura 40×25 de TEST282. Los mapas más grandes siguen limitados a la primera región 40×25 en esta ruta musical experimental (la reproducción Bitmap MC + SID + WASD y viewport desplazado requieren integración posterior). Esta limitación no afecta al PRG de scroll independiente de TEST307.
- Bitmap Multicolor **no posee mezcla HiRes/MC por carácter**. La mezcla es una función nativa de *Multicolor Character Mode*, que esta prueba conserva.

## Validación interna

- TEST309 SID estático Char Multicolor: una compilación simulada; en el ASM resultante aparece `ORA #$10; STA $D016` y las escrituras $D022/$D023 con valores del layer. Bytes del mapa de colores `$03,$0B,$00,$08` preservados íntegros. El audio integrado contiene `sid_init_protected211` y `sid_play_protected211`: PASS.
- TEST309 Bitmap MC + SID: fuente ASM con `$D016=$18`, `$D011=$3B`, bitmap completo (8.000 B), screen (1.000 B), colores (1.000 B), copia explícita a $D800 y SID original. Datos y llamadas de IRQ encontrados en la misma fuente: PASS.
- Prueba con un SID sintético de 3798 bytes cargado en $1000: resultado fuente compilada por mock 1 vez, sin errores, SID y bitmap coexistentes, sin relocalización.
- Prueba con SID sintético 7900 bytes cargado en $1000: planificador TEST229 cambia el core a $C000 y actualiza BASIC SYS49152. No se mueven bytes de SID ni bitmap.
- HiRes sin multicolor: ruta sin patch $D016: PASS.

**Pendientes de validar con VICE real:** ejecución audible, igualdad de píxeles/colores, música CIA, y diferentes SID. La simulación del ensamblador no demuestra por sí sola el funcionamiento físico completo de la C64. No declarar MASTER hasta pasar visual + audio.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test309-sid-mixed-character-fidelity.zip

---

# TEST308 — Restauración de exportación SID (25/10/2026)

**Problema:** TEST307 interceptaba el botón Export PRG y priorizaba el PRG experimental WASD (que NO tiene player SID). Incluso con el checkbox WASD apagado, el exportador rápido Bitmap MC TEST299 podía adelantarse al exportador nativo, descartando la música. Además, el adaptador SID TEST229 seleccionaba la ruta de render dinámico TEST228 incluso cuando había un único frame completamente detenido; la ruta antigua TEST207 para pantalla detenida seguía presente pero no se ejecutaba.

**Correcciones solo en TEST308:**

- El módulo de panel detecta un SID *realmente cargado*: selector nativo `sid` + bytes presentes, o checkbox SID del exportador avanzado TEST207/229 activado. Una canción de proyecto autoseleccionada NO cuenta como SID cargado.
- Con SID real se da prioridad al exportador musical existente, SIN pasar por el generador WASD autónomo ni por TEST299. Si el checkbox WASD estaba marcado, se desmarca antes de exportar; así **no se genera engañosamente un PRG WASD sin audio**. El resultado en esta ruta es un PRG SID normal (no incorpora control WASD).
- La instancia avanzada original se reutiliza; si no está conservada en el editor, el código utiliza el prototipo `ToPRGAdv` ya cargado y su mismo `createPRG`. No se construye otro player SID.
- Dentro de la copia **aislada** `RICO_SID_RESTORED_TEST308.js`, un solo frame con `ricoMapScrollV1.type` vacío se deriva a la ruta legacy `export207` pensada para pantalla detenida. Proyectos animados mantienen la ruta `exportSelectedEngine228`. Se conservan las reglas de PSID INIT/PLAY y CIA/VBlank.
- Sin SID y con WASD marcado, TEST307 Full Map + diagonales se mantiene tal cual; sin SID y sin WASD, TEST299 (cuando corresponde) y el exportador nativo se mantienen.
- Si se solicita D64 y queda WASD marcado, se desmarca y deriva al exportador de disco habitual, sin el bloqueo artificial impuesto por la prueba WASD.
- El código compartido `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` **no se modifica**, ni tampoco TEST307, TEST306, TEST305, TEST297 PASS o MASTER.

**Pruebas internas:** siete escenarios de despacho con objetos de exportación simulados PASS (SID nativo, avanzado con/sin instancia, Bitmap MC sin SID, música de proyecto autoseleccionada, D64). Con un PSID de ejemplo y un ensamblador simulado, el adaptador SID de TEST308 eligió `STATIC_SID_TEST207`, ejecutó el ensamblador y produjo 14.353 bytes de PRG sintético. **La música audible, la reproducción en VICE y el arte en Bitmap MC real todavía no están verificados**. Esta rama requiere prueba real del usuario y no se marca MASTER.

**Importante:** TEST308 **restaura SID en la ruta normal**, NO promete un nuevo motor que combine WASD y SID en el mismo ejecutable. Esa integración futura implica un IRQ de audio independiente y replanificación de RAM; no debe confundirse con haber recuperado el player anterior.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test308-restore-sid-export.zip

---

# TEST307 — FULL MAP + DIAGONALES WASD (25 OCT 2026)

**Estado:** PASS de compilación/CPU 6502 simulada, **pendiente evaluación visual y velocidad real en VICE**.

Se parte de TEST306, aprobado por el usuario como scroll exportado continuo y sin parpadeo negro. Esta prueba deja intactas TEST306, TEST305, TEST297 PASS y MASTER.

## Problemas corregidos

1. TEST306 capturaba siempre solo los primeros 40×25 caracteres de cada frame y desplazaba circularmente esa ventana. El mapa configurado en LVLLVL podía tener 40×50, 80×50, etc.; la mitad inferior y los sectores laterales quedaban invisibles para el ejecutable.
2. El lector de teclado ASM seleccionaba una sola dirección según prioridad W, A, S, D. Dos teclas simultáneas no producían diagonales.

## Cambios

- Captura completa `getGridWidth() × getGridHeight()` del layer actual, con tile de 8×8 y todos los colores por celda. HiRes = 2 B/celda (ID y FG). Bitmap Multicolor = 3 B/celda (ID, C1/C2 y C3). No aplana la imagen a la ventana 40×25.
- Se utilizan las dimensiones separadas `RICO_TEST75_WINDOW_DIMENSION.getConfig` y `getScrollArea`, cuando están definidas, o el grid entero como área de scroll si no hay recorte explícito. El viewport físico es como máximo 40×25, y respeta la región recortada configurada y su ubicación dentro de la pantalla C64.
- El mapa fuente empaquetado está en `$8000-$BFFF` (16 KiB), las tablas de índices en `$1000-$15FF`, atlas de 2048 B en `$4000` (Bitmap MC) o `$5000` (HiRes). Las dos pantallas/buffers y las rutinas de color conservan ubicaciones independientes.
- La cámara recorre **toda el área de scroll** y retorna circularmente al otro extremo del mapa fuente, no al borde de la ventana visible. Así se pueden revelar sectores inferiores, superiores, derechos e izquierdos sin que el contenido se corte a los 40×25 iniciales.
- W y S modifican Y, A y D modifican X, **independientemente** en cada lectura CIA1; permite W+A, W+D, S+A y S+D en el mismo paso, con un solo redibujado del buffer oculto y un solo cambio de banco. Se repite mientras se sostienen las teclas.
- No se vuelve a desactivar la pantalla por movimiento. Se conserva el raster swap y Color RAM de TEST306. **El coste de redibujar el viewport completo con el mapa fuente puede reducir el número de pasos por segundo respecto al desplazamiento circular de TEST306**; hace falta medir en VICE. Es una primera versión correcta para probar las nuevas combinaciones y el mapa completo.
- El panel WEB sigue igual que TEST306: flechas del mouse con repetición al mantener presionado; sin interceptar WASD del editor. Checkbox en panel y exportación normal sincronizados. La ruta no-WASD sigue usando el exportador habitual.

**Límite de memoria:** exporta mapas de dimensiones de hasta 255 por eje mientras ocupen 16.384 bytes en formato empaquetado: máximo 8.192 celdas HiRes o 5.461 celdas Bitmap MC. Si el mapa supera ese límite, se muestra error explícito; **no se exporta una imagen truncada**. Se deja el soporte para mapas mayores con bancos/streaming para una fase siguiente.

## Pruebas internas del ASM ejecutado por intérprete 6502

| Modo | Mapa | Combinación | Resultado |
|---|---|---|---|
| HiRes | 40×50 | W+A sostenidas, dos pasos | 0 diferencias en pantalla y Color RAM, 0 apagados DEN |
| HiRes | 80×50 | W+A sostenidas, dos pasos | 0 diferencias en pantalla y Color RAM, 0 apagados DEN |
| Bitmap Multicolor | 40×50 | W+A sostenidas, dos pasos | 0 diferencias en bitmap, Screen RAM y Color RAM, 0 apagados DEN |
| Bitmap Multicolor | 80×50 | W+A sostenidas, dos pasos | 0 diferencias en bitmap, Screen RAM y Color RAM, 0 apagados DEN |
| HiRes | 80×50, Scroll Area (12,8,20,34), ventana 18×20 | S+D sostenidas, dos pasos | PASS, recorte y coordenadas, 0 diferencias |
| Bitmap MC | idem | W+D sostenidas, dos pasos | PASS, incluye vuelta circular vertical, 0 diferencias |

Almacenamiento/ASM verificado: 40×50 Bitmap MC 6.000 B fuente; 80×50 Bitmap MC 12.000 B fuente; motor ASM ~1,2 KiB dentro de $0810–$0FFF. Captura real simulada del editor Bitmap MC 40×50 y viewport 38×24 en (1,1): celda final correcta, motor TEST307 seleccionado.

**IMPORTANTE:** no se ha hecho la validación visual de velocidad o parpadeo cromático en VICE. Esta rama es solo experimental hasta recibir un PASS visual.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test307-fullmap-diagonal-wasd.zip

---

# TEST306 — HOLD SCROLL EN EDITOR Y PRG SIN BLINK POR $D011

Fecha 25 de octubre de 2026. Parte exclusivamente del TEST305 confirmado por el usuario. El MASTER, TEST297 PASS, TEST304 y TEST305 originales se conservan.

## Problema confirmado y causa en código

En el PRG autónomo TEST305 cada tecla se aceptaba solo una vez hasta soltarla (estado `$F0`), y se escribía `$0B` a `$D011` con cada movimiento: la pantalla se apagaba mientras se copiaban 1000 bytes de Color RAM, produciendo negro/parpadeo. Además, copiar 8000 bytes de bitmap mediante un bucle con salto por cada byte costaba muchos ciclos.

## Mejoras TEST306

- **Panel Interfaz → Ricos Manual Scroll:** mouse `pointerdown` ejecuta 1 desplazamiento instantáneo de una celda; tras 140 ms de pulsación sostenida comienza una repetición cada 70 ms mientras se mantiene presionado. `pointerup`, `pointercancel`, pérdida de captura del puntero, cerrar panel o perder foco detienen el desplazamiento y limpian temporizadores. El editor WEB sigue **sin captura WASD**.
- **PRG exportado:** cada pulsación sostenida de W/A/S/D se reconsulta después de terminar cada actualización de doble buffer. Se repite automáticamente hasta soltar la tecla; la frecuencia está limitada por los ciclos reales del C64 y no equivale necesariamente a los 70 ms del navegador.
- **Parpadeo:** se conserva el uso de `$D011=$0B` una sola vez durante la inicialización, pero ya NO se apaga la pantalla en movimientos. Las copias se preparan fuera de pantalla, se espera aproximadamente hasta raster 252 (borde inferior PAL/NTSC), se selecciona el buffer de video y se copia Color RAM de arriba hacia abajo con rutina rápida para minimizar interferencia con el haz. Puede quedar una irregularidad cromática puntual pendiente de verificación con VICE: evitar la pantalla negra no garantiza simultaneidad absoluta de Color RAM.
- **Rendimiento:** el bucle de transferencia de páginas copia 8 bytes antes de saltar, reduciendo saltos por byte, y el copiado Color RAM de 1000 bytes utiliza secuencias de 8 transferencias `LDA abs,X / STA abs,X` por bloque, con dos rutas para cada shadow buffer. No modifica tamaño/paleta de la imagen y mantiene los buffers independientes.
- **Compatibilidad:** menú Interfaz y antiguo SCREEN mantienen la misma ventana, checkbox compartido con Export PRG y rutas normales cuando está desmarcado. No se modificaron otros módulos de LVLLVL.

## Evidencia de validación interna

- Sintaxis JS válida; ASM generado sin solaparse con datos: HiRes 1494 bytes (`$0810`–`$0DE5`), Bitmap MC 1632 bytes (`$0810`–`$0E6F`), ambos antes de `$1000`.
- Prueba con intérprete de opcodes 6502 simulado, tecla A sostenida: dos desplazamientos continuos sin soltar, con 0 bytes incorrectos en pantalla, bitmap y Color RAM y 0 apagados de `$D011` después de inicializar, ambos modos: PASS (raster ajustado finalmente a 252; este ajuste no cambia rutas de datos).
- Prueba simulada de mouse: 1 movimiento instantáneo, repetición después de 140ms, 4 movimientos durante pulsación sostenida; al soltar y cerrar, 0 movimientos adicionales y 0 temporizadores pendientes: PASS.

**Pendiente:** validar el nuevo PRG real en VICE (velocidad, raster PAL/NTSC, color y presencia o ausencia de destellos), especialmente Bitmap Multicolor con mucha variedad de colores. No afirmar PASS visual ni velocidad medida hasta esa prueba.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test306-held-scroll-prg-stability.zip

---

# TEST305 — Interfaz / Ricos Manual Scroll — 25 OCT 2026

Estado: PASS en prueba simulada de integración de menús/DOM; validación visual del usuario pendiente.

Partimos de TEST304 V6, cuya ventana flotante sin gris fue confirmada funcional por el usuario.

Cambios de esta prueba:
- El **editor WEB ya no captura W/A/S/D**. No hay nuevo listener de teclado para desplazamiento; el movimiento circular de celdas del documento se realiza únicamente con ▲ ◀ ▶ ▼ dentro de la ventana.
- Nuevo menú **Interfaz → Ricos Manual Scroll...**. Si la app ya tiene menú Interfaz/Interface, se reutiliza; si no existe, se agrega una sola vez. Con el mismo ítem se puede abrir o cerrar el panel. Sigue disponible el acceso histórico SCREEN → Ricos Manual Scroll... y ambos accionan LA MISMA ventana.
- El panel sigue siendo realmente flotante, arrastrable por el título y NO MODAL: sin backdrop gris, sin bloquear el lienzo, sin duplicados y conservando la selección del checkbox al cerrar/reabrir.
- El checkbox **Export with WASD Scroll Control** sigue configurando el PRG generado. **En VICE, el PRG experimental continúa usando WASD**; en el editor WEB no se usa el teclado para el desplazamiento. El exportador original sigue cuando el checkbox está desactivado.
- No se cambió el motor PRG ASM, la captura de BitMap Multicolor, el movimiento de celdas, MASTER, TEST297 PASS ni la rama V6.

Pruebas internas con DOM/UI/editor simulados:
- Con menú Interfaz existente o ausente: exactamente un menú Interfaz, un ítem de panel en ese menú, y un ítem histórico en SCREEN.
- Abrir desde Interfaz, mover flecha derecha, invalidar/redibujar celdas, cerrar desde SCREEN, reabrir, checkbox sincronizado: PASS.
- No se registró listener de teclado WASD ni se alteró stack modal: PASS.
- Prueba visual en navegador y exportación VICE: pendiente de comprobación del usuario.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test305-interface-manual-scroll-arrows-only.zip

---

# TEST304 V6 — ventana flotante real (25 OCT 2026)

**Problema corregido:** el intento V5 usaba `UI.Dialog.show()`, que seguía creando una capa modal gris y bloqueaba la interacción/redibujado del editor aunque no se usase `UI.showDialog()`. Las flechas no mostraban movimiento visible.

**V6:** se elimina `UI.Dialog` del panel Manual Scroll. El menú SCREEN → Ricos Manual Scroll... ahora crea una ventana flotante DOM independiente, desplazable por la barra de título, sin backdrop, sin entrada en `UI.dialogStack` y sin desactivar el editor. Los botones ▲ ◀ ▶ ▼ y W/A/S/D (solo con la ventana abierta) cambian las celdas del frame real, llaman a invalidación y redibujo del gráfico. El checkbox compartido con Export PRG sigue intacto; la ruta experimental WASD no consulta ninguna propiedad de SID y exporta PRG autónomo SIN música. Desmarcar la casilla conserva el exportador existente.

**Prueba de regresión con editor y DOM simulados:** código JavaScript parseado; ventana sin overlay, desplazamientos RIGHT + UP coherentes, 2 llamadas a invalidación/redibujado, checkbox sincronizado, panel retirado y teclado desactivado al cerrar: PASS. **Prueba visual en navegador y ejecución en VICE: PENDIENTES.**

**Ramas preservadas:** MASTER, TEST297 PASS y las restantes pruebas no se modifican.

---

# TEST304 — Ricos Manual Scroll (actualización: controles nativos y exportación con WASD)

## Corrección TEST304 v5 — FALSO SID Y VENTANA QUE BLOQUEABA EL EDITOR

**Problema observado por el usuario:** el PRG WASD mostraba el error «aún no permite SID» sin haber cargado música. Simultáneamente, la ventana Ricos Manual Scroll oscurecía/deshabilitaba el área de trabajo, por lo que no se veía desplazamiento tras pulsar las flechas.

**Causas confirmadas:**

1. El código verificaba `#exportPRGMusic.value !== 'no'`. La ventana nativa selecciona por defecto una entrada del listado de música disponible, aunque el usuario no haya cargado SID. Esa condición era un falso positivo.
2. `UI.showDialog('rico304Dialog')` añade una entrada a `UI.dialogStack`. El motor original de LVLLVL deja de ejecutar `UI.canvasRender()` y `UI.webGLRender()` cuando hay algún modal abierto. Además, `UI.Dialog.show()` presenta un backdrop que oscurece y captura el mouse. En esas condiciones, el movimiento del frame quedaba oculto.

**Correcciones implementadas, solo TEST304:**

- La ventana sigue siendo el `UI.Dialog` nativo (estética, barra de título y botones propios), pero se abre de modo **no modal** usando `dlg.show()` directamente, sin añadir nada a `UI.dialogStack`. El fondo de bloqueo se oculta con `display:none !important` y `pointer-events:none`, y el diálogo se coloca al borde derecho, dejando el canvas operativo. `closeManual()` cierra este diálogo sin cerrar otros diálogos de exportación; también corrige el cierre por la X de la barra de título.
- Los botones ▲ ◀ ▶ ▼ invocan `moveArtwork()` y desplazan el **frame original** y `ricoBmpColors` circularmente. Se invalida y repinta el `graphic` original. W/A/S/D hacen lo mismo únicamente con la ventana abierta; al cerrarla el contador de movimientos permanece inmóvil.
- El bloqueo de música se ejecuta **solo si** `exportPRGMusic.value==='sid'` **y** existe `ToPRG.sidData` cargado realmente. Una pista de proyecto autoseleccionada no bloquea la exportación WASD. **El PRG WASD autónomo de esta prueba no incorpora música**; si se necesita conservar música o animaciones, desmarcar el checkbox y exportar con el motor normal.
- El checkbox `Export with WASD Scroll Control` sigue siendo único en cada una de las dos ventanas, sincronizado por `st.exportWithWASD`. Al desactivarlo se restaura la ruta normal de TEST299 Bitmap MC o LVLLVL HiRes. No se agregó un botón de exportación alternativo.

**Prueba interna:** en ambos modos Bitmap MC y Char HiRes, el stack modal quedó en 0, backdrop oculto, ventana al borde derecho, dos clics de flechas y una tecla WASD generaron 3 redibujos reales, el botón X cerró y deshabilitó WASD, la opción de exportación quedó sincronizada, el listado de música autoseleccionado no provocó alertas, se generaron los PRG experimentales de 12049 B y 20481 B, y desmarcar el checkbox restituyó exactamente las rutas normales. **VICE real pendiente**.

Esta revisión modifica solamente `TEST/test304-bgfont-wasd-hardscroll`, no MASTER ni TEST297 PASS.

---

**Estado:** PASS de simulación/interfaz; falta validar el PRG WASD visualmente en VICE. MASTER, TEST297 PASS y TEST299 conservados.

## Interfaz final

- SCREEN → **Ricos Manual Scroll...** abre solo una pequeña ventana nativa (sin vista previa, sin botones de exportación, sin modos MAPA/GRUPO).
- Cuatro botones de dirección desplazan **el arte real del área de trabajo**, una celda 8×8 por clic; circular en los cuatro ejes.
- W/A/S/D hacen lo mismo mientras está abierta la ventana. Al cerrarla, se dejan de interceptar completamente.
- Un único checkbox: **Export with WASD Scroll Control**. Esta misma opción aparece en la ventana normal **Export C64 PRG**, con una sola variable compartida y sincronización bidireccional.
- Si está **desmarcada**, el botón OK de Export PRG mantiene el motor normal existente: TEST299 Bitmap MC cuando es elegible, o LVLLVL original para modo HiRes/otros.
- Si está **marcada**, OK genera el PRG experimental WASD, que presenta el mapa detenido y permite moverlo por teclas en VICE, sin controles de joystick ni flechas. El nombre de archivo se toma de la exportación y termina en `_WASD.prg`.
- En la ruta WASD la prueba autónoma solo admite PRG, pantalla de 40×25 y no incluye SID; se informa si se ha seleccionado D64 o música. Desmarcar restablece la ruta normal sin restricciones nuevas.
- Las opciones del PRG de prueba no modifican el menú normal ni los archivos MASTER. La opción queda activa durante la sesión del editor (variable compartida de TEST304).

## Validación realizada

Se ejecutó una simulación de interfaz con las dos rutas HiRes y Bitmap MC:

| Verificación | Bitmap MC | HiRes |
|---|---|---|
| Aparece el ítem SCREEN solo una vez | PASS | PASS |
| Cuatro movimientos WASD sobre el frame | PASS | PASS |
| Desactivar WASD al cerrar el diálogo | PASS | PASS |
| Check en Manual Scroll sincroniza check Export PRG | PASS | PASS |
| Export PRG muestra ventana nativa y check | PASS | PASS |
| Casilla activada: se genera PRG WASD | 12.049 bytes | 20.481 bytes |
| Casilla desactivada: vuelve al exportador anterior | TEST299 | LVLLVL |

Las pruebas de ejecución de la CPU 6502 realizadas anteriormente para A→W→D→S→A→D→W→S verificaron **cero diferencias** entre el resultado ASM y el desplazamiento esperado de códigos/colores/bitmap. **Todavía falta la prueba real en VICE del usuario.**

## Acceso

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test304-bgfont-wasd-hardscroll.zip

---

# TEST304 — BGFONT hard-scroll por caracteres completos con WASD (solo teclado)

## Actualización de interfaz — SCREEN → Ricos Manual Scroll...

La opción experimental está en el menú **SCREEN**, inmediatamente después de **Crop To Selection**. Abre un diálogo nativo de LVLLVL titulado **Ricos Manual Scroll**. No hay botón flotante.

La vista previa permite elegir **MAPA** o **GRUPO** y usar exclusivamente **A, W, D, S**, una celda por pulsación. **EXPORTAR PRG WASD (MAPA)** está dentro del diálogo y no modifica **Export PRG** normal.

La vista MAPA en Bitmap Multicolor funciona aunque no exista ningún Group Animate, porque captura el bitmap y sus C1/C2/C3 directamente del frame. El diálogo captura WASD únicamente mientras está abierto.

**Validación interna:** ítem único de SCREEN, diálogo nativo abierto, cuatro movimientos de WASD simulados, desactivación al cerrar, captura del Bitmap MC estático. Exportación PRG HiRes y Bitmap MC con ocho pulsaciones ASM simuladas y sin diferencias. **Pendiente prueba real en VICE.**

---

**Fecha:** 25 de octubre de 2026. **Rama:** `release/test304-bgfont-wasd-hardscroll`  
**Estado:** módulo WEB, exportador PRG WASD, ASM 6502 y pruebas automáticas PASS. **Pendiente visual/velocidad en VICE real**. El MASTER, TEST247 PASS, TEST297 PASS y TEST299 permanecen intactos.

## Propósito

Investigar y convertir en **features paralelas** la técnica de BGFONT: desplazamiento circular de una matriz de 40×25 caracteres completos. A diferencia del scroll por píxeles, no desplaza bits internos; reconstruye el mapa de destino moviendo celdas completas.

Solo se usa **W A S D** (sin joystick, sin flechas) tanto en la WEB como en VICE:
- **A** = izquierda
- **D** = derecha
- **W** = arriba
- **S** = abajo

Un evento de teclado mueve **una celda de 8×8 píxeles de pantalla**. En modo Bitmap Multicolor son 4 muestras de píxel multicolor en el eje horizontal, no ocho muestras de dos bits; para desplazar dos celdas, pulsar dos veces. Cada tecla se procesa **una vez por pulsación**; soltar y volver a pulsar para otro paso. Es intencional para analizar costuras.

## Interfaz de la WEB

Abrí **SCREEN → Ricos Manual Scroll...** desde el menú del editor. Se muestra un diálogo nativo con:
- Captura el frame, banco y bitmap actuales sin modificarlos.
- Muestra una vista previa 320×200 a escala, que acepta únicamente las cuatro letras WASD cuando el panel está abierto.
- **MAPA (colores móviles):** desplaza circularmente todos los códigos de pantalla, 8 bytes gráficos por celda en Bitmap MC, Screen RAM C1/C2 y Color RAM C3. En HiRes desplaza índices y color FG por celda.
- **GRUPO (colores fijos):** remapea los IDs del Group Animate seleccionado, manteniendo cada posición física con sus atributos de color. No cambia el resto del mapa.
- Botones **Reiniciar**, **Recargar proyecto** y **Verificar 4 direcciones**.
- **EXPORTAR PRG WASD (MAPA)**: genera un PRG autónomo para inspección manual en VICE. No sustituye ni intercepta el menú normal Export PRG.

Al panel no se le asignan flechas ni control de joystick. El código del PRG **no lee $DC00/$DC01 para joystick**: recorre exclusivamente las columnas y filas de la matriz física correspondientes a W/A/S/D.

## Exportador PRG WASD — modos admitidos

**HiRes Character (8×8)**
- Dos pantallas: $4400 y $4800, fuente de 256 glifos en $5000.
- Al desplazarse MAPA, mueve 1000 códigos y sus 1000 colores de primer plano.
- Color RAM se alimenta desde buffers en $2800/$2C00.

**Bitmap Multicolor (8×8 y 16 colores locales)**
- Doble banco VIC-II: bitmap $6000 / $E000 (8000 bytes c/u), Screen RAM $5C00/$C400 (1000 bytes c/u).
- Colores C1/C2 de Screen RAM se desplazan como atributos por celda; C3 de Color RAM usa buffers $3800/$3C00 (1000 bytes c/u).
- Conserva todos los valores de color 0–15, sin convertir la imagen a MC Character ni reducir el atlas.
- BGFONT-inspired circular movement: sobre cada nueva imagen, código ASM copia únicamente celdas enteras en las cuatro direcciones. Para Bitmap MC, el *stride* de la fila es 320 bytes, para char 40 bytes.
- **Al presentar el paso, el programa desactiva temporalmente la visualización** mientras copia Color RAM, después intercambia el banco/pantalla y vuelve a activar la imagen. Esto evita presentar una mezcla de colores viejos/nuevos, pero podría producir un **breve negro/flicker en VICE**; está pendiente de comprobación. No confundirlo con el motor sin parpadeos de TEST297.

Los dos PRG funcionan con `$01=$35`, interruptores enmascarados y lectura directa de CIA1:
- `$DC00=$FD`: columna 1; W fila 1 (bit 1), A fila 2 (bit 2), S fila 5 (bit 5).
- `$DC00=$FB`: columna 2; D fila 2 (bit 2).
- Restauración de columnas a `$FF` tras la lectura, con estado de tecla para esperar liberación. Joysticks y cursores **no controlan nada**.

### Nota sobre el alcance

**El PRG WASD solo implementa por ahora MAP SCROLL de celda entera.** Group Scroll por carácter (colores fijos) se prueba mediante vista previa WEB, no mediante PRG. No incorpora scroll fino, combinación de animaciones, SID, Ping Pong ni diagonales del player. No debe sustituir aún a un exportador MASTER.

## Resultados verificados por código

**Pruebas de scroll circular de 40×25**, tanto horizontales, verticales como diagonales en la función WEB: mover y deshacer conserva exactamente tiles, 8000 bytes bitmap, 1000 screen y 1000 color.

**Simulación de programa PRG ASM 6502, pulsaciones físicas W/A/S/D en CIA1**: dos PRG autónomos compilados y ejecutados por el emulador de instrucciones, con secuencia exacta:
`A → W → D → S → A → D → W → S`

| PRG | Tamaño | Bytes ASM | Cambios simulados | Diferencias entre C64 y referencia JS |
|---|---:|---:|---:|---|
| Char HiRes | 20.481 B | 1.060 | 8 | **0** en códigos y Color RAM |
| Bitmap Multicolor | 12.049 B | 1.198 | 8 | **0** en bitmap, Screen RAM y Color RAM |

Esto prueba los datos producidos por el código ASM bajo pulsaciones simuladas; **no mide velocidad real, badlines, DMA ni funcionamiento de todas las teclas en VICE físico**. Los PRG no contienen joystick ni lectura de flechas.

## Instrucciones para la prueba

1. [Abrir WEB TEST304](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/).
2. Cargar el proyecto y abrir **SCREEN → Ricos Manual Scroll...**. Seleccionar **MAPA**.
3. Presionar **A/W/D/S** una tecla por paso; probar las cuatro direcciones, volver al origen, revisar las costuras y colores.
4. Cambiar a **GRUPO** para comprobar cómo se desplazan los patrones con colores físicos fijos; recargar si se cambia el grupo seleccionado.
5. Seleccionar MAPA y pulsar **EXPORTAR PRG WASD (MAPA)**. Se descarga un archivo específico de modo como `RICO_TEST304_WASD_BITMAP_MC.prg`.
6. Abrir ese PRG en **VICE** y usar exclusivamente **A/W/D/S**, con pulsar-soltar-pulsar. En MC Bitmap comprobar las costuras y los 16 colores; indicar si hay pantalla negra breve durante cada paso.
7. La opción normal **Export PRG** sigue siendo la misma de los tests anteriores. No promover este PRG a motor principal sin un PASS explícito.

## Siguientes features paralelas posibles

- **TEST305**: extender el PRG con el modo GROUP WASD y C1/C2/C3 anclados (actualmente disponible solo como preview).
- Optimizar la transferencia de Color RAM para presentar con doble buffer sin negro perceptible; requerirá raster y medición de VICE.
- Variar tamaño del paso entre 1 y 2 celdas para comparar los scrolls Bitmap MC de 4 y 8 píxeles multicolor lógicos.
- Integrar esta visualización en un menú EDIT/SCREEN solo después de validar la feature; por ahora botón aislado de pruebas.

## Entregables

- **WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/
- **ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test304-bgfont-wasd-hardscroll.zip
- **Código:** `TEST/test304-bgfont-wasd-hardscroll/js/RICO_WASD_HARD_SCROLL_TEST304.js`
