# LVLLVL RICO — Features corregidas TEST326 → TEST328

**Actualización 04/11/2026. Estado: TEST328 PASS comunicado por el usuario para MEGASOFT 100×25.**

## TEST326: eliminación de límites artificiales

El viejo límite de **96 columnas** de Map Scroll horizontal era propio de una prueba, no de la C64. El motor horizontal de un frame utiliza bancos de fuente de 12.288 bytes por mapa/color, a razón de 50 bytes por columna duplicada, por lo que la capacidad **calculada** es hasta **245 columnas**. El motor compacto multiframe de TEST206 usa 5.120 bytes por buffer, equivalente a **102 columnas calculadas**. **No se ha certificado en VICE el máximo de 245/102**. El caso de **100 columnas sí recibió PASS usuario en TEST328**.

## TEST327: Map Scroll + animaciones

Se integra el planificador de scroll individual de caracteres TEST175/176 (Left, Right, Up, Down, Blink) y el motor de Group Scroll TEST182/183 con prioridad al desplazamiento de mapa. TEST328 repara además la **ruta efectiva de Export PRG**: el exportador usaba un recopilador interno anterior, omitiendo animaciones aun cuando las pruebas de construcción de ASM parecían pasar.

La animación individual y grupal del **mismo código de carácter y banco** sigue bloqueada: ambos motores escriben los mismos 8 bytes, por lo que hace falta componer los efectos. Los grupos simultáneos **no tienen PASS real independiente** aún: el JSON MEGASOFT del PASS no contiene ningún grupo.

## TEST328: 64 glifos y cuatro fondos ECM

**Fallo corregido:** el PRG generado por la ruta horizontal forzaba `#$1B` en `$D011` (Text Mode), desactivando Extended Background Color, y solo cargaba `$D021`. Se perdían los demás fondos.

**Solución:** el ASM utiliza `$D011=$5B` y escribe `$D021`, `$D022`, `$D023`, `$D024`. El exportador detecta glifos físicos realmente utilizados y los reubica **en una copia privada del charset para el PRG**, sin modificar el documento o su JSON. Los códigos de pantalla se reconstruyen como:

```
byte_de_pantalla = (selector_de_fondo_0_a_3 << 6) | indice_de_glifo_0_a_63
```

La reasignación conserva las direcciones de animación individual y Group Scroll en los BANK 1/2 compatibles. Un proyecto Text Mode toma el `bc` por celda y el fondo global cuando no hay `bc` explícito; uno ya convertido a ECM conserva sus registros y slots 0–3. Si un mapa requiere **más de 64 glifos o más de cuatro colores de fondo simultáneos**, el exportador informa el problema en vez de recortar o descartar el dibujo.

## Validación y alcance real

| Caso | Resultado |
| --- | --- |
| MEGASOFT: 100×25, Window 40×25, Left 1 px / 2 ticks, 1 frame | **PASS del usuario TEST328 (04/11)** |
| MEGASOFT: 22 glifos, fondos 0/8/14, 8 glifos con scroll individual Left configurado | Caso asociado al PASS, sin matriz de cada efecto |
| Generador ASM con grupo sintético 2×8 + 8 individuos + tres fondos | Comprobación de generación, **no VICE PASS** |
| Cuatro fondos efectivos; cinco fondos efectivos | Pruebas lógicas: cuatro aceptados, cinco rechazados, **no VICE PASS** |
| Right, multiframe, Bank 2, grupo real, solapamiento de glyphs, diagonal, SID, más de 100 columnas | **Pendientes de validación específica** |

## Archivos del motor y conservación

- [TEST326](../TEST/test326-horizontal-map-limits/): límites por RAM.
- [TEST327](../TEST/test327-horizontal-animated-map/): scheduler individual y Group Scroll.
- [TEST328 PASS](../TEST/test328-ecm-preserve-4-backgrounds/): `js/RICO_ECM_EXPORT_REPACK_TEST328.js` y módulos heredados.
- [Registro PASS](../TEST/test328-ecm-preserve-4-backgrounds/PASS_04_NOV_2026.md).

**`gh-pages/index.html` sigue apuntando a TEST297**. TEST328 no se fusionó con la portada ni los MASTER. Rama de congelación `release/test328-ecm-horizontal-pass-2026-11-04`. La rama `main` diverge: nunca fusionar sin auditoría.
