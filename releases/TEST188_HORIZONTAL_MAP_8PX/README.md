# TEST188 — Map Scroll horizontal 8 px/step con Group Animate vertical

Fecha: 21 octubre 2026. Base: TEST187 limpio, motor de Map Scroll horizontal para Screen ancho (TERRY 45x32).

## Función probada
- Elección del usuario en Rico's Map Scroll: Pixels/Step **1 o 8**, Ticks/Step **1**, dirección Map Left/Right. La configuración anterior de 1 px sigue soportada; el proyecto de usuario no se altera al abrirlo.
- 8 px solicita **una columna de caracteres por paso**. El motor solo hace swap del doble buffer cuando la siguiente pantalla de 40x25 fue preparada completamente; si necesita más de un tick, se espera para evitar mostrar basura.
- Group Animate Scroll Up/Down de los caracteres sigue activo con sus propios ticks.
- Sin cambio a la rutina de 1 px: ensamblador fuente exacto (ASM) idéntico a TEST187 para TERRY Left/Right. Sin cambio a motor vertical TEST181 ni máscaras de la preview TEST180.
- Continúan las restricciones experimentales heredadas: un solo Group Animate vertical, sin animación individual ni Switch Bank, un solo frame, Screen >40, Window 40x25, Color RAM uniforme.

## Validación
- **Node PASS** 10 casos de selección y regresión con mapa real TERRY 45x32; 1px ASM exacto TEST187; 8px genera la rama de buffer completo para Left y Right; valores intermedios se rechazan con aviso.
- **6502 assembler ACME WASM PASS** para las dos rutas de 8 px con Group Scroll vertical: Left y Right. PRG carga en $0801; ejecutable usa SYS8192, sin errores del ensamblador.
- ZIP limpio idéntico en número de entradas (597), con solo index.html, script de motor y README sustituidos. No incluye PRG demos, scripts de prueba, respaldos ni documentos acumulados.
- **VICE PENDIENTE**: el nuevo motor no garantiza alcanzar un avance de 8 px por frame en grupos de gran coste CPU; si render tarda más, espera (a diferencia de animación suave).

## Artifacts
WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
Library ZIP: `LVLLVL_TEST188_HORIZONTAL_MAP_8PX_GROUP_VERTICAL_WEB_LOCAL.zip`
SHA256 ZIP: `5c58509cd1cf7c2836dd499eb5fcdec433b010223758cdef50c58f9da9e30bd2`

MASTER main permanece en 480c53dd58d0c23675c281b6dbe14da95b40aff6. Estudio Ondas preliminar separado y sin modificar.
