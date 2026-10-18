TEST129 — CARACTERES ANIMADOS + MAP SCROLL + COLORES ORIGINALES
============================================================
BASE: TEST128 PASS por validacion en VICE del usuario (tres @ animados y Map Scroll juntos).
MASTER 17 OCT 2026: INTACTO. Esta prueba no asciende a MASTER sin PASS.

CAMBIO AISLADO
- El TEST128 exportaba un color dominante y escribia ese color en toda $D800-$DBFF.
- TEST129 extrae el foreground fc real de CADA celda (40x25) de cada frame LVLLVL.
- Conserva dos buffers de color en $1000/$1400, sincronizados con los buffers de pantalla $0400/$0800.
- Reutiliza la misma preparacion de desplazamiento (up,down,left,right,pingpong,movein/moveout) de TEST77 en un segundo pase para mover los colores con cada celda.
- Actualiza la RAM de color $D800 cuando se confirma la pantalla preparada o el cambio de frame.
- No modifica animate_chars_native, su informacion de ticks ni los sprites de los caracteres.
- No modifica frame_tick ni la logica de scroll, salvo agregar la sincronizacion de los colores.
- Emite los datos fuente de color per-frame en la zona de datos del PRG.

PROBAR
1. Descomprimir el ZIP completo y abrir index.html.
2. Abrir el MISMO proyecto LVLLVL con los tres @, animacion de caracteres y Map Scroll.
3. Exportar PRG de nuevo y ejecutar en VICE.
4. Verificar que los 3 @ se animan, Map Scroll se mueve y el color original (celeste u otro) no cambia a blanco.
5. Observar en scroll rapido si aparecen retrasos visibles de la RAM de color. Confirmar PASS/FAIL.

PRG DE DEMOSTRACION
- TEST129_DEMO_3ARROBAS_COLORES_SCROLL.prg: 3 caracteres @ con colores de test
  diferentes (14, 3 y 7) y scroll horizontal; NO representa los colores del proyecto real.
- Para comprobar los colores originales hay que exportar el proyecto desde la web.

VALIDACION REALIZADA
- Runtime fuente ensamblado con ACME WebAssembly: PASS (ejemplo 40x25, tres @, scroll horizontal).
- PRG generado con encabezado de carga $0801: PASS.
- Integridad del archivo ZIP: se verifica al empaquetar.
- Ejecucion en VICE de TEST129: PENDIENTE. NO declarar PASS visual anticipadamente.

LIMITACION
- Esta prueba se limita al exportador TEST77 (40x25 con Map Scroll). Pantallas mayores de 25 filas siguen otra ruta de exportacion.
