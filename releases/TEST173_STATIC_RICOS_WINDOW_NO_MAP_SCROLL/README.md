# TEST173 — Rico's Window export sin Map Scroll
Fecha: 20 octubre 2026. Estado: PRG COMPILADO PASS; VICE VISUAL PENDIENTE.
Base TEST172, branch MAIN/MASTER del 20 octubre intacto.

## Fix
Cuando Screen=40xN con N>25, el exportador TEST168 antes elegía el motor de mapas grandes
incluso si NO se había habilitado MAP SCROLL. Eso mostraba un aviso y cancelaba la exportación.

Ahora la elección se basa primero en la configuración del Map Scroll, por frame.
Si todos están OFF:
- Projectar TEMPORALMENTE la Rico's Window elegida sobre un frame virtual 40x25;
- tomar las celdas fuente desde (Window.x, Window.y), sin reducir ni mutar el arte en el Screen;
- exportar usando el motor nativo TEST77 que soporta Switch Bank 1/2 e individuales simultáneas;
- preservar toda la geometría, charset, color y editor originales luego de exportar.
- Ventana parcial: respetar ancho/alto, con zona restante vacía fuera de la Window.
Si un Map Scroll está activo, conservar las rutas de mapas grandes anteriores (TEST168).

## Ensayos
PASS smoke de proyección Screen 40x50: Window 40x25 desde Y5, conserva pixel/celda fuente.
PASS Window personalizada 23x11 (X6,Y12), sin alterar mapa.
PASS multi-frame sin Map Scroll no confunde tamaño del Screen con movimiento.
PASS PRG 16348 bytes compilado: BANK1 Scroll Up 1 tick, BANK2 Scroll Down 2 ticks,
Switch Bank cada 3 ticks, Screen 40x50 Window 40x25 Y5. Aún no es VICE PASS.
PASS editor y datos de frames restaurados tras exportación.
No se modificó el resto de módulos TEST172 ni se añadieron límites nuevos.

ZIP: LVLLVL_TEST173_RICOS_WINDOW_EXPORT_SIN_MAP_SCROLL_WEB_LOCAL.zip
SHA256: 161352beae273aa9de5286cea433326b32756d8c4b69506312d16c9d754e1235

Al confirmar el usuario, recién entonces considerar promoverlo al MASTER.
