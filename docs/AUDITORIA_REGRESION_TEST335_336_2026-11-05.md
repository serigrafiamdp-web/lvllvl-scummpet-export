# Auditoría de regresión — TEST335/336 — 5 noviembre 2026

## Síntomas reportados
- TEST335: `TEST186: selecciona exactamente UN Group Scroll vertical para esta prueba`.
- TEST336: el usuario informa que no exporta PRG y no presenta advertencia.
- En TEST336, la animación grupal no se previsualiza en el dibujo.
- El usuario observa una aparente duplicación del tileset en BANK 2.

## Base segura
TEST332 PASS de dos grupos Scroll Left+Right sin Map Scroll.
TEST334 PASS reportado para grupos Up+Down, Ondas horizontal y vertical, Ping Pong horizontal y mezcla Left+Up, **sin Map Scroll**, un frame. No modificar estos archivos.
TEST335/336 **no son PASS**. No promocionar al editor raíz.

## Hallazgos verificados en código
1. TEST335 `H.collect` llamaba primero a `previousCollect(self)`, que acaba entrando en `makeGroup` de TEST186 con validación `mods.length!==1`. TEST336 añadió un flag temporal alrededor del recopilador en una copia de TEST327. Corrige la condición detectada, pero no certifica la ruta final del botón.
2. Hay wrappers en orden: TEST327 scheduler, TEST334 standalone, SID TEST207, bitmap TEST297, ECM TEST328 y TEST336. El orden es contrato técnico. Hay colectores léxicos y hooks públicos, por lo que parchear solo `H.collect` o `H.build` no garantiza interceptar todos los exportadores.
3. El ECM TEST328 `pack()` maneja `d.group` (único), pero no la colección nueva `d.__groups335`. Es un riesgo confirmado de incompatibilidad de remapeo: no se debe usar esta combinación hasta adaptar/revisar todos los punteros de grupos, datos y animaciones. ECM tiene un techo físico de 64 glifos, distinto de Text Mode.
4. En `RICO_GROUP_STANDALONE_TEST334.js`, cuando no hay BANK2 explícito, la **copia de exportación** hace `bank2=rawBank2?glyphs(rawBank2):bank1`. En el exportador horizontal TEST327 hay un fallback análogo. No se constató escritura permanente a BANK2. Auditar fuente del banco y panel antes de atribuir el síntoma a esta operación.
5. TEST336 no modificó directamente el motor de preview del editor, heredado de `RICO_GROUP_ANIMATE_TEST34.js`. La falta de preview requiere reproducción controlada comparando TEST334/TEST336 con mismo JSON, mismo banco, mismo estado Play y mismo modo de pantalla. La captura enseña un botón «Play» que podría indicar vista previa pausada, sin demostrarlo.
6. El código TEST336 hace `d.__groups335=groups;d.group=null`, lo que desacopla colección multigrupo de las APIs ECM que solo conocen `d.group`. El primer paso siguiente debe ser auditar el contrato de datos del exportador.
7. No hay instrumentación de extremo a extremo de click→selección de exportador→collect→build→assemble→download. Por tanto, «no exporta sin advertencia» sigue sin causa final confirmada.

## Próximo paso recomendado
- Mantener TEST334 como checkpoint PASS.
- No seguir sumando wrappers sobre TEST336.
- Capturar con instrumentación de solo diagnóstico la ruta efectiva y errores del botón Export PRG, y verificar exactamente qué modos y dimensiones tiene el proyecto del usuario.
- Separar modo estándar (hasta 256 códigos por banco) y ECM (64 glifos físicos), preservando BANK2 solo si está explícitamente configurado.
- Reproducir previsualización en TEST334 y TEST336 en Play antes de tocar renderer; comparar el JSON.
- Construir una sola abstracción explícita `groups[]` para planificación, remapeo, kernel y scheduler. Controlar tamaño de RAM y colisiones reales, no número arbitrario de grupos.
- Crear TEST nuevo solo después de identificar ruta real y contrato; nunca editar checkpoint PASS.
