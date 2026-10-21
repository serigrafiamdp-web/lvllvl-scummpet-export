RICO LVLLVL TEST185 — GROUP SCROLL HORIZONTAL 4 PIXELES POR TICK
21 OCTUBRE 2026

Base: TEST184 experimental; TEST181 Map Scroll vertical PASS; TEST180 preview border PASS.
MASTER LVL RICO 20 OCTUBRE intacto.

CAMBIO UNICO DEL MOTOR PRG:
- Group Scroll LEFT y RIGHT ahora avanza 4 pixeles por tick de grupo.
- Frente a TEST184 solo cambia la constante inmediata del paso: $02->$04.
- Group Scroll UP, Map Scroll vertical, Individual BANK1/BANK2, Switch Bank,
  scheduler de prioridad de mapa, geometria y preview siguen sin cambios.
- Sin Group Scroll horizontal: PRG identico al de TEST184.

VALIDACIONES:
- Compilador real 6502 de LVLLVL: PASS 11 combinaciones y 6 configuraciones
  adicionales de grupo, incluyendo BANK1 / BANK2.
- LEFT 1T, RIGHT 1T y demo completa: PRG byte-identicos a TEST184 salvo
  un byte, en offset 38954: $02 pasa a $04.
- PRG individual sin grupo: byte-identico a TEST184.
- No se ha probado visualmente en VICE; el avance de fase no garantiza
  4 pixeles completos visibles por cada 20 ms: cada glifo se actualiza por
  iteracion del bucle principal, y Map Scroll tiene prioridad.

EFECTO OBSERVADO EN VIDEO PREVIO (TEST184): "ONDAS" (candidato)
- La actualizacion incremental mezcla temporalmente glifos de fases
  diferentes: el contorno parece ondularse en lugar de moverse como
  una capa uniforme.
- Si esa mezcla se quiere convertir en un efecto independiente, hay que
  reproducir el desfase de forma controlada y configurable, NO dependiendo
  del tiempo accidental de CPU o del mapa en ejecución.
- TEST185 prueba la fase a 4px sin modificar ese scheduler para comparar
  velocidad real y apariencia de ondas.

DEMOS VICE:
 DEMOS_VICE/TEST185_TERRY45X32_MAP_UP_LEFT_GROUP_1T.prg
 DEMOS_VICE/TEST185_TERRY45X32_MAP_UP_RIGHT_GROUP_1T.prg
 DEMOS_VICE/TEST185_TERRY45X32_MAP_UP_INDIVIDUAL_LEFT_GROUP_SWITCH.prg

Probar VICE PAL >=30 segundos, observar velocidad lateral real, cantidad
visible de ondas, continuidad del Map Scroll vertical y ghost bytes.
No promover al MASTER sin PASS usuario.
