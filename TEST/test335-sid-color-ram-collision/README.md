# TEST335 — Causa concreta de corrupción progresiva con SID

**Fecha: 05/11/2026. Test experimental, todavía sin PASS en VICE.** Se parte de TEST334 y se conserva su protección Zero Page y el orden Graphics First. La raíz TEST329, TEST332, TEST333 y TEST334 permanecen intactos.

## Diagnóstico real del PRG del usuario

Archivo recibido: `TERRY NUEVO 2 (19).prg` (44.801 bytes incluyendo dirección de carga). LOAD $0801, final de imagen $B6FF.

Observaciones directas del binario:

- El motor de Group Animate está en **$A000** y sus fuentes de dibujo se extienden por **$B000–$B6FF**.
- El motor de colores de pantalla contiene instrucciones de escritura indexada en **$B000, $B100, $B200, $B300** y en **$B400, $B500, $B600, $B700**. Direcciones concretas: `$22D8: STA $B000,Y`, `$22D4: STA $B400,Y`, `$2300: STA $B100,Y`, `$2324: STA $B600,Y`.
- Hay **datos no nulos de animación** en los rangos a los que apunta el motor de colores: 344 bytes en $B000–$B3FF y 219 bytes en $B400–$B6FF.
- El SID empaquetado en el PRG está en **$1000**, con INITIALIZE que configura el chip; su PLAY en **$1024** contiene solo `RTS` (código $60). Eso confirma que, en este PRG, la música no necesita escribir en el mapa para que exista la colisión.

**Causa confirmada:** TEST228/229, al incorporar SID, sustituía referencias a las tablas temporales de Color RAM `$1000–$17FF` por `$B000–$B7FF`. Su verificación antigua únicamente detectaba marcadores explícitos `*=$Bxxx`, no datos que **comenzaban en $A000 y continuaban hasta $B700**. Las escrituras periódicas de Color RAM terminaban machacando fuentes de Group/Ondas durante el scroll. El fallo se acumula aunque el SID PLAY sea una rutina vacía.

## Corrección del módulo TEST335

- Nueva asignación **dinámica de 2 KiB**, en páginas alineadas, para tablas temporales de posiciones y valores de Color RAM.
- Recorre todos los segmentos de código/datos declarados en el ASM, contabilizando los `!byte` continuos y no solo los `*=` explícitos.
- Reserva CPU ZP/stack, BASIC/screen buffers, los dos charsets $3000–$3FFF, el archivo SID original y la zona $D000–$FFFF.
- Prefiere **$C000–$C7FF** cuando está libre (en el PRG analizado estaba libre). Prueba otros bloques y evita cualquiera que se cruce con el código, mapas, colores o datos de grupo.
- Sustituye solamente las referencias indexadas correspondientes al scratch temporal original y deja de usar la zona $B000 por defecto.
- Si no existe ningún bloque libre, **falla con un mensaje técnico** antes de generar un PRG corrupto. No elimina glifos, Group Scroll, Ondas, Map Scroll ni datos ECM.
- Diagnóstico `window.RICO_TEST335_COLOR_LAYOUT`: `base`, `end`, `references`, `groupRegions`, `dynamic`.

## Pruebas de generación realizadas

| Caso | RAM asignada | Resultado |
| --- | --- | --- |
| Group con datos $A000–$B8FF | $C000–$C7FF | Correcto |
| Grupo + ocupación de $C000–$C7FF | $C800–$CFFF | Correcto |
| Grupo + ocupación de $C000–$CFFF | $5000–$57FF | Correcto |
| Fuente sin Group | $C000–$C7FF | Correcto |

Los casos se probaron sobre las funciones del adaptador real y verifican que las referencias a `$1000–$1700` se trasladan sin solapar la fuente. **No se ha compilado con ensamblador 6502 real ni ejecutado en VICE** en esta sesión.

## Prueba para confirmar PASS

1. Abrir [LVLLVL TEST335](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test335-sid-color-ram-collision/).
2. Cargar el mismo diseño y **el mismo SID** que generaron `TERRY NUEVO 2 (19).prg`. Activar SID a 50 Hz manual, sin cambiar Group/Ondas ni colores.
3. Exportar y ejecutar en VICE al menos durante el intervalo que antes tardaba en aparecer la corrupción.
4. Comprobar en consola `window.RICO_TEST335_COLOR_LAYOUT`. Si indica `$C000`, las listas de Color RAM ya no escriben sobre $B000–$B7FF.
5. Repetir horizontal y diagonal. El checkpoint sin SID TEST332 sirve como control.

Si persiste otro problema visual, comparar la nueva salida real, pero **no volver a mover IRQ ni Zero Page sin examinar las escrituras concretas**.

[TEST335](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test335-sid-color-ram-collision/) · [TEST334](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test334-sid-zp-sandbox/) · [TEST332 sin SID](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test332-unified-120x120/).
