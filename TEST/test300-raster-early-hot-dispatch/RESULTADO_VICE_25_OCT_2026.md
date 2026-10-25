# TEST300 — Medición real en VICE: sin mejora adicional frente a TEST299

**Fecha:** 25 de octubre de 2026 (Argentina).  
**Fuente:** vídeo adjunto `2026-10-25 01-20-59.mkv`, duración ~11,3 s, 1920×1080, 50 FPS.  
**Estado:** **FAIL del objetivo de nueva mejora de velocidad**, sin evidencias de desgarro de bitmap.

## Comparación realizada con las mismas regiones y algoritmo

Se procesaron las capturas originales a 50 FPS. Se midió la diferencia entre fotogramas consecutivos, recortando la imagen del C64 (x=215…900, y=120…560), convirtiendo a escala de grises y reduciendo a 171×110 para detectar cambios completos. Umbrales 3–15 de diferencia media dan exactamente los mismos conteos. Se contrastaron además separadamente las mitades superior e inferior.

| Referencia | Cuadros procesados | Transiciones reales detectadas | Mediana de cuadros por paso | Aproximación de pasos por segundo |
|---|---:|---:|---:|---:|
| TEST297 PASS — `2026-10-24 23-46-06.mkv` | 604 | 87 | 7 | 7,2 |
| TEST299 — `2026-10-25 00-16-01.mkv` | 519 | 87 | 6 | 8,4 |
| **TEST300 — `2026-10-25 01-20-59.mkv`** | **564** | **95** | **6** | **8,4** |

Intervalos TEST300: 65 de 6 cuadros, 16 de 5, 13 de 7; total 94 intervalos, media ~5,97 cuadros. TEST299: 65 de 6, 11 de 5, 10 de 7; media ~5,99 cuadros. Los intervalos de TEST299 y TEST300 son prácticamente idénticos.

**Integridad visual:** en TEST300 los **95 cambios** del área superior fueron simultáneos con los **95 del área inferior**: 0 transiciones exclusivas de una mitad. En TEST299 las 87 transiciones también coincidieron arriba y abajo. Eso es consistente con flips de bitmap completos y sincronizados, aunque no comprueba todos los píxeles a nivel del emulador.

## Interpretación

TEST300 combina las mejoras de scheduling de TEST299 con el fast dispatch de TEST298. El simulador de ciclos 6502 había predicho una mejora marginal de ~8,3 % frente a TEST299, pero **el vídeo real no muestra un cambio de cadencia: seis fotogramas de captura por desplazamiento en ambos motores**. El ahorro puede no alcanzar el próximo momento de flip o puede depender del mapa, badlines, VIC-II, ruta seleccionada o mezcla de costes de render. No dar por demostrado un origen concreto sin instrumentación de VIC/CPU real.

**Conclusión:** no promover TEST300 como mejora de velocidad; mantenerlo como experimento documentado. **TEST297 sigue siendo el último PASS claramente aprobado por el usuario; TEST299 es una variante experimental con un beneficio medible pero no percibido**. El MASTER permanece intacto.

## Próxima línea de investigación

Para ganar otro cuadro de velocidad en el mapa real, exigir una reducción bastante mayor en el trabajo de actualización (por ejemplo, reordenamiento de datos, speedcode por destino mejor empaquetado, cambios parciales del bitmap basados en datos reales), en lugar de sumar microajustes de dispatcher. Llevar además un benchmark de raster real del PRG exportado en VICE, con perfil de badlines, evitando tomar los ciclos sintéticos como FPS.
