# TEST330 — Scheduler multigrupo independiente (experimental)

Fecha: 2026-11-05. Origen: TEST329 (gh-pages). **Sin PASS en VICE**.

## Problema
El exportador independiente TEST247/246 rechazaba cualquier proyecto con más de un grupo por `groups.length!==1`. La ruta diagonal también tiene un bloqueo propio para más de un grupo; TEST330 **no corrige diagonal ni Map Scroll**.

## Implementación
- `TEST/test330-multigroup/js/RICO_GROUP_STANDALONE_TEST330.js` conserva sin cambios la ruta de un solo grupo.
- Para varios grupos sin Map Scroll construye una instancia de `groupASM` por grupo; separa símbolos `group182_*`, contador, fase, estado y pending.
- IRQ actualiza cada timer; el main loop sirve todos los grupos de manera secuencial y cooperativa, una columna por llamada.
- Los punteros zero-page $35-$38 se comparten solo secuencialmente; tablas de origen numéricas se reubican junto con cada bloque.
- Se asigna RAM en bloques alineados a 256 bytes desde $A000 hasta antes de $D000. No hay máximo arbitrario de cantidad. Si la RAM no alcanza se informa sin descartar grupos.
- Si dos grupos comparten el mismo glifo físico de un banco se informa conflicto de composición, no se fusionan ni se descartan.
- No se habilitaron versiones de optimización TEST246/247/245 para el camino multigrupo: se conserva el generador base de grupo para aislar el riesgo.

## Límites de alcance de esta prueba
- Solo **Group Animate sin Map Scroll** y **un frame**, pantalla 40x25.
- El modo optimizado con intercambio de charset Ping Pong de grupo único sigue en su propia ruta; verificar Ping Pong multigrupo en VICE.
- Sin PASS de VICE, sin test de convivencia con SID; no integrar en la portada.
- La rama de la página principal TEST329 queda intacta.

## Pruebas esperadas
1. Crear dos grupos con glifos diferentes y animaciones Left / Right en un mapa simple de 40x25, un solo frame, sin Map Scroll. Exportar PRG desde TEST330 y ejecutar en VICE PAL.
2. Verificar movimiento simultáneo, colores y ausencia de basura.
3. Repetir con tres grupos disjuntos y con grupos en bancos diferentes cuando proceda.
4. Probar un solo grupo como regresión del camino previo.
5. Si falla, guardar error exacto y PRG; revisar `window.RICO_TEST330_MULTIGROUP_PLAN`.

Este documento es un checkpoint experimental. No significa que el scheduler genérico para horizontal, vertical, diagonal y mapas ya esté terminado.
