RICO / LVLLVL TEST133 — PRIORIDAD A COLORES VISIBLES
18 OCTUBRE 2026 — PRUEBA, SIN PASS VISUAL AUN

TEST132: dos animaciones + Map Scroll funcionan y no quedan fantasmas ni saltos de linea.
Pendiente: destellos blancos de algunas celdas cada cierto numero de frames.

HIPOTESIS: la cola limitada a 40 actualizaciones por IRQ colorea primero celdas vacias.
Tras el intercambio de pantalla, los glifos visibles aun pueden heredar por unos frames
los colores previos de RAM, que en ocasiones son blancos.

CAMBIO UNICO EN TEST133:
- La cola de cambios de color se prepara con dos pasadas fuera de IRQ:
  1) celdas que en el siguiente screen buffer contienen un glifo distinto de blank_char;
  2) el resto de celdas.
- No se elimina ninguno de los cambios de color y no se cambian patrones de glifos.
- El presupuesto sigue siendo 40 escrituras de color por IRQ.
- Se conservan animacion de caracteres, Map Scroll, exportador TEST77 y timings.
- No altera frames, colores originales ni el MASTER.

TESTS AUTOMATICOS:
- 6/6 configuraciones de compilacion con ensamblador nativo LVLLVL.
- 7/7 pruebas de rutina 6502 con recuento final y orden de prioridades.

VICE: EXPORTAR DESDE ESTA WEB Y VERIFICAR SI DESAPARECE EL BLINK BLANCO.
Si reaparece cualquier ghost o salto de linea, STOP y revertir a TEST132.
GitHub: serigrafiamdp-web/lvllvl-scummpet-export
