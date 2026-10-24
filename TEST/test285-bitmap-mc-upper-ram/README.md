# TEST285 — Atlas Bitmap Multicolor trasladado a RAM alta

**Fecha:** 24/10/2026.
**Motivo:** TEST284 produce `No cabe el atlas en memoria Bitmap` con grupos de animación grandes.
**Estado:** PASS sintaxis, estrés de memoria y emulación de loader CPU 6502; **falta PASS visual en VICE**. MASTER y TEST282/284 intactos.

## La causa NO es el tamaño del mapa
TEST284 dedicaba solo $3800-$5BFF (9216 bytes) a **todos los patrones temporales más las listas de celdas modificadas**. Aun con 256 índices de tiles, una animación grupal puede producir centenares o miles de variaciones de patrones. El mapa sigue siendo visible 40×25, independientemente de cuánto ocupa el atlas.

## Implementación
- NUEVO atlas + streams de animación en `$8000–$CFFF`: **20.480 bytes** (frente a 9216 bytes previos). **2,22 veces más** de espacio.
- El VIC mantiene Screen $5C00, Bitmap $6000, Color RAM $D800 y registros comprobados en TEST282.
- El código 6502 comienza con trampolín a la rutina de inicio, realiza `LDA #$36 / STA $01` para desactivar BASIC ROM manteniendo KERNAL e I/O accesibles, y devuelve el control al loader original. Permite leer correctamente patrones y streams en $A000-$BFFF.
- PRG exportado directamente como imagen estática o como animación individual/grupal desde el menú habitual **Export PRG**. No incorpora botones ni configuraciones de exportación adicionales.
- Sigue actualizando solo celdas del bitmap que cambian, no el bitmap completo.
- Los archivos PRG pueden ser más grandes que en TEST284 porque contienen un hueco de memoria entre los datos iniciales y el atlas alto. Esta versión prioriza la funcionalidad y deja la compresión del PRG para otra optimización.
- Los errores restantes muestran los bytes que necesita el atlas/los streams y el límite total. Si una animación excede 20KB, será necesario un motor de cambios o compresión más eficiente; **no se recomienda achicar el mapa como solución**.

## Pruebas realizadas
- JS sintaxis PASS.
- Reproducción sintética de la falla exacta de TEST284: **grupo 10×16 tiles**, 16 tiles visibles distribuidos en 16 filas, scroll grupal horizontal, 80 fases.
- En TEST284 original: `No cabe el atlas en memoria Bitmap.` (FAIL original confirmado).
- En TEST285: atlas **10.248 bytes** + streams **8080 bytes** = **18.328 bytes**, total menor que 20.480. PASS.
- PRG construido en la prueba: 49.049 bytes, final de datos $C798.
- Simulación 6502 de 42.243 instrucciones: entra y sale del trampolín, configura $01=$36, lee atlas/streams en RAM alta, ejecuta 2 transiciones de animación y conserva $D011/$D016/$D018. PASS.
- **8.000 / 8.000 bytes de bitmap comprobados** tras una actualización frente al estado objetivo. PASS.

Los resultados de simulación no sustituyen la validación en VICE con un proyecto real.

## Prueba sugerida
1. Abrí [TEST285 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test285-bitmap-mc-upper-ram/).
2. Importá el **mismo proyecto** que arrojaba el aviso de TEST284. No reduzcas dimensiones ni quites animaciones.
3. Seleccioná `SCREEN → Multicolor Bitmap (Experimental)`.
4. Exportá por el menú habitual **Export PRG**.
5. Abrí el .PRG generado en VICE. Si sigue apareciendo un aviso, registrá los bytes que necesita y los bytes disponibles. Si el PRG funciona pero va lento, hay que medir el presupuesto ASM del motor, independiente de la RAM.

## Riesgos y limitaciones
- Mantiene las restricciones de TEST284: única frame de documento, animaciones individuales/grupales, sin Map Scroll ni SID.
- Sólo reproduce el sector superior izquierdo 40×25 celdas: un mapa 40×50 se puede mantener pero todavía no desplaza el viewport.
- Algunas combinaciones de grupos muy grandes pueden superar el límite de 20.480 bytes; esta ampliación no soluciona todas las escenas posibles.
- Con BASIC ROM deshabilitada ($01=$36), no se debe retornar a BASIC sin restaurar el puerto; el PRG animado permanece reproduciéndose y la IRQ sigue deshabilitada como en los otros tests estáticos.
- Tamaño final del PRG mayor: el formato actual no comprime los huecos ni los registros de cambio.
- El presupuesto de raster de 1 tick aún no está medido; **aumentar RAM no aumenta automáticamente velocidad**.

## Entregables
- [Abrir WEB TEST285](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test285-bitmap-mc-upper-ram/)
- [Descargar ZIP TEST285](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test285-bitmap-mc-upper-ram.zip)
- `TEST/test285-bitmap-mc-upper-ram/js/RICO_BITMAP_MC_UPPER_RAM_TEST285.js`
