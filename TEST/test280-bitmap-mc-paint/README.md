# TEST280 — Corrección de pintado Multicolor Bitmap (24/10/2026)

Base exacta: TEST279, manteniendo intactos TEST275 y el MASTER.

## Problema observado en la captura
El Tile Editor conservaba las etiquetas nativas Frame / Cell / Multi1 / Multi2, mientras la nueva paleta bitmap C1/C2/C3 estaba separada. Parte del mapa podía mostrar el modo de carácter convencional, sin la interpretación bitmap.

## Cambios aislados
- Nueva barra propia dentro de Tile Editor: BG global + C1/C2/C3 de 16 colores cada uno, con selector de color de LVLLVL. Se ocultan los controles nativos de multicolor de caracteres mientras Bitmap MC esté activo.
- El raster de la capa ahora puede repintar un mapa 40x50 aunque el canvas visible mida 320x200. TEST279 se salteaba el render cuando el canvas era menor que el mapa completo.
- La vista previa del Tile Editor usa la misma tabla de color 00=BG, 01=C1, 10=C2, 11=C3 que el mapa; C3 permite 0..15.
- La brocha actualiza la paleta local de la celda incluso cuando el carácter no cambia; fuerza actualización visual (agrupada por requestAnimationFrame).
- Sin cambios en datos de glifos, exportación PRG/ASM, scroll ni frames nativos.
- Compatible con los selectores secundarios de C1-C3 de TEST279.

## Prueba
1. Entrar a SCREEN > Multicolor Bitmap (Experimental) y abrir Tile Editor.
2. Verificar que aparezcan BG, C1, C2, C3 con sus propias muestras y que los antiguos Frame/Cell/Multi1/Multi2 no se muestren en este modo.
3. Seleccionar C1=2, C2=5, C3=7 y pintar un glifo con los cuatro patrones de bits 00,01,10,11.
4. Cambiar C1=9, C2=3, C3=15 y pintar una segunda celda con el mismo glifo. La primera no debe variar.
5. Cambiar el fondo y verificar que únicamente se alteren los píxeles 00.
6. En un mapa grande, comprobar que las celdas ya pintadas usan el mismo render que la nueva.

## Estado y límites
**PASS sintaxis JavaScript**; **PASS prueba simulada** de 40x50 / canvas 320x200, con cuatro tintas correctas. **PENDIENTE PASS visual** en navegador del usuario. No se afirma haber ejecutado el LVLLVL completo en Chromium.

La pintura del mapa se valida en celdas 8x8. Siguen pendientes prueba real de importaciones, scroll, selección/paste, char animation por frames y PRG bitmap.

WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test280-bitmap-mc-paint/

ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test280-bitmap-mc-paint.zip
