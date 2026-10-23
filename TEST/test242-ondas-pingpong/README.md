# TEST242 — ONDAS vs. PING PONG ATÓMICO (23/10/2026)

Base: TEST240 aislado. **La web principal, TEST239, TEST240 y los MASTER aprobados no se modificaron.**

## Evidencia ONDAS
Referencia visual: captura entregada por el usuario `2026-10-23 14-03-36.mkv` (10 s, 1920×1080, 50 fps).

- **ONDAS Left/Right/Up/Down**: mantiene el algoritmo anterior de Ping Pong del TEST240. Cada columna/carácter se escribe progresivamente en el charset visible; con 8 píxeles/tick produce la deformación ondulante aprobada conceptualmente y ahora renombrada ONDAS.
- **PING PONG Left/Right/Up/Down, sin Map Scroll**: TEST242 prepara en charset no visible ($3000/$3800) y cambia el registro VIC-II $D018 dentro de IRQ cuando se completó el grupo. La preparación sigue siendo incremental y respeta la fase de ida/vuelta; se elimina la escritura parcial en el charset visible. Al exportar se duplican los glyphs iniciales del banco visible a ambos buffers, solo en el PRG temporal. Los datos del proyecto original quedan intactos.
- Compatibles BANK 1 y BANK 2 como banco visible del PRG. No se fuerza Map Scroll.

## Arquitectura del nuevo Ping Pong atómico
- `group182_step` sigue ejecutando la rutina ASM calculada por el compositor de grupo, pero los punteros de destino aplican `EOR group240_target_xor` para escribir al charset staging.
- `group240_swap_request` se activa al concluir una fase; la IRQ ejecuta `D018 XOR 2` solo con el banco completo.
- `group240_target_xor XOR 8` cambia el destino para la siguiente preparación.
- Cola de ticks acotada para evitar acumulación indefinida si el grupo excede el presupuesto por frame. Se preserva la coherencia visual, pero un grupo muy grande puede ralentizar los cambios de fase.

## Validación técnica realizada
- Sintaxis JS: PASS.
- Generación de fuente ASM: ocho opciones grupales × BANK1/BANK2; sin etiquetas duplicadas.
- Pendiente: ensamblado real del editor y validación visual/velocidad en VICE. **NO marcar PASS**.

## Compatibilidad y pendientes
- Los mapas vertical/horizontal/diagonal conservan el algoritmo progresivo del TEST240; las variantes ONDAS pasan mediante alias a ese mismo compositor.
- Para Ping Pong + Map Scroll todavía hay que incorporar la conmutación atómica coordinada con los buffers de pantalla. No afirmar que esta ruta ya es atómica.
- La vista previa muestra el desplazamiento ideal del grupo, no simula el desfasaje de escritura que produce ONDAS en la C64.
- Blink, Frames, Switch Bank y múltiples grupos simultáneos requieren sus propias pruebas de integración.

URL de prueba: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test242-ondas-pingpong/
