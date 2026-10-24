# TEST270 — C64 Import: cada captura agrega una frame

**Fecha:** 24/10/2026. **Base:** TEST269 Oil's Well Warp — PASS confirmado por el usuario. **MASTER 24/10 intocable.**
**Estado TEST270:** simulación positiva, **pendiente PASS visual del usuario en la web**.

## Objetivo y flujo

1. Abrir **Import → C64 Formats**, cargar `ricos oil.prg` e iniciar la partida.
2. En **Oil's Well · Nivel** elegir **1** y pulsar **Warp** (o entrar al nivel normalmente).
3. Pulsar **Import** (botón inferior derecho) o **Capture → New Frame** (debajo del emulador). **No se cierra** el cuadro.
4. El primer Import utiliza la Frame 1 vacía si el documento estaba en blanco.
5. Ir a **Nivel 2** con Warp, volver a pulsar **Import**. La nueva pantalla se guarda en **Frame 2**.
6. Repetir hasta terminar, con un frame por nivel. El editor selecciona siempre la frame recién capturada.
7. Cerrar con **Cancel** o la X cuando terminen todas las capturas.

### Comportamiento y protección

- Inserta con `editor.graphic.insertFrame(lastFrameIndex)` y selecciona con `editor.frames.gotoFrame(newFrameIndex)`. **Nunca inserta en el medio** ni pisa un frame anterior.
- Cada frame conserva su mapa de 1000 celdas, Color RAM (color `fc` por celda), fondo, borde, MC1 y MC2 **propios** en la estructura de LVLLVL.
- El primer frame toma el charset del VIC de **2048 bytes** (corrige la lectura nativa de 2000 bytes), guarda el tileset una sola vez. En las siguientes capturas compara los glifos que se utilizan en la pantalla; si cambiaron se niega a sobrescribir el tileset global de las frames anteriores.
- Esta versión solo soporta **un mismo modo gráfico (Text o C64 Multicolor)** en una capa; si el modo cambia, muestra un aviso y no crea una nueva frame.
- Si el proyecto tiene gráficos existentes incompatibles con el charset o modo de la nueva captura, no los sobreescribe: pide abrir un proyecto vacío.
- Si la grilla existente no es 40×25 y no es la primera frame vacía, no la redimensiona silenciosamente.
- El botón **Import** permanece abierto únicamente cuando el tipo cargado es `prg` (incluyendo `d64` y `crt` a los que el importador original asigna ese tipo). Otros importadores conservan su cierre y comportamiento anterior.
- No afecta la memoria del juego ni el Warp TEST269; el emulador sigue corriendo. La lectura VIC pausa/reanuda momentáneamente el núcleo cuando estaba ejecutándose.

### Limitaciones expresas del primer prototipo

- Captura la **pantalla de caracteres 40×25** visible en la memoria del VIC. No reconstruye automáticamente raster-splits bitmap/charset, sprites, niveles más grandes, mapas comprimidos, cambios de charset por nivel ni bancos múltiples.
- Oil's Well mezcla modos por raster; si la lectura se produce durante fase bitmap se informa que hay que **comprobar visualmente la captura**. Se conserva el comportamiento de lectura básica del importador original.
- El charset se comparte entre frames. No se implementa todavía un tileset distinto por nivel; si hay un conflicto de glifos usados el importador protege las capturas anteriores.
- Los controles **Warp**, **Joystick**, **Drive**, **Reset** y el emulador ampliado de TEST267/268 se mantienen iguales.

## Prueba específica

- Frame 1: ir al Nivel 1, importar, constatar Frame 1.
- Frame 2: usar Warp al Nivel 2, importar, constatar Frame 2 y que el diálogo siga abierto.
- Frame 3: usar Warp al Nivel 3, importar, constatar Frame 3.
- Cerrar Import, navegar entre Frame 1/2/3, comprobar que **sus mapas y colores NO cambian** cuando se captura otro nivel.
- Reabrir el cuadro solo después de guardar el trabajo, pues el importador nativo reinicia la C64 al abrir la ventana.

## Validación

Simulación JS de UI y estructura real de la API LVLLVL: **PASS**. Se comprobó Frame 1 → Frame 2, selección del nuevo frame, preservación del mapa/color anterior, no cierre de diálogo, lectura 2048 B, protección de charset modificado y conservación del cierre original para formatos no PRG.

No se declara PASS en navegador ni en VICE sin validación del usuario.

## Entregables

- **WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test270-c64-import-frames/
- **ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test270-c64-import-frames.zip
- **Release:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test270-c64-import-frames
- **MASTER congelado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026

**Arquitectura:** sólo añade `TEST/test270-c64-import-frames/js/RICO_C64_IMPORT_FRAMES_TEST270.js` y el `index.html` del TEST. Conserva código núcleo, 6502, WASM y exportadores sin cambios.
