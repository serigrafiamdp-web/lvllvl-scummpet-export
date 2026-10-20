# RICO TEST175 — Map Scroll + Switch Bank + animaciones individuales simultáneas
Fecha: 20 de octubre de 2026.
Estado: **COMPILACIÓN PASS / VICE VISUAL PENDIENTE**.
Base: TEST174 PASS; no modificar MASTER LVL RICO 20 OCT 2026.

## Problema corregido
Al activar Map Scroll sobre un Screen 40xN grande, TEST168 seleccionaba
un motor vertical que solo movía el mapa. No generaba el código de
animación individual ni el temporizador Switch Bank. En Screen 40x25,
TEST77 prohibía Switch Bank junto con Map Scroll y TEST138 sincronizaba
ciertas animaciones con el avance de píxeles de mapa en lugar de con ticks.

## Implementación
- **Mapa 40xN (N>25), Up y Down:** en el IRQ PAL del motor TEST168
se ejecutan: (1) tabla de caracteres nativos de BANK 1 en $3000 y
BANK 2 en $3800; (2) Switch Bank por $D018; (3) paso normal de Map Scroll.
Tres relojes independientes. La animación de BANK 1 y BANK 2 progresa
aunque uno no esté visible.
- Cada carácter tiene su propio temporizador y dirección. BANK 1 y 2
mantienen props separados; los ID del mapa no se remapean.
- Código y tabla variables bajo $3000, scratch ZP $30..$34;
no se escriben caracteres nuevos con Switch, no se pisa $3FFF.
- **40x25:** TEST77 permite Switch Group con Map Scroll; el temporizador
nativo dual no depende del avance de mapa (gear desacoplado para Switch).
- **Mapas 40xN con Left/Right:** proyección original TEST168 al
motor TEST77 ya compatible.
- Si no existe grupo Switch, motor de Map Scroll anterior conserva el
mismo ejecutable y temporización **byte por byte**.

## Validación de código
PASS: PRG ensamblados para mapa 40x50 Up, Down y Left, y 40x25 Up
con Switch Bank 3 ticks, BANK 1 Up 1 tick y BANK 2 Down 2 ticks.
PASS: tablas de animación con direcciones $3050 y $3850, contadores
independientes y código por debajo de $3000.
PASS: el exportador no altera los datos del editor.
PASS: regresión byte-idéntica con TEST174 para mapas 40x50 Up/Down y
40x25 sin Switch Bank.
FALTA: validación visual real en VICE, velocidad bajo carga y combinaciones
de mayor complejidad. No declara PASS visual ni prueba de todos los
modos de Map Scroll de mapas grandes.

## Paquete
`LVLLVL_TEST175_MAP_SCROLL_DUAL_NATIVE_SWITCH_WEB_LOCAL.zip`
SHA256: `ec84dfca7bcd5cf37a3bcf02fabd5fe5787f8619ae7f5346f6c1fd98d5aa68d7`
Demo principal: `DEMOS_VICE/TEST175_MAP40x50_SWITCH3T_BANK1UP1T_BANK2DOWN2T.prg`
GitHub Pages: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
Protegido: `release/master-lvl-rico-20-oct-2026`.
