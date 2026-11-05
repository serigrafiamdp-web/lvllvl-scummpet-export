# TEST336 — Recuperación de frames existentes y animaciones combinadas

**Fecha:** 05/11/2026. **Estado:** prueba aislada; todavía **NO PASS en VICE**. Parte de TEST335, que corrigió la corrupción progresiva del SID. Se mantienen sin cambios el editor principal TEST329 y los checkpoints anteriores.

## ¿Qué estaba roto?

Los motores multiframe **ya existían** y fueron construidos en TEST53 (cambio de frame/duración), TEST205 (Left/Right con duración y fondos), TEST206 (almacenamiento compacto) y TEST327 (animación individual por carácter).

En la integración posterior de ECM TEST328/331, `H.build` volvió a recopilar el **editor completo** en lugar del frame virtual que TEST205/206 ya le había entregado. La llamada topó con `TEST186: Map Scroll horizontal ancho requiere un solo frame`, incluso con un sistema multiframe correcto. Además:

- TEST327 tenía una exclusión para cualquier proyecto de varios frames con una animación individual configurada.
- TEST205 usa la dirección de Zero Page **$30** para `direction205`, mientras TEST327 la empleaba para `anim175_ptr_lo`. Si se habilitaba el doble motor sin separar esas variables, se podía corromper la dirección de scroll.
- La compactación ECM de cada frame se hacía independientemente; cuando el frame cambiaba, los mismos índices físicos podían representar dibujos distintos.
- El monitor TEST331 bloqueaba ECM multiframe antes de elegir el motor.
- El motor compacto TEST206 tenía otra cadena de recopilación que perdía la unión de animaciones de todos los frames.

## Cambios TEST336 (sin reinventar el motor de frames)

1. **Reutilización TEST205:** cada frame se recopila en su contexto virtual; el código de cambios de frame y sus tablas originales **se conservan**.
2. **TEST206 compacto recuperado:** varios frames utilizan el mismo planificador y el almacenamiento comprimido existente; se integra ECM y se hace unión de animaciones de todas las frames, no solo la primera.
3. **TEST327:** se eliminó la exclusión de ensayo, usando un único clock continuo de animadores individuales que aparecen en cualquiera de los frames. En multiframe, punteros temporales de animación pasan de **$30–$34** a **$70–$74**, evitando la colisión con `direction205=$30`. El comportamiento del motor individual monoframe se preserva.
4. **ECM compartido:** la compactación de los glifos visibles se hace con la unión de todos los mapas; preserva fuentes animadas en índices independientes y remapea los destinos grupales. Cada frame puede actualizar sus cuatro registros **$D021–$D024** mediante tablas propias; el charset no cambia de significado al cambiar de frame.
5. **SID:** se conserva el arreglo de TEST335, con asignación dinámica de las tablas de Color RAM para evitar sobrescribir las fuentes de Group/Ondas.
6. **Map Scroll OFF dentro de la secuencia:** se conserva como un frame fijo de duración propia; no elimina los demás.
7. **Sin modificar el documento:** todo el repaque ECM es una copia privada durante Export PRG.

## Pruebas realizadas

Las pruebas son **de generación de ASM mediante ensamblador simulado**, no de compilación real ni VICE:

| Configuración | Resultado |
| --- | --- |
| 2 frames 60×25, Map Left/Right, Group Ondas + Individual, Text Mode | Genera ASM con frame-index, duraciones, grupo e individual |
| 2 frames, mismas animaciones, ECM | Genera ASM; cuatro fondos por frame, asignación global de glifos |
| 2 frames, mismas combinaciones, con SID | Genera ASM; conserva la ruta SID y scratch en $C000 |
| 5 frames, buffer compacto TEST206, Text/ECM | Genera ASM; calendario de frames y animaciones |
| 5 frames, compacto y ECM, con SID | Genera ASM; cinco sets de fondo y glyphs compartidos |
| Frame 1 Left (12 ticks), frame 2 OFF (30 ticks), frame 3 Right (7 ticks) | Tablas `$0c,$1e,$07`; velocidad cero en frame 2 |

El código genera las rutinas de `frame_index205`, `duration_tick205`, `group182_step`, `anim175_tick` y, cuando hay ECM, las tablas de fondo `frame336_bg1..3`.

## Límites y faltantes que NO deben confundirse con regresiones

- Esta integración recupera **multiframe horizontal Left/Right y frames sin Map Scroll**. TEST53 mantiene su ruta histórica de 40×25; **multiframe de mapas grandes Up/Down/diagonal** todavía utiliza otros exportadores y necesita reconectar sus datos, no afirmar que se arregló aquí.
- El motor compacto TEST206 reutilizado tiene buffers de **5 KiB**; hasta **102 columnas** por buffer. No se ha portado el almacenamiento compacto de más de 102 columnas para 3+ frames.
- **ECM** continúa teniendo 64 patrones físicos simultáneos por charset; los duplicados se fusionan sin destruir el JSON. Si los frames necesitan más de 64 patrones distintos en conjunto, falta streaming de charset.
- **Varios grupos simultáneos** y la animación individual y grupal sobre el **mismo glifo físico** todavía requieren compositor de efectos. Los motores actuales pueden dar errores técnicos y no deberían omitir un efecto.
- Los recursos compactos pueden invadir otras zonas RAM en diseños mucho mayores; hay que validar el PRG ensamblado y el runtime, especialmente con grupos grandes/SID. No declarar PASS universal por generar ASM.
- El clock de caracteres individuales es **continuo** al pasar de frame: no reinicia automáticamente su fase. Si el usuario desea reinicio de fase por frame, es una opción adicional pendiente.

## Prueba en VICE PAL

1. Abrir [TEST336](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test336-frames-recovered/) y actualizar con Ctrl+F5.
2. Cargar **el mismo JSON** y SID que ya funcionaron en TEST335; configurar 2 o 3 frames visualmente distintos con duraciones diferentes.
3. Map Scroll Left/Right y al menos un grupo Ondas y una animación individual en caracteres distintos. Export PRG en ECM.
4. Confirmar visualmente que Frame 1 → Frame 2 → Frame 3 cambian **a su duración correcta**, sin apagar Group/Individual ni perder fondos. Dejar reproducir para descartar corrupción SID.
5. Repetir con un frame sin Map Scroll y, cuando pase, con más frames.
6. En consola, inspeccionar `window.RICO_TEST336_FRAME_REPORT` y `window.RICO_TEST335_COLOR_LAYOUT`.

**TEST335 permanece como checkpoint del arreglo SID:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test335-sid-color-ram-collision/

**No promocionar TEST336 como PASS hasta la prueba real del PRG en VICE.**
