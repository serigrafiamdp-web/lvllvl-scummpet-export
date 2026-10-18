LVLLVL / RICO — TEST132 — 18 OCTUBRE 2026
======================================
BASE: TEST131 (mejora parcial de basura blanca; FAIL por saltos y residuos de color en borde superior del mapa).

VIDEO DE REFERENCIA: 2026-10-18 11-57-28.mkv, 8.617 segundos, 1920x1080 a 60 fps (VICE, aportado por usuario).
El video confirma artefactos cerca del borde alto durante la traslación vertical. No prueba por si mismo la causa de esos artefactos.

HIPOTESIS QUE PRUEBA TEST132
---------------------------
TEST131 hizo actualizaciones de color dispersas hasta 120 celdas en IRQ, pero
si eran más de 120 volvía a copiar 1024 bytes de golpe. El tiempo variable
puede alargar la interrupción raster iniciada en $FA y producir saltos visuales
cuando alcanza la parte superior en el cuadro siguiente.

TEST132 elimina el fallback de copia completa del commit de scroll y limita
cada ejecución de la IRQ a 40 cambios de color. Los cambios restantes se
aplican en IRQ siguientes. Se conserva la lista precomputada en $1800-$1FCF,
los dos buffers de screen y color y la animación nativa de caracteres.

Mientras existe una lista pendiente, el main loop no pisa esa lista con
nuevas preparaciones ni transiciones de frame; puede pausarse el ritmo del
scroll ante cambios de color masivos. El dibujo original no se altera.
La RAM de color del C64 no es doble buffer: durante uno o más cuadros las
celdas pueden mostrar aún el color previo si hay más de 40 diferencias.

ESTADO
------
PASS COMPILACION: ensamblador integrado LVLLVL, 6 escenarios (1, 2, 6 y 20
frames, con/sin chars animados y guard de RAM).
PASS RUTINAS 6502: emulacion de la rutina ensamblada con 0, 6, 98, 90,
206, 900 y 1000 cambios; todas las celdas terminan con el color esperado,
y cada IRQ escribe hasta 40 celdas.

SIN PASS VISUAL: aun falta probar en VICE el proyecto real del video.
No ascender al MASTER ni marcar como resuelto el salto vertical antes de esa prueba.

LIMITES DE ALCANCE
-----------------
Se ha cambiado exclusivamente la forma en que se aplican los colores del
scroll TEST77 en la interrupcion. No se modifican los algoritmos de scroll,
scroll de caracteres, charsets, banks, disenos, ni la configuracion UI.
Las transiciones completas a otro frame conservan el tratamiento de color
anterior: esta prueba se centra en los pasos de scroll de mapa.

Repositorio: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export
