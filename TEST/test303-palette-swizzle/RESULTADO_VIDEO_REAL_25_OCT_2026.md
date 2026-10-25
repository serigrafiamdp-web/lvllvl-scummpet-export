# TEST303 — Video real: retroceso de velocidad por fallback a TEST297

**Fecha:** 25 de octubre de 2026. **Estado del test:** **FAIL de aceleración** en el proyecto del usuario. No se actualiza MASTER.

## Evidencia y archivos analizados

El usuario informó "lo veo peor creo" y adjuntó `2026-10-25 11-27-42.mkv` (H.264, 1920×1080, 50 FPS, duración 10,42 segundos). Se comparó cuadro a cuadro con las capturas existentes de TEST297 PASS, TEST299 y TEST300, todas a 50 FPS. Se analizaron las diferencias medias de imagen dentro de una región común de la escena, excluyendo la UI, y se verificó estabilidad del resultado con umbrales de diferencia de 2,5 a 12. Los intervalos del nuevo video permanecen constantes alrededor de 7 cuadros.

| Captura | Cambios detectados | FPS captura | Cuadros medios / desplazamiento | Frecuencia de actualizaciones |
|---|---:|---:|---:|---:|
| TEST297 PASS `2026-10-24 23-46-06.mkv` | 87 en 604 cuadros | 50 | 6,99 | 7,20 Hz |
| TEST299 `2026-10-25 00-16-01.mkv` | 87 en 519 cuadros | 50 | 5,99 | 8,38 Hz |
| TEST300 `2026-10-25 01-20-59.mkv` | 95 en 564 cuadros | 50 | 5,97 | 8,42 Hz |
| **Nuevo video `2026-10-25 11-27-42.mkv`** | **75 en 520 cuadros** | **50** | **6,99** | **7,21 Hz** |

**Resultado:** el video nuevo coincide prácticamente con la cadencia de TEST297 PASS. Comparado con TEST299/300, muestra aproximadamente **14% menos desplazamientos por segundo**. No se detecta en las muestras un parpadeo nuevo; los cambios observados son completos.

## Explicación confirmada por el mensaje del navegador

Previamente el usuario aportó un diálogo:

```
TEST303 NO ACTIVADO. Se exporta TEST297 sin mejora de velocidad.
Filas compatibles: 0/25.
Motivo: Ninguna asignación de C1/C2 globales y permutaciones de tiles conserva Color RAM 0–7 estática para todas las fases.
```

Esto confirma que TEST303 **NO ejecutó el motor MC Character Swizzle**, sino la ruta de Bitmap MC TEST297 heredada. Por tanto, NO interpretar el menor rendimiento del video como prueba de que el speedcode Palette Swizzle (no activado) sea más lento. Es un error de referencia de fallback: el motor activo es TEST297 y no los motores de scheduler TEST299/TEST300.

## Estado de las referencias

- **TEST297:** PASS explícito confirmado por el usuario, rollback seguro.
- **TEST299:** mejora medible, ~8,4 cambios/s, aunque el usuario no la percibió claramente.
- **TEST300:** misma cadencia que TEST299 en video real, sin mejora adicional.
- **TEST301-303:** experimentos de conversión a modo MC Character, no compatibles con el arte actual sin pérdida, que hicieron fallback a TEST297.
- **MASTER:** intacto.

## Siguiente decisión técnica

1. No seguir utilizando TEST303 como prueba de velocidad real en el arte actual mientras marque **NO ACTIVADO**.
2. Para próximos experimentos de Bitmap Multicolor puro, **usar como referencia de rendimiento TEST299/TEST300** y conservar TEST297 PASS como punto de rollback.
3. Si hay que mejorar el fallback de los experimentos de compatibilidad, hacerlo explícito y validarlo en un TEST separado; no reemplazar silenciosamente el último PASS aprobado.
4. Futuros intentos deben mantener 256 tiles, 1000 apariciones, C1/C2/C3 completos, doble buffer y comparar la cadencia en VICE real.

**Ningún cambio al ASM se deriva automáticamente de esta medición.**
