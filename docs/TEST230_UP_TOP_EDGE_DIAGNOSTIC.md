# TEST230 — línea superior en scroll Up a 1 píxel

**Estado:** prueba diagnóstica A/B, todavía sin PASS VICE.

## Síntoma observado

El usuario detecta una línea defectuosa en la parte alta de la pantalla al exportar **Up, 1 Pixel/Step**. El motor aprobado a 8 píxeles (TEST227 PASS) y la ampliación SID de TEST229 no deben tocarse.

## Hipótesis a comprobar

El PRG vertical usa el bit 3 de `$D011` en modo 25 filas (`$18 | fine_pos`). La documentación del VIC-II explica que, para el scroll fino vertical, el modo **24 filas** puede ocultar las líneas de borde que el modo de 25 deja expuestas.

No sabemos todavía si la línea observada procede de ese borde o de otra causa, como el intercambio del doble buffer. Por eso TEST230 ofrece dos exportaciones con el mismo proyecto.

## Variantes A/B

- [A — modo original 25 filas](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/?v=test230&topguard=25) — salida ASM idéntica a TEST229.
- [B — modo 24 filas diagnóstico](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/?v=test230&topguard=24) — solo **Up, Pixels/Step=1, Window Height=25**, cambia en `apply_scroll_regs` `ora #$18` por `ora #$10`; oculta 4 scanlines arriba y 4 abajo. Mantiene datos del mapa y 25 filas en RAM. **No es una solución final de viewport completo**.

El parámetro `topguard` se lee al abrir la web; al cambiar la variante hay que volver a exportar el PRG. No se modifica la configuración guardada del proyecto.

## Controles

La comprobación de 64 combinaciones de tipo (Up/Down), velocidad (1–8), altura de ventana (24/25) y variante (24/25) confirmó:

- 25 filas: ASM íntegramente idéntico al generador original.
- 24 filas de diagnóstico: una sola instrucción inmediata de `$D011` modificada en el único caso elegible.
- Up a 8 píxeles, Down a todas las velocidades, Left/Right, diagonales, SID TEST229: no alterados.

## Próximo paso

Exportar ambos PRG desde el mismo proyecto y comparar en VICE. Si B oculta la línea, corregir la frontera superior **sin sacrificar el área visible de 25 filas**. Si ambos presentan la línea, estudiar el primer badline y la sincronización de fase y doble buffer, no atribuir el defecto al modo 25.
