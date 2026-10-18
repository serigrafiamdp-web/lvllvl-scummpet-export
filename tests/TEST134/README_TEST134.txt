RICO / LVLLVL — TEST134 — 18 OCTUBRE 2026
OBJETIVO: quitar destellos blancos ocasionales al combinar la animacion ORIGINAL de caracteres @ con Map Scroll.
ESTADO: PASS FINAL EN VICE / 18 OCT 2026.

DIAGNOSTICO REAL (PRG del usuario Untitled (2).prg, exportado con TEST133):
- Un frame; Map Scroll RIGHT, 6 ticks/step, 1 pixel/step.
- El caracter $00 esta animado UP cada 6 ticks; el codigo aparece 26 veces en pantalla.
- Los 26 $00 tienen color 14 (celeste); las restantes 974 celdas son espacio $20 con color 1 (blanco).
- TEST133 compara directamente el byte de color del backbuffer ($00-$0f) contra el byte leido desde $d800-$dbe7. En C64 el color tiene solamente 4 bits validos; no se puede utilizar el nibble superior de su lectura para comprobar igualdad. Esto puede convertir celdas ya correctas en diferencias falsas y acumular hasta 1000 escrituras por paso.
- Ademas, TEST133 trata como vacias solamente las celdas $ff (blank_char del motor), ignorando el caracter espacio $20 que en ambos charsets es realmente vacio.

CAMBIOS TEST134 (SOLO EXPORTADOR TEST77):
1) Comparar el color de RAM tras aplicar AND #$0F, preservando la semantica real de los 4 bits de C64.
2) Priorizar las celdas con glifos visibles segun tabla de 256 codigos generada desde los dos charsets reales y metadatos de animacion. Se consideran vacios solo los glifos sin pixels en ambos bancos y que no esten animados.
3) Conservar las dos animaciones, las velocidades, los datos de los tiles y la cola de maximo 40 actualizaciones por IRQ de TEST132.

VALIDACION:
- Ensamblador original LVLLVL: 6/6 configuraciones compiladas.
- Emulacion de rutinas de color 6502: 8/8 escenarios PASS, ahora simulando los bits altos indeterminados de RAM de color.
- Reconstruccion del PRG real: 26 caracteres @, tipo UP, ticks6, 974 espacios blancos y 26 caracteres celestes.
- Los bytes de charset BANK1/BANK2, pantalla, tabla de animacion original y colores del PRG reconstruido son identicos al PRG recibido.
- En un desplazamiento RIGHT de una celda, se detectan 30 cambios reales de color y se aplican en 1 IRQ. No 1000 cambios falsos.

INSTRUCCIONES:
- Abrir index.html de este ZIP o la web GitHub Pages TEST134.
- Validado en VICE con el proyecto real: exportacion final aprobada, sin destello blanco.
- Comparar opcionalmente el PRG TEST134_REPRO_USUARIO_26_ARROBAS.prg, reconstruido del ultimo archivo enviado.
- PASS VISUAL confirmado por usuario con su proyecto real: exporta correctamente las animaciones de caracteres y Map Scroll a la vez, sin blink blanco, caracteres fantasma ni saltos de linea.
- PASS adicional confirmado: color de borde y color de fondo del editor se respetan en el PRG ejecutable.
- Aprobado para promocion a nuevo MASTER el 18/10/2026.
