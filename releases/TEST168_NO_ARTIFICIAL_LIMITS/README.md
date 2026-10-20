# TEST168 — Retirada de topes artificiales (20/10/2026)

**Estado: PENDIENTE VICE PASS/FAIL. No es un MASTER.**

Base exacta: MASTER LVL RICO 20 DE OCTUBRE (TEST167 PASS), sin tocar ni reemplazar el MASTER.

- Se elimina el tope TEST86 de 255 caracteres visibles en la exportación de mapas grandes: colores uniformes optimizados; la tabla sparse TEST89 se conserva cuando cabe; para escenas densas multicolor hay una ruta dinámica sobre el mapa de colores fuente de hasta 1000 posiciones visibles.
- Mapas 40×N (N>25) con movimiento horizontal Left/Right y variantes horizontales utilizan una proyección no destructiva de 25 filas a partir de Window Y, despachada al motor TEST77 (en vez de rechazarse como solo Up/Down).
- **Limitación real que sigue pendiente:** mapas grandes verticales de varias frames, Ping Pong vertical sobre N filas y áreas parciales requieren runtimes propios. No se quitan verificaciones de memoria para fabricar un PRG corrupto.
- **Cuidado:** la ruta multicolor dinámica es más costosa en ciclos y necesita una prueba visual en VICE a 1 tick. No se certifica idéntico rendimiento al caso uniformemente coloreado.

Pruebas automáticas PASS: ensamblador original LVLLVL para 40x50 sparse y 1000 celdas visibles uniformes/multicolor, 40x255 multicolor, y Left/Right de ventana Y=11; no se validó aún el rendering en VICE.

ZIP local congelado: `LVLLVL_TEST168_SIN_TOPES_ARTIFICIALES_WEB_LOCAL.zip`.
SHA256: `234b72cc212fa7d5dc41332fb06747c7c6b34bbb7075a6c9e60bed8f1c79c5c9`.

Conservar siempre: branch release/master-lvl-rico-20-oct-2026 y backup/gh-pages-before-test168-20oct-2026.
