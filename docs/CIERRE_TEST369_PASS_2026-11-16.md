# LVLLVL RICO — Cierre de sesión y checkpoint TEST369 PASS
**Fecha local:** noche del 15 al 16 de noviembre de 2026 (Argentina)  
**Repositorio:** \`serigrafiamdp-web/lvllvl-scummpet-export\`  
**Página canónica:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/  
**Rama ejecutada:** \`gh-pages\` (NO usar \`main\` para editar el sitio activo)  
**Commit funcional con TEST369 PASS:** \`e20d6f4da6deb1b242476e566efae910c8d51ecb\`  
**Rama de recuperación:** \`release/test369-pass-2026-11-16\`

## 1. Aprobaciones y cambios de esta sesión

| TEST | Cambio | Estado |
|---|---|---|
| **364** | Cargador C64: muestreo de 16 posiciones 8×8 de Colodore / Pepto / VICE, sin deduplicar índices | **PASS del usuario** |
| 365 | Selector: conserva la opción C64 elegida (Pepto / VICE / Colodore) al reabrir | Integrado; no consta PASS independiente |
| **366** | Selector C64-only: elimina otras plataformas y oculta pestañas Custom/Load, solo en la interfaz | **PASS del usuario** |
| 367 | Primer intento SpotySID al lado de Help | **FAIL de visibilidad**, reemplazado por 368 |
| 368 | Enlace SpotySID junto a Help con resolución del ID real de UI.MenuBar; abre en otra pestaña | Integrado; sin PASS explícito posterior |
| **369** | TEST80: evita llamar a \`resizeThePanel('south')\` repetidamente cuando ya está a 54 px; preserva los ajustes efectivos | **PASS del usuario**, parpadeo inicial corregido en su prueba |

**El editor original no fue sustituido**: el archivo \`gh-pages/index.html\` carga los módulos funcionales anteriores más las correcciones del cierre. Los archivos de paletas de otras plataformas permanecen almacenados deliberadamente; se ocultaron **solo en la UI**. C64 BANK 1/2, Tiles, Dock, frames, exportadores, Bitmap, ECM y SID no fueron editados en el cierre de TEST364–369; el usuario confirmó la corrección visual reportada. Esto **no** implica PASS general de todas las combinaciones de exportación.

## 2. Checkpoint y recuperación
- Punto funcional probado y publicado: \`e20d6f4da6deb1b242476e566efae910c8d51ecb\`.
- Rama fija: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test369-pass-2026-11-16
- El \`index.html\` estable carga TEST369 en el lugar del antiguo script TEST80; el \`js/RICO_UI_LAYOUT_TEST80.js\` original sigue disponible en el repo para comparar/revertir.
- GitHub Pages confirmó deploy \`success\` del commit funcional antes del cierre.
- No sobrescribir este checkpoint al seguir trabajando. Abrir nuevas pruebas como TEST370+ sin retirar funciones ni forzar límites ajenos a la C64.

## 3. Auditoría de exportaciones pendientes (fuentes reales revisadas)

**Separar tres categorías:** (a) PASS visual/audio del usuario en VICE, (b) ensamblado/generación ASM con scripts reales o mocks, (c) funciones de UI con exportador específico aún no integrado. Una ruta presente en la portada **no** significa que todas sus combinaciones estén probadas.

| Ruta / combinación | Estado al cierre | Acción para la próxima sesión |
|---|---|---|
| **TEST363 — Map Scroll diagonal multiframe** | Activo en \`gh-pages\`; recupera TEST342 PASS histórico, pero **sin PASS nuevo de VICE**. Delega mezclas con cardinales, ECM, SID, Group, Individual, Bitmap, multicolor. | Probar PRG de 2 y 4 frames con mapas, colores, direcciones, velocidades y BANK independientes; distinguir resultado de compilación y de VICE. |
| **TEST355 — Group Animate sin Map Scroll + varios frames** | Activo en \`gh-pages\`; genera/ensambla fuentes para frames iguales y distintos; **VICE de esta integración pendiente**. Su README experimental aún dice no promover sin PASS: advertencia histórica que no coincide con su presencia actual en \`index.html\`. | Comprobar Group-only multiframe en VICE; revisar persistencia de movimientos, colores, BANK, transiciones y loop. |
| **Group + Map Scroll + varios frames** | Falta un compositor/scheduler único para mapas, grupo y transición de frame. | Añadir cobertura sin degradar a imagen estática ni descartar frames. |
| **Más de un Group / Group + Individual** | Rutas históricas procesan un solo grupo; escrituras concurrentes sobre un mismo glyph precisan compositor. | Mantener todos los grupos y movimientos; resolver sobreescrituras de bytes y fases, no añadir un veto global. |
| **Group + SID; Map + Group + SID** | Coordinación RAM/IRQ/timers dependiente de cada ruta; no hay PASS global. | Preservar música y efectos a la vez; perfilar conflictos reales. |
| **ECM (EBCM) + frames / Map / Group / bancos** | 64 patrones físicos y 4 colores de fondo son límites reales; los wrappers de TEST350/351/328 son especializados y no garantizan cobertura conjunta. | Evaluar repack no destructivo, planificación de glifos, $D018, Color RAM y runtime por frame; evitar conversiones destructivas del editor. |
| **Horizontal/vertical/diagonal y distintos Window / Scroll Area / BANK** | Múltiples rutas parciales (TEST326/327, TEST168/221–232, TEST196/362/363); geometrías y capacidades diferentes. | Matriz por motor, velocidad, dirección, área de scroll, banco y frame; evitar revivir topes de TEST186 cuando exista motor más capaz. |
| **Bitmap Multicolor + Group o SID y multiframe** | Bitmap TEST297 tiene PASS histórico en su alcance; la composición combinada requiere kernel propio. | Comparar buffers/mapa de memoria y scheduler de Bitmap antes de reusar motores de texto. |
| **Manual Scroll / WASD** | Prototipos TEST304–321 aislados según auditoría del 05/11, no router universal en portada. | Evaluar recuperación sin alterar las rutas PRG existentes. |
| **Exportar fuente completa 64tass + .bin/.asm + ZIP** | Existe Export Assembly/TASS de datos; **no** exportador reconstruible del runtime elegido con todos los efectos. | Usar el mismo plan de PRG para fuente+assets y reensamblar en 64tass/VICE; no confundir datos estáticos con motor completo. |

**Evidencia leída para esta lista:** \`docs/PASS_Y_REGRESIONES_2026-11-14.md\`, \`TEST/test355-export-combinations/README.md\`, \`TEST/test363-diagonal-multiframe-unlocked/README.md\`, \`docs/AUDITORIA_MODOS_Y_EXPORT_TEST330_2026-11-05.md\`, \`docs/MAPA_FEATURES_EXPORT_TEST331_2026-11-05.md\`, \`docs/PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md\`, \`docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md\`. Los documentos de tests antiguos pueden contener advertencias históricas como "no integrado", por lo que la presencia actual de scripts se verificó contra \`gh-pages/index.html\`.

## 4. Regla para la próxima sesión — Desbloqueo completo sin regresiones
1. Partir de **TEST369 PASS** y comparar SHA y orden de scripts de \`gh-pages/index.html\` antes de editar.
2. Hacer una **matriz de combinaciones reales** del botón Export PRG: modo de pantalla, Map (8 direcciones y sin scroll), grupo(s), animación individual, frames, BANK 1/2, música SID, Window, Scroll Area y velocidad.
3. Por cada combinación que no funcione, identificar qué *wrapper* toma \`ToPRGAdv.prototype.createPRG\`, si delega, falla, bloquea o elimina un efecto. No confundir restricción de test con límite de hardware.
4. Recuperar capacidades con un compositor/planificador por recurso cuando sea necesario: charset, pantalla, Color RAM, bancos VIC, IRQ, SID, RAM. Mantener datos JSON originales y no silenciar efectos.
5. Permitir exportación en todas las combinaciones técnicamente realizables; donde falte soporte, exponer diagnóstico específico y desarrollar el componente faltante, no bloquear globalmente por cantidad de frames, BANK u orientación.
6. Una única mejora por TEST; diferenciar JS, ASM ensamblado, PRG cargado y PASS visual/audio en VICE; conservar una rama de rollback con cada PASS.

**Primera línea propuesta para TEST370:** auditar la selección efectiva de rutas y casos que hoy abortan la exportación; después corregirlos por capacidad concreta sin introducir más guardas. No se hizo ninguna modificación a exportadores durante este cierre.
