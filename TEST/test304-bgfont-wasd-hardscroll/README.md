# TEST324 — Restauración del Bitmap Multicolor real y WASD

**Fecha: 26 OCT 2026 · Rama:** `release/test324-bitmap-fidelity-wasd-restore` · Base TEST323. **PENDIENTE VICE**.

## Incidente corregido

El usuario reportó TEST323 sin movimiento y con mezcla de gráficos HiRes y Multicolor. Había dos problemas diferentes:

1. Su proyecto tenía el flag `ricoBitmapV1Enabled` activado, aunque el diálogo de exportación dijera «Multicolour Character». TEST323 ofrecía «Interpretar Bitmap como Multicolor Character», pero esa conversión no puede conservar las tres tintas independientes de cada celda Bitmap: altera la imagen y puede producir patrones aparentemente mezclados.
2. El motor VIC-II nativo del mapa vertical (>25 filas, TEST321/322) **solamente acepta W y S**. Si se presionan A/D no se mueve. El selector lo presentaba de forma susceptible de confundirse con WASD completo.

## Cambio TEST324

- **Se elimina por completo la casilla de reinterpretación Bitmap→Character**. No vuelve a exportarse un Bitmap auténtico como matriz de caracteres solo para aparentar velocidad.
- Si se detecta Bitmap Multicolor y estaba elegido «VIC-II original», el exportador **cambia automáticamente a «Avance 8 px»**, actualiza el selector del panel y genera el **Bitmap WASD real** de TEST307, que conserva 8.000 bytes de patrones bitmap iniciales, matrices de Screen/Color RAM y el mapa completo de celdas con 3 bytes por entrada (tile ID + C1/C2 + C3). No cambia la capa ni `ricoBmpColors`.
- Este Bitmap real recupera W/A/S/D y diagonales para el mapa completo de hasta 16 KB de celdas empaquetadas. Sigue usando el motor anterior y por tanto **NO ofrece aún la velocidad del VIC-II Character**.
- Se hace una aserción antes de exportar: si la capa indica Bitmap pero `capture().source.kind` no es `bitmap-mc`, no genera el PRG y muestra error. Evita un segundo caso de «mezcla de modos» accidental.
- Para HiRes y Multicolor Character reales, el motor original VIC-II sigue disponible en su ruta experimental: 40×25 cuatro direcciones; mapas más altos W/S solamente. No existe todavía horizontal nativo ni Bitmap Multicolor rápido sobre mapas grandes.
- Con SID real y motor VIC-II nativo continúa el aviso de incompatibilidad. Para SID + WASD debe seleccionarse el motor de 8 px. No se silencia ni se descarta música.
- Todos los cambios están aislados al panel y su control de exportación. Los motores TEST318/TEST307/TEST321 y el MASTER no se modifican.

## Pruebas internas (no VICE)

Proyecto falso pero representativo de Bitmap Multicolor 40×50 con valores locales C1/C2/C3 diferentes en cada celda:
- Selección inicial `VIC-II original` + Bitmap activo → selecciona automáticamente `Avance 8 px`, genera PRG Bitmap **36.721 bytes**, modo `bitmap-mc`, mapa completo 6.000 bytes, y preserva el estado Bitmap.
- Selección `Avance 8 px` + Bitmap activo → exactamente la misma ruta Bitmap y dimensiones.
- Multicolor Character real (flag Bitmap desactivado) → genera PRG de caracteres, sin activar Bitmap ni reinterpretación.
- Browser index actualiza el módulo del panel con una nueva etiqueta de versión para evitar usar el código TEST323 en caché.

### Cómo probar en VICE

1. Actualizar la WEB con Ctrl+F5.
2. Con tu proyecto actual Bitmap experimental de 40×50, abrir «Rico's Manual Scroll», marcar WASD, seleccionar `Avance 8 px` (o dejar que el programa cambie automáticamente si intentaste VIC-II).
3. Elegir `No Music` para la primera medición y exportar PRG.
4. En VICE, comprobar W/S/A/D y diagonales, especialmente que **no aparezca la mezcla HiRes/Multicolor** y que cada celda conserve los tres colores originales.

**WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

**ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test324-bitmap-fidelity-wasd-restore.zip

**Limitación importante:** no es la solución definitiva de rendimiento. Para igualar/superar el Map Scroll original sin perder el Bitmap por celda se requiere implementar un motor VIC-II específico de Bitmap Multicolor que maneje los planos de 8.000 bytes y los tres colores de cada celda en un mapa grande. No disfrazar Character como Bitmap.

---

# TEST323 — Distinguir Bitmap experimental de Multicolor Character real

**Fecha:** 26 OCT 2026 · Base: TEST322 · Rama: `release/test323-explicit-character-projection`.
**Estado:** validación interna de generador PASS, aún NO VICE PASS.

## Causa confirmada del error de la captura

La alerta original `TEST319 original: solo HiRes Character, Layer Grid; Bitmap no admitido` aparecía aunque la ventana *Export C64 PRG* tuviera marcado **Multicolour Character Mode**. La razón está en TEST279: la modalidad **Multicolor Bitmap (Experimental)** utiliza internamente `layer.getScreenMode()==='c64multicolor'` pero almacena `layer.doc.ricoBitmapV1Enabled=true` y, por frame, datos adicionales `ricoBmpColors` con **tres colores locales por celda**. El selector de exportación normal solo indica el modo base; no refleja ese segundo indicador. Por lo tanto, ignorarlo o borrarlo automáticamente produciría una exportación de colores incorrecta o pérdida de configuración.

## Solución TEST323

1. Se conserva el motor VIC-II original 40×25 (W/A/S/D) y 40×N con N>25 (solo W/S), sin SID, usando la rama TEST322.
2. En `Rico's Manual Scroll` añadimos una casilla **«Interpretar Bitmap como Multicolor Character (solo PRG)»**, por defecto **DESMARCADA**. Solo afecta la exportación cuando está seleccionado `VIC-II original`.
3. Si la capa tiene el modo Bitmap experimental activo y la casilla está desmarcada, se muestra una alerta correcta que explica el conflicto: la exportación dice Character pero la capa sigue en Bitmap, cómo habilitar una interpretación de caracteres y cómo conservar fidelidad Bitmap usando el otro motor.
4. Si el usuario marca la casilla, el PRG rápido usa los **tile IDs, patrones del charset y colores FC 0–15** de la capa como Multicolor Character y configura el VIC-II con el patch TEST264. **No toca la capa, `ricoBitmapV1Enabled`, `ricoBmpColors`, el tamaño del mapa ni los frames guardados.** Las tres tintas locales Bitmap no se reproducen en un renderer Character: los colores de esa exportación pueden diferir notablemente; por eso exige una elección explícita.
5. Si el usuario necesita preservar el Bitmap Multicolor real (tres colores locales por celda), mantiene el motor **«Avance 8 px · TEST318»**. Ese motor es más lento; aún no existe una versión nativa VIC-II de Bitmap MC con esa misma fidelidad.
6. Cuando se ha cargado realmente un SID, el motor `VIC-II original` rechaza la combinación con una explicación clara, en lugar de exportar silenciosamente por la ruta lenta TEST311; elegir **No Music** para medir, o **Avance 8 px** para combinar SID+WASD.

## Pruebas internas

Simulación del flujo real ToPRGAdv con compilador ASM interceptado:
- Capa Bitmap flag=true y casilla desmarcada → **bloqueo claro y sin modificaciones del proyecto**.
- Capa Bitmap flag=true y casilla marcada → **ASM VIC original** con `poll_wasd321`, mapa completo 40×50, patch de `$D016`, `$D022/$D023`, sin cambiar el flag Bitmap.
- Capa Multicolor Character real flag=false → exportación rápida normal, **sin necesitar casilla**.
- Capa Bitmap con SID realmente cargado → bloquea la ruta rápida sin música con aviso específico.
- Capa HiRes → conserva exportación nativa.
- Motor TEST322/TEST321 compartido, Bitmap renderer, proyecto y MASTER no modificados.

Se utilizó ensamblador simulado: aún no hay prueba de ensamblado real ni ejecución en VICE. No marcar PASS definitivo.

## Probar con el proyecto de la captura

Abrir la WEB TEST323, recargar completamente. En `Rico's Manual Scroll`:
- `Export with WASD Scroll Control` ✓
- `Motor PRG`: `VIC-II original · TEST323`
- `Interpretar Bitmap como Multicolor Character (solo PRG)` ✓ **solo si se acepta la interpretación Character**; no representa fidelidad Bitmap.
- Velocidad `Máxima · sin pausa`.
- En `Export C64 PRG`, seleccionar **No Music** y Export Frames **1 To 1**.
- Exportar PRG, comprobar en VICE W/S; en Screen >25 filas A/D sigue pendiente del kernel horizontal.

Alternativa para modo Character puro: **guardar copia** y cambiar en `Screen → Screen Mode` de *Multicolor Bitmap (Experimental)* a *C64 Multicolour Character*; esto desactiva el flag Bitmap, pero los colores por celda se reinterpretan. No hacerlo automáticamente desde el exportador.

**WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

**ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test323-explicit-character-projection.zip

---
# TEST322 — Corrección de dimensiones reales del Screen (26 OCT 2026)

**Motivo:** En la WEB TEST321 el panel bloqueaba todo proyecto salvo exactamente Screen 40×25 o Screen 40×50 y un único frame, incluso al seleccionar *Export Frames: 1 To 1*. Un usuario trabajando en Multicolor Character recibió esa alerta al exportar.

**Nueva rama:** `release/test322-native-vic-dynamic-map-geometry`. Base TEST321. TEST321/TEST320/TEST319 y MASTER intactos.

## Cambio concreto

- El panel identifica dimensiones **reales de Screen**, independientes de Rico's Window: 40×25 mantiene motor W/A/S/D TEST319/320. Todo mapa con **ancho ≥40 y alto 26..255** usa el motor original de mapas grandes TEST168 adaptado TEST321, **solo W/S**. Se elimina el bloqueo por 40×50 exacto.
- Se permiten documentos con varios frames SI la exportación pide **1 To 1**. El motor experimental usa únicamente frame 1 y no modifica los demás. No soporta transición multiframe ni exportación de otros rangos.
- Para Screen más ancho que 40, usa una **proyección temporal 40-columnas** empezando en el X de Rico's Window (limitado a los bordes del Screen). Eso deja intacto el documento, conserva **todas las filas**, pero no habilita todavía scroll horizontal sobre el ancho total del Screen.
- Multicolor Character conserva el módulo TEST264: VIC $D016 bit4 y $D022/$D023, colores de celda 0..15 mixtos HiRes/MC. Bitmap Multicolor sigue fuera de esta ruta nativa.
- La alerta de dimensiones ahora incluye **Screen W×H y cantidad real de frames** detectados. Si el Screen tiene menos de 40 columnas o 25 filas, se informa el requisito concreto y no se genera un falso PRG.
- Sin SID, sin diagonales en mapa grande. No modificar los motores originales compartidos TEST168/TEST77, ni las otras rutinas ya validadas. El editor conserva por defecto el motor de 8 píxeles TEST318; el VIC experimental es una selección explícita.

## Validación interna (no equivale a VICE PASS)

Simulando el flujo de exportación con el encoder ASM interceptado, pasaron:
- Multicolor Character Screen 40×50, Window 38×24, frame 1.
- Multicolor Character 40×63.
- Multicolor Character 48×50, Window X=5, proyecta 40 columnas desde X=5 y retiene las 50 filas.
- Multicolor Character 40×100 con 2 frames, Export Frames 1 To 1; solo se utiliza el primero.
- Multicolor Character 40×25 continúa la ruta anterior.
- Screen 39×50 y 40×24 reciben una alerta explícita con medidas reales, no generan PRG.
- Fuente ASM contiene `poll_wasd321`, datos de mapa 40×N y parche MC activo; no se modifican los datos originales.

**Pendiente:** ensamblador real en navegador, ejecución VICE, fidelidad de colores y velocidad en W/S. No marcar PASS antes de la prueba del usuario. Si la WEB informa medidas imprevistas, copiarlas: ahora conocemos cuál de las dimensiones produce el rechazo, sin especular.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test322-native-vic-dynamic-map-geometry.zip

---

# TEST321 — WASD VIC-II con Screen 40×50: primera fase vertical

**Fecha:** 26 OCT 2026. Base TEST320. Rama aislada `release/test321-native-vic-40x50-vertical-wasd`. TEST320, TEST319, TEST318 y MASTER no se modificaron. **No es PASS de VICE.**

## Fallo observado y diagnóstico

El usuario trabaja en **Multicolour Character Mode** con un mapa Screen **40×50** y un solo frame. En TEST320 el selector `VIC-II original` rechazaba explícitamente `gridHeight!==25` con el mensaje `TEST319 original: por ahora solo mapa 40×25...`. Eso no es una deficiencia de Multicolor ni del registro VIC, sino una restricción de tamaño de los núcleos del experimento TEST319/320.

En el repositorio el motor original de Map Scroll de mapas grandes, **TEST168** (`RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js`), trabaja sobre **40×N**, con origen de mapa completo, dos screen buffers, control fino de $D011, gestión de Color RAM y rutinas ASM de avance **vertical Up/Down**. Su scroll horizontal para pantallas >25 filas usa un recorte estático de Window a 25 filas y NO permite recorrer todo 40×50 en ambos ejes simultáneamente.

## Implementación

1. Nuevo fork **aislado** `TEST/test304-bgfont-wasd-hardscroll/js/RICO_PRG_LARGE_MAP_WASD_TEST321.js`, copia adaptada de TEST168. El archivo compartido original permanece inalterado.
2. Para **40×50, un frame, HiRes Character o Multicolor Character, sin SID**, el selector `VIC-II original · TEST321` manda un argumento `ricoWASD321:true` al exportador avanzado, que usa el motor de mapa 40×50 y un lector CIA1 de teclas:
   - **W:** motor rápido vertical Up
   - **S:** motor rápido vertical Down
   - **A/D:** **aún no disponibles en el motor nativo de mapa grande**. No se simula una falsa ruta lateral. Para desplazamiento A/D en 40×50 elegir **Avance 8 px · TEST318**.
3. `prep_request` inicialmente 0 para que la pantalla quede quieta sin teclas; `poll_wasd321` solo en estado sin preparación pendiente, para mantener la coherencia de buffers/colores. En el IRQ se programa W/S; main_loop prepara el siguiente buffer en RAM, `commit_fast8` intercambia screen y aplica colores; al finalizar se consulta nuevamente el teclado. Se conserva la rutina original, sin sustituirla con copia manual TEST317.
4. Para vista 38×24 en el editor, durante exportación se usa una **vista hardware de 40×24** sobre el mapa 40×50 (sin editar coordenadas ni recortar el origen del mapa). Si el usuario tenía 40×25 se usa 40×25. La gestión de Scroll Area vertical usa la altura real de 50 filas.
5. El módulo **TEST264 Multicolor** continúa adaptando todas las escrituras de $D016 (bit4), $D022/$D023 y conservando Color RAM por celda: HiRes 0..7, Multicolor 8..15. **Bitmap Multicolor queda bloqueado**. No declarar compatibilidad Bitmap.
6. Para **40×25** sigue la ruta TEST319/320 con cuatro direcciones WASD. Para otro tamaño, uso del motor 8px anterior o mensaje claro. Todos los elementos de datos del proyecto se leen para exportar sin mutar el original.

## Pruebas internas

- Exportación simulada de flujo completo ToPRGAdv+TEST264+TEST321+panel: **40×50 Multicolor Character, Window 38×24**, genera ruta grande, detecta lector W/S, Map Screen=40×50, VIC Multicolor habilitado, colores compartidos y proyecto sin cambio de altura.
- 40×50 HiRes con vista 40×25 genera el mismo motor grande sin activar Multicolor.
- 40×25 Multicolor conserva ruta TEST320, sin truncamiento.
- 40×50 Bitmap MC no pasa al motor de caracteres.
- El test emplea un **ensamblador simulado**, no prueba el ensamblado real ni la ejecución de VICE. No afirmar que W/S sea PASS antes de validarlo.
- **Limitación:** aún no hay desplazamiento horizontal nativo 40×50 ni diagonales. No se promete superar la velocidad del Map Scroll tradicional. TEST168 dispone de modos de color adaptativos: un mapa denso en colores distintos puede costar más CPU que uno uniforme.

## Prueba sugerida

Abrir WEB TEST321, cargar **el mismo proyecto Multicolor Character de 40×50**, un frame, **sin SID**. En `Rico's Manual Scroll`:
- `Export with WASD Scroll Control`: marcado.
- `Motor PRG`: `VIC-II original · TEST321 (HiRes / Char MC)`.
- `Velocidad`: **Máxima · sin pausa**.
- Exportar **PRG**. Ejecutar en VICE PAL y mantener **W**, luego **S**, invertir W/S y observar que use todas las 50 filas y conserve colores.
- Para A/D por ahora cambiar a `Avance 8 px · TEST318`.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test321-native-vic-40x50-vertical-wasd.zip

**Estado:** fuente y ruta de exportación comprobadas; VICE pendiente. Las rutinas horizontales originales 40×25 y el MASTER están intactos.

---

# TEST320 — WASD del motor original VIC-II en Multicolor Character

**Fecha:** 26 OCT 2026. **Rama experimental:** `release/test320-native-vic-character-multicolor`. Base TEST319, TEST318/MASTER no modificados.

## Problema

El usuario confirmó una mejora notable de TEST319 HiRes, pero indicó que Multicolor seguía mucho más lento. El motivo verificado en el programa es que TEST319 bloqueaba explícitamente `layer.getScreenMode()==='c64multicolor'` y, al seleccionar el motor anterior, la exportación se realizaba por rutinas de reconstrucción de pantalla, no por los núcleos rápidos de `step_left/right/up/down`.

## Solución delimitada

- El selector de Rico's Manual Scroll ahora muestra `VIC-II original · TEST320 (HiRes / Char MC)`.
- **Multicolor Character (no Bitmap)** puede seguir la misma ruta rápida de Map Scroll VIC-II que HiRes, reutilizando el motor ASM experimental TEST319.
- **Se conserva el módulo TEST264 ya probado para activar el bit4 del registro $D016** en todos sus puntos de escritura, sin perder los bits de scroll fino / CSEL. Las paletas compartidas MC1/MC2 van a **$D022/$D023**. Color RAM conserva el valor exacto `0..15` de cada celda (bit3 selecciona HiRes/Multicolor por carácter). No convertir los códigos de color ni forzar un modo global sobre las celdas HiRes.
- Se sigue sin aceptar **Bitmap Multicolor**, marcado en el proyecto con `layer.doc.ricoBitmapV1Enabled`, porque requiere copiar 8.000 bytes bitmap y no se puede manejar con un kernel de pantalla de 1.000 caracteres. Esa modalidad sigue utilizando el motor anterior cuando el usuario lo selecciona. Para Bitmap se necesita un motor de fine-scroll y raster específico, que NO se entrega aquí.
- Continúan las restricciones del motor VIC experimental: **1 frame, 40×25, sin SID, cardinal W/S/A/D individualmente; no diagonales; no mapa 40×50 todavía**.
- `js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` ORIGINAL compartido permanece sin modificaciones: se usa el fork aislado `TEST/test304-bgfont-wasd-hardscroll/js/RICO_PRG_MAP_SCROLL_NATIVE_TEST319.js`. TEST264 original permanece sin modificaciones. Solo se amplía la elegibilidad de Multicolor Character dentro del panel.
- La opción `Avance 8 px · TEST318` sigue elegida por defecto, para conservar exportaciones anteriores.

## Pruebas internas

- Simulación de flujo real de exportación con el wrapper TEST264 + fork TEST319: HiRes exporta sin parches MC; Multicolor Character exporta con cuatro escrituras de $D016 parcheadas (`ORA #$10`) y configura $D022=6, $D023=11 para el fixture de prueba; el usuario puede elegir otros colores según el proyecto.
- El mock conserva el tipo `TEST320 VIC-II MULTICOLOR CHARACTER + WASD`, devuelve bytes PRG y usa el encoder ASM original. El mismo proyecto Bitmap MC se rechaza explícitamente; sin TEST264 se rechaza la exportación para evitar un modo HiRes falso.
- El test utiliza un ensamblador simulado; **NO es PASS de ensamblador real ni de VICE**. La corrección de ritmo, colors, mixed-cell bit3 y latencia todavía requiere grabación de VICE.

## Cómo validar en VICE

1. Cargar un proyecto **Multicolor Character** de 40×25 con un frame. Si se trata de **Bitmap Multicolor**, no es esta prueba.
2. Abrir **Rico's Manual Scroll**, activar el checkbox WASD y seleccionar `VIC-II original · TEST320 (HiRes / Char MC)`, velocidad Máxima, sin SID.
3. Exportar PRG y ejecutarlo en VICE PAL. Mover W/S/A/D. Confirmar desplazamiento, ausencia de arte estático, multiceldas con color 8–15 y celdas HiRes de color 0–7, sin parpadeos ni deformaciones.
4. Comparar con la ejecución HiRes TEST319 y registrar velocidad sobre el mismo mapa.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test320-native-vic-character-multicolor.zip

**Estado:** pruebas internas de ruteo y parches MC correctas; VICE PENDIENTE. **No reemplazar TEST319, TEST318 ni MASTER.**

---

# TEST319 — WASD sobre el motor original de Map Scroll VIC-II

**Fecha:** 25/10/2026. Rama aislada: `release/test319-native-vic-wasd-cardinal`. Base: TEST318. **Estado: experimento para VICE, no PASS ni MASTER.**

## Objetivo

Reutilizar el motor ASM de Map Scroll tradicional (TEST77: fine-scroll de $D011/$D016, `step_up/step_down/step_left/step_right`, doble buffer, preparación anticipada, colores dispersos), agregando el movimiento manual mediante WASD, en vez de seguir reconstruyendo toda la pantalla con el motor de avance de 8 píxeles de TEST318.

**Alcance de esta primera prueba**: **HiRes Character; Screen 40×25; un solo frame; sin SID; direcciones W/S/A/D individualmente; 8 píxeles por tick elegido**. No se ha implementado todavía desplazamiento diagonal simultáneo, mapa grande 40×50 ni coexistencia musical en este nuevo motor. Son las próximas fases si el sistema original responde correctamente.

## Cómo utilizarlo

1. Abrir la WEB TEST319.
2. Cargar un proyecto HiRes Character de **40×25**, con **1 frame**. No Bitmap Multicolor ni mapa de 40×50 en esta primera prueba.
3. Desde **Interfaz → Rico's Manual Scroll...**, marcar `Export with WASD Scroll Control`.
4. En el selector **Motor PRG**, elegir `VIC-II original · TEST319`. La opción `Avance 8 px · TEST318` sigue siendo el valor predeterminado, para preservar los PASS previos.
5. Mantener velocidad **Máxima** para comenzar. Exportar PRG normal, sin seleccionar SID.
6. Ejecutar el PRG en VICE PAL y mantener W / S / A / D. Observar el fine-scroll del VIC-II, la inversión de dirección y los colores. Comparar contra TEST318 usando la misma imagen y el mismo formato 40×25.

El selector de velocidad usa **ticks por paso** para el motor original (Máxima=1, 2/4/8/12 = ticks por paso), mientras que en el motor TEST318 utiliza las pausas adicionales previamente implementadas. No se deben comparar las etiquetas como si fuesen equivalentes en tiempo real.

## Cambios técnicos

- El código original compartido `js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` permanece **idéntico a TEST318**. TEST319 agrega un solo fork experimental dentro del directorio de la prueba:
  `TEST/test304-bgfont-wasd-hardscroll/js/RICO_PRG_MAP_SCROLL_NATIVE_TEST319.js`
- `index.html` de esta WEB utiliza dicho fork en lugar de cargar el módulo original compartido. Sus cambios se activan **únicamente** cuando la exportación lleva `ricoWASD319:true`. El resto de los modos sigue el camino original del antiguo TEST77/TEST168.
- `RICO_WASD_HARD_SCROLL_TEST304.js` agrega selector de motor al panel ya existente y envía la exportación con bandera experimental al `ToPRGAdv.createPRG` original, sin pasar por el generador de pantallas completas TEST307/318.
- En la rutina original C64, al comenzar se deja `scroll_type=0`. En cada IRQ, `poll_wasd319` consulta CIA1 `$DC00/$DC01`, detecta W/S/A/D y asigna dinámicamente `scroll_type=1/2/3/4`. Sin teclas, `scroll_type=0`, por lo que no avanza. Si hay preparación de pantalla, colores pendientes o bloqueo del motor, aplaza el cambio para respetar sus operaciones ya iniciadas.
- A diferencia de TEST318, el movimiento usa la **rutina de fine-scroll original y su preparación de colores**, no la copia completa del bitmap ni `colorShift317`.
- Una dirección se acepta por IRQ (prioridad W, S, A, D si se sostienen varias teclas). **No hay diagonales simultáneas en TEST319** y el cambio rápido de eje necesita validación real. No declarar que soporta diagonales en esta primera fase.
- Cuando la opción original está elegida en un proyecto distinto de HiRes 40×25 y 1 frame, aparece un error explícito y **no se exporta falsamente una pantalla fija**. Para proyectos grandes, elegir el motor TEST318.

## Verificaciones internas

- El generador JavaScript original más su bandera TEST319 crea el ASM de teclado + las cuatro rutinas de Map Scroll original: PASS de estructura.
- No se detectaron etiquetas ASM duplicadas en el fuente de 2.508 líneas generado para 40×25, y todas las referencias esperadas están presentes.
- Con un ensamblador simulado se comprobó que la ruta `ToPRGAdv` recibe correctamente la bandera, y una exportación normal sin bandera retorna a su exportador original, sin mutaciones.
- Prueba del formulario: exportación TEST319 HiRes 40×25 llama a `ToPRGAdv`; casos 40×50 y Multicolor se detienen con mensajes explícitos.
- **Pendiente:** ensamblado real con el ensamblador LVLLVL en navegador y ejecución VICE; timing PAL, calidad visual, inversión W↔S y A↔D, cambios de eje y respuesta en reposo. Si falla, registrar error y no marcar PASS.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test319-native-vic-wasd-cardinal.zip

---

# TEST318 — Corrección de borde derecho en scroll visual hacia izquierda

**Fecha:** 25 OCT 2026. Nueva rama aislada: `release/test318-left-border-raster-colors`, basada en TEST317. TEST317 queda intacto como referencia de velocidad. Estado: PASS simulación CPU 6502, **pendiente prueba VICE**.

## Motivo

El usuario observa una pequeña anomalía transitoria de color en el borde opuesto al scroll de la imagen hacia izquierda (tecla A en el PRG HiRes, cámara +X). TEST317 terminaba con Color RAM correcta en el simulador, pero ejecutaba `STA $D018` para activar la pantalla nueva ANTES de copiar toda Color RAM y repintar el borde derecho. El VIC podía dibujar filas de la pantalla nueva con colores viejos mientras el CPU actualizaba $D800–$DBE7; es tearing de Color RAM temporal, no necesariamente un fallo de indexación.

## Solución acotada de TEST318

Solo para **HiRes Character 40×25 sin SID**, movimiento **A (visual izquierda, sin diagonal)**:

- Conserva `renderDelta315` con doble buffer y actualización del borde entrante.
- **No cambia a la pantalla nueva inmediatamente.** Emplea `colorShiftLeftRaster318`: 25 pequeños bloques ASM, uno por fila, sincronizados con el raster PAL `58+8*fila` (58, 66, …, 250). Cada bloque actualiza la Color RAM de su fila DESPUÉS de que el VIC terminó de mostrar esa fila de la imagen antigua.
- Cada bloque mueve 39 colores a izquierda, en orden creciente (seguro ante solapamiento), y **escribe explícitamente el último color de la columna derecha** desde la sombra destino `$2800` o `$2C00`, usando el banco real de destino. No depende del dato previamente arrastrado ni permite que ese borde quede pendiente al avanzar a la siguiente fila.
- Solo después de actualizar las 25 filas se ejecuta el cambio de Screen RAM ($D018). Se omite la copia de color de TEST317 para ese movimiento, porque ya quedó completada antes del flip.
- El programa HiRes de pantalla completa ahora usa $0810–$263B para ASM y tablas ROW/COL en $3000–$35FF. Color shadows $2800 y $2C00 y video banks $4400/$4800 permanecen en sus direcciones anteriores sin superposición.
- **Todas las demás direcciones (D, W, S y diagonales) usan exactamente el núcleo de Color RAM de TEST317**. Próximas optimizaciones deben tratarse independientemente; no afirmar que se eliminaron todos los posibles efectos de tearing.
- Bitmap Multicolor, Multicolor Character, HiRes viewport 38×24, ruta SID, Map Scroll tradicional y exportador manual/checkbox/velocidad quedan idénticos byte a byte a TEST317.

## Verificaciones internas

- Compilación JS + encoder PRG: PASS, 7.724 bytes de ASM; termina en $263C antes de los buffers de color que empiezan en $2800.
- Simulación CPU 6502 con raster temporal simulado, mapa 40×50, arranque cerca de wrap (39,49), cuatro posiciones de cámara en las ocho direcciones: **8/8** con cero diferencias de Screen RAM y Color RAM. En movimiento A se observó el avance por filas y la escritura del borde derecho antes del flip.
- Comparación binaria contra TEST317: seis variantes (Bitmap 40×25/38×24, Char MC 40×25/38×24, HiRes 38×24) permanecen **idénticas byte por byte**. Solamente cambia HiRes 40×25 sin SID.
- Esta simulación NO modela el robo de ciclos VIC en badlines ni sustituye un video real VICE. Las rutinas por raster PAL deben validarse visualmente con movimiento sostenido. No marcar como PASS final ni MASTER sin prueba VICE.

## Cómo probar

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test318-left-border-raster-colors.zip

En modo HiRes 40×25 con el proyecto de caras, **sin SID**, abrir Rico's Manual Scroll, marcar Export with WASD Scroll Control, Máxima / sin pausa, exportar PRG. Sostener A (imagen hacia izquierda), observar **columna derecha** y comparar con TEST317: evaluar si desaparece la franja / residuo de color y registrar velocidad. Probar W+A después, pero esa diagonal usa todavía el motor TEST317.

---

# TEST317 — HiRes, Color RAM in-place y actualización de bordes (25/10/2026)

**Base preservada:** TEST315, referencia empírica VICE ~16,7 pasos/segundo. Branch `release/test317-color-ram-inplace-scroll`. No se modifican TEST315, TEST316, TEST314, TEST313, TEST311 ni MASTER.

## Hipótesis y alcance

TEST315 copia la pantalla + otra sombra de 1.000 colores a un segundo buffer, hace el intercambio de pantalla y después reescribe 1.000 bytes de Color RAM. TEST316 aceleró algunos accesos pero no logró mejorar la cadencia sostenida observada. TEST317 reemplaza esa secuencia para **HiRes Character de ventana completa 40×25 sin SID**, conservando los colores originales por celda.

**Cambios concretos:**

1. `renderDelta315` sigue reconstruyendo el offscreen *screen matrix* 40×25 y dibuja solamente los bordes entrantes, pero **evita copiar los colores de 960-975 celdas de un shadow al otro**; solo pinta en la sombra destino los colores de filas/columnas nuevas.
2. Al cambiar de screen bank durante el raster ~252, `colorShift317` **desplaza directamente los colores ya existentes en Color RAM $D800-$DBE7**, con 8 rutinas especializadas para W/S/A/D y las cuatro diagonales. Para no pisar los bytes que aún debe leer, el sentido de copia es creciente con desplazamientos +1/+39/+40/+41 y decreciente con desplazamientos -1/-39/-40/-41.
3. Las transferencias de Color RAM procesan **8 bytes por iteración**, con resto generado directamente; los bordes nuevos (40 para una fila, 25 para una columna) se rellenan desde las sombras de colores a las que el renderer escribió los códigos correctos al dibujar el borde.
4. Para disponer de ~4,6 KB de ASM especializado, las tablas de direcciones ROW/COL del **modo HiRes de pantalla completa únicamente** se ubican en $3000-$35FF. El núcleo empieza en $0810 y termina antes de $2000. Bitmap MC y otros tamaños conservan tablas $1000-$15FF y ejecutable idéntico a TEST315.
5. El SID no se modifica ni participa: `RICO_FULLMAP_SID_WASD_TEST311.js` se conserva **byte por byte** de TEST315. Los menús, el checkbox WASD, el selector de velocidades y el Map Scroll tradicional tampoco se modifican.

**Importante:** sigue copiando la pantalla de caracteres al buffer secundario; lo que se evita es copiar la sombra completa de colores además del commit completo. No se promete 1 frame PAL ni compatibilidad con todas las restricciones de raster y Color RAM sin prueba VICE.

## Mediciones de simulador 6502 (sin VIC DMA / no son VICE)

Mapa 40×50, viewport 40×25, inicio cámara (39,49), 4 capturas de pantalla por dirección, con valores de carácter y color distintos por celda:

| Dirección | TEST315 | TEST317 | Resultado simulado |
|---|---:|---:|---|
| W | ~58.966 ciclos | ~39.318 ciclos | 3 a 2 frames |
| S | ~58.971 ciclos | ~39.311 ciclos | 3 a 2 frames |
| A | ~58.970 ciclos | ~39.319 ciclos | 3 a 2 frames |
| D | ~58.971 ciclos | ~39.312 ciclos | 3 a 2 frames |
| W+A | ~58.976 ciclos | ~58.972 ciclos | 3 frames, pendiente |
| W+D | ~58.968 ciclos | ~39.321 ciclos | 3 a 2 frames |
| S+A | ~58.967 ciclos | ~39.413 ciclos | 3 a 2 frames |
| S+D | ~58.968 ciclos | ~39.317 ciclos | 3 a 2 frames |

PASS interno 8/8: **cero discrepancias en 1.000 caracteres de pantalla y 1.000 colores en cada captura** tras desplazamientos repetidos y wrapping. W+A no mejora en número entero de frames con este modelo; seguir investigando ajuste de cadencia y coste del border renderer.

- Comparación binaria de los PRG entre TEST315 y TEST317: **Bitmap Multicolor, Mixed Character y HiRes con ventana 38×24 son idénticos byte por byte**. Solo cambia el binario HiRes 40×25 de viewport completo.
- El programa HiRes optimizado mide 4.591 bytes de ASM ($0810-$19FE), con Lookup Tables por encima en $3000-$35FF.
- La simulación no modela el bus ocupado por VIC-II ni la apariencia real del commit de colores. Los writes directos a Color RAM pueden mostrar tearing si no se coordinan con el barrido; **evaluar visualmente en VICE antes de aceptar PASS**.

**Objetivo de prueba de usuario:** Mismo proyecto HiRes 40×50, vista 40×25, WASD activado, `Máxima · sin pausa`, SID NO cargado. Capturar A/D, W/S y W+A durante movimiento continuo a 50 FPS y comparar con TEST315. Confirmar fidelidad de colores y ausencia de líneas/colores parpadeantes.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test317-color-ram-inplace-scroll.zip

**Estado:** simulación CPU PASS; **VICE pendiente**, no incorporar al MASTER.

---

# TEST315 — HiRes Character: reutilizar buffer + pintar únicamente bordes

**Fecha:** 25 OCT 2026. Base: `release/test314-character-row-index-speed`. Rama nueva: `release/test315-border-only-char-scroll`.

**Objetivo:** superar el motor TEST314 que dibujaba los 1.000 caracteres visibles por cada paso WASD de 8 píxeles; conservar el programa, colores, scroll completo, diagonales y SID. Esta es una primera prueba experimental de optimización, NO un MASTER.

## Nueva técnica ASM de TEST315

- Conserva ambos screen buffers HiRes ($4400/$4800) y ambas sombras de Color RAM ($2800/$2C00). Cada salto de cámara **copia la zona de solapamiento** desde la pantalla previamente visible al otro buffer, ya desplazada 1 fila/columna de caracteres.
- Para cada movimiento horizontal, solo consulta el mapa completo para **una columna entrante**. Para movimiento vertical, solo consulta el mapa para **una fila entrante**. Para diagonal, consulta ambas (sin necesidad de mantener 1.000 búsquedas).
- Punteros de copia 6502: `$E0-$E1` pantalla origen, `$E2-$E3` pantalla destino, `$E4-$E5` colores origen, `$E6-$E7` colores destino. El movimiento positivo desplaza el puntero origen y el negativo el destino, sin pisarse porque son dos buffers.
- Borde nuevo: `deltaFetchCell315` obtiene solamente las celdas nuevas de `MAP=$8000` mediante las tablas ROW/COL de TEST307/311, respetando Scroll Area, wrapping y la Window 38×24 / 40×25. Se copian exactamente los códigos y colores 0..15, incluyendo bit3 HiRes/Multicolor por celda.
- Al final conserva el flip VIC sincronizado en $D012 y commit completo de Color RAM, ya probados. **Todavía no se optimizó el commit de 1.000 colores**, importante para un futuro TEST316.
- Detecta cancelación W+S/A+D y no muestra un buffer sin actualizar. Viewports de una sola fila o columna mantienen por seguridad TEST314.
- Multicolor Character mixto funciona también SIN SID (antes únicamente estaba permitido en el exportador híbrido), sin forzar la resolución por celda.
- El motor **Bitmap Multicolor** (8.000 bytes de bitmap) no participa de esta optimización, permanece **idéntico byte a byte** a TEST314, con y sin SID.

## Mediciones y límites

- TEST314 HiRes, 40×25, salto diagonal sostenido: ~98.278 ciclos CPU simulados entre los dos últimos movimientos.
- TEST315 HiRes, 40×25, avance continuo W/A: ~58.969 ciclos simulados entre los dos últimos movimientos. No atribuir toda esta diferencia a solo el tipo de dirección; medir las dos versiones bajo las mismas condiciones antes de declarar una mejora porcentual formal. La primera evidencia es una reducción importante del trabajo interno del renderer.
- Verificación del código binario: TEST315 usa ~1.743 bytes de núcleo sin SID y ~1.931 bytes en la ruta con SID / Mixed Character, por debajo del espacio $0810–$0FFF.
- Simulación 6502 sin SID: 24 casos (4 direcciones y 4 diagonales, tres configuraciones de mapa/viewport/wrap), cero errores de screen/color, sin detener el scroll. **PASS interno**.
- Simulación con SID sintético: W+A, D y S+D en Mixed Character, 3 pantallas verificadas por cada prueba, cero errores de celda, $D016 y $D022/$D023 conservados; el reproductor llegó a PLAY (la duración de estas simulaciones es demasiado corta para validar el ritmo musical). **PASS gráfico interno / audio real pendiente**.
- Comparación byte por byte: Bitmap MC 36.721 bytes con y sin SID, exactos entre TEST314 y TEST315. **PASS regresión**.

## Qué no se debe afirmar todavía

- No hay prueba real en VICE de esta versión; el usuario debe comprobar la velocidad, fluidez y estabilidad.
- No se alcanzaron los 50 pasos por segundo del Map Scroll tradicional: cada nuevo paso todavía exige copiar aproximadamente 1.000 bytes de screen, 1.000 bytes de color shadow y luego actualizar Color RAM.
- No es un desplazamiento fino de 1 píxel: el manual WASD continúa saltando 8 píxeles por paso, en las 8 direcciones.
- No se alteró Map Scroll tradicional HiRes/Char MC reconectado en TEST313 ni sus parámetros Ticks/Step / Pixels/Step. La prueba del rendimiento debe hacerse en **Manual Scroll con WASD marcado** y **Máxima / sin pausa**.

**WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

**ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test315-border-only-char-scroll.zip

---

# TEST314 — Primer rendimiento del avance por carácter (25 OCT 2026)

**Base exacta:** TEST313. Solo se optimizaron los dos generadores PRG del Manual Scroll: `RICO_FULL_MAP_WASD_TEST307.js` y `RICO_FULLMAP_SID_WASD_TEST311.js`. Los motores de Map Scroll tradicional y su selección TEST313 siguen intactos. No se modificaron los proyectos guardados ni los demás PRG, incluyendo TEST312/311/307 PASS y MASTER.

## Optimización ASM

El motor anterior reconstruía todos los caracteres visibles tras cada movimiento y, dentro del bucle de 1.000 celdas, ejecutaba aritmética de 16 bits para actualizar **tres punteros**: mapa, Screen RAM y color shadow. TEST314 evita esos incrementos 16-bit por celda para los dos tipos de carácter:

- `$E8` = índice de columna de destino (0..windowWidth-1). `$E9` = offset de origen (2 bytes por celda), desde la base del mapa calculada una vez por fila.
- `LDA (map),Y` (Y = E9) y `STA (screen),Y` (Y = E8) escriben el carácter. Un segundo par escribe su color original (0..15). No normaliza Color RAM: el bit3 continúa seleccionando celdas HiRes vs Multicolor en Multicolor Character.
- Si el origen cruza el borde del Scroll Area, se vuelve al inicio de la fila y E9 se reinicia. Al terminar la fila visible, las direcciones del screen y de su sombra de colores avanzan **40 celdas una sola vez**, conservando viewport 24/25, 38/40, desplazamiento físico y mapa independiente.
- Se conserva doble buffer, VBlank, mapa completo, WASD continuo, diagonales, IRQ SID y sus bancos de memoria sin modificaciones.
- El optimizador solo se activa para **HiRes Character** y **Mixed Multicolor Character** (este último con SID). **Bitmap Multicolor queda íntegramente sin cambios.**

## Benchmarks: simulación 6502, no VICE

| Escenario | TEST313 | TEST314 | Ganancia |
|--|--:|--:|--:|
| Char HiRes 40×25, W+A, ciclos entre pasos 2→3 | 118.045 | 98.278 | -16,7 % |
| Char HiRes viewport 38×24, cerca del wrap, ciclos 2→3 | 117.935 | 98.279 | -16,7 % |
| Char Multicolor mixto + SID, viewport 38×24, ciclos 2→3 | 117.933 | 99.157 | -15,9 % |

**Verificaciones:** todos los píxeles en modo carácter / colores 0..15 de cada pantalla visible comparados contra el mapa completo — 0 discrepancias en los tres casos; con SID preservados $D016 bit4, $D022/$D023, ZP privada del SID y llamadas PLAY. Pruebas de tamaño y reubicación CPU superadas.

**Control de regresión Bitmap MC:** PRG de 36.721 bytes **idéntico byte por byte al TEST313**, con y sin SID. Esto garantiza que el nuevo patch no altera el renderer bitmap ni sus rutas de audio/WASD.

### Limitaciones y siguiente paso

- La versión nueva sigue **reconstruyendo las celdas visibles**: disminuye aritmética dentro del bucle, pero todavía no es una rutina que copie solamente los bordes.
- Un desplazamiento completo sigue siendo **8 píxeles**, no fine-scroll de 1 píxel. El Map Scroll tradicional de TEST313 usa sus kernels originales y no se altera.
- No se puede afirmar 50 pasos/s a partir de este test: 98k ciclos simulados entre pasos es todavía muy superior a ~19,7k ciclos disponibles por cuadro PAL. Además, VICE puede dar resultados diferentes por DMA VIC, IRQ reales y esperas de raster.
- Si este resultado es PASS en VICE, los próximos candidatos son reutilización de buffer previo + actualización de filas/columnas y optimización de commits de Color RAM. Cambiar esas técnicas requiere volver a medir arte, velocidad y estabilidad SID.

**STATUS:** `TEST314 generado; benchmarks de simulador PASS; **PENDIENTE PASS del usuario en VICE**`.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test314-character-row-index-speed.zip

---

# TEST313 — Recuperación Map Scroll tradicional (25 de octubre de 2026)

**Estado:** PASS de ruteo interno y CPU 6502 para movimiento automático Bitmap MC; **pendiente validación VICE** de las rutas tradicionales HiRes/Multicolor Character y de velocidad real. No declarar MASTER.

Base: TEST312. Se conservan TEST312, TEST311 (SID+WASD), TEST310, TEST307 PASS, TEST297 PASS y MASTER.

## Síntoma denunciado

Seleccionar Map Scroll automático en HiRes o Multicolor, exportar PRG y recibir una imagen detenida. Las rutinas tradicionales ya existían, pero las intervenciones de TEST304–TEST312 habían cambiado **la prioridad del exportador**:

- `Editor.prototype.menuClick('export-prg')` abría forzosamente el diálogo ToPRG básico, eludiendo interceptores tradicionales como TEST77, TEST168, TEST203 y el exportador avanzado.
- `ToPRG.prototype.exportPrg()` seleccionaba primero SID estático o TEST299 Group Animate, incluso si había una configuración `ricoMapScrollV1.type` de Map Scroll automático.
- Bitmap MC no comparte el formato del modo de caracteres; usar TEST290/TEST299 sin Group Animate activo podía terminar exportando una pantalla sin movimiento.

## Modificación

La selección ahora lee la configuración real del `graphic.frames[i].ricoMapScrollV1` o del servicio `RICO_TEST57_MAP_SCROLL.getConfig(graphic,i)`.

**SIN checkbox WASD y CON Map Scroll automático configurado:**

- **Char HiRes / Char Multicolor mixto:** llama `ToPRGAdv.prototype.createPRG` y devuelve la selección a los motores ASM tradicionales TEST77/TEST168/TEST203 y TEST228 cuando corresponde SID. No modifica su lógica ni sus ajustes originales `ticksPerStep`/`pixelsPerStep`. Si el exportador falla, no genera silenciosamente una imagen estática como sustituto.
- **Bitmap Multicolor:** el camino de caracteres antiguo NO se utiliza. Se agregó un recorrido cardinal automático que usa el Bitmap MC real y el **mapa completo**, llamando al renderer TEST307 (sin SID) o TEST311 (con SID) con máscaras sintéticas que equivalen a las mismas direcciones CIA1 usadas por WASD. No se requiere presionar ninguna tecla.
- Direcciones Bitmap implementadas en esta fase: **Left / Right / Up / Down**. Máscaras de movimiento automático solo al exportar Map Scroll tradicional; WASD manual sigue con su captura y controles originales.
- **Advertencia importante:** el Bitmap MC automático de TEST313 todavía actualiza **8 píxeles de pantalla por paso**, es decir, un carácter completo. Conserva dirección y avance del mapa, pero **NO recupera todavía el fine-scroll de 1–8 píxeles por paso**. Si `pixelsPerStep` es menor que 8, se usa un intervalo medio aproximado para los saltos de 8px, no los píxeles finos exactos. No se debe afirmar que esta modalidad iguala al scroll fino previo.
- Para otros tipos Bitmap como Ping Pong/Move In/Out, se muestra un error explícito antes de exportar, en lugar de fingir movimiento.
- La opción `Export with WASD Scroll Control` **mantiene prioridad cuando está marcada**: exporta TEST311/TEST307 manual, que ya funcionaban. Para probar Map Scroll automático desmarcarla.

**SIN checkbox WASD y SIN Map Scroll automático:** mantiene ruta normal de exportación de frame estático/animaciones previas, incluido TEST299 cuando sea elegible.

## Pruebas

- Mock del formulario: Char HiRes y Char MC con/sin SID y Map Scroll activo enviaron a ToPRGAdv 4/4; Bitmap MC con/sin SID enviaron al motor bitmap automático, no a ToPRGAdv ni a exportador estático, 2/2; sin Map Scroll usó la ruta normal; WASD activado conservó exportación WASD manual.
- Intérprete 6502 del PRG Bitmap MC: sin teclas pulsadas, imagen desplazó dos veces consecutivas en Left/Right/Up/Down; con SID sintético, avanzó automáticamente en las mismas cuatro direcciones mientras PLAY continuaba (55 llamadas en dos pasos); 0 diferencias en Bitmap, Screen RAM y Color RAM; 0 apagados de pantalla durante movimiento. PASS de 8/8 pruebas internas.
- Programas no probados todavía con VICE real. La ruta HiRes/Char MC está reconectada pero requiere exportación real del proyecto para confirmar correcto rendimiento.

**Siguiente objetivo:** restaurar/optimizar Bitmap MC fino (1–8 px/step) sin perder SID, evitando reconstruir 8000 bytes en cada avance parcial y comparando con las mediciones del Map Scroll tradicional.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test313-restore-traditional-map-scroll.zip

---

# TEST312 — Rico's Manual Scroll / velocidad configurable

25 OCT 2026 · Rama: `release/test312-manual-scroll-speed`

**Origen:** TEST311 con PSID y WASD ejecutándose juntos, confirmado funcional por el usuario. No modifica TEST311, TEST310, TEST307 PASS, TEST297 PASS ni MASTER.

## Solicitud y solución

- **Nombre correcto:** todos los nombres visibles que heredaban el error `Ricos Manual Scroll` pasan a **Rico's Manual Scroll** en el título de la ventana flotante, el menú `Interfaz`, la entrada heredada `SCREEN` y los mensajes. Los identificadores DOM/menús se conservan por compatibilidad.
- **Selector `Velocidad` en la misma ventana flotante**, debajo del checkbox WASD. Son cinco niveles compartidos por editor y exportación. La ventana sigue pudiéndose arrastrar, cerrar y reabrir; las flechas continúan desplazando el editor mientras se sostienen; WASD NO desplaza el editor WEB.
- Valor por defecto **Máxima / sin pausa adicional**, compatible con el ritmo de TEST311. Se conserva la elección mientras el panel está cerrado y al reabrirlo (durante la sesión).
- En el **editor web**, repetición del mouse por nivel: 70, 105, 160, 275 o 420 milisegundos; primer paso instantáneo, repetición tras 140 ms, y stop al soltar/cerrar/blur.
- En el **PRG normal WASD (sin SID)**, tras cada cambio de pantalla y copia de Color RAM se aplica una espera de **0 / 8 / 16 / 32 / 64 cuadros PAL aproximadamente**, sincronizada con VIC-II `$D012`. Sin pausas adicionales en Máxima.
- En el **PRG híbrido SID+WASD**, después del render se guarda el contador de raster IRQ en `$3622`. Antes de aceptar el siguiente paso, el motor exige la diferencia de **0 / 8 / 16 / 32 / 64 interrupciones de video** respecto al contador de `$3621`. La espera ocurre fuera del render y **no retrasa ni desactiva el IRQ musical**, que sigue con el ritmo del PSID/CIA. El SID no cambia de velocidad.
- El motor conserva mapa completo, diagonales simultáneas, Color RAM, Bitmap Multicolor real y caracteres HiRes/Multicolor mixtos, según corresponda a cada proyecto.

| Menú Velocidad | Espera C64 adicional por paso completo | Editor (intervalo hold) |
|---|---:|---:|
| Máxima · sin pausa | 0 cuadros | 70 ms |
| Rápida · +8 cuadros | 8 cuadros | 105 ms |
| Media · +16 cuadros | 16 cuadros | 160 ms |
| Lenta · +32 cuadros | 32 cuadros | 275 ms |
| Muy lenta · +64 cuadros | 64 cuadros | 420 ms |

**Importante:** son pausas *añadidas a la duración del render*. En Bitmap Multicolor el proceso de reconstrucción puede superar varios cuadros incluso en velocidad Máxima. No se promete que el nivel Máxima sea más rápido que el motor existente ni una cantidad exacta de movimientos por segundo.

## Pruebas internas

- JS sintaxis de panel y ambos motores, generación de 5 configuraciones de ASM normal y SID + WASD, todos debajo de `$1000`: PASS.
- 10 pruebas del formulario Export PRG: con/sin SID × 5 velocidades, descarga correctas, checkbox WASD permanece marcado y se genera el nivel solicitado: PASS.
- Prueba DOM simulada: título, selector, pulsación sostenida a velocidad lenta versus rápida, `pointerup`, cierre y limpieza de temporizadores: PASS.
- Simulación 6502 con W+A sostenidas y PSID que incrementa contador en PLAY: video tras segundo desplazamiento cuadro 54 Máxima, 85 Lenta y 118 Muy lenta; audio PLAY avanzó normalmente (54, 85, 118 llamadas). Ningún bloqueo por el selector: PASS.
- **Pendiente:** velocidad real, audio y ausencia de parpadeos en VICE de usuario. No marcar como MASTER hasta esa comprobación.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test312-manual-scroll-speed.zip

---

# TEST311 — SID + WASD EN EL MISMO PRG (25 OCT 2026)

**Objetivo:** resolver el defecto mostrado por el usuario en TEST310: la música SID se escuchaba, pero al exportar se desmarcaba automáticamente "Export with WASD Scroll Control" y el PRG carecía de movimiento.

Estado: PASS de generación y simulación CPU 6502 para mapa Bitmap MC + música PSID + WASD simultáneos. Pendiente prueba real de VICE con el archivo SID original de 3798 bytes. No declarar MASTER sin validación visual/audio.

## Cómo funciona TEST311

- NUEVA ruta **híbrida**, únicamente al marcar WASD y seleccionar SID. Si hay SID y no se marcó WASD, sigue intacta la ruta de TEST310 (música y frame detenida). Si se marcó WASD sin SID, sigue la ruta de TEST307 (scroll mapa completo y diagonales).
- Ya NO se ejecuta `setExportWASD(false)` cuando el SID es solicitado junto con WASD. La selección de la ventana Manual Scroll y del diálogo Export PRG es una única variable compartida que se preserva después de la descarga.
- Con SID + WASD: `RICO_FULLMAP_SID_WASD_TEST311.js` toma el mapa completo / Scroll Area de TEST307 y la información PSID validada de TEST207/229; genera un PRG combinado.
- Dos columnas CIA1 escaneadas independientemente: W+A, W+D, S+A, S+D mueven la cámara en ambos ejes; repetir hasta soltar. Las flechas web del panel siguen siendo la única entrada para mover el arte del editor.
- **IRQ SID** activo mientras se genera una nueva pantalla Bitmap. Se usa el esquema de TEST207 de salvar el bloque ZP `$F0-$FF` del motor, instalar/restaurar el ZP privado del SID durante INIT/PLAY y preservar A/X/Y con PHA/PLA. El cambio de buffer y copia de Color RAM siguen sin escribir DEN=0 en $D011.
- El PSID conserva las direcciones LOAD/INIT/PLAY declaradas (entre $1000-$2FFF). Para evitar superposición, las seis páginas de tablas de mapa que TEST307 tenía en $1000-$15FF pasan a `$3000-$35FF`. `$3600-$361F` contiene bloques privados motor/SID y `$3620` es contador de rate 60Hz fallback. El bitmap / pantallas / color / atlas y mapa packed en `$8000+` no se desplazan.
- Temporización PAL: música raster 50Hz con PLAY por IRQ; si el PSID marca CIA Timer A y se detecta latch fiable, activar el hardware original después de INIT sin sobrescribirlo. Si CIA sin latch detectable, fallback 60Hz con 6 PLAY cada 5 raster frames.
- El módulo SID aislado expone `getRawSID()` para la opción SID avanzada sin tocar PLAY; cuando se usa el selector original **Use A SID File**, se conserva también una copia de los bytes originales en un listener del archivo, por si el exportador nativo almacena solo el cuerpo/bytes procesados.
- La descarga utiliza preferentemente la API `window.download` nativa; conserva fallback Blob.
- También se permite **Multicolor Character mixto** en el motor híbrido: $D016 habilita multicolor, $D022/$D023 se toman del layer, los valores Color RAM 0..7 siguen HiRes y 8..15 multicolor. **Bitmap Multicolor** sigue usando el formato separado real, sin forzar HiRes.

## Pruebas internas

1. Prueba 6502 CPU simulada con SID sintético que incrementa $37FF en cada PLAY y mantiene estado privado en ZP $F0: W+A sostenidas produjeron cámaras (0,0) → (1,1) → (2,2), **21 IRQ/PLAY**, 0 errores al comparar colores, Screen RAM y bitmap visibles, 0 apagados de pantalla. Los ZP privados del SID y del motor permanecieron independientes: PASS.
2. Prueba de integración Export PRG: modo Bitmap Multicolor 40×50, SID detectado, checkbox WASD marcado, descarga `SIX_EYES_SID_WASD.prg`, selección WASD permanece marcada, `NATIVE SID` no intercepta la exportación y no aparecen alertas: PASS.
3. Motor ASM con PSID de 7900 B dentro de $1000–$2FFF: PAL normal 1372 B, CIA hardware 1396 B, CIA sin latch 1390 B, todos terminan antes de $1000 sin superponer tablas, bitmaps ni mapa: PASS.
4. Exportación con SID y checkbox desactivado: ruta musical TEST310 **sin cambios**. Exportación sin SID con WASD: ruta TEST307 **sin cambios**.

**Limitaciones actuales:** el motor híbrido exporta un solo frame del proyecto como mapa navegable completo, hasta 16 KB packed (5.461 celdas en Bitmap MC u 8.192 caracteres en HiRes/Multicolor Character). No integra animaciones simultáneas de frames/Group Animate todavía. Con opción híbrida se debe elegir formato **PRG**, no D64. Hay que validar la velocidad real, las colisiones de SID no reubicables que usan memoria RAM adicional fuera de su región LOAD, el modo CIA y los colores en VICE; una simulación no garantiza fidelidad absoluta en todos los SIDs.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test311-sid-wasd-hybrid.zip

NO se modificaron TEST310, TEST309, TEST308, TEST307 PASS, TEST297 PASS ni MASTER.

---

# TEST310 — Fix ensamblador SID / Bitmap Multicolor

Fecha: 25 octubre 2026. Base exacta: TEST309. **No altera** TEST309, TEST308, TEST307 PASS, TEST297 PASS ni MASTER.

## Error observado (captura del usuario)

Exportar un frame Bitmap Multicolor detenido con SID de 3798 bytes, LOAD $1000, fallaba durante el ensamblado:

`RICO TEST229 SID: TEST207 ASM: unknown value: 14336+$100,x`
`undefined label: color309_data+$100,x`

### Causa

`RICO_BITMAP_SID_STATIC_TEST309.js` generaba `LDA color309_data+$100,X` y expresiones equivalentes para +$200 y +$300. El ensamblador de LVLLVL resolvía la etiqueta como 14336 decimal ($3800), pero no admitía aritmética de etiquetas combinada con indexación X en esa sintaxis. Es un defecto de expresión ASM, **no del SID ni de los datos del arte**.

### Parche mínimo

- `LDA $3800,X` → copia en `$D800,X`
- `LDA $3900,X` → copia en `$D900,X`
- `LDA $3A00,X` → copia en `$DA00,X`
- `LDA $3B00,X` → copia en `$DB00,X`

Se mantienen sin tocar las cuatro zonas de Color RAM, el bitmap completo ($6000), Screen RAM ($5C00), el modelo de datos de TEST282, las llamadas protegidas del SID TEST207/229 y la posibilidad de caracteres mixtos HiRes/Multicolor cuando el proyecto sea de **Multicolor Character**. El archivo del player SID no cambia.

### Pruebas locales de regresión

- Generación del ASM Bitmap+SID sin `color309_data+$... ,X` ni referencias calculadas: PASS.
- Referencias absolutas $3800/$3900/$3A00/$3B00 y destinos D800/D900/DA00/DB00 presentes: PASS.
- Secciones $3800 (color), $5C00 (screen), $6000 (bitmap) y SID INIT/PLAY conservadas: PASS.
- Sintaxis JS de generador y adaptador SID: PASS.

La ruta del SID ya se había comprobado con pruebas simuladas para el caso de 3798 bytes cargado en $1000 y para ~7900 bytes con reubicación del núcleo; estas pruebas **no sustituyen una compilación real en el ensamblador del navegador ni la prueba en VICE**. Pendiente de verificar el PRG visual/audio real por el usuario.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test310-sid-bitmap-asm-colorpages.zip

---

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
