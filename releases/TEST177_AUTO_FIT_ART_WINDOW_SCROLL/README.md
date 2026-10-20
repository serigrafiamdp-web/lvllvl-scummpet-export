# RICO LVLLVL TEST177 — Auto Fit Art to Window / Scroll Area
Fecha 20/10/2026. **Node/syntax PASS — interfaz visual pendiente PASS usuario.**
Base: TEST176 experimental. TEST174 PASS, TEST173 PASS y MASTER del 20 de octubre preservados.

## Función
Se suma **Auto Fit to Art** al diálogo Rico's Window Dimensions.
- En pestaña Window ajusta sus cuatro márgenes al rectángulo de los caracteres dibujados.
- En pestaña Scroll Area ajusta los márgenes de la Scroll Area al rectángulo.
- Sólo modifica un borrador de la geometría; OK lo guarda, Cancel no guarda.
Se suma **Auto Fit Scroll Area to Art** al diálogo Rico's Map Scroll.
- Ajuste en borrador para el frame; OK guarda la Scroll Area, Cancel descarta.
- Frame < > conserva la convención existente de guardar antes de cambiar.

La detección recorre el **Screen completo** de la capa Grid actual, por frame.
Se cuentan caracteres con píxeles visibles, no índices de carácter en blanco.
El carácter 0 puede ser arte. Si está activo Group Switch Bank, se
calcula la unión de BANK1 y BANK2. En modo normal se usa el banco del frame.
No hay recorte ni cambios a tilesets, píxeles, códigos de mapa, Screen
Dimensions ni rutinas PRG.

Si la Window resultante supera 40x25, no modifica geometría y muestra mensaje.
Para Map Scroll vertical sobre Screen 40xN grande se advierte si los límites
no coinciden con los que admite la rutina de exportación existente:
Window X0/40x24-25 y Scroll Area X0/ancho40/alto≥25. El botón no inventa
nuevas restricciones ni altera el rectángulo detectado para forzar una exportación.

## Comprobaciones
Node `TEST177_AUTOFIT_NODE_TEST.js`: PASS 9 pruebas de escaneo,
bancos, empty/noTile, índice 0, Screen 40×50, oversized Window y no-mutación.
Node --check de los tres módulos PASS.
**Prueba visual de navegador real NO realizada por limitaciones del entorno.**
**TEST176 Map Scroll + dos bancos + Switch Bank SIGUE SIN PASS visual; TEST177
no pretende resolver ghost bytes ni el scroll detenido reportado anteriormente.**

ZIP: `LVLLVL_TEST177_AUTO_FIT_ART_WINDOW_SCROLL_WEB_LOCAL.zip`
SHA256: `93b1cd2732e9598074f1e070724e27d6acfd4a663392d854ce4d4df73fc9082a`
Respaldo MASTER: `release/master-lvl-rico-20-oct-2026`.
