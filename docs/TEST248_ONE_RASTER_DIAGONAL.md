## Contadores VICE reales — 22/10/2026

El usuario ejecutó el PRG TEST248 en VICE y entregó:

```
(C:$212f) m a020 a027
>C:a020  d4 6a 69 00  34 80 48 01
```

| Byte | Hex | Decimal | Significado |
|---|---|---:|---|
| $A020 | D4 | 212 | IRQ totales |
| $A021 | 6A | 106 | Intercambios realizados |
| $A022 | 69 | 105 | IRQ con `main_busy != 0` |
| $A023 | 00 | 0 | IRQ con petición pendiente pero no lista mientras CPU libre |
| $A024 | 34 | 52 | Raster bajo del último intercambio |
| $A025 | 80 | bit 8=1 | Último intercambio terminó en línea raster **308** (256+52) |
| $A026 | 48 | 72 | Firma "H" correcta |
| $A027 | 01 | 1 | Versión correcta |

**Interpretación:** hay un intercambio completo por cada dos IRQ, correlacionado con ~una IRQ ocupada por cada intercambio; `212 ≈ 106×2`. No hay una fase de espera libre sin `prep_ready` (`A023=0`). Los contadores son de 8 bits y admiten desbordamiento. La captura independiente de TEST248 confirma ~25,04 desplazamientos/s. Esto localiza la causa observada en **uso de CPU entre preparación de caracteres y commit de colores**, no en la separación entre dos IRQ. No se ha demostrado aún un mínimo físico universal de 25 fps.

**Siguiente estrategia aconsejada:** no seguir moviendo el raster o ahorrando decenas de ciclos en Color RAM; medir y optimizar el costo total de las celdas entrantes, los accesos al mapa y las transferencias de 936+960 posiciones. Para conseguir 50 desplazamientos/s a 8px/step habría que caber integralmente en el presupuesto CPU disponible de un cuadro PAL. Conservar TEST244 como referencia segura.

---

## Resultado de VICE: TEST248 NO MEJORA VELOCIDAD — 22/10/2026

El usuario observó "no veo mucho cambio" y adjuntó `2026-10-22 22-22-49.mkv`. Análisis directo del video fuente 1920×1080, 60 fps, 556 cuadros (9,267 s), con diferencias consecutivas de imagen y umbral estable en el área central de juego:
- **232 cambios visuales**, equivalentes a **25,04 avances/segundo**.
- 8 intervalos de 1 cuadro de grabación, 124 de 2 cuadros, 99 de 3 cuadros; **ninguna pausa mayor de 3 cuadros de captura**.
- En los 8 segundos completos centrales se cuentan aproximadamente 25 cambios/s.
- Comparación con los mismos criterios: TEST244 `19:47:14` **25,13/s**, TEST245 `19:56:52` **25,07/s**, TEST247 `21:10:41` **25,02/s**.
- **Conclusión: NO PASS de aceleración.** Conserva la fluidez, pero el cambio a una IRQ raster única no altera la cadencia efectiva de ~25 pasos/s.

Hipótesis técnica no confirmada por contadores: las transferencias de caracteres (936 copias de 8 ciclos + bordes) y Color RAM (960 copias de 8 ciclos + bordes) sumadas superan el presupuesto disponible de un cuadro PAL, sobre todo con badlines y tiempo de IRQ. No atribuir una causa única sin leer `m a020 a027` de VICE.

**Estado de rama: experimento conservado y registrado, no promover a MASTER. Mejor referencia conservada: TEST244.**

---

# TEST248 — Unificar dos raster IRQ en uno

**Estado: EXPERIMENTAL.** No es PASS de VICE. Conserva TEST244 como mejor referencia multicolor y TEST247 como optimización de caracteres sin mejora real de FPS.

## Motivo
La prueba TEST246 registró 158 interrupciones con pantalla lista y 159 con CPU ocupada, mientras TEST244/245/247 se mantuvieron alrededor de 25 avances/s. TEST247 ahorró ~4.400 ciclos de copia, pero no cambió la cadencia. Esta prueba modifica únicamente **cuándo** se ejecutan las dos fases Color RAM y el avance; **no** cambia ninguna rutina de copia de caracteres, Color RAM o mapa.

## Experimento

- Motor original TEST247: `diag_shift221` reemplazado por copiar 936 caracteres con código directo (una pantalla se genera en RAM $E000 al iniciar).
- Color RAM original TEST244, mismas subrutinas `color_upper244`, `color_edges_upper244`, `color_lower244`, `color_edges_lower244`.
- Interrupción raster única PAL en **$78 (línea 120)**:
  1. Si la pantalla no está lista, posponer (sin modificar Color RAM).
  2. Si está lista, ejecutar **ambas mitades** de Color RAM consecutivamente, detrás del haz VIC-II.
  3. Intercambiar screen buffer $0400/$0800, actualizar cámara, limpiar flags.
  4. Ejecutar `irq_tick` al final y solicitar el siguiente paso si corresponde.
- Ya no se programa una segunda interrupción en $FA. Con esto eliminamos el intervalo muerto entre $A0 y $FA, a costa de una IRQ más larga. El objetivo es verificar si sincronización de dos IRQ nos impedía subir de 25 movimientos/s.
- Borde del juego, 16 colores, ambas charsets, fuentes del mapa y opciones de scroll no modificadas.
- El motor TEST248 solo se selecciona cuando TEST247 está activo: diagonales **Up Left / Up Right**, multicolor sin Group Animate y **sin SID nativo**. Otras rutas regresan íntegramente al código anterior.
- Precaución: el enfoque 'behind the beam' es una hipótesis de raster timing PAL; si aparecen franjas o parpadeos, considerar TEST248 FAIL y volver a TEST244.

## Monitoreo

En VICE, después de ~3 segundos de correr el PRG, abrir monitor y leer:

`m a020 a027`

| Dirección | Significado |
|---|---|
| $A020 | Cantidad de IRQ de raster (mod 256) |
| $A021 | Cantidad de intercambios de pantalla completados (mod 256) |
| $A022 | IRQ cuando `main_busy` está activo |
| $A023 | IRQ con solicitud pendiente, pero no lista |
| $A024 | Línea raster baja al último intercambio |
| $A025 | Bit alto ($00 o $80) de raster al último intercambio |
| $A026 | Firma $48 ("H") |
| $A027 | Versión de contador $01 |

Los contadores de 8 bits pueden desbordar si la medición dura más tiempo. Una grabación MKV de VICE de 10 segundos permite comparar contra la medición de TEST247 (≈25,02 avances/s).

## Verificaciones antes de VICE

- 32 configuraciones sintéticas exportadas como código fuente ASM, 8 activas y 24 con fallback byte por byte idéntico al TEST247.
- Revisión estática del flujo de código 6502: sin ramas condicionales fuera del límite (-128..127).
- Regiones ensambladas estimadas (no ejecución real): PRG lineal llega hasta $CA91, sin cruzar la zona de I/O $D000-$DFFF; sin colisiones de segmentos. La construcción de código en $E000 permanece en el inicio y no modifica el PRG lineal.
- No hay compilación final de PRG ni prueba VICE automatizada: **la velocidad y la seguridad gráfica aún necesitan confirmación del usuario**.

## Enlaces

- Web aislada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test248/
- ZIP rama: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test248-single-raster-diagonal-commit.zip

MASTER y raíz gh-pages intactos. Si TEST248 es FAIL, regresar a TEST244.
