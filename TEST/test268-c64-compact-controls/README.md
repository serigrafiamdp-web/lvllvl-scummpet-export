# TEST268 — Joystick compacto debajo del emulador C64
**Fecha:** 24/10/2026 · **Base:** TEST267 BIG SCREEN validado visualmente por el usuario · **Estado:** prueba visual del nuevo layout pendiente.

## Cambios

- Conserva la ampliación del TEST267: canvas C64 384×272 interno, representación CSS hasta 768×544.
- Quita la columna lateral derecha del cuadro **Import → C64 Formats**.
- Traslada los CONTROLES EXISTENTES al pie de la imagen, sin recrear inputs ni perder los IDs.
- Joystick compacto: `None`, `Port 1`, `Port 2`, accesos `cursor keys` y `Z = fire`. Se conservan los eventos originales de `ImportC64Formats.initEvents()`.
- Se preservan los controles de importación `.SEQ`, `.C`, `.CTM` y `.VSF`: se trasladan junto con joystick y continúan ocultándose/mostrándose por el motor nativo.
- Redimensiona el cuadro a un máximo de **855×850**, evitando espacio lateral muerto. La zona de emulación sigue ocupando hasta 768 píxeles de ancho.
- Mantiene Import, Cancel, Reset, Drive, selector PRG/D64/CRT/VSF y teclado.
- **Ningún cambio** en c64.wasm, memoria, CPU, VIC-II, charset, mapa, exportadores PRG ni MASTER.

## Archivos

- `TEST/test268-c64-compact-controls/js/RICO_C64_COMPACT_CONTROLS_TEST268.js`: único módulo añadido al TEST267.
- `TEST/test268-c64-compact-controls/index.html`: la web de prueba; usa 91 scripts, 89 del TEST264 + módulo TEST267 + módulo TEST268.
- `release/test268-c64-compact-controls/index.html`: entrada raíz para ZIP descargable.

## Verificación estática y simulada

- JS parseado sin error.
- Ciclo UI.showDialog → ImportC64Formats.initContent: panel lateral retirado, `importC64Settings` e `importC64PRGControls` trasladados al pie.
- Se preservó identidad de todos los radio inputs existentes, con sus listeners conectables.
- La pantalla C64 nativa sigue exactamente 384×272 y se expone a 768 píxeles CSS.
- Reabrir el cuadro no duplica la barra; el resize también se recalcula.
- Pendiente: test de la web real por el usuario, especialmente carga de `ricos oil.prg` y selección de Port2.

## URLs

- **WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test268-c64-compact-controls/
- **ZIP:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test268-c64-compact-controls.zip
- **MASTER 24 OCT preservado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026
- **TEST267 PASS preservado:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test267-c64-big-screen/
