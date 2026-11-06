# TEST333 — MultiGroup: direcciones y Ping Pong

Fecha: 2026-11-05. **Experimental**, no PASS en VICE para nuevas combinaciones.

## Punto de partida
El usuario confirmó **PASS TEST332** con dos grupos independientes en el mismo banco: mitad del índice Scroll Left y otra mitad Scroll Right (sin Map Scroll). Se conserva TEST332 sin cambios.

## Cambios de TEST333
El motor standalone multigrupo reutiliza `groupASM` de TEST182/183/239 y crea un estado por grupo.
- Direcciones: Left, Right, Up, Down.
- Ping Pong: Left, Right, Up, Down.
- Ondas: se normaliza al Ping Pong correspondiente, siguiendo el comportamiento anterior del exportador.
- Las etiquetas `group182_*`, `group183_*` y **`group239_*`** se renombran por grupo para impedir colisiones en el ensamblador.
- Se reubican las tablas absolutas de punteros altos por grupo.
- Reserva de fuentes según efecto: Ping Pong Right usa 24 bytes por tile, los demás horizontales 16; los verticales usan dos copias por columna.
- Memoria calculada por grupo; no se establece máximo fijo de grupos. Un conflicto físico de glifo en un mismo banco se denuncia, no se descarta.

## Alcance
Esta prueba se limita a **un frame, Group Animate sin Map Scroll**, pantalla 40×25. No valida aún combinación de Map Scroll + varios grupos, ni SID, ni mezcla de BANK1/BANK2 en pantalla, ni multiframe. No promover como MASTER hasta prueba en VICE.

## Orden de regresión en VICE PAL
1. Repetir caso TEST332 de dos grupos Left + Right (regresión).
2. Dos grupos Up + Down.
3. Un grupo Left y otro Ping Pong Right.
4. Dos grupos Ping Pong Up + Ping Pong Down.
5. Un grupo Ondas Left y otro Right (verificar comportamiento visual).
6. Tres grupos distintos con velocidades independientes, si la RAM lo permite.

Si falla, registrar mensaje de exportación, configuración y PRG, revisando `window.RICO_TEST330_MULTIGROUP_PLAN`. No volver a imponer un máximo artificial.
