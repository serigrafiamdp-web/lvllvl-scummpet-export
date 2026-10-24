# TEST246 — Screen Remap DemoScene (23/10/2026)

**Estado:** experimentación ASM publicada en un directorio aislado; sin PASS de VICE.

## Diagnóstico de TEST245

El Speedcode de TEST245 cacheaba **todas las fases completas** de Ping Pong y rechazaba proyectos grandes cuando su caché superaba la memoria segura. Cuando esto sucedía, caía silenciosamente a TEST244, que copiaba el charset completo en cada fase. Así, en estrés de 128/256 caracteres, podían no notarse mejoras.

## Nueva estrategia TEST246

Para Group Animate Ping Pong a **8 píxeles/tick, sin Map Scroll**:

1. Durante la exportación, calcula cuatro variantes del charset original: residuos de píxeles **0, 2, 4 y 6**. A velocidad de 8 píxeles y límites de rebote en dimensiones múltiplos de 8, el recorrido solamente visita esos residuos.
2. Coloca las cuatro fuentes en VIC **BANK 1 ($4000–$7FFF)**: `$5000, $5800, $6000, $6800`. No se usa $1000–$1FFF de VIC bank 0 (ROM de caracteres).
3. Usa pantallas alternadas `$4400` y `$4800`. Mientras una se muestra, prepara la otra mediante código ASM directo `LDA tabla,X / STA pantalla`.
4. La tabla de mapeo convierte códigos del grupo según el movimiento en **caracteres completos**, sin copiar 8 bytes del bitmap por carácter durante cada tick.
5. La IRQ intercambia simultáneamente la pantalla y la variante de charset seleccionando **$D018**; el VIC permanece en bank1 ($DD00 bits bajos 2).
6. El color original de cada celda se conserva. Los caracteres del grupo no visibles se reemplazan con un glifo vacío reservado si es posible.
7. Si el proyecto no dispone de un glifo vacío, el grupo no coincide con el banco mostrado o la memoria no alcanza, **se conserva el exportador TEST245** sin modificar el proyecto.

### Presupuesto aproximado

El coste depende de las **celdas visibles que usan caracteres del grupo**, no del número total de bytes del charset:

| Celdas afectadas | Ciclos núcleo estimados/fase |
| --- | ---: |
| 64 | ~662 |
| 250 | ~2.150 |
| 600 | ~4.950 |
| 900 | ~7.350 |

Son estimaciones de instrucciones, no mediciones con VICE. No incluyen IRQ, conflictos de bus VIC, ni inicialización.

### Diagnóstico visible

Después de exportar, un aviso pequeño en la esquina inferior derecha indica:

- `TEST246 REMAP ACTIVO` y cantidad de celdas/fases, si se utilizó la nueva ruta.
- `TEST246 FALLBACK` con causa, si la exportación volvió al motor antiguo.

Esto impide confundir un fallback con un resultado del nuevo motor.

### Comprobaciones completadas

- Sintaxis JS y generación de ASM: sin errores de sintaxis ni etiquetas duplicadas en casos simulados.
- Validación geométrica independiente: cuatro direcciones, 10.240–20.480 bytes de caracteres por caso frente a una implementación recortada de referencia, **0 discrepancias**.
- Bancos activos 1 y 2 ensayados en la fase de recolección. La ruta remapeada crea un único VIC bank1 con los píxeles del banco originalmente activo; no altera el documento del editor.
- **Falta:** ensamblado y ejecución real en VICE, integridad de todas las variantes de pantalla, raster timing y benchmark de un grupo grande.

### Límites reales

- 1 grupo rectangular de hasta 256 caracteres únicos en un frame estático, sujeto a capacidad de memoria de tablas y espacio del código.
- Si los 256 códigos están ocupados y ninguno sirve como glifo vacío, hay fallback: no se elimina un carácter del arte para fabricar el fondo.
- ONDAS conserva su motor de TEST242. Group Animate con Map Scroll y SID siguen en sus rutas anteriores.

## Prueba

https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test246-charset-remap/

TEST245 permanece disponible:
https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test245-demoscene-speedcode/
