# LVLLVL RICO — Auditoría de modos, exportadores y restricciones
**Fecha:** 05/11/2026 · **Código investigado:** `gh-pages`, portada TEST329, rama experimental TEST330.

## 1. Alcance de la revisión
Se examinó el árbol GitHub (1.272 entradas, 362 archivos JavaScript), el orden de carga de los **117 scripts** de TEST330 —incluidos **104 módulos de features RICO/TEST/ECM**— y las rutas que redefinen `ToPRGAdv.prototype.createPRG`, Group Animate, ECM, scroll vertical/horizontal/diagonal, multiframe y Bitmap MC. Se leyó el código de restricciones, se realizó una prueba de interfaz con mocks y se generó ASM para casos sintéticos. **No se ejecutó el binario final en VICE ni en una C64 real.**

El proyecto no tiene un único exportador: es una cadena de envoltorios JS que interceptan `createPRG` por orden de carga. Por eso una función puede estar disponible en el editor, pero la ruta finalmente elegida usar otro motor sin su soporte. El objetivo es un router de capacidades, no quitar `if` a ciegas.

## 2. Errores detectados y cambios ya implementados en TEST330

| Área | Problema detectado | Corrección |
| --- | --- | --- |
| UI Group Animate | Al asignar grupo, se escribía `props.animated=false` para los miembros | Eliminada la desactivación automática. Persisten los ajustes del individuo |
| UI Individual Animate | Al asignar movimiento individual, el wrapper borraba grupos superpuestos del JSON | Se conserva Group Animate; conflicto de escritura se explicita al exportar |
| Ondas | El selector ofrecía `ondas-*`, pero algunos recopiladores convertían el tipo a `pingpong-*` | Se retiene el tipo `ondas-*` original como metadato y se usa el escritor **progresivo** histórico para su runtime; Ping Pong standalone continúa atómico |
| Avisos | Group standalone mostraba avisos de motor, optimizador y fallback | Suprimido el aviso en pantalla; diagnóstico permanece en consola, errores visibles |
| Diagonal multigrupo | `groupFromStore` seleccionaba el primer grupo y podía descartar los demás | TEST330 cancela con **error concreto** si hay varios grupos; no genera PRG incompleto sin avisar |
| ECM fuera de horizontal monoframe | El PRG podía generarse en Text Mode aunque se hubiese pedido Extended | TEST330 informa error técnico en diagonal, vertical ancho, multiframe ancho o Group-only ECM sin compositor; no finge conservar los cuatro fondos |
| Monitor de exportación | Errores de ciertas rutas quedaban solo en consola o podían perderse | `window.RICO_TEST330_EXPORT_MONITOR.last` y `.lastError`; error visible si el motor devuelve fallo sin avisar |

Estas modificaciones están **solo en** `TEST/test330-effects-recovery/`. **No se ha tocado la portada TEST329 ni los checkpoints TEST328 PASS / TEST297.**

## 3. Matriz real de posibilidades (no confundir generación ASM con PASS de VICE)

| Modo / ruta | Qué existe | Estado |
| --- | --- | --- |
| Texto C64 40×25 estático, charset individual, bank switch básico | Exportador nativo TEST77/104, según configuración | Legado, comprobar regresiones |
| Map Scroll horizontal Left/Right, 1 frame, hasta 245 columnas calculadas | Motor TEST326/327/328 + TEST330 | **100×25 ECM PASS usuario en TEST328**; **120×25 probado solo en generación ASM** |
| Group Scroll standalone, circular, 4 direcciones, Pixels/Tick 1–8 | TEST247, aceleradores TEST243–246 | TEST247 PASS anterior; TEST330 preserva configuraciones |
| Ondas standalone Left/Right/Up/Down | Compositor progresivo TEST242, sin cambio atómico | Ruta ASM diferenciada sintética; **VICE pendiente en TEST330** |
| Ping Pong standalone | TEST242 atómico y aceleradores TEST243–246 | Ruta ASM distinta de Ondas; VICE pendiente para nuevo conjunto TEST330 |
| Horizontal Map + Ondas + scroll individual en glifos distintos | TEST327 y TEST330 + ECM TEST328 | **ASM generado** para 100 y 120 columnas; **pendiente VICE** |
| Mismo glifo en scroll individual y grupal | Editor TEST330 ahora conserva ambos | PRG debe mostrar error de **escrituras conflictivas** hasta que exista compositor; no es límite arbitrario |
| Dos o más grupos simultáneos | La UI los admite en registros; runners suelen usar uno solo | **Pendiente scheduler multigrupo**, sin descarte silencioso |
| Vertical grande Up/Down | TEST168, Window 40×24/25, Screen 40×N hasta 255 por diseño | Motor separado; combinar con ECM y otros scrolls requiere validación |
| Diagonal 4 direcciones | TEST196 y aceleradores asociados a rutas históricas | Hires disponible según escenario; **ECM diagonal no conservado**, TEST330 lo advierte |
| Horizontal multiframe | TEST205/206, buffer compacto 5.120 bytes, máximo calculado 102 columnas por frame | No tiene planificador de scroll individual multiframe; **ECM multiframe pendiente** |
| Extended Background Color (ECM) | 64 glifos físicos, 4 fondos; TEST328 repack no destructivo *al exportar* horizontal | Hardware 64/4 **real**; no retirarlo |
| Bitmap Multicolor | TEST264 y posteriores, motor final Bitmap TEST297 | PASS histórico TEST297; no se integra automáticamente con rutinas de chars |
| Switch Bank combinado con Map horizontal | Existe switch independiente, pero compositor horizontal rechaza su mezcla con grupo/map | **Pendiente integración de $D018/charsets**, no simple cambio de guard |
| SID | Motor PSID con memoria reservada; otras variantes como RSID no soportadas | Restricciones de cabecera/direcciones/colisión son reales para ese reproductor |
| WASD / Manual Scroll | Prototipos TEST304–321 aislados | No hay un único exportador universal activo en la portada TEST329 |

## 4. Otras rutas destructivas detectadas: PRIORIDAD ALTA

**No corregidas todavía:** el código de conversión de Screen a ECM (`js/SCUMM_ECM_LIVE_REPACK_TEST01.js`) copia los tiles usados a los 64 lugares físicos y **desactiva las propiedades `animated` de los tiles 64–255**. Dos interfaces adicionales de ECM (`SCUMM_ECM_GLYPH_PICKER_TEST04.js`, `SCUMM_ECM_NATIVE_PALETTE_UI_TEST06.js`) también desactivan esas propiedades, y sus operaciones de selección pueden sustituir celdas del mapa por el tile vacío.

Esto puede destruir datos o configuraciones. **No quitar solo la asignación `animated=false`:** ECM usa bits 6–7 como selección de fondo y las referencias a glifos deben migrarse de modo consistente. Próxima corrección: transformación **transaccional**, snapshot/copia recuperable de todos los tiles, mapeo inverso, preservación de fondos y grupos, deshacer, rechazo técnico antes de alterar el documento si hay pérdida. Mientras tanto, para conservar efectos, preferir exportar ECM desde Text Mode con TEST328/330 **sin cambiar el modo del documento**.

## 5. Restricciones por pruebas versus límites reales

**Retiradas o sustituidas:** techo horizontal artificial de 96 columnas (ahora RAM); exclusión destructiva UI Individual/Group; tratamiento implícito de ECM diagonal que perdía fondos sin explicarlo; silenciamiento del descarte de grupos diagonales.

**Todavía pendientes, no declaradas como hardware:** solo un grupo por exportador, un frame en horizontal ancho con Individual, solo 40 columnas en vertical grande, ausencia de combinación múltiple de modos, ECM diagonal/vertical/standalone, traspaso de Ondas con estado propio entre rutas. Requieren código de composición o nuevos buffers, no eliminar la comprobación sin más.

**Reales por el C64 o por los buffers reservados:** ECM 64 patrones/4 fondos; índices de pantalla de 8 bits; direcciones de $D011/$D018/$D021–$D024; solapamiento de RAM; tamaño del bitmap/charset; relación Color RAM/tiempo raster; 245 columnas por banco de 12 KiB para el horizontal actual; 102 por buffer compacto de 5 KiB; no permitir dos escritores concurrentes sobre los mismos ocho bytes sin mecanismo de composición.

## 6. Pruebas técnicas efectuadas (sin VICE)

1. **UI:** carga y ejecución mock de `TileEditor.prototype.setAnimatedType('left')` conserva el grupo `ondas-left` y la propiedad `animated` del carácter; las cuatro opciones Ondas están presentes.
2. **100×25, ECM, Map Left, Ondas Left 2×8 y 2 caracteres individuales distintos:** genera ASM con `$D011=$5B`, registros ECM, motor de mapa, grupo progresivo e individual.
3. **120×25, misma combinación:** genera ASM con los mismos elementos; 6.000 bytes por banco de mapa/color, dentro del presupuesto de 12 KiB.
4. **Group-only Ondas Left:** fuente ASM usa el kernel progresivo y no la secuencia de swap atómico.
5. **Group-only Ping Pong Left:** toma un motor ASM de remapeo/aceleración distinto.
6. **Diagonal + ECM no implementado:** devuelve error explícito sin generar un PRG de modo equivocado.

**Todos los casos 2–5 se probaron con ensamblador simulado; falta enlazar a un compilador real y probar en VICE PAL.**

## 7. Orden de ingeniería recomendado

1. **Mantener TEST330 aislado** hasta PASS de Ondas, Group y Individual con Map real.
2. Construir convertidor ECM reversible sin pérdida de mapa/animadores/tiles, y añadir pruebas ida/vuelta.
3. Unificar en un router explícito el reconocimiento de modos y el reporte de errores; evitar fallback que silenciosamente cambie el modo.
4. Crear scheduler real para **múltiples grupos** y compositor para **grupo+individuo sobre el mismo glifo**; arbitrar bancos y fases con doble buffer.
5. Integrar ECM a diagonal, vertical, multiframe y Group-only; verificar 4 fondos en cada ruta.
6. Reconectar Switch Bank, SID y WASD con asignación de RAM y raster verificable por combinación.
7. Repetir matriz PAL/VICE: 40×25, 100×25, 120×25, 40×100, 4 fondos, ambos banks, 1–8 px/tick, frames, diagonales, Ondas y Ping Pong.

## 8. Recuperación de GitHub

- **Editor principal TEST329 (no modificado):** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- **Prueba TEST330:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test330-effects-recovery/
- **Checkpoint TEST328 PASS:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test328-ecm-preserve-4-backgrounds/
- **Backup previo a TEST330:** `backup/gh-pages-before-test330-effects-recovery-2026-11-05`
- **Backup de la portada TEST297:** `backup/gh-pages-root-test297-before-test329-pared-2026-11-04`
- Los README de pruebas anteriores TEST242–247 registran la procedencia de Ondas/Ping Pong y deben preservarse.

**Regla de continuidad:** no declarar una combinación PASS por el solo hecho de que construya ASM; el usuario debe verificar el PRG en VICE. No quitar guards que preservan integridad física; convertirlos en errores claros mientras se implementan las rutinas faltantes.
