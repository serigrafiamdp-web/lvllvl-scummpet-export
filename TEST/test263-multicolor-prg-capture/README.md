# TEST263 — Reparación de captura del PRG Multicolor (24/10/2026)

**Estado:** nueva prueba aislada, pendiente de validación con VICE. TEST262 anterior y MASTER 23/10 intactos.

## Qué pasó en TEST262

Al intentar exportar SCREEN → Multicolor, el aviso decía: "TEST262: el motor de exportación no devolvió un PRG válido".

La causa está **confirmada con el código fuente original** `lospec/lvllvl/src/js/textMode/c64export/toPrgAdvanced.js`: `ToPRGAdv.createPRG()` construye una matriz `output` con el PRG final y sólo la entrega a `download(output, filename, 'application/prg')` si `args.download` es verdadero. Al final, el método **devuelve `{blocks:blocks}`**, información de memoria, **no bytes del PRG**. Además `this.prg` sólo contiene parte base del cargador y NO sustituye el PRG terminado.

TEST262 llamaba al motor nativo con `download:false`, por lo que no veía bytes completos; detectaba la respuesta de metadatos y mostraba el error. No hay prueba de fallo del dibujo o del ensamblador a causa de este aviso.

## Arreglo TEST263

1. Mientras se exporta Multicolor, se instala una captura temporal en `window.download`; el motor interno se llama con `download:true,type:'prg'`. Así **genera el PRG final completo**, pero su descarga queda interceptada y no llega al navegador.
2. Se usa la matriz original capturada en vez del objeto `{blocks}`; como alternativa compatible con motores nuevos, se acepta un `Uint8Array` o matriz de bytes devuelto directamente.
3. Se validan longitud y cabecera PRG de carga. No se usa `this.prg` para sustituir el programa completo.
4. La exportación final usa el mecanismo de descarga original exactamente **una vez**, sólo después de aplicar los arreglos de TEST262 a los registros VIC.
5. El ASM mantiene `$D016` bit 4 habilitado al exportar, `$D022/$D023` con Multicolor 1/2 y Color RAM de las celdas. Si el motor no permite parche seguro, no produce un archivo falsamente Hi-Res.
6. No se carga simultáneamente TEST262: TEST263 lo **reemplaza** en el orden de scripts, conservando los módulos TEST256–261, Scroll FAST y ONDAS.

## Pruebas ya realizadas

- Con exportador simulado **nativo**: devuelve `{blocks}`, guarda un `this.prg` parcial y entrega PRG sólo mediante `download()`. TEST263 captura el **PRG completo**, parchea fuente ASM y entrega una única descarga.
- Caso `download:false` del usuario: no descarga ningún archivo, pero devuelve bytes completos para otras rutinas.
- Motor grupal con retorno propio de bytes: sigue exportando.
- Motor que solo devuelve bytes: sigue exportando.
- Ruta Hi-Res: se utiliza el exportador anterior sin parche.
- Rutas incompatibles sin `STA $D016`/`STA $D021`: se bloquean deliberadamente para no generar PRG mal interpretado.

**No se pudo ejecutar VICE desde la prueba simulada**. La comprobación definitiva es la del usuario con su proyecto de arte.

## Próxima prueba

Abrir la web TEST263, seleccionar SCREEN → Multicolor, Export → PRG sin SID ni scroll, y comprobar que descarga el PRG en vez de mostrar error. Ejecutarlo en VICE y confirmar que arte y colores coinciden con el área de trabajo. Luego comprobar scrolling, BANK1/2 y música por separado. Si aún falla, enviar texto literal del aviso o PRG generado.

## Enlaces

**WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test263-multicolor-prg-capture/

**ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test263-multicolor-prg-capture.zip

**Repo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test263-multicolor-prg-capture
