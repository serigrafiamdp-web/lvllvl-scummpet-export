# TEST260 — Map Scroll + Group Animate + Animación individual de caracteres

**Estado:** TEST DE INTEGRACIÓN ASM, pendiente de VICE. Se parte de **TEST259** sin fusionar con MASTER VIERNES 23 OCTUBRE ni sobrescribir ningún PASS previo.

## Diagnóstico confirmado en el código

**1. Motor diagonal TEST196/259:** su colector leía `groupFromStore` pero NO recogía los `tile.props.animated` ni los ticks de las animaciones individuales del TileSet. El mapa podía desplazarse correctamente mientras los caracteres animados permanecían estáticos: ausencia de generación de animación nativa. La rutina de grupo sí estaba definida, pero podía sufrir falta de tiempo de CPU bajo cargas de scroll.

**2. Motor horizontal ancho TEST186/220:** reconocía que había caracteres individuales animados y emitía un error explícito. No tenía scheduler que ejecutara junto con Map Scroll esos efectos, aunque sí disponía de `group182_step`.

**3. Motor vertical TEST168/175:** ya incluye `anim175_tick` para izquierda/derecha/arriba/abajo/blink junto con `group182_step`, pero el `main182_background` priorizaba SIEMPRE al grupo mientras hubiera tareas de grupo pendientes; bajo estrés podía postergar la animación individual. Esto no acredita que fuera la única causa visual, pero sí es un problema real de prioridad.

## Reparación de TEST260

### Diagonales en las cuatro direcciones

- El colector ahora pasa por un hook mínimo `RICO_TEST260_CHAR_ANIM.attach`: identifica todos los caracteres usados en el mapa y animados en Bank1 y Bank2, con tipo y ticks individuales; conserva los índices de usuario y **no recrea la moldería**.
- Reutiliza literalmente las subrutinas de animación de caracteres del motor C64 TEST175 (cinco efectos, un registro de cinco bytes por glifo). Se alojan después del código de color directo en **$C400..** con RAM de estado propia.
- El `main_group` ahora reparte tiempo entre `group182_step` y `anim175_tick`, sin cambiar la prioridad de preparar un marco de mapa pendiente. Cuando ambas colas tienen trabajo, alterna turnos en lugar de dejar al grupo siempre adelante.
- Para rutas 3-IRQ TEST254/257/259, incrementa la petición de animación individual en **la primera fase raster**, no tres veces por cuadro PAL. Para dos franjas TEST244, lo hace una vez en la fase media. El fallback diagonal genérico lo hace una vez en su IRQ de pantalla.
- No modifica el scroll fino, `plan_step`, el Color RAM, los 16 colores, la cámara, los dos bancos de 2048 bytes, ni los raster 86/132/218 del motor rápido.

### Left / Right (motor horizontal ancho)

- Se retira SOLO cuando está instalado TEST260 el rechazo de animaciones individuales. El colector horizontal llama el mismo hook de TileSet para obtener records reales.
- Se agrega un scheduler individual, con alternancia para `group182_step`, manteniendo Map Scroll en primer lugar.
- Cuando hay animación nativa en un mapa multicolor sin grupo, se desactiva el optimizador RLE de Color RAM que podría ocupar el nuevo bloque de código. Si otra ruta todavía necesita la zona de memoria, se rechaza la exportación con explicación, nunca se descartan cuadros.
- El motor horizontal 40 columnas / proyecto clásico heredado puede tener un despachador distinto: **no se afirma cubrir todos sus submodos sin pruebas específicas**.

### Up / Down (motor vertical de mapa grande)

- Conserva `collectAnimations175` y todas las rutinas 6502 existentes.
- Cuando hay simultáneamente Grupo e individuales, la cola se atiende mediante turnos alternados. Reserva **$39 ZP** como flag de justicia, inicializado en cero; group $35–$38 y native $30–$34 no se tocan.
- Si hay solo Grupo o solo individuales, el ASM vertical queda idéntico al anterior.

## Restricciones legítimas

- Si un mismo carácter/banco está seleccionado simultáneamente para Group Animate e individual, ambas rutinas escribirían el mismo bitmap de ocho bytes. Se rechaza con mensaje claro para evitar anular uno de los dos efectos.
- Más de un Group Animate o Switch Bank en exportador diagonal no se ignora silenciosamente: se informa que falta el scheduler pertinente.
- Solo se generan animaciones individuales de caracteres realmente referenciados por el mapa; se conservan BANK1 y BANK2, las cinco transformaciones `left`, `right`, `up`, `down`, `blink` y ticks 1..255.
- Los modos RLE y grupos demasiado grandes que amenacen RAM C400..CFFF no deben forzarse. La RAM del motor y de los charsets tiene prioridad sobre ganar FPS.

## Monitor VICE para Diagonal / Horizontal

**Cuando haya al menos una animación individual incluida**:

```
m cfe0 cfe4
```

| Byte | Significado |
|---|---|
| $CFE0 | Firma **$60** (TEST260) |
| $CFE1 | Versión **$01** |
| $CFE2 | Número de IRQ PAL que solicitan animación individual (módulo 256) |
| $CFE3 | Veces que el main loop atendió `anim175_tick` (módulo 256) |
| $CFE4 | Veces que el main loop atendió `group182_step` (módulo 256) |

Para un mapa con grupo e individuos visibles, $CFE2, $CFE3 y $CFE4 deberían aumentar, aunque con velocidades distintas. Un contador igual a cero luego de varios segundos indica que se debe investigar esa cola. Esos contadores NO sirven para el motor vertical, cuyo código ya contiene anim175 nativo y cuyo ajuste es solo el reparto de turnos. Los valores son módulo256 y pueden envolver.

## Validación ya realizada

- Revisión del código real de los tres exportadores y detección de las causas anteriores.
- **24 combinaciones diagonales**: cuatro sentidos × 1/4/8 px × grupo sí/no, 2 animaciones individuales Bank1 y Bank2: 0 colisiones de memoria, 0 branches fuera de ±127 antes de instrumentar; confirmación final de marcadores y contadores sobre 24 combinaciones sin errores.
- **12 combinaciones horizontales**: Left/Right × 1/4/8 px × grupo sí/no: 0 colisiones y 0 branches ASM fuera de rango en la generación; confirmación final de firma $60 y contadores sobre las 12 variantes sin errores.
- **24 combinaciones verticales**: Up/Down × 1/4/8 px × Grupo sí/no × nativo sí/no; se aplica reparto de turnos **solo** en los seis casos que tienen ambas animaciones; cero errores de generación.
- `attach` con tres caracteres animados usados de Bank1/Bank2 detecta correctamente tipo, dirección, ticks y dirección física de charset. Conflicto con carácter de grupo y Group no reconocido: se comprobaron errores explícitos.
- Las 36 variantes Diagonal/Horizontal con nativas de TEST260 contienen **CFE0=60, CFE1=01 y los tres contadores**. Las nuevas instrucciones de contador agregan unos pocos ciclos de CPU y por eso no se deben comparar directamente sus FPS con un TEST sin instrumentar.
- **No hay todavía PRG probado en VICE**. Validación ASM estática no equivale a PASS de ejecución ni prueba definitiva de que el fenómeno original está resuelto.

## Prueba ordenada en VICE

1. [ABRIR TEST260 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test260/), mismo TERRY, Bank1, C64 PAL, Warp OFF.
2. En un carácter usado por el mapa, configurar Scroll Individual **Left, 1 tick**; Map Scroll **Diagonal Up Left 8px / 1 tick**, exportar y comprobar si el glifo se anima mientras el mapa sigue desplazándose.
3. Añadir Group Animate sobre **otros caracteres diferentes**, exportar: el grupo y la animación individual deben verse al mismo tiempo. Leer `m cfe0 cfe4`: esperamos `60 01` y ambos contadores de ejecución creciendo.
4. Repetir **Diagonal Up Left 4px / 1 tick** para comprobar que TEST259 mantiene scroll fino y la animación nativa al mismo tiempo.
5. Probar **Left / Right horizontal ancho** con Map + Grupo + individuales en caracteres separados.
6. Probar **Up / Down vertical** con Group e individuales, verificando la alternancia cuando haya más trabajo.
7. Si falla alguna combinación, conservar los bytes monitor, modelo de VICE y el PRG. No fusionar el código hasta tener un PASS visual específico.

## Enlaces y rollback

- TEST260 web aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test260/
- TEST260 ZIP completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test260-diagonal-map-group-individual.zip
- Documentación: `docs/TEST260_MAP_GROUP_INDIVIDUAL_INTEGRATION.md`
- Rama de referencia TEST259 (sin modificar): https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test259-up-diagonal-fine-fast
- MASTER VIERNES 23 OCT: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026

**No declarar PASS ni reemplazar MASTER mientras no veamos los tres subsistemas coexistiendo en VICE.**
