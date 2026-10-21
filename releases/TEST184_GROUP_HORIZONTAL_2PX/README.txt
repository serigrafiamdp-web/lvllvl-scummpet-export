RICO LVLLVL TEST184 — GROUP SCROLL HORIZONTAL 2 PIXELS PER TICK
21 OCTUBRE 2026

Base: TEST183 experimental. TEST181 Map Scroll vertical PASS, TEST180 preview border PASS.
MAIN MASTER LVL RICO 20 OCTUBRE intacto.

CAMBIO ÚNICO DEL MOTOR 6502:
- Group Scroll LEFT y RIGHT ahora avanza 2 píxeles por tick de grupo.
- La modificación cambia una constante inmediata ($01->$02).
- No altera el Group Scroll UP, Map Scroll vertical, individuales BANK1/BANK2,
  Switch Bank ni el scheduler que da prioridad al mapa.
- Sin grupo horizontal: PRG byte-idéntico a TEST183.
- Sólo archivos de motor JS, consulta cache del INDEX, demos y notas.

VALIDACIONES:
- REAL 6502 assembler PASS 11 configuraciones, grupo BANK1 y BANK2.
- Grupos 1x32,2x8,3x5,16x16,32x8 PASS.
- PRG LEFT/RIGHT/demostración completa: exactamente 1 byte distinto de TEST183.
- PRG individual sin grupo: byte-idéntico.
- Sin prueba visual definitiva en VICE. Velocidad real puede ser menor según
  cantidad de tiles procesados durante cada tick (mapa tiene prioridad).

DEMOS:
 DEMOS_VICE/TEST184_TERRY45X32_MAP_UP_LEFT_GROUP_1T.prg
 DEMOS_VICE/TEST184_TERRY45X32_MAP_UP_RIGHT_GROUP_1T.prg
 DEMOS_VICE/TEST184_TERRY45X32_MAP_UP_INDIVIDUAL_LEFT_GROUP_SWITCH.prg
 DEMOS_VICE/TEST184_TERRY45X32_MAP_UP_LEFT_GROUP_ONLY.prg
 DEMOS_VICE/TEST184_TERRY45X32_MAP_UP_RIGHT_GROUP_ONLY.prg

Para probar: PAL VICE, al menos 30s, primero LEFT 1T; confirmar que mapa
no se detenga, sin ghost bytes, y comparar con TEST183 con misma configuración.
NO promover al MASTER sin PASS del usuario.
