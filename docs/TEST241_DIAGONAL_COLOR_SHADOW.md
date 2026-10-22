# TEST241 — Scroll diagonal: desplazamiento incremental del buffer sombra de color

**Base:** TEST240 (incluye fix TEST239 de Bank 1). **Estado:** PASS en pruebas de fuente/simulación; PENDIENTE VICE. No promover a MASTER sin PASS del usuario.

## Por qué

Eliminar píxeles aislados apenas ayuda si el carácter sigue teniendo algún píxel visible. En las rutas multicolor de fallback, el motor preparaba los 1000 colores del próximo frame desde los datos del mapa, incluso cuando casi todos eran simplemente los colores de la pantalla desplazados diagonalmente.

## Cambio único

- Conserva `diag_shift221` de caracteres, IRQ, `prepare_sparse_colors203`, `commit_sparse_colors203`, $D018, SID y ambas BANKs.
- Solo cuando se utiliza un fallback multicolor con `fastRows`, sustituye la rutina `diag_colors221` por una copia **en el mismo buffer sombra `$0C00-$0FE7`**.
- Desplaza los colores por el salto diagonal de 39 o 41 bytes, en orden ascendente o descendente según solapamiento de origen/destino, y reconstruye únicamente la columna y fila entrantes a partir de las tablas de mundo.
- Los mapas con RLE de TEST236/240 activo no se modifican. Los monocolor tampoco. Tampoco Group Animate.
- Nunca copia los 1000 colores completos en IRQ: evita el fracaso de TEST238.

## Verificaciones

- **2880 movimientos** (4 diagonales, tres anchos, tres alturas, 80 fases) del algoritmo de buffer sombra comparados contra la reconstrucción total; sin discrepancias en simulación.
- **96 exportaciones sintéticas** de fuente ASM cubriendo cuatro diagonales, dos bancos, mapas mono/multicolor, tres densidades y dos anchos: 36 modificaron solo el subprograma `diag_colors221`; 60 permanecieron idénticas. No hubo errores de transformación.
- Sintaxis de módulo: PASS.
- Sin medición de ciclos real todavía; PRG final no ensamblado ni validado en VICE.

## Prueba

Web aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test241/

ZIP de rama completa: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test241-diagonal-inplace-shadow.zip

Comparar con TEST240, usando exactamente el mismo mapa multicolor, BANK1, las cuatro diagonales, 8 px/tick y ticks/step=1.

Consola después de exportar: `window.RICO_TEST241_LAST_BUILD`. Si `selected:true`, se activó el nuevo desplazamiento sombra. Si `selected:false`, la ruta RLE u otro motor quedó sin cambios y no se debe esperar aceleración en TEST241.

Verificar: velocidad, colores, bordes superior/laterales, retorno de cámara, Bank1 y música opcional. Ante cualquier corrupción volver a TEST240; no modificar MASTER.
