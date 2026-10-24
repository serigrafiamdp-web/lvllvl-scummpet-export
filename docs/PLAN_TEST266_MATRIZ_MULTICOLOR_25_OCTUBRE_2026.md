# PLAN TEST266 — Matriz de exportación C64 Multicolor
**Fecha prevista:** domingo 25 de octubre de 2026. **Estado:** PLANIFICADO; ninguna prueba de esta tabla ha sido ejecutada hoy. **Base de pruebas:** MASTER LVLVL RICO 24 OCT + TEST264 con 1 frame MC PASS.

## Preparación de referencia

1. Usar un **JSON patrón con colores distinguibles**: Background negro (0), Multicolor 1 amarillo (7), Multicolor 2 celeste (3) y Color 3 verde C64 (celda color RAM 8–15, por ejemplo 13). Si el arte original utiliza otras combinaciones, usar los colores reales del documento y anotarlos. No alterar el patrón entre pruebas.
2. Tileset 8×8; verificar índice BANK1/BANK2 y área de trabajo coincidentes; los caracteres MC no deben convertirse en Hi-Res al pintarlos.
3. Guardar copia del JSON de referencia fuera de la versión de pruebas y su PRG básico TEST264 PASS. Abrir VICE PAL con velocidad 100 %, capturar pantalla o MKV.
4. Guardar un PRG por escenario con nombre inequívoco. Registro esperado de hardware para cada frame: `$D016 bit4=1`, `$D021` fondo, `$D022` MC1, `$D023` MC2, Color RAM `$D800-$DBE7` bit3 encendido para las celdas Multicolor.
5. Configurar 1 frame y sin SID para las primeras pruebas; añadir cada recurso posterior de forma aislada. No cambiar motor ni múltiple dimensión a la vez.
6. Si un PRG no se genera, registrar el error completo. Si se genera pero es Hi-Res o altera colores, guardar PRG y captura; **eso es FAIL, no PASS parcial de Multicolor**.

## Matriz principal de prueba

| ID | Movimiento o función | Ticks/Step | Pixels/Step | Frames | Estado inicial | Registro |
|---|---|---:|---:|---:|---|---|
| MC-00 | Sin scroll; referencia TEST264 | — | — | 1 | **PASS confirmado 24/10** | Guardar PRG patrón y captura |
| MC-01a | Map Scroll Up | 1 | 1,2,8 | 1 | Pendiente | |
| MC-01b | Map Scroll Down | 1 | 1,2,8 | 1 | Pendiente | |
| MC-01c | Map Scroll Left | 1 | 1,2,8 | 1 | Pendiente | |
| MC-01d | Map Scroll Right | 1 | 1,2,8 | 1 | Pendiente | |
| MC-02a | Ping Pong Up | 1 | 1,8 | 1 | Pendiente | |
| MC-02b | Ping Pong Down | 1 | 1,8 | 1 | Pendiente | |
| MC-02c | Ping Pong Left | 1 | 1,8 | 1 | Pendiente | |
| MC-02d | Ping Pong Right | 1 | 1,8 | 1 | Pendiente | |
| MC-03a | Move Out Up | 1 | 1,8 | 1 | Pendiente | |
| MC-03b | Move Out Down | 1 | 1,8 | 1 | Pendiente | |
| MC-03c | Move Out Left | 1 | 1,8 | 1 | Pendiente | |
| MC-03d | Move Out Right | 1 | 1,8 | 1 | Pendiente | |
| MC-04a | Move In Up | 1 | 1,8 | 1 | Pendiente | |
| MC-04b | Move In Down | 1 | 1,8 | 1 | Pendiente | |
| MC-04c | Move In Left | 1 | 1,8 | 1 | Pendiente | |
| MC-04d | Move In Right | 1 | 1,8 | 1 | Pendiente | |
| MC-05a | Diagonal Up Left | 1 | 1,8 | 1 | Pendiente | |
| MC-05b | Diagonal Up Right | 1 | 1,8 | 1 | Pendiente | |
| MC-05c | Diagonal Down Left | 1 | 1,8 | 1 | Pendiente | |
| MC-05d | Diagonal Down Right | 1 | 1,8 | 1 | Pendiente | |
| MC-06 | Map 40×50, Scroll Up y Down | 1 | 1,8 | 1 | Pendiente | |
| MC-07 | Map >40 columnas, Scroll Left/Right | 1 | 1,8 | 1 | Pendiente | |
| MC-08 | Horizontal ancho con MC1/MC2 variables | 1 | 1,8 | 2+ | Riesgo reconocido | |
| MC-09a | Group Scroll Up/Down | 1 | 1,2,8 | 1 | Pendiente | |
| MC-09b | Group Scroll Left/Right | 1 | 2,8 primero; 1,3,5,7 después | 1 | Riesgo velocidades impares | |
| MC-10 | Group Ping Pong horizontal | 1 | 2,8 primero; impares después | 1 | Riesgo velocidades impares | |
| MC-11 | ONDAS horizontal y vertical | 1 | 1,2,8 | 1 | Riesgo motor horizontal | |
| MC-12 | Animated Char Left/Right, Up/Down, Blink | 1 | 1,2 | 1 | Riesgo horizontales | |
| MC-13 | Map Scroll + Group Scroll | 1 | 1,2,8 | 1 | Pendiente convivencia | |
| MC-14 | Map Scroll + Animated Char | 1 | 1,2 | 1 | Pendiente convivencia | |
| MC-15 | Scroll + SID | 1 | 1,2,8 | 1 | Pendiente RAM/timing | |
| MC-16 | Cambios de fondo, MC1 y MC2 entre frames | 1 | 1,8 | 2+ | **Fallos MC-01/MC-02 documentados** | |
| MC-17 | Cambio BANK1/BANK2 entre frames | 1 | — | 2+ | Pendiente | |

**Nota:** los movimientos se expresan como configuraciones del editor. Si una combinación no es seleccionable, registrar `NO IMPLEMENTADO`, no `FAIL DE RENDER`. 1 pixel en Group Left/Right es un escenario deliberadamente conflictivo de pares de bits; **no corregir el arte patrón para ocultarlo**.

## Criterio PASS / FAIL de cada caso

- **PASS MC**: PRG generado, ejecución VICE, formas idénticas a preview para la fase correcta, colores BG/MC1/MC2/FC exactos, Scroll/Ping Pong/Move conforme al editor, sin parpadeo/fases desincronizadas ni caídas significativas no previstas.
- **FAIL EXPORT**: diálogo de error, PRG vacío, sin descarga o loader roto.
- **FAIL VISUAL MC**: PRG carga pero muestra Hi-Res, colores desplazados, pares rotos o Color RAM incorrecta.
- **FAIL MOTION**: MC visible correcto pero la dirección, ticks, paso o rebote no coincide.
- **SIN PROBAR**: no hay captura ni PRG, **aunque la ruta tenga ASM disponible**.
- **NO IMPLEMENTADO**: combinación fuera del soporte confirmado de ese motor (por ejemplo más de un grupo horizontal con Animated Char).

## Ficha mínima para registrar cada resultado

```text
TEST266-MC ID:
JSON usado:
PRG generado:
Modo SCREEN:
Dirección / Tipo:
TICKS/STEP:
PIXELS/STEP:
Frames:
BANK activo:
SID: Sí / No
Colores BG/MC1/MC2/FC:
Resultado VICE: PASS MC / FAIL EXPORT / FAIL VISUAL MC / FAIL MOTION / NO IMPLEMENTADO
D016 / D021 / D022 / D023 (si se revisan):
Diferencia editor/VICE:
Screenshot o MKV:
Código o aviso exacto:
```

## Orden recomendado y protección de PASS

Probar primero 20 variantes de Map Scroll con el patrón MC. Solo después pasar a mapa grande, Group, ONDAS, animación individual y SID; así cualquier fallo apunta a **un subsistema** en lugar de cruzar tres motores.

Si se detecta un bug, abrir un test de código independiente **TEST266A / TEST266B / etc.** sobre una rama derivada del MASTER 24/10. Cuando se repare un motor, revalidar Hi-Res y MC para no perder los PASS previos; nunca tocar `MASTER_LVLVL_RICO_24_OCTUBRE_2026` durante las pruebas.

**Lecturas previas:** [MASTER 24/10](MASTER_LVLLVL_RICO_24_OCTUBRE_2026.md) · [Auditoría TEST265](TEST265_AUDITORIA_EXPORT_MULTICOLOR.md)
