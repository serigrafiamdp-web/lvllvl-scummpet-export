LVLLVL → RICO | TEST131 | 18 OCTUBRE 2026
==========================================

BASE: TEST130 (assembler real de LVLLVL PASS, prueba en VICE reporta
mejora, pero muestra saltos breves de filas y algunas celdas blancas
cuando la animacion atraviesa la zona alta de la pantalla).

HIPOTESIS TECNICA Y CORRECCION AISLADA
-------------------------------------
TEST130 copiaba siempre 1.024 bytes a la RAM de color ($D800-$DBFF)
en la IRQ, incluso si solo cambiaban unos pocos colores. La IRQ
comienza en la linea raster $FA y ese trabajo puede invadir el raster
del siguiente frame. Esto puede explicar el tearing de la zona alta.

TEST131 mantiene LAS MISMAS rutinas de Map Scroll y animate_chars_native.
En la preparacion en main loop, compara los 1000 colores del buffer
oculto con la RAM de color y prepara una lista de cambios por celda.
Guarda cada cambio como 2 bytes empaquetados en $1800-$1FCF
(offset bajo; pagina 2 bits + color 4 bits). Escribe solo las
celdas cambiadas en la IRQ al hacer swap.

PRESUPUESTO: se aplican listas de hasta 120 cambios en la IRQ.
Con mas de 120 cambios por paso, hay fallback al copiado completo de
TEST130, para preservar el resultado y evitar un nuevo problema
funcional. Por eso TEST131 es una prueba focalizada en scroll de
mapas con colores mayormente estables; NO es todavia una solucion
universal de raster para pantallas con demasiados cambios de color.

VALIDACIONES:
- Assembler de LVLLVL: 6/6 escenarios PASS (1, 2, 6, 20 frames,
  sin y con chars animados, y guard de limite RAM).
- Ejecucion de instrucciones 6502 reales en emulador de prueba
  acotado: 5 casos PASS (6, 90, 98, 206 y 900 cambios).
- Verificados los buffers de color $1000 y $1400.
- Codigo + tablas de runtime terminan antes de $3000.
- Los bytes de PRG se generan con el assembler interno de LVLLVL.
- El MASTER del 17 OCT y los dos sistemas de animacion no se tocan.

PENDIENTE: resultado visual PASS/FAIL en VICE con el proyecto real,
especialmente el borde superior, los cambios de color y la suavidad.

NOTA: en TEST131 no se afirman resultados visuales que todavia
no se probaron. Si los saltos persisten, comparar las transiciones
del buffer/guard row del Map Scroll con los mismos datos y ticks.
