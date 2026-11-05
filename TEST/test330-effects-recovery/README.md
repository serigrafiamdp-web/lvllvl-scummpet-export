# TEST330 — Ondas originales y animaciones independientes (05/11/2026)

**Prueba aislada. No PASS de VICE todavía.** Se conserva la portada TEST329 y los checkpoints TEST328/297.

## Auditoría: problemas reales

1. Group Animate desactivaba **automáticamente** la animación individual de los caracteres seleccionados; configurar Individual Animate borraba **automáticamente** el grupo. TEST330 conserva las dos configuraciones y no destruye los ajustes del documento.
2. El selector **ONDAS Left/Right/Up/Down** seguía existiendo en la interfaz, pero la ruta combinada lo normalizaba internamente a Ping Pong. TEST330 conserva su nombre original como metadato y usa el compositor **progresivo del charset visible**, sin conmutación atómica. Ping Pong standalone continúa usando el intercambio atómico de bancos.
3. La ruta Group standalone mostraba mensajes informativos en pantalla. TEST330 los deja solo en consola; muestra diálogos únicamente si ocurre un error.
4. ECM horizontal monoframe y Bitmap TEST297 siguen igual. **ECM diagonal/vertical grande, multiframe y Group-only** todavía no tiene runtime ECM equivalente, por lo que TEST330 informa un error antes de entregar un PRG incorrectamente degradado a Text Mode.
5. La ruta diagonal actualmente podía seleccionar el primer grupo e ignorar el resto. Con dos o más grupos configurados, TEST330 explica el conflicto en lugar de descartarlos.

## Límites reales todavía no resueltos

- El VIC-II solo muestra 64 glifos físicos con ECM y cuatro fondos a la vez.
- Grupo e Individual que escriben los mismos 8 bytes del mismo glifo necesitan compositor combinado. **Ahora se conservan ambos efectos en el JSON**, pero esa combinación todavía da un error de exportación.
- Múltiples grupos simultáneos con mapa necesitan un scheduler multigrupo real; no basta con quitar un `if`.
- Los motores de vertical, diagonal, multiframe, Group-only y Bitmap tienen pipelines separados. La falta de ECM en esas rutas requiere port específico.
- Los 245 *columnas* monoframe horizontales y 102 multiframe compactas son límites por buffer calculados; el ancho 120 ya pasa generación ASM, no VICE PASS general.

## Modos que conviene probar mañana

1. **Ondas LEFT standalone** y **Ping Pong LEFT standalone**, mismo grupo de 2×8 y velocidad. Ondas debería mostrar la actualización progresiva peculiar; Ping Pong no.
2. **Map Scroll LEFT 120×25 + Ondas**, un frame, Text/ECM según diseño; exportar, comparar.
3. **Individual fuera del grupo + Group Ondas + Map Scroll**: configurar los tres, guardar/reabrir JSON, comprobar que ninguno se borre; exportar y ejecutar.
4. **Mismo glifo con Individual + Group**: el JSON debe conservar ambos ajustes, pero el PRG debe dar error explícito de conflicto hasta tener compositor real.
5. Regresión: MEGASOFT TEST328, PARED TEST329, Bitmap TEST297.

Diagnóstico para consola: `window.RICO_TEST330_EXPORT_MONITOR.last` y `.lastError`.

URL: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test330-effects-recovery/


## Auditoría transversal

[Ver inventario de rutas, restricciones y pruebas del 05/11/2026](../../docs/AUDITORIA_MODOS_Y_EXPORT_TEST330_2026-11-05.md). El rango 120×25 ya genera ASM con Ondas y dos individuales; solo se declara PASS después de VICE.
