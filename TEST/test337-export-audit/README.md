# TEST337 — Auditoría instrumental de exportación, grupos y BANK2

Fecha 2026-11-05. Base TEST336, no PASS. **No modifica el motor exportador, no cambia el contenido del editor, no toca TEST334 PASS ni la portada.**

## Síntomas a explicar
- TEST336 no descarga PRG y no presenta error.
- Animación grupal no se ve sobre el dibujo.
- BANK2 parece duplicar BANK1.

## Instrumentación
- Wrapper externo sobre `ToPRGAdv.prototype.createPRG` que delega al original y anota entrada, retorno `false/null/bytes`, excepciones, si se produjo descarga y errores existentes (`RICO_TEST326_HORIZONTAL_LAST_ERROR`, standalone, ECM).
- Registra alertas durante exportación, errores de página y promesas rechazadas.
- Cuenta actualizaciones de `TileSet.update` sin modificar su resultado; botón `Estado/Bancos` muestra modo, dimensiones, frames, configuración del mapa, bancos y glifos con contenido por banco.
- `fingerprint` lee los tileData de BANK1 y BANK2 y genera una huella; **la igualdad de huellas no indica escritura mutante**, y la presencia/ausencia de BANK2 explícito queda diferenciada.
- Botón `Copiar diagnóstico` para pegar reporte en el chat; los registros están en `window.RICO_TEST337_DIAGNOSTIC.report()`.
- El diagnosticador no promete interceptar todas las rutinas internas léxicas, pero sí el resultado de `createPRG`, y muestra cuando no se llega a descarga.

## Prueba controlada
1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test337-export-audit/ y cargar el mismo JSON de TEST336.
2. Pulsar Play en la UI; observar si la animación aparece sobre el dibujo, pulsar `Estado / Bancos` para ver `ticksObserved`.
3. Pulsar Export PRG con Map Scroll horizontal y los grupos actuales.
4. Pulsar `Copiar diagnóstico` y compartir texto en el chat. El PRG no tiene por qué descargarse en esta prueba.
5. Comparar con TEST334 usando idéntico JSON, frame y modo si el preview sigue detenido.

## Precauciones
- No promover TEST337 a raíz, no afirmar arreglos de Map Scroll + múltiples grupos.
- Para integrar, revisar el contrato del exportador real, no seguir sumando wrappers sin saber la ruta.
- BANK2 en exportación tiene fallback `bank2=bank1` cuando el segundo banco no existe, sin evidencia de mutación del documento. El reporte distingue presencia de datos reales.
