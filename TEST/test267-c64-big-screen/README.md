# TEST267 — C64 Import Big Screen (v2, 24/10/2026)

**Estado:** TEST visual pendiente de validación por usuario. No cambia el MASTER `MASTER_LVLLVL_RICO_24_OCTUBRE_2026`.

## Cambio puntual

En **Import → C64 Formats**, la ventana original de 615×490 se sustituye visualmente por una de hasta **1120×850** y el preview C64 nativo de **384×272** se amplía **2× = 768×544 píxeles visibles**. La pantalla C64 interna sigue exactamente en 384×272, por lo que la emulación, el pixel buffer, los registros, Color RAM y los importadores no se modifican.

## Problema corregido en v2

La primera versión ajustaba la imagen desde `UI.showDialog`, pero el HTML del importador podía cargarse **después**. El canvas todavía no existía, y el emulador conservaba el tamaño original aunque la ventana se hubiese ampliado.

La v2 engancha `ImportC64Formats.prototype.initContent`, ejecuta el método nativo y después aplica el ajuste. Además, ensancha la columna izquierda de la tabla, elimina el `max-width:100%` que comprimía el canvas y fuerza `width:768px!important` en pantallas grandes. El JS recalcula la escala para viewports más pequeños. La anchura máxima visible es 768, sin cambiar la resolución del backend.

## Archivos del TEST

- `TEST/test267-c64-big-screen/js/RICO_C64_BIG_SCREEN_TEST267.js`: parche visual aislado.
- `TEST/test267-c64-big-screen/index.html`: carga los mismos 89 scripts del TEST264 en idéntico orden y **un** módulo visual TEST267.
- `index.html` de la rama release: editor completo con el TEST267 en raíz, para arrancar independiente.

## Validación interna

Mock JS del ciclo `UI.showDialog` anterior a la aparición del canvas seguido de `ImportC64Formats.initContent`: diálogo 1120×850, CSS `width:768px!important`, altura automática, `max-width:none`, canvas real permanece en **384×272**. **PASS simulación, VICE/WEB real pendiente del usuario**.

## Cómo probar

1. [Abrir TEST267 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test267-c64-big-screen/)
2. **Import → C64 Formats**.
3. Comprobar que ahora el C64 ocupa una porción grande de la ventana y no el cuadro pequeño original.
4. Cargar `ricos oil.prg` y comprobar que el monitor y controles funcionan sin distorsión.
5. Si el navegador tiene la página anterior en caché, usar Ctrl+F5 (el script del TEST lleva `v=test267-scale-after-dom-v2`).

**Nota:** No se agregan todavía Trainer, Warp, Immortal ni Capture Frame. Es una prueba exclusivamente de tamaño.

## ZIP

https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test267-c64-big-screen.zip
