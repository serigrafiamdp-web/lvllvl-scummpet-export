# TEST174 — Copy/Paste múltiples caracteres del índice

**20/10/2026 · Pruebas de código PASS · pendiente PASS visual del usuario.**
Base: TEST173 PASS, que conserva Switch Bank + animaciones individuales, Rico's Window y Map Scroll.
MASTER 20/10 permanece intacto.

## Objetivo
El botón Copy del Tile Editor copiaba 8x8 píxeles del primer carácter pese a tener una selección múltiple ya existente. TEST174 amplía exclusivamente el clipboard del TileEditorGrid.

- Una selección de 1 carácter conserva la rutina original de LVLLVL.
- Al seleccionar varios caracteres (2x2, 4x1, 16x16, etc.) copia todos los píxeles en un bloque rectangular conservando la geometría.
- Al seleccionar un solo carácter de destino, Paste pega el bloque desde esa celda, siguiendo la distribución del índice activo (incluidas 16 o 32 columnas).
- También puede pegar sobre otra selección rectangular de destino, siguiendo sus IDs.
- Respeta BANK 1 y BANK 2: lectura del banco activo y escritura al banco activo. Permite copia entre bancos mediante snapshot en memoria.
- Pegar actualiza el index, la visualización y las caches para **todos** los IDs afectados, en una sola entrada de historial.
- Un bloque que no cabe en el destino no modifica parcialmente otros caracteres.
- No cambia el charset fuente durante Copy, ni altera el mapa de arte, los tilesets por defecto, los motores PRG, IRQ, Window o Map Scroll.
- TEST174 se limita a **copiar los píxeles** tal como hacía Copy original; no traslada las propiedades de animación automáticamente.

## Validación
PASS pruebas Node: 2x2, 2x1, 1x2, pegar en ancla, pegar en selección 2x2, superposiciones, BANK1→BANK2, índices en rejilla de 16 y 32 columnas, virtual BANK2, frontera 255, camino nativo de 1 carácter y refresco de todos los tiles.
No se ha verificado todavía en navegador real: solicitar PASS/FAIL al usuario.

ZIP: `LVLLVL_TEST174_COPY_PASTE_MULTIPLES_CARACTERES_WEB_LOCAL.zip`
SHA256: `4a928673df4c5958df72094d5c67ca337a64eca78bdd38de2dd87e7d1239eaf8`
