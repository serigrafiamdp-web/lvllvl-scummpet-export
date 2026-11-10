# TEST350 — AUDITORÍA DE REGRESIÓN / SIN RESTRICCIONES NUEVAS

Fecha: 2026-11-09. **Candidato experimental**, pendiente de prueba del usuario en VICE; NO está integrado en `gh-pages/index.html`.

## Error introducido en esta tarea

TEST349 interceptaba cualquier proyecto C64 EBCM con 2 o más frames. Entonces `collect()` cancelaba la exportación si tenía Map Scroll, BANK2, SID, Group Animate, animación individual, tamaño distinto de 40×25 o más de 10 frames. Eso convertía límites del pequeño motor de prueba en prohibiciones generales del editor. Comportamiento incorrecto reconocido.

## Cambios en TEST350

- Conserva el motor estático exacto de TEST349 y sus mejoras visuales y raster.
- Antes de utilizar este motor evalúa qué proyecto corresponde a otro exportador. En cualquier combinación diferente, devuelve **sin cambios** las opciones originales a la función `createPRG` anterior (`old.apply(this,arguments)`).
- Delegación para Map Scroll izquierda, derecha, arriba, abajo y las cuatro diagonales; BANK2; SID; Group Animate; animación individual de glifos; dimensiones distintas de 40×25; 1 frame o 11+ frames; modos de pantalla distintos y tilesets distintos.
- Si el `collect()` o generador ASM del motor estático no pueden representar un proyecto, TEST350 delega al exportador anterior, en vez de bloquearlo.
- Se eliminó la validación obligatoria exclusiva de REMISERIA para los glifos 14 y 24. Se eliminó el acceso incondicional a la novena frame para diagnóstico de la K. Ahora los diagnósticos son genéricos e informativos.
- Los límites de memoria/tiempo y las reglas físicas de VIC-II siguen aplicándose dentro de cada motor, pero **no se usan para rechazar exportaciones que otro motor pudiera manejar**.

## Pruebas de regresión ejecutadas

20 escenarios con llamada a `createPRG()` sobre exportadores simulados. Para 19 escenarios ajenos al caso estático, se comprobó llamada efectiva a `old`, conservación de identidad del objeto `args` y de las frames (sin mutar). El caso 2 frames pertenece al motor estático y se generó ASM directamente.

Map Scroll comprobado: left, right, up, down, diag-up-left, diag-up-right, diag-down-left, diag-down-right.

Otros casos: SID por opciones, SID por música, BANK2, Group Animate, individual glyph animation, 1 frame, 11 frames, 120 columnas, 120 filas, modo texto distinto, tiles 16×8.

Pruebas exactas con REMISERIA 64 (1).json: los 9 mapas, Color RAM, paletas raster y ASM del motor TEST350 son **byte por byte equivalentes al ASM de TEST349**, tras sustituir únicamente el número de etiqueta del TEST.

Recopilador+generador de ASM probado para cantidades de 2 a 10 frames a partir de REMISERIA. Todas generaron código. **No se compiló en el ensamblador real del navegador y no se ejecutó TEST350 en VICE.**

## Precaución

La delegación **evita nuevas restricciones de esta tarea**, pero no constituye una garantía de que los exportadores antiguos soporten todas las combinaciones. Cualquier mensaje de otro motor necesita diagnóstico separado. No quitar comprobaciones de integridad física sin un motor capaz de conservar los efectos.

## Rutas

- PASS archivado: `TEST/test349-ecm-bg-slots/`
- Router experimental seguro: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test350-ecm-safe-router/
- Producción y TEST342 no modificados.