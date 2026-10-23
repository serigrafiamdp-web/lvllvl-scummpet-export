# TEST255 — Candidato a 50 avances/s PAL: 6502 fast path sin profiler CIA

**Estado: EXPERIMENTAL, pendiente de prueba real en VICE.** Deriva de TEST254, validado por vídeo a **47,22 avances/s**. No tocar MASTER ni las versiones TEST244, TEST251, TEST254.

## Razón concreta

En TEST254, el video `2026-10-23 01-25-00.mkv` mostró 584 cambios en 12,383 s = **47,22/s** (~1,89× sobre TEST244). La primera IRQ normalmente encuentra datos listos: TEST254 `$A043=01`, `$A044=00`, `$A045=01`, raster $57 (87). La preparación previa finalizó en raster $53 (83), aproximadamente **3 raster de margen** antes de IRQ a raster $56 (86).

El software de TEST254 seguía arrastrando el profiler CIA1 de TEST253:
- `t253_begin` y `t253_end` alrededor de `prep_edges249` en el main loop.
- `t253_queue` inmediatamente después de plan_step dentro del handler de IRQ.
- `t253_first` en cada primera interrupción raster.
- `t253_init` al arrancar.

Ese profiler nos permitió diagnosticar correctamente el cuello de botella, pero ya no hace falta en la ruta de rendimiento. Sus lecturas/escrituras a CIA y RAM cuestan CPU cada frame.

## Cambios de TEST255

1. **Eliminar del hot path** cinco llamadas `JSR t253_init/begin/end/queue/first` (cuatro puntos de ejecución, cinco nombres).
2. Retirar las rutinas auxiliares CIA ya sin referencias y los antiguos 26 bytes de telemetría A030–A049. No son necesarios para el render.
3. Suprimir exactamente **40 instrucciones `AND #$0F`** de la copia ya desenrollada de la última fila de colores (ahorro 80 ciclos).
4. **Corrección garantizada:** `collect()` en TEST196 normaliza cada `cell.fc` con `&15` antes de exportar. Para cualquier entrada artificial con colores fuera de 0..15, TEST255 desactiva la optimización y genera EXACTAMENTE el TEST254 anterior.
5. Crear firma inerte específica TEST255 en `$A030..A032 = 55 01 03`, para demostrar en monitor que la exportación aplicó el modo rápido.

Se conservan bit a bit:
- 936 copias de caracteres + 936 de Color RAM, ASM directas, in-place.
- 65 celdas de borde/Color RAM y todas sus escrituras.
- Los dos bucles ya desenrollados de TEST254 excepto esas 40 máscaras innecesarias.
- 3 IRQ raster a **86,132,218**, coordinación beam-chasing y `plan_step`.
- Todos los colores C64 0..15, Bank1/2, mapa circular y TERRY.
- Los contadores de TEST250 en `$A020..A028`.

### Presupuesto teórico

La supresión del profiler evita alrededor de **235–250 ciclos por movimiento** (dependiendo de los caminos recorridos) y quitar 40 × AND inmediato de 2 ciclos evita **80 ciclos**. Total esperado **~315–330 ciclos ahorrados**, sin contar posibles efectos de badlines o alineación del raster. La cifra es una estimación ASM, NO medición VICE.

No hay cambios en el formato de gráficos ni en las rutinas de copia de pantalla. El código de programa pasa a `$2000..$2D9C` y deja margen amplio antes del charset $3000.

## Validación antes de VICE

- 128 configuraciones sintéticas: 8 rutas rápidas en dos diagonales arriba, Bank1/Bank2, colores normalizados y 8px/step; 120 fallbacks **byte a byte iguales a TEST254**, incluyendo patrones con colores fuera de rango.
- 0 ramas ASM fuera del rango 6502, 0 colisiones de memoria.
- Código de programa `$2000..$2D9C`; caché TERRY CHAR+Color `$8000..$967F`; diagnóstico A020–A028 y firma A030–A032; archivo PRG hasta `$C340` (<$D000).
- JavaScript sintácticamente correcto y transformación de fuente válida. **No se ha ensamblado el PRG real ni ejecutado VICE con este TEST255.**

## Protocolo de medición

WEB separada: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test255/

ZIP completo rama: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/release/test255-zero-profiler-fast-path.zip

1. Cargar mismo **TERRY multicolor**, Diagonal Up Left, Bank1, 8px por step, 1 tick, **sin SID**.
2. Exportar PRG desde TEST255 y probar en **VICE PAL, sin Warp**, grabar 10–15 s como en TEST254.
3. Verificar visualmente: continuidad, arte, los 16 colores, zona de unión de las tres franjas raster, bordes y esquina inferior.
4. Detener y leer:

```
m a020 a028
m a030 a032
```

**Esperamos `$A030..A032 = 55 01 03`**. Los antiguos datos de cronómetro **TEST253 `m a030 a049` ya NO tienen significado en TEST255**. Para medir ciclos otra vez, usar TEST254 archivado o construir un muestreador de bajo coste futuro.

5. Comparar cambios visuales/s contra TEST254 47,22/s (video 60 Hz). Objetivo 50/s sostenidos PAL. Si el resultado es igual o peor, no promover. No afirmar éxito por firma o pruebas estáticas.

## Respaldo

Referencia rápida anterior: TEST254, validada 47,22/s. MASTER: sin modificar.
