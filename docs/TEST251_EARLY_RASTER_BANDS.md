# TEST251 — Acortar huecos entre las tres IRQ raster (86 / 132 / 218)

**Estado: EXPERIMENTAL / todavía sin VICE.** Derivado exactamente de TEST250; preservamos copia de caracteres, colores, máscara de pantalla, preparación de bordes y cálculo de cámara. MASTER, TEST244 y TEST250 sin modificar.

## Hallazgo de VICE en TEST250

La usuaria indicó «aún estamos igual» y leyó:

```
(C:$1600) m a020 a028
>C:a020  00 3e 4f 4f  00 48 00 50  01
```

Interpretación sustentada:
- $A020=$00: fase inicial.
- $A025=$48, $A026=$00: **última actualización terminó en la línea PAL 72**.
- En TEST250 la primera interrupción está en raster 86, dejando sólo **14 líneas (~882 ciclos nominales de CPU)** para preparar el siguiente paso. Es insuficiente para la preparación de 25+40 caracteres y sus colores.
- Los contadores IRQ, commits y busy son de 8 bits y **pueden haber desbordado**; no interpretar $3E=62, $4F=79 como razones absolutas sin medir ventana concreta. Lecturas idénticas son normales porque monitor de VICE pausa CPU.
- Esto explica plausiblemente el cuadro perdido pero todavía no demuestra que sólo adelantando el raster alcancemos 50 FPS.

## Cambio exacto de TEST251

Mover las citas raster de las franjas de TEST250:

| Fase | TEST250 | TEST251 | Cambio |
|---|---:|---:|---:|
| Superior filas 0–3 | 86 ($56) | **86 ($56)** | ninguno |
| Central filas 4–11 | 150 ($96) | **132 ($84)** | adelantar 18 líneas |
| Inferior filas 12–23 y última fila | 248 ($F8) | **218 ($DA)** | adelantar 30 líneas |

La primera fase no cambia. En el código generado, sólo se reemplazan **dos inmediatos**: `LDA #$96` → `LDA #$84` antes de programar IRQ de fase central, y `LDA #$F8` → `LDA #$DA` antes de la IRQ inferior.

*Hipótesis:* al reducir huecos de espera entre fases, la última actualización terminará antes que raster 72 del siguiente frame, dejando más tiempo libre para preparar la siguiente diagonal. La mejora visual a 50 pasos/s no está comprobada y las franjas podrían solaparse o correr el riesgo de tearing: nunca integrar sin prueba VICE real.

## Contadores ya disponibles

VICE monitor, después de 3 segundos en PAL x64sc, sin warp:

`m a020 a028`

Bytes:
- A020: fase actual (0,1,2)
- A021: IRQ (módulo 256)
- A022: desplazamientos completados (módulo 256)
- A023: IRQ inicial con CPU ocupada (módulo 256)
- A024: IRQ inicial con pantalla no lista (módulo 256)
- **A025/A026: raster de finalización (low/high bit).** Comparar con TEST250 `48 00` (raster 72).
- A027: firma `50`.
- A028: versión `01`.

Registrar también un MKV de ~10 segundos para medir avances por segundo con el mismo criterio que TEST244–249 (~25/s).

## Pruebas realizadas

- 32 combinaciones sintéticas: 4 rutas seleccionadas TEST251 (dos diagonales ascendentes, Bank1/2, multicolor 8px), 28 casos sin alteración respecto de TEST250.
- En los 4 activos, la ASM generada es exactamente idéntica a TEST250 con excepción de las dos líneas inmediatas que programan los rasters nuevos.
- 0 saltos relativos fuera de rango, 0 colisiones de regiones y archivo PRG simulado termina en $C340 (< $D000).
- Código JavaScript sintácticamente válido.
- **No ejecutado en VICE ni verificado compilador ASM real; no declarar PASS de velocidad.**

## Enlaces de prueba aislados

- WEB: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test251/
- ZIP: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test251-early-raster-tight-bands.zip

Instrucciones: proyecto TERRY original, Diagonal Up Left, Bank1, 8 píxeles por paso, 1 tick, sin SID, x64sc PAL. Si hay saltos, franjas de colores o fallo, volver a TEST244 y marcar TEST251 FAIL.
