# TEST349 — REMISERIA EBCM: dos caracteres y fondo negro de K

Estado: EXPERIMENTAL, pendiente de VICE. No se modifica TEST348 ni editor principal. Fecha 09/11/2026.

## Reporte previo

El usuario confirmó que TEST348 resolvió la basura raster, pero la K de frame 9 aparece celeste en lugar de negro y la celda animada de frames 1–8 parece cambiar de color en vez de alternar dos caracteres.

## Diagnóstico del JSON

- Frames 1–8: (X=8,Y=15) alterna t=14, fc=10, bc=0 con t=88, fc=10, bc=1.
- En VIC-II EBCM `t=88` refiere glifo FÍSICO 24 (88 & 63), y `t=14` refiere al glifo físico 14. Son dos dibujos distintos, verificados byte a byte: glifo 14 `[255,0,0,255,255,255,255,255]` y glifo 24 `[255,255,0,0,255,255,255,255]`.
- Frame 9: la K (X=27,Y=8) tiene t=255, fc=1, bc=3. EBCM físico 63; el registro de fondo debe ser el color real, no el número de selector.
- El proyecto no incluye los registros explícitos c64ECMColor1..3 en las frames; bgColor=0 negro.
- En las celdas con `bc == (t>>6)` y t>=64, el campo bc parece guardar el índice lógico EBCM y NO un color de la paleta: tratarlos como color literal 1 o 3 introduce el efecto equivocado.

## Corrección aislada

- Conserva raster temprano comprobado en TEST348.
- Cuando la celda tiene t>=64 y bc coincide con el selector EBCM, resuelve el color real desde el registro ECM de la frame; si no está registrado, usa bgColor global (en este JSON negro).
- Todos los demás fondos directos 0..15 se mantienen. No se modifica el archivo JSON.
- Recodifica los bytes de pantalla a base de glifo físico + selector del color real por fila; no escribe tonos artificiales 1/3.
- Añade comprobación de bitmap físico 14 versus 24 para garantizar que el blink realmente alterna glifos distintos.
- Añade diagnóstico en console `window.RICO_TEST349_CHAR_CHECK` con los dos glifos, screen codes y estado de la K.

## Verificación interna con REMISERIA 64 (1).json

- Screen codes de blink frame1/frame2: 14/24 (cambian los glifos físicos); ambos BG 0, FG 10.
- La K de frame9: screen code 63, FG 1, BG 0 negro.
- Los cambios de mapa por transición a frames 2..8: EXACTAMENTE 1 byte; Color RAM sin diferencias.
- La frame 9 conserva 152 celdas de pantalla y 126 cambios de foreground.
- Se requieren solo 4 cambios raster de fondo compartidos (versus 7 en TEST348).
- Assembler ASM sintético: 13 ramas relativas dentro de rango, etiquetas y referencias resueltas, cero opcodes sin reconocer.
- Mapa de memoria sin solapamientos: kernel $2000-$2182, charset $3800-$39FF, parches $4000-$4B02, pantalla+colores iniciales $6000-$67FF y tablas raster $7000-$700C.
- El ensamblador nativo del navegador y VICE PAL NO se ejecutaron aquí. Pendiente de PASS.

## Probar

1. https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test349-ecm-bg-slots/
2. Verificar etiqueta visible `TEST349 · EBCM · GLIFOS · V349-A1`.
3. Cargar REMISERIA 64 (1).json y exportar PRG terminado `_TEST349.prg`.
4. En VICE PAL: observar diferencia visual entre dos caracteres de frames 1..8; confirmar K negro en frame9 y ausencia de basura horizontal.
5. Si falla, compartir PRG TEST349 y captura/video.

TEST348 permanece íntegro; TEST342 PASS y editor principal intactos.