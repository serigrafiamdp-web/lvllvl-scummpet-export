# TEST262 — Exportar PRG realmente C64 Multicolor (24/10/2026)

**Estado:** PRG experimental corregido a nivel de fuente ASM. Pendiente ejecución real en VICE y PASS del usuario. TEST247/TEST260/TEST261 y MASTER no modificados.

## Problema confirmado

En la web TEST261, SCREEN → Multicolor, el índice y las nuevas celdas del pincel pueden representar caracteres en 2 bits por pixel, pero varios exportadores del proyecto establecen `$D016=$08` o calculan un valor de desplazamiento horizontal sin activar el bit 4. El VIC-II por tanto ejecuta el PRG en **Hi-Res**. La paleta compartida del editor tampoco se trasladaba a los registros VIC `$D022` y `$D023`.

## Qué hace TEST262

Al exportar **únicamente cuando la capa seleccionada es `c64multicolor`**:
- Intercepta la cadena completa del PRG en el punto del ensamblador `g_app.assembler.assemble()`. Incluye rutas que ensamblan sus propios runtimes (Map Scroll, Group Animate y SID).
- Antes de cada `STA $D016`, añade `ORA #$10`; se conservan todos los bits originales de scroll/columnas.
- Después de cada `STA $D021` (fondo), configura `$D022` y `$D023` con `getC64Multi1Color(frame)` y `getC64Multi2Color(frame)`.
- Si existen varios frames con colores compartidos distintos, utiliza tablas `rico262_mc1_table`/`rico262_mc2_table` e índice `current_frame` cuando ese símbolo está disponible; conserva A y X.
- Conserva toda la Color RAM original de 1000 celdas, incluidos los valores 8–15 aportados por TEST260.
- Si una ruta no entrega fuente ASM con escrituras reconocibles a `$D016` y `$D021`, o no permite sincronizar varios frames, **se detiene con un error claro** en lugar de descargar un PRG Hi-Res incorrecto.
- El exportador puede devolver PRG como valor o mediante descarga anterior; TEST262 captura y publica sólo el PRG modificado y validado.
- SCREEN Hi-Res y demás modos pasan a las rutinas originales, sin parche ni diferencia de bytes.

**Sin cambios:** bitmap de glifos, BANK1/BANK2, ONDAS, Scroll FAST aprobado, SID, duración/ticks, paleta del editor, selección, importador y archivos MASTER.

## Pruebas técnicas hechas

- Prueba con un exportador simulado: detecta y corrige `$D016`, añade `$D022/$D023`, exporta una sola vez; Hi-Res pasa intacto.
- Secuencia de dos frames con colores compartidos diferentes: tablas de color y actualización por índice `current_frame` generadas.
- Si `current_frame` o registros VIC no aparecen en la ruta, aborta sin descargar bytes falsos.
- Prueba con fuente ASM **real del motor Group Scroll FAST TEST247**: detectó una escritura de `$D016` y una de `$D021`; insertó todas las instrucciones Multicolor necesarias.
- Estas verificaciones prueban la transformación de código fuente, **no garantizan aún ensamblado, memoria ni timing final para cada motor**.

## Cómo probar en VICE

1. Abrir la web TEST262 con el mismo proyecto del TEST261.
2. SCREEN → Multicolor, elegir caracteres de BANK1/BANK2 y pintar caracteres.
3. Edit → Replace Color para modificar Fondo / Multicolor 1 / Multicolor 2 si se desea.
4. Export PRG. Si el motor es compatible, el programa debe verse en Multicolor con los colores del proyecto.
5. En monitor VICE comprobar bit 4 de `$D016` activo, valores `$D022/$D023` y 8–15 de Color RAM en celdas pintadas como Multicolor.
6. Repetir la exportación en SCREEN → Text: debe permanecer Hi-Res como antes.
7. Repetir con Map Scroll / Group Scroll y SID opcional. Si el ensamblador avisa memoria llena, **no aceptar el PRG**: hay que adaptar esa ruta particular, sin sobrescribir motores PASS.

## Enlaces

**WEB:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test262-multicolor-prg/

**ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test262-multicolor-prg.zip

**Fuente:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test262-multicolor-prg/TEST/test262-multicolor-prg
