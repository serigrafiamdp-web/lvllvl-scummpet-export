# MASTER LVLVL RICO — sábado 24 de octubre de 2026

**Estado: snapshot congelado en GitHub tras TEST264.** Se conserva el primer **PASS de exportación C64 Multicolor con 1 frame, sin Map Scroll ni SID**, confirmado visualmente por el usuario en VICE el 24/10/2026. Las otras combinaciones permanecen **no validadas en Multicolor**, incluso si tienen un PASS previo en Hi-Res.

## Enlaces y recuperación

- **MASTER de hoy (rama inmutable de trabajo):** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026
- **ZIP completo del MASTER:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_24_OCTUBRE_2026.zip
- **Editor TEST264 aprobado en VICE para exportación simple MC:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test264-native-multicolor-export/
- **Documento auditoría TEST265:** [TEST265_AUDITORIA_EXPORT_MULTICOLOR.md](TEST265_AUDITORIA_EXPORT_MULTICOLOR.md)
- **Hoja de pruebas para 25/10:** [PLAN_TEST266_MATRIZ_MULTICOLOR_25_OCTUBRE_2026.md](PLAN_TEST266_MATRIZ_MULTICOLOR_25_OCTUBRE_2026.md)
- **MASTER diagonal TEST254 (23/10) preservado por separado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026
- **MASTER Group Scroll FAST TEST247 del 23/10 preservado por separado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026_GRUPALES_TEST247_PASS

**Importante:** `main` y `gh-pages` divergen. Esta rama se creó desde `release/test264-native-multicolor-export`, que proviene del editor web `gh-pages`, y mantiene su propio `index.html` listo para abrir desde la raíz de un deployment independiente. **La raíz pública de GitHub Pages no fue reemplazada.** El MASTER diagonal TEST254 sigue separado; no asumir que ambos motores han sido fusionados o validados simultáneamente.

## Qué incluye este MASTER

| Función | Script / referencia | Estado |
|---|---|---|
| Editor Rico anterior, 2 bancos (512 índices), sprites/tileset, vista de grupos, selección, scroll | Dependencias preservadas desde `gh-pages` | Estado histórico conservado |
| Group Scroll FAST ASM (4 direcciones) y Ping Pong; ONDAS separado | TEST247 + TEST246 | PASS anterior en Hi-Res; **sin PASS MC específico** |
| Compactación de herramientas/paleta C64 de 16 colores | TEST256 | Incorporada |
| Refresco completo del índice al cambiar SCREEN | TEST257 | Incorporada |
| SCREEN Text/MC/ECM sin bloquear al superar límite del repack | TEST258 | Incorporada; restricciones reales del VIC siguen vigentes |
| Render C64 Multicolor en índice BANK1/BANK2 | TEST259 | Incorporada |
| Pincel de color RAM bit3: 8–15 habilita Multicolor | TEST260 | Incorporada |
| Edit → Replace Color en MC / área completa o selección / intercambio y Undo | TEST261 | Incorporada |
| Exportación VIC-II MC experimental con captura del PRG completo | TEST262/263 | Código histórico preservado; **TEST264 sustituye sus wrappers activos** |
| Exportación PRG nativa Multicolor: modo 2, colores compartidos, BANK1/2 | TEST264 | **PASS confirmado en VICE: pantalla simple, 1 frame** |
| Compatibilidad de Scroll/Group/ONDAS/SID con Multicolor | TEST265 | **Auditoría documentada; pruebas pendientes** |

### Cambios cruciales TEST264

- El exportador RICO TEST23 original forzaba `safeArgs.mode='standard'`, por lo que se descartaban las tablas reales de C64 Multicolor.
- El wrapper `RICO_PRG_DUAL_BANK_TEST264.js` adapta el modo a `'multicolor'` al detectar `layer.getScreenMode()==='c64multicolor'`; en Text sigue `'standard'`.
- `RICO_MULTICOLOR_EXPORT_TEST264.js` captura el PRG nativo completo por la llamada a descarga interna y comprueba que el byte de configuración VIC a `$0811` sea `2` antes de descargar. Las rutas ASM que no usan el exportador nativo siguen siendo experimentales.
- No modificar estas dos rutas durante la auditoría de mañana: crear prueba aislada TEST266+.

## Matriz Multicolor (estado cerrado a 24/10/2026)

| Movimiento / función | Estado después de TEST264 |
|---|---|
| Sin Scroll, 1 frame | **PASS en VICE confirmado por usuario** |
| Scroll Up / Down / Left / Right | ASM disponible; requiere PASS MC en VICE |
| Ping Pong cuatro direcciones | ASM disponible; requiere PASS MC en VICE |
| Move Out cuatro direcciones | ASM disponible; requiere PASS MC en VICE |
| Move In cuatro direcciones | ASM disponible; requiere PASS MC en VICE |
| Diagonales cuatro direcciones | ASM disponible; múltiples frames con riesgo |
| Scroll vertical en mapas 40×50 | Disponible; requiere PASS MC en VICE |
| Scroll horizontal en mapas anchos | Disponible; requiere PASS MC en VICE |
| Scroll horizontal con múltiples frames | Riesgo al cambiar colores compartidos entre frames |
| Group Scroll vertical | Disponible; requiere PASS MC en VICE |
| Group Scroll horizontal | Riesgo de descomponer píxeles MC con velocidades impares |
| Group Ping Pong horizontal | Mismo riesgo con velocidades impares |
| ONDAS horizontal | Motor de bits sin adaptación exclusiva para MC |
| Animated Chars Left / Right | Riesgo de alterar pares de bits |
| Scroll + SID | Compatibilidad MC aún sin validar |

### Bugs de código identificados (no corregidos en el MASTER)

- **MC-01:** exportador nativo obtiene `getC64Multi1Color()` y `getC64Multi2Color()` sin índice de frame, lo que puede omitir cambios de paleta entre frames.
- **MC-02:** el parche ASM exige una etiqueta `current_frame` de una forma restrictiva; algunos motores usan `current_frame=$02`. Con diferentes MC1/MC2 puede rechazar una exportación válida.
- **MC-03:** desplazamientos horizontales impares realizados bit a bit separan los pares de color MC (2 bits/píxel).
- **MC-04:** parcheo automático del ASM no demuestra VICE correcto, especialmente en rutinas cambiantes $D016, doble buffer y SID.
- **MC-05:** algunas rutas de diagonal solo leen el primer frame. No suponer soporte multiframe.
- **MC-06:** motores PRG binarios anteriores que evitan `g_app.assembler.assemble` quedan fuera del parche y pueden ser rechazados.

## Próximo paso el domingo 25 de octubre

Usar la matriz preparada en `PLAN_TEST266_MATRIZ_MULTICOLOR_25_OCTUBRE_2026.md`. Mantener un proyecto patrón con colores C64 bien identificables, exportar un PRG por variación, observar en VICE, conservar los archivos/registro de fallos; priorizar primero Map Scroll cardinal, luego Ping Pong, Move In/Out, diagonal y finalmente Group/ONDAS/individual/SID.

No asignar automáticamente PASS a ningún modo adicional. La fecha de mañana es **plan de trabajo**, no tarea programada ni test ejecutado. Las modificaciones futuras deben hacerse en una carpeta/branch de TEST266 y jamás directamente en este MASTER.

## Regla de mantenimiento

No reemplazar el MASTER 23/10 diagonal ni el Group247 y no romper ONDAS para corregir Multicolor. Cada TEST de mañana se valida con PRG + ejecución VICE antes de incorporar a un MASTER posterior. Evitar residuos ZIP por test y limpiar dependencias no usadas solo después de confirmar la ruta activa.
