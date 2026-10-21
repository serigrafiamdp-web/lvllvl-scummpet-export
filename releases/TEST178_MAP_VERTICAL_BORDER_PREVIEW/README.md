# TEST178 — Map Scroll vertical: borde negro opaco, sin grilla ni columna transparente
20/10/2026 — **Node PASS, visual navegador pendiente**. Base TEST177; TEST177/176 continúan experimentales. MASTER de 20 OCT intacto.

## Capturas interpretadas
- Primera: Screen completo, mayor que la Window. Borde turquesa marcado para visualizar el área exterior.
- Segunda: al activar Map Scroll vertical, el borde (negro) muestra la grilla de edición.
- Tercera: franja de columnas vacías/cuadriculadas a la derecha que deberían ser borde negro opaco.

## Corrección de preview
1. TEST178 añade `RICO_MAP_PREVIEW_BORDER_MASK_TEST178.js`, posterior al módulo TEST83.
2. Mientras Map Scroll vertical está activo sobre un Screen grande con Window más pequeña:
   - limita la grilla de edición a la Window;
   - tapa con el **color configurado del borde** el exterior (incluidas zonas de checkerboard/grilla);
   - si Scroll Area tiene menos columnas que Window, rellena el sobrante sin transparencia;
   - conserva los scrollbars del editor.
3. `RICO_LARGE_MAP_VIEWPORT_SOURCE_TEST83.js`: el contenido vertical solo se repite por Y (tres copias), nunca por X; viceversa para scroll horizontal.
4. Se capturan las dimensiones completas del Screen ANTES de que TEST83 proporcione a GridView2d sus métricas temporales de Window.
5. Sin MAP SCROLL, el Screen completo permanece editable. Ningún cambio a datos de arte, geometrías o rutinas exportadoras.

## Validación
- PASS `node TEST178_BORDER_NODE_TEST.js`: GridView2d clip Window 40×25 de Screen 40×50; columna sobrante de 6 chars; Scroll Area desplazada; borde superior/inferior; Map Scroll OFF, horizontal y 40×25 sin cambios.
- PASS `node --check` para dos módulos JS.
- PASS comparación contra ZIP TEST177: solo index, TEST83, nueva rutina TEST178, notas y launcher alterados.
- PENDIENTE verificación visual real en editor (la ejecución de Chromium bloquea localhost y file:// en el entorno).
- **Importante:** TEST176 de Map Scroll + BANK1/BANK2 + Switch Bank no tiene PASS visual en VICE. TEST178 corrige solo la preview y no afirma resolver ghost bytes de los PRG.

## Descargas
`LVLLVL_TEST178_MAP_VERTICAL_BORDER_NEGRO_SIN_GRILLA_WEB_LOCAL.zip`
SHA256: `49e431d6a63dc35fbaf03fc5b6bad35be332f79fae0e0ca342aa3b345d11e572`.
Main protegido `release/master-lvl-rico-20-oct-2026`.
