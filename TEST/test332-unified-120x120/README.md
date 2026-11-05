# TEST332 — Mapas de hasta 120×120 para scrolls de un frame

**05/11/2026 · CANDIDATO EXPERIMENTAL. Sin PASS de VICE.** Copia aislada de la página TEST331. La raíz, TEST331 y todos los MASTER/TEST PASS siguen sin cambios.

## Objetivo
Separar **Screen editable** de **Window física C64** de 40×25 y del layout interno del exportador. Los límites diferentes 245x25, 40x255 y 12 KiB diagonales eran decisiones de rutas de código distintas; no justifica bloquear la edición de 120×120.

## Corrección ejecutada: diagonal 120×120 completo

Cuando el Scroll Area diagonal supera los antiguos 12 KiB por mapa, esta variante del TEST196 reserva:

- **$4000–$7FFF** para mapas de 16.384 bytes máximo (120×120 ocupa 14.400, hasta $783F).
- **$8000–$9FFF** para 8.192 bytes de color de primer plano, empaquetando 2 celdas por byte (120×120 ocupa 7.200, hasta $9C1F).
- **$A000 en adelante** para grupo y datos adicionales, sin solapar los dos bloques anteriores.
- Motor 6502 que lee el byte de color correcto de cada fila y extrae la mitad de 4 bits según la columna; se preservan los 16 colores de foreground.
- Anchos pares **e impares** mediante `Math.ceil(width/2)`. No modifica JSON ni Screen.
- Continúan conectados el asignador de 64 glifos ECM TEST331, sus cuatro fondos, Ondas, Group Scroll e Individual en glyphs diferentes.
- Para mapas diagonales más pequeños se conserva sin modificaciones el código anterior TEST196.

## Comprobaciones

Generación de código ASM con ensamblador **simulado**: las cuatro diagonales 120×120, 119×120 y 120×119 dieron resultado con kernel grupal, individual, fondo ECM y descodificador nibble. Una prueba 60×30 con Window Y=20 resultó inválida por definición (la Window 40×25 debe caber en el Screen); corregir la ventana a Y=0 para esa regresión.

**No es prueba real de PRG ni rendimiento PAL.** Antes de declarar PASS hay que ensamblar y ejecutar en VICE.

## Otros motores y restricciones

- Horizontal Left/Right ya genera ASM para una fuente Screen **120×120**; procesa una franja 120×25 según la coordenada Y de Window.
- Vertical Up/Down ya genera ASM para Screen **120×120**; procesa una franja 40×120 según la coordenada X de Window.
- La diagonal recorre **120×120 completo** con nuevo almacenamiento compacto.
- Group-only selecciona la Window 40×25 y conserva Ondas/Individual en glifos distintos.
- **Multiframe horizontal** sigue usando el buffer de 5 KiB por frame (hasta 102 columnas calculadas) y todavía necesita un motor ECM multiframe.
- **ECM hardware:** máximo 64 patrones físicos simultáneos por charset, 4 registros de fondos. Si hay más de 64 realmente distintos, falta streaming/bank switching de glifos.
- Multigrupo, mismo glifo animado simultáneamente, Ping Pong atómico combinado, SID y Switch Bank requieren rutas específicas reales, no quitar las verificaciones.
- **No se agregaron avisos al modificar el tamaño del Screen.** Mostrar errores concretos únicamente cuando una exportación realmente no se puede representar.

## Pruebas en VICE

1. Crear Screen 120×120, Scroll Area 120×120 y Window 40×25.
2. Map Scroll diagonal en cada dirección, un frame. Export PRG en Extended Background Color.
3. Verificar 4 fondos, todos los colores de primer plano, Map Scroll completo, Ondas y animaciones individuales.
4. Repetir con 119×120, 120×119 y mapa pequeño 60×30 (Window 40×25 en X=0,Y=0).
5. Verificar los otros motores horizontal y vertical, y comparar con TEST331.

[Editor TEST332](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test332-unified-120x120/) · [Editor TEST331](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test331-ecm-map-only-glyphs/)
