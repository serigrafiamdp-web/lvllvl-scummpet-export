# TEST179 — Map Scroll horizontal, borde opaco y sin grilla

**20 de octubre de 2026. Estado: pruebas Node PASS, validación visual pendiente.**

Base TEST178, cuyo ajuste vertical fue aprobado visualmente por el usuario. Sin cambios al MASTER LVL RICO del 20 de octubre.

## Motivo
Al activar Scroll Left / Right en un mapa grande, aparecían la cuadrícula del editor y una franja transparente junto al borde. La máscara correctiva de TEST178 tenía un filtro que activaba su comportamiento solo para animaciones verticales.

## Solución
Único cambio funcional: extender el filtro a movimientos horizontales Left, Right, Ping Pong, Move y Move In; mantener intacto el render previo de movimientos verticales. El recorte del GridView2d y la máscara opaca exterior de Rico's Window ahora funcionan con ambos ejes.

El borde utiliza el color configurado en el editor (negro, turquesa, etc.). El mapa completo sigue editable al desactivar Map Scroll. Las celdas fuera de Scroll Area reciben máscara de borde sin alterar el dibujo.

## Validación
- PASS Node: LEFT / RIGHT y seis variantes horizontales.
- PASS regresión vertical, ventana 40×25, scroll OFF, máscara izquierda/derecha y borde superior/inferior.
- PASS comparación con TEST178: solo cambiaron dos archivos, `index.html` y `js/RICO_MAP_PREVIEW_BORDER_MASK_TEST178.js`.
- Pendiente verificación visual en browser.
- **TEST176 sigue experimental**: esto NO modifica exportación PRG ni afirma resolver ghost bytes de VICE.

ZIP: `LVLLVL_TEST179_MAP_HORIZONTAL_BORDER_SIN_GRILLA_WEB_LOCAL.zip`
SHA256: `4a41bc6616729ea65ba67a3915be82eb09866b9885327a5013a94b2f30b8e091`
Protegido: `release/master-lvl-rico-20-oct-2026`.
