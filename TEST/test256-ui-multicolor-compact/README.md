# TEST256 — Multicolor: barra lateral compacta sin ocultar Frame

**Fecha:** 23/10/2026. **Estado:** listo para prueba visual; NO PASS hasta confirmación.

**Base:** `MASTER_LVLLVL_RICO_23_OCTUBRE_2026_GRUPALES_TEST247_PASS` y orden de scripts exacto de TEST247. Sólo agrega `RICO_UI_MULTICOLOR_COMPACT_TEST256.js`.

## Defecto previo

Cuando SCREEN cambia de Text a C64 Multicolor, el panel izquierdo agrega `#drawTools-c64multicolor`, desplaza `#drawTools-frameColors` y puede tapar los dos selectores de `borderColor` y `backgroundColor`. La paleta rápida C64 de 16 colores añadida en `RICO_UI_LAYOUT_TEST80.js` estaba posicionada **absolute/bottom:14px** dentro de `#toolsPanel`; ocupaba la misma zona vertical sin reservar espacio. Pantalla de referencia: capturas suministradas por el usuario 23/10.

## Cambios del TEST256 (sólo CSS)

1. `#toolIconHolder`: menor padding, cuadraditos `.drawTool` de 20×19 px interiores, iconos de 19×19 px, menor separación; conserva selector de herramienta y los dos por fila en barra estrecha.
2. `#drawTools-cellColor`: altura 53px (antes 68); colores FG/BG separados, sin modificar identificadores ni eventos.
3. `#drawTools-c64multicolor`: bloques C64 Multi 21×21 px y encabezado comprimido.
4. `#drawTools-frameColors`: altura 54px (antes 66); rectángulos Border/Background mantienen sus identificadores, tamaño relativo y zonas de clic.
5. **Causa raíz corregida:** `#ricoQuickPalette80` deja de estar en posición absoluta y pasa al flujo normal **después de Frame**. Los 16 colores permanecen disponibles, con cuadrados de 23 px (21 px si la pantalla tiene altura menor a 760px).
6. `#toolsPanel` permite scroll vertical cuando no alcanza la altura; ya no tapa el selector Frame aunque se reduzca la ventana.
7. El CSS aplica a escritorio, no al diseño móvil `body.mobileMode`.

## Regresiones a verificar

- SCREEN > Text / C64 Multicolor / Text, varias veces: todos los colores FG, BG, Multicolor1/2 y Frame Background/Border siguen visibles y seleccionables.
- Ventanas altas y bajas: ninguna sección superpuesta; barra se desplaza si no entra completa.
- Paleta C64 (16 colores): clic izquierdo cambia FG, clic derecho cambia BG.
- UI de paneles y arrastre lateral; export PRG/VICE con el mismo proyecto no cambia porque no se tocaron scripts ASM.
- Zoom navegador, reconexión después de cargar otro proyecto.

## Validación realizada

- Sintaxis del módulo de estilos: PASS (JS estático).
- Comparación de orden de carga HTML: los **82 scripts originales de TEST247** permanecen en el mismo orden, sin eliminarse ninguno; se añade **1 script CSS-only**.
- Verificado que existen los selectores DOM originales `#drawTools-c64multicolor`, `#borderColor`, `#backgroundColor`, `#toolIconHolder`, `#ricoQuickPalette80`.
- **Pendiente:** comprobación manual visual en navegador real y cambio de modo SCREEN del usuario. No marcar PASS automáticamente.

## Enlaces

- **WEB TEST256:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test256-ui-multicolor-compact/
- **ZIP fuente completo, versión de prueba:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test256-ui-multicolor-compact.zip
- **Release branch raíz de descarga:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test256-ui-multicolor-compact
- **MASTER anterior intacto:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026_GRUPALES_TEST247_PASS
