# TEST264 — Exportación nativa C64 MULTICOLOR (24/10/2026)

**Estado:** motor preparado, pruebas de lógica PASS; pendiente validación de programa real en VICE. **NO marcar PASS VICE** hasta confirmación.

## Síntoma

En TEST263 exporta un PRG y ejecuta en VICE, pero el dibujo aparece casi monocromático y sin amarillo/celeste, mientras el editor SCREEN Multicolor sí muestra esos colores. Las formas y el mapa sobreviven: se trata principalmente del modo VIC/colores.

## Causa raíz confirmada por código

`js/RICO_PRG_DUAL_BANK_TEST23.js`, dentro de `ToPRGAdv.prototype.createPRG`, fija siempre:

```js
safeArgs.mode = 'standard';
```

Esto anula el SCREEN Multicolor del usuario. El exportador nativo original `lospec/lvllvl/src/js/textMode/c64export/toPrgAdvanced.js` reconoce `args.mode === 'multicolor'` y solo en ese caso escribe:

- `mode=2` en byte de configuración del PRG en dirección C64 **$0811**;
- los colores globales **Background, Multicolor 1, Multicolor 2** en cada frame;
- Color RAM con `fc` original de cada celda (0–7 Hi-Res y 8–15 Multicolor).

El TEST262/263 intentaba activar bit 4 de $D016 e insertar $D022/$D023 a nivel ASM, pero **no podía corregir los datos y el modo del player original** configurados con `standard`.

## Corrección TEST264

Se sustituyen **dos scripts del TEST263**, manteniendo exactamente su posición:

1. `TEST/test264-native-multicolor-export/js/RICO_PRG_DUAL_BANK_TEST264.js`: copia aislada del TEST23, cambia solo la elección de `safeArgs.mode`. Cuando `layer.getScreenMode()==='c64multicolor'`, entrega **`multicolor`** al nativo. En otros modos sigue entregando **`standard`**. El sistema de BANK1/BANK2, rutinas ASM, patchPRG y trampolín permanecen sin cambios.
2. `TEST/test264-native-multicolor-export/js/RICO_MULTICOLOR_EXPORT_TEST264.js`: conserva la captura completa y única descarga del TEST263, pero al detectar el exportador nativo (indicador `self.__ricoDualBankExportActive`) **no agrega instrucciones ASM** al player de tamaño fijo. El nativo ya trae modo 2, tablas de colores y rutinas VIC. Para motores modernos custom Group/Map, conserva el parche seguro $D016/$D022/$D023 de TEST263.
3. Antes de descargar un PRG nativo, comprueba que el byte de la dirección $0811 sea **exactamente 2**. Si no, avisa y **no descarga un PRG Hi-Res engañoso**.

**Importante:** en Multicolor C64 el color individual de celda debe ser `fc` entre 8 y 15 para que el VIC interprete los pares de bits; las celdas `fc` entre 0 y 7 pueden seguir siendo Hi-Res de manera válida. No se modifican los bitmaps del tileset ni se destruye el arte.

## Tests de lógica realizados

Mock con TEST264 Dual-bank y TEST264 Export encadenados:

- SCREEN Multicolor: motor original recibe `args.mode='multicolor'`, conserva fuente ASM nativa sin ampliarla y entrega PRG con config $0811=2. **PASS simulación**.
- Si el PRG nativo devuelve config $0811=0, TEST264 lo **rechaza** en lugar de descargarlo.
- SCREEN Text: sigue `args.mode='standard'` y devuelve bytes sin intervención multicolor.
- Captura completa de PRG y no más de una descarga mantenidas desde TEST263.
- El resto de los scripts y todos los motores PASS quedan fuera de este TEST.

## Qué validar en VICE

1. Abrir web TEST264 y cargar proyecto original.
2. SCREEN → Multicolor y Export → PRG (primero sin Map/Group Scroll ni SID).
3. VICE debe mostrar **los colores compartidos del editor** (p. ej. amarillo/celeste) y formas con píxeles dobles. El programa ya no debe quedar monocromático verde.
4. Si funciona, comprobar un proyecto con Group Scroll y luego Map Scroll/SID. Esas rutas de motor custom conservan parche TEST263 hasta que se validen independientemente.
5. Comprobar SCREEN → Text → PRG: debe seguir exportando Hi-Res normal.

## Enlaces

- WEB TEST264: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test264-native-multicolor-export/
- ZIP fuente completo: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test264-native-multicolor-export.zip
- Repositorio: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test264-native-multicolor-export

**MASTER LVLVL RICO 23/10 permanece intacto.** TEST263/TEST262 también quedan disponibles para comparación.
