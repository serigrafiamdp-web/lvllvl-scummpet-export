# TEST170 — Marco rojo solamente en Rico's Window Dimensions
Fecha: 20/10/2026. Estado: pendiente de PASS visual.
Base: TEST169, preserva MASTER LVL RICO 20 DE OCTUBRE 2026.
- El marco rojo C64 MAX 40x25 permanece exclusivamente dentro del diálogo de Rico's Window Dimensions (TEST75).
- Se retiran todos los contornos superpuestos al área de trabajo, incluido rojo MAX y blanco Window.
- No se altera Screen completo editable, Window efectiva por frame, Scroll Area ni los 16 movimientos de Map Scroll en preview.
- No se modifica el exportador PRG ni el contenido del dibujo.
- Solo cambian dist/index.html y dist/js/RICO_WINDOW_VIEWPORT_GUIDE_TEST169.js frente a TEST169.
- Verificación automática PASS: GridView2d.draw queda sin wrapper, modal TEST75 intacto, Window 40x25 por defecto, Window personalizada y Screen original sin mutación.
- Pendiente de inspección visual en navegador: carga real y guía roja en diálogo.
- ZIP: LVLLVL_TEST170_MARCO_ROJO_SOLO_EN_WINDOW_WEB_LOCAL.zip
- SHA256: e4eb3ee74f0e250beda111090efbe70bcbc092603fb0cb0f334cc24e2f3f968a
