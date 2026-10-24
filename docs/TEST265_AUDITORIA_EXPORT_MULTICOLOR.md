# TEST265 — Auditoría integral de exportación C64 Multicolor
**Fecha:** 24/10/2026. **Base verificada:** `release/test264-native-multicolor-export`. **Consolidado en:** `MASTER_LVLLVL_RICO_24_OCTUBRE_2026`. **Tipo:** inventario estático del código y matriz de regresión; *NO equivale a PASS visual en VICE*.
**MASTER 23/10, TEST247, TEST264 y la web pública no se han modificado.**

## Veredicto y leyenda
- **PASS real informado:** SCREEN Multicolor → PRG básico con TEST264, confirmado por el usuario.
- **Ruta presente, SIN PASS MC:** el exportador actual puede producir ASM y TEST264 inserta $D016 bit4 + $D022/$D023, pero no fue validado en VICE.
- **Bloqueo confirmado:** la propia lógica puede rechazar/no exportar.
- **Riesgo de imagen:** puede salir PRG, pero el desplazamiento de bits no preserva los pares 2-bit de Multicolor.
- **Fuera de corrección:** exportadores antiguos que generan un PRG binario sin llamar a `g_app.assembler.assemble` no reciben el parche ASM y TEST264 bloquea la descarga en Multicolor.

## Rutas de Map Scroll por tipo de movimiento

| Opciones seleccionadas en el editor | Código que las enruta | Estado MC (TEST264) | Riesgo |
|---|---|---|---|
| Ningún Map Scroll, 1 frame, sin animaciones | Nativo `ToPRGAdv` + TEST264 dual-bank | **PASS informado** | Aún comprobar frames adicionales y otros valores C64 |
| Scroll Up / Down (40×25) | `RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` | ASM con parche, **sin PASS MC** | `$D016` parcheado, falta VICE; frames múltiples con paletas distintas pueden fallar |
| Scroll Left / Right (40×25) | TEST77 | ASM con parche, **sin PASS MC** | Fino horizontal y Color RAM por fases requieren VICE |
| Ping Pong Up / Down / Left / Right | TEST77 (códigos 5–8) | ASM con parche, **sin PASS MC** | Rebote, paletas por frame y timing |
| Move Out Left / Right / Up / Down | TEST77 (códigos 9–12) | ASM con parche, **sin PASS MC** | Transición / blank stage y actualización de Color RAM |
| Move In Left / Right / Up / Down | TEST77 (códigos 13–16) | ASM con parche, **sin PASS MC** | Pantalla de transición y registros del VIC |
| Diagonal Up Left / Up Right / Down Left / Down Right | `TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js` | ASM con parche, **sin PASS MC** | El exportador usa el frame 0 para el mapa; 2+ frames no equivalen a animación multiframe |
| Scroll vertical de mapas >25 filas, 40 columnas | `RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` + optimizaciones 221–232 | ASM con parche, **sin PASS MC** | Hay una escritura `LDA #$08 / STA $D016`; TEST264 la parchea al ensamblar, falta VICE |
| Scroll horizontal de mapas >40 columnas, 1 frame | `RICO_PRG_HORIZ_WIDE_GROUP_VERTICAL_TEST186.js` (evolución TEST203/220) | ASM con parche, **sin PASS MC** | Uso de `$D016` sin bit4 en código base; parcheado pero no validado |
| Scroll horizontal ancho + múltiples frames | `RICO_PRG_HORIZ_MULTIFRAME_TEST205.js` y `RICO_PRG_HORIZ_COMPACT_FRAMES_TEST206.js` | Condicional | Paletas MC1/MC2 distintas entre frames: bloqueo probable por ausencia de etiqueta `current_frame` reconocible |
| Rutas binarias antiguas Up/Down/Left/Right | `RICO_PRG_MAP_SCROLL_VERTICAL_CLEAN_TEST50.js` / TEST51 | **Fuera de corrección** si vuelven a ejecutarse | Esos constructores emiten `bytes` directamente y no pasan por el ensamblador interceptado. TEST264 detecta `count=0` y no descarga |
| Map Scroll con +32 frames | TEST77 `MAX_FRAMES=32` | **No soportado por ese motor** | Puede caer a motor más antiguo o rechazar; no prometer MC |

**No confundir existencia de ruta ASM con PASS de visualización C64.** Los 4+4+4+4+4 movimientos de mapa constituyen 20 movimientos (4 Scroll, 4 Ping Pong, 4 Move Out, 4 Move In y 4 diagonales).

## Group Animate, char animation y ONDAS

| Función | Estado MC | Explicación |
|---|---|---|
| Group Scroll Up / Down, 1 frame | Exportador TEST247 y fallback; sin PASS MC | Desplazar filas enteras preserva pares de bits, pero $D016/D022/D023 se añaden mediante wrapper sin validar ASM real |
| Group Scroll Left / Right, pasos pares en bits (2/4/6/8) | Sin PASS MC | Desplazamientos múltiplos de 2 conservan fronteras de píxel Multicolor, pero requieren validación visual |
| Group Scroll Left / Right a 1/3/5/7 bits | **Riesgo confirmado de colores rotos** | TEST247 usa `sx=x*8+xx+sign*shift` y residuos 1,3,5,7. El hardware interpreta bytes en pares de bits, de modo que desplazarlos 1 bit mezcla los índices de color |
| Ping Pong Group Left / Right, velocidades impares | **Riesgo confirmado de colores rotos** | Mismo núcleo TEST247 que Scroll normal |
| Ping Pong Group Left / Right a 8 bits | TEST246; sin PASS MC | Fuente precalculada horizontal en residuos pares, arquitectónicamente compatible con pares, pero no validado |
| Group Ping Pong Up / Down, y modos Up / Down | Sin PASS MC | Desplazamiento vertical no rompe parejas horizontales, pero requiere prueba de Color RAM/VIC |
| ONDAS Left / Right | **Riesgo de interpretación** | El motor legado desplaza bits ASM mediante ASL/ROL/LSR/ROR (TEST168), no trata específicamente píxeles de 2 bits |
| ONDAS Up / Down | Sin PASS MC | El modo ONDAS permanece intacto: requiere prueba en VICE, sin prometer paridad con Hi-Res |
| Caracteres animados individuales LEFT/RIGHT | **Riesgo de colores rotos** | TEST77 incluye giros bit a bit (ASL/LSR/ROL/ROR) sobre glifos, no giros por parejas Multicolor |
| Caracteres animados individuales UP/DOWN, BLINK | Sin PASS MC | No se confirma pérdida de parejas por desplazamiento horizontal; falta prueba de coexistencia |

La instrucción `ORA #$10` sobre $D016 habilita el modo de visualización, pero no convierte automáticamente un motor de **desplazamiento de un bit** a uno que respete los píxeles Multicolor de **dos bits**. Esa conversión debe respetar al mismo tiempo cada pareja y sus colores.

## SID, bancos y casos combinados
- **SID + SCROLL**: `RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js` modifica dinámicamente el ASM ensamblado y el plan de memoria. El wrapper TEST264 sigue siendo alcanzable, pero ninguna combinación MC+SID se ha validado en VICE.
- **BANK1/BANK2**: `RICO_PRG_DUAL_BANK_TEST104_ANIM_MEM_SWAP.js` vuelve a pasar `safeArgs.mode='standard'`, pero la capa anterior TEST264 dual bank reestablece el modo según `layer.getScreenMode()`. Una simulación y el PASS básico indican que la ruta básica se salva. Revisar qué pasa al cambiar bancos durante el runtime.
- **Map Scroll + Group**: TEST168 admite como máximo un grupo de movimiento; las rutas grandes usan otro scheduler. TEST247 FAST solo se aplica al grupo sin Map Scroll.
- **Map Scroll + Group + char animations**: la ruta horizontal ancha TEST186 rechaza animaciones individuales. Otros motores comparten charset y deben coordinar qué CPU lo escribe; no prometer coexistencia.
- **4+ colores / distintas paletas por frame**: no extrapolar del PASS básico.

## Bloqueos y defectos de código confirmados en TEST264

**MC-01, ALTA — Cambios de MC1/MC2 entre frames, exportador nativo**:
En `lospec/lvllvl/src/js/textMode/c64export/toPrgAdvanced.js`, las líneas 2182–2183 obtienen `layer.getC64Multi1Color()` y `layer.getC64Multi2Color()` sin pasar el frame que se está exportando. Por lo tanto, frames distintos pueden heredar colores compartidos del frame actualmente seleccionado. El byte de modo 2 no detecta esta discrepancia.

**MC-02, ALTA — Bloqueo de 2+ frames con MC1/MC2 distintos, custom ASM**:
`TEST/test264-native-multicolor-export/js/RICO_MULTICOLOR_EXPORT_TEST264.js` usa el regex `/^current_frame\\s*(?:;[^\\n]*)?$/mi`, que acepta la etiqueta sola, pero **no** `current_frame=$02`, como la declara `js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js`. Se puede bloquear una exportación real con paletas distintas aunque el motor sí disponga del contador de frame.

**MC-03, ALTA — Corrimiento horizontal de 1 bit en MC Group**:
`TEST/test247-group-scroll-fast/js/RICO_GROUP_SCROLL_REMAP_TEST247.js` precalcula residuos impares (líneas 55–71) y obtiene bitmap bit por bit. Un ejemplo: fila `00110011` (cuatro píxeles de 2 bits `00|11|00|11`) desplazada 1 bit resulta `10011001` (`10|01|10|01`). Son colores diferentes, incluso si se activa el modo VIC Multicolor.

**MC-04, MEDIA — Diagnóstico insuficiente**:
No hay matriz visual de exportador REAL utilizado por cada modo. TEST264 reporta ensamblado y modo nativo, pero no certifica si todos los writes posteriores a $D016 preservan el bit4 o si existen colisiones de memoria al insertar instrucciones de color.

**MC-05, ALTA — Multi-frame en diagonal**:
`TEST/test242-ondas-pingpong/js/RICO_PRG_DIAGONAL_TEST196.js` selecciona `graphic.frames[0]` para el mapa. No considerar la presencia de múltiples frames como soporte automático de animación temporal.

## Orden de pruebas visuales recomendado
1. Map Scroll Up / Down **1 frame**, 1/2/8 px, MC1 amarillo, MC2 celeste, Color 3 verde; comprobar Color RAM.
2. Map Scroll Left / Right **1 frame**, 1/2/8 px y 38 columnas.
3. Ping Pong cuatro direcciones, 1/8 px.
4. Move Out / Move In cuatro direcciones y varios bordes.
5. Cuatro diagonales, 1/8 px, antes de mezclar grupos.
6. Mapas 40×50, luego horizontales >40 y multiframe.
7. Group Up / Down; Group Left / Right 2/8 y luego 1/3/5/7 px comparando colores.
8. ONDAS e individuales Left/Right, especialmente bordes de píxeles de colores.
9. SID y Switch Bank al final; consolidar solo rutas que coincidan entre editor y VICE.

Mantener arte y colores fijos en todos los ensayos, cambiar **solo un parámetro** por prueba. Para declarar un modo PASS se necesita **PRG exportado + resultado VICE**; una prueba JS o compilación ASM no bastan.

## Estado de preservación
Esta copia queda congelada dentro de `MASTER_LVLLVL_RICO_24_OCTUBRE_2026`, desde TEST264 PASS. La rama de auditoría `audit/test265-multicolor-export-matrix` permanece disponible como referencia histórica. No crea un nuevo motor ni altera código aprobado. Su propósito es ayudar a organizar tests futuros (TEST266+) de reparación puntual en vez de un reemplazo masivo.

**Consultar:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/MASTER_LVLLVL_RICO_24_OCTUBRE_2026/docs/TEST265_AUDITORIA_EXPORT_MULTICOLOR.md
