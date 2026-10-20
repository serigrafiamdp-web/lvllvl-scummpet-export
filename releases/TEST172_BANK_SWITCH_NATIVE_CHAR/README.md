# RICO TEST172 — Switch Bank + Individual Character Scroll (20/10/2026)

**Estado: pruebas de ensamblado PASS; VICE / navegador PENDIENTE. No es MASTER.**
Base: TEST171, conserva TEST170 PASS y MASTER LVL RICO 20 OCT 2026 intactos.

## Combinacion
- Group Animate → **Switch Bank 1 / Bank 2**, con su propio Ticks/Frame (1..255).
- La seleccion Individual Character Animation (Scroll Left, Right, Up, Down, Blink) se puede activar ANTES o DESPUES de Switch Bank. Las dos quedan habilitadas; el Group Switch nunca desactiva el scroll individual, y elegir animacion individual no elimina el grupo Switch.
- Cada BANK tiene sus propias propiedades y registros: BANK 1 en $3000, BANK 2 en $3800; mismo codigo puede moverse en diferentes direcciones/ticks en cada BANK.
- El IRQ anima AMBOS charsets incluso cuando uno esta oculto, y luego conmuta $D018 segun el contador independiente de Switch.
- **El cambio de banco es GLOBAL en pantalla**: los caracteres ajenos al grupo tambien alternan visualmente si difieren entre bancos.

## Preview y UI
- TEST33 calcula ambas fases de los dos bancos independientemente.
- TEST25 sigue para pantalla el banco efectivo visible y mantiene el editor configurado sobre el BANK del frame (sin cambiar sus metadatos).
- TEST19 aplica los bytes de la fase animada de cada bank al activar la vista. El selector del Group Switch esta disponible desde su grupo, y el switch sigue encendido cuando se editan los individuales en el otro banco.

## Tests
- PASS: exportador con BANK 1 char10 Up/1T, BANK 2 char10 Down/2T, BANK1 char11 Left/4T, BANK2 char12 Right/8T y Switch/3T.
- PASS: 4 registros C64 separados, contador por banco y glifo; 2 PRG sinteticos VICE ensamblados sin errores.
- PASS: codigo antes de charset $3000, no reescritura del charset por SWITCH.
- PASS: programacion de animacion individual NO elimina el grupo Switch.
- PASS: fuente ASM sin Switch y fuente Switch sin individual identicas a TEST171.
- **Pendiente de verificar en VICE**: comportamiento visual, CPU con gran cantidad de caracteres y preview del navegador real.
- Fuera de alcance del test: combinacion con Group Scroll Up tradicional, frames animation no nativa y Map Scroll simultaneo. Estas opciones existentes no se degradaron intencionalmente.

## Paquete completo
`LVLLVL_TEST172_SWITCH_BANK_CHAR_INDIVIDUAL_WEB_LOCAL.zip`
SHA256 `89d96449ea78e6b7aa03be93a76a5066f225cd490a9fb767c4009e2bca5e9f28`

Dos PRG de demostracion en `DEMOS_VICE/`, uno empezando BANK 1 y otro BANK 2.
MASTER `release/master-lvl-rico-20-oct-2026` preservado.
