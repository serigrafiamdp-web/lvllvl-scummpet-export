RICO / LVLLVL TEST139 — 18 OCTUBRE 2026
OBJETIVO: mostrar en el indice de caracteres los glyphs que estan animados, SIN modificar fondo o motor/exportador.
ESTADO: PASS VISUAL CONFIRMADO POR USUARIO EN NAVEGADOR — 18/10/2026; 10/10 PRUEBAS AUTOMATICAS PASS.

CAUSA VERIFICADA:
- TEST33 calcula cache de pixeles animados para BANK 1 y BANK 2.
- TEST120 evitaba flickering al mutear todas las llamadas de dibujo de TilePaletteDisplay durante TileSet.update.
- Las fases avanzaban pero el indice no se volvia a dibujar.

CORRECCION TEST139:
- UN solo JS nuevo: js/RICO_PALETTE_ANIM_UNMUTE_TEST139.js, cargado DESPUES de TEST120.
- Envuelve TileSet.update y, despues de la restauracion de TEST120, reabre solamente el dibujo del indice.
- Reusa cache de TEST33, BANK 1/2 (incluyendo indices virtuales 256-511) y el pipeline TEST17/21 de Columns of 16 / Banks 32x8.
- Repara tambien glifos que dejan de estar animados y acumula los cambios durante la limitacion de 95ms.
- La vista previa no garantiza ticks exactos: se sacrifica precision de preview para no generar flickering y permitir identificar rapidamente animated chars.
- NO toca el fondo de trabajo, scroll, export PRG, color RAM, charset fuente, tile editor, ni codigo del MASTER TEST138.

VALIDACIONES AUTOMATICAS:
- node TEST139_PREVIEW_ISOLATION_CHECK.cjs — 10 aserciones + controles de BANK1/BANK2 y muting de canvas/global.
- JS parse en Node PASS.
- Archivo exportador JS, actualizacion TEST120 y modules SCUMM TEST138 byte-identicos al MASTER aprobado.

CONTINUACION:
- Probar la web TEST139: animar un caracter en BANK 1 y otro en BANK 2, mirar el indice lateral sin insertarlos en el mapa.
- Comparar Columns of 16 y Banks 32 x 8.
- MASTER en main sigue siendo TEST138 y se conserva intacto; TEST139 queda como PASS de la vista previa del indice, no como cambio del runtime.

CONFIRMACION FINAL — TEST139 PASS
- Usuario confirma 'pass' tras probar TEST139 online.
- Correccion aprobada: visibilidad de Animated Chars en indice de BANK 1/BANK 2 sin cambiar el fondo, Map Scroll ni exportacion C64.
- El refresco de la paleta es orientativo; no garantiza precision de ticks.
- Guardar esta version como punto de retorno independiente; nuevas pruebas parten de ella y nunca editan la rama del MASTER TEST138.
