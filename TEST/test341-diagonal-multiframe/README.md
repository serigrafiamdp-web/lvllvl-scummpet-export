# TEST341 — Map Scroll diagonal + Multiframe (4 direcciones)

Fecha: 2026-11-09. **Estado: EXPERIMENTAL, pendiente de ensamblado real y VICE PAL**.

## Qué se integró

Una ruta nueva que exporta **2..255 frames** cuando al menos una frame tiene Map Scroll diagonal. La capacidad efectiva se determina por la memoria C64 disponible (no por un límite artificial de frames). Cada frame puede configurar independientemente:

- **Map Scroll:** Diagonal Up Left, Up Right, Down Left, Down Right. También se acepta Map Scroll OFF como frame quieta.
- **Ticks/Step, Pixels/Step** y duración de frame del editor.
- **Window 40x25, Scroll Area**, dimensiones dentro del mapa y posición de cámara inicial.
- **Mapa y colores por celda**, fondo, borde, recorte fino y BANK 1 o BANK 2.

### Diseño

- Usa el colector original TEST196, virtualizando cada frame sin alterar el JSON/documento real.
- Conserva el motor diagonal de renderizado completo y Color RAM con doble pantalla. Desactiva **solo en TEST341** la aceleración TEST221 de dirección fija y filas duplicadas, porque un único PRG debe poder cambiar de dirección y geometría entre frames.
- Empaqueta todos los mapas en $4000–$6FFF y los colores en $7000–$9FFF. La **suma** real no debe superar 12.288 bytes por banco. Si no cabe, muestra la necesidad de memoria y no omite frames.
- Construye tablas de punteros de filas reescribibles, regeneradas al entrar en cada frame. La tabla de configuración almacena la dirección X/Y, duración, desplazamiento fino, velocidad, ticks, BG, borde y BANK.
- El temporizador de frame marca la transición; el loop principal prepara la siguiente pantalla mientras la interrupción mantiene el framebuffer actual. Solo cuando está lista se conmuta la pantalla y se aplican sus nuevos colores y charset.
- Conserva el motor sin multiframe y el PASS de TEST339 sin cambios.

### Fuera de alcance de esta prueba

- **Group Animate** (de uno o varios grupos), **Switch Bank como efecto**, animaciones individuales y SID combinados con diagonal + multiframe: no se descartan silenciosamente, se informa explícitamente que requieren un compositor adicional.
- ECM y bitmap tienen motores separados, no se degradan a texto para exportarlos.

### Prueba recomendada

1. Abrir [TEST341](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test341-diagonal-multiframe/).
2. Crear **4 frames**, Window 40×25, Scroll Area de por ejemplo 50×30, y usar cuatro direcciones: Up Left, Up Right, Down Left, Down Right.
3. Asignar duraciones distintas, por ejemplo 12 / 18 / 24 / 30 ticks, y diferentes colores. Opcional: BANK1 en frames 1,3 y BANK2 en frames 2,4.
4. Mantener Group Animate, animación individual y SID desactivados en esta primera prueba.
5. Exportar PRG: si falla, compartir el mensaje **TEST341 diagonal multiframe**. Si compila, abrir en VICE PAL y confirmar que **las cuatro frames y direcciones** se reproducen, que sus tiempos son correctos y que no se corrompen los colores.
6. Como regresión, comprobar que un proyecto de **una sola frame** se exporta mediante el motor anterior.

## Verificaciones efectuadas

- Sintaxis JavaScript PASS.
- Smoke test del generador con 4 frames simuladas y sus respectivas direcciones PASS: mapas y colores diferentes, duración 10/11/12/13, BANK 1/2 alternados y tablas ASM generadas.
- Smoke test del generador con 2 frames y geometría de 40×25 PASS; comprobación aproximada de saltos de rama sin saltos fuera de 8 bits.
- **No se ejecutó el ensamblador real de LVLLVL ni VICE. No se afirma PASS del PRG.**

Rollback: TEST339 y TEST340 quedan sin modificaciones; la página principal `gh-pages/index.html` tampoco se tocó.
