# TEST276 — Multicolor → HiRes (Fill)

**Fecha:** 24/10/2026. **Base:** TEST275 (modo SCREEN sincronizado), TEST274 (índice MC uniforme), TEST273 (Custom al importar), TEST271 (captura secuencial) y TEST269 (Warp PASS). Este TEST es **experimental, no PASS visual**. Mantener MASTER `MASTER_LVLLVL_RICO_24_OCTUBRE_2026` intacto.

## Objetivo

Al cambiar un mapa de C64 Multicolor a Standard Character / HiRes, ciertas secuencias de píxeles multicolor aparecen como **rayas verticales** debido a que cada píxel multicolor es un par de bits (resolución horizontal 4×8 dentro de un carácter 8×8), mientras HiRes interpreta esos mismos ocho bits individualmente.

Este TEST crea una **copia independiente del charset** y rellena visualmente esas parejas de píxeles para obtener una silueta HiRes sin franjas de un píxel.

### Algoritmo de conversión de cada pareja de bits

| Par MC original | Par HiRes convertido | Motivo |
|---|---|---|
| `00` | `00` | Fondo / vacío |
| `01` | `11` | Rellenar ambos píxeles |
| `10` | `11` | Rellenar ambos píxeles |
| `11` | `11` | Ya estaba relleno |

Ejemplos: `%01010101` (`$55`) se convierte en `%11111111` (`$FF`), y `%10101010` (`$AA`) también se convierte en `$FF`. Eliminará las líneas vacías debidas a los huecos internos 01/10.

**Limitación:** un carácter HiRes utiliza un solo foreground y un background por celda; por lo tanto, **no se pueden reproducir los cuatro colores multicolor en el mismo carácter** mediante esta conversión binaria. Se preservan los valores de Color RAM existentes, pero no se garantiza la apariencia cromática original. Esta primera versión conserva las siluetas, no las separaciones entre colores. Las texturas o detalles finos se pueden fusionar.

## Implementación no destructiva

- En el panel lateral **Tiles**, al lado del selector de ordenamiento, se agregan dos botones:
  - **MC → HiRes Fill**: recorre todas las frames de la capa actual, identifica los códigos de caracteres utilizados en celdas Multicolor (FC 8–15), crea un **tileset nuevo** de 256 caracteres y convierte *solo esos glifos* con el algoritmo de pares de bits. Los demás glifos conservan su bitmap 8×8 original. Asigna este tileset a la capa y cambia `SCREEN` a `textmode`.
  - **Restaurar MC**: vuelve a asignar el tileset original a la capa y restaura el modo anterior del mapa, normalmente `c64multicolor`.
- Los **códigos de carácter, mapas de frames y valores de color** originales quedan intactos. El tileset de origen no se reescribe; la transformación queda en una copia persistente del documento que puede exportarse posteriormente.
- Si existe el banco 2 independiente `ricoCharsetBank2`, el nuevo tileset copia sus 256 entradas y transforma los mismos códigos utilizados por la capa; el Bank 2 de origen no cambia.
- Por seguridad solo acepta sets estáticos de 8×8 con 256 glifos. No intenta modificar animaciones de glyph; estas requieren una conversión distinta para todos los frames internos del tile.
- No se aplica automáticamente al cambiar de modo: la conversión necesita un clic explícito y se puede revertir.
- **Custom** y el refresco del índice de TEST273/275 se conservan.
- Todos los scripts y el MASTER anteriores permanecen intactos.

## Cómo probar

1. Abrir [TEST276 WEB](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test276-mc-to-hires-fill/) con un documento LVVL vacío.
2. **Import → C64 Formats**, cargar `ricos oil.prg`, capturar uno o más niveles. Cerrar Import.
3. Mantener SCREEN en **C64 Multicolor**, confirmar el mapa original.
4. En el lateral **Tiles**, junto a la selección del índice, pulsar **MC → HiRes Fill**.
5. Comprobar que `SCREEN` pasa a Standard/HiRes y que las franjas verticales internas de los caracteres multicolor desaparecen o se reducen. La imagen usará una paleta HiRes simplificada.
6. Pulsar **Restaurar MC** y comprobar que mapa, formas, colores y charset original regresan.
7. Repetir con otros niveles; navegar por frames antes y después de la operación.

Si el botón no aparece, informar en qué disposición de ventana está el panel Tiles. Si la conversión no cambia algunos glyphs, verificar si esos códigos solo aparecían en celdas FC 0–7 (HiRes).

## Validación interna

- `expandPairRow(0)` → 0.
- `expandPairRow(1)` → 3; 2 → 3; 3 → 3.
- `expandPairRow(0x55)` → `0xFF`; `0xAA` → `0xFF`.
- Mock editor + tileset manager + layer: conversión crea nuevo tileset distinto, cambia el mapa a `textmode`, y Restaurar MC regresa al ID original y al modo `c64multicolor`. **Byte a byte el atlas original queda intacto**.
- **PASS pruebas unitarias/simuladas**; aún no verificado en interfaz real del usuario.

## Archivos

- `TEST/test276-mc-to-hires-fill/js/RICO_MC_TO_HIRES_FILL_TEST276.js`.
- `TEST/test276-mc-to-hires-fill/index.html` y rama release con entrada propia.
- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test276-mc-to-hires-fill/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test276-mc-to-hires-fill.zip
