# Rico TEST207 — 8 frames + reproductor SID original LVLLVL

Estado: EXPERIMENTAL. No es PASS de VICE. Los PASS de TEST203/204 no se modifican.

## Referencia original
- James / LVLLVL original: https://github.com/jaammees/lvllvl
- src/js/textMode/c64export/export.asm: init de SID antes de habilitar IRQ; play dentro de interrupcion raster.
- src/js/textMode/c64export/toPrgAdvanced.js: extrae y embebe PSID; respeta LOAD, INIT, PLAY.
- src/js/textMode/c64export/toPrg.js: usuario elige "Use A SID File" y el parser lee las direcciones.
- Las rutinas de SCUMM-PET-C64 NO se utilizan en este TEST.

## Como probar
1. Crear un proyecto con **8 frames** y Map Scroll horizontal Left/Right de 45x25.
2. Abrir la exportacion avanzada y elegir un archivo .sid en la seccion "TEST207 — 8 frames + SID original".
3. Activar la casilla; dejar 50 Hz (1 play por cuadro) en la primera prueba.
4. Exportar PRG y comprobar en VICE: musica audible, rotacion de las ocho frames, velocidad y colores.
5. Si se usa el dialogo PRG estandar, sigue admitiendo su opcion nativa "Use A SID File".

## Memoria
- $1000-$1FFF: PSID cargado a su direccion ORIGINAL, hasta 4096 bytes.
- $B000-$B7FF: scratch selectivo de Color RAM reubicado desde $1000-$17FF.
- $4000-$67FF: buffers compartidos de TEST206.
- $6800-$9FFF: datos compactos (45x25, 8 frames).
- $A000-$AFFF: Group Scroll, si se usa.
- $D400-D41C: registros fisicos SID (no se almacenan recursos alli).
- El modulo comprueba que el banco B000-B7FF no este ocupado por cuadros compactos.

## Compatibilidad y limites iniciales
- PSID con LOAD, INIT y PLAY dentro de $1000-$1FFF; 8 frames.
- Subtune inicial de la cabecera; direccion LOAD NO se reubica.
- Rechaza RSID, PLAY=0, temporizacion CIA, ausencia de datos SID y conflicto de memoria.
- 50 Hz por defecto; opcion de dos llamadas PLAY/IRQ a 100 Hz, inspirada en el original.
- No garantizamos que un PSID arbitrario sea compatible: puede necesitar ROM, CIA, varias SID, memoria o zero-page ocupada.
- La reproduccion se ejecuta con raster compartido con Map Scroll; el uso de CPU real se comprueba en VICE.
- Sin SID seleccionado, el exportador anterior sigue INTACTO.
- 16 frames + SID todavia no estan soportadas en esta prueba aislada.

## Pruebas tecnicas realizadas
- Extraccion PSID y retencion de las direcciones LOAD/INIT/PLAY.
- Listas de color TEST203 reubicadas (16 referencias indexadas X/Y, cero referencias anteriores).
- Generacion de la fuente de 8 frames con Group Scroll Off/Up/Down/Left/Right y 1/2 llamadas SID Play por raster.
- No se ha utilizado un ensamblador/VICE real para confirmar el PRG final.
