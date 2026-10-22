# GUIA DE CONTINUIDAD — LVLLVL RICO (para otro chat IA)

**Fecha/base:** MASTER 22 OCTUBRE 2026; TEST228 PASS confirmado por el usuario en VICE.

## Lectura recomendada (5 minutos)

1. [README principal](../README.md) — features y estado del MASTER.
2. [Estado MASTER](ESTADO_MASTER_22_OCTUBRE_2026.md) — evidencia PASS/FAIL.
3. [Arquitectura](ARQUITECTURA_MOTOR_Y_EXPORT.md) — rutas ASM y memoria.
4. [TEST214–228](CRONOLOGIA_TEST214_228.md) — qué ya se intentó.
5. [Historial completo](HISTORIAL_UNIFICADO_PRUEBAS.md) — pruebas antiguas, log y mapa conceptual originales.

## Localización exacta

- Repositorio: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export
- Editor web: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- Código que usa GitHub Pages: `gh-pages` (no `main`).
- Checkpoint estable: `MASTER_LVLLVL_RICO_22_OCTUBRE_2026`.
- Rollback original antes de limpieza: `backup/PRE_MASTER_22_OCTUBRE_2026_TEST228_PASS`.
- Raíz activa: `index.html`, `js/`, `css/`, `c64/`, `charsets/`.
- Pruebas viejas de interfaz: `TEST/test150` a `TEST/test165`.
- Histórico SID207–213: `docs/historico/`.
- Transcripción sin recortes de los dos TXT históricos: `docs/HISTORIAL_UNIFICADO_PRUEBAS.md`.

## Ruta de código según qué falle

- Horizontal LEFT/RIGHT: `js/RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js` contiene optimización TEST220; **PASS**. No revocar la copia incremental ni el fallback.
- Vertical UP/DOWN: comenzar por `js/RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js`, leer los wrappers verticales en orden de `index.html`; la corrección TEST227 **PASS** está dentro de `js/RICO_PRG_VERTICAL_DIRECT_COLOR_8PX_TEST226.js`.
- Diagonales: `js/RICO_PRG_DIAGONAL_TEST196.js`, TEST221. Tener cuidado: compilación y simulación no son un PASS VICE específico.
- Música: `js/RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` contiene TEST228 **PASS** pese al nombre. Reutiliza el ASM nativo y añade SID; nunca generar PRG sin música si el usuario seleccionó SID.
- Múltiples frames horizontales: `js/RICO_PRG_HORIZ_MULTIFRAME_TEST205.js` y `js/RICO_PRG_HORIZ_COMPACT_FRAMES_TEST206.js`.
- UI Map Scroll/previsualización: `js/RICO_MAP_SCROLL_PREVIEW_SCROLL_AREA_TEST79.js` y módulos de viewport; no confundir preview con temporización real del PRG.
- Remix/charsets: `js/RICO_REMIX_TILESET_TEST24.js`, `js/RICO_GROUP_ANIMATE_TEST34.js`, `js/RICO_FRAME_CHARSET_BANK_TEST15.js`.

## Validaciones conocidas

- TEST220 Left/Right: usuario lo dio por bueno.
- TEST227 Up/Down 8px/1 tick: **PASS, sin bugs**.
- TEST228 SID: **PASS**. Audio y video deben mantener clocks independientes.
- TEST223 contadores: `m 0028 002a` en VICE (busy/wait/commits; wrap a 256). No comparar totales entre muestras de distinta duración como una estadística de velocidad.
- TEST225 4px: el efecto saltarín seguía; no reetiquetar como corregido.
- TEST226: congelamiento por `JMP $0000`, corregido por salto absoluto autoconfigurable en TEST227.

## Procedimiento de cualquier cambio futuro

1. Leer el código real y todos los wrappers cargados después del motor que vas a modificar. Revisar el SHA de `gh-pages`.
2. Crear rama `test/...` desde el MASTER actual. No alterar el MASTER hasta nuevo PASS explícito.
3. Optimizar sin sacrificar las 40×25 celdas, colores, música y controles Pixels/Step y Ticks/Step.
4. Verificar sintaxis, ensamblado, límites de ramas 6502, colisiones RAM y layout PRG. Si se solicita, analizar también el PRG real del usuario.
5. Publicar un **TEST web** con cache-buster y ZIP completo limpio desde la rama; mantener backups.
6. El usuario valida visual y musicalmente en VICE: solo entonces marcar PASS y promover.
7. Actualizar arquitectura, tabla de versiones, README y referencia del MASTER. Evitar decenas de carpetas/TXT nuevos en raíz; usar `TEST/` o `docs/`.

## Errores a evitar

No reintroducir `JMP (color_tbl_lo)` en la ruta que originó `JMP $0000`. No insertar código de SID encima de direcciones de memoria ocupadas; `$1000–$1FFF` se reserva para PSID compatible. No cambiar audio para ajustar velocidad visual. No fusionar `main` con `gh-pages` sin comparación (divergieron en muchos archivos).

**Prompt de recuperación sugerido:** «Continuemos LVLLVL RICO desde `MASTER_LVLLVL_RICO_22_OCTUBRE_2026`. Leé README, arquitectura y guía IA en `gh-pages`; conserva TEST220 horizontal, TEST227 vertical 8px y TEST228 SID PASS. No modifiques nada sin revisar wrappers y preparar un TEST reversible».
