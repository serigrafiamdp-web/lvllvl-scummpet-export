# TEST236 — DIAGONAL DUAL FAST · ZIP LOCAL

**Estado:** experimental, pendiente de medición PASS/FAIL en VICE.
**Base:** gh-pages con TEST232 PASS y documentación de features actualizada. **No altera gh-pages ni MASTER.**

## Por qué
TEST235 seguía lento en el proyecto real del usuario (FAIL de velocidad). TEST235 convertía las fases de Color RAM RLE ya precalculadas por TEST221B a otra etapa de copiar/desplazar 1000 celdas en RAM y recorrer 1024 posiciones buscando diferencias. TEST236 **descarta ese cambio**.

## Técnica que combina las dos rutinas cardinales rápidas
- Conserva el desplazamiento diagonal de caracteres **en una única pasada** `diag_shift221` sobre el backbuffer, basado en las estrategias de TEST220 horizontal y TEST168/227 vertical. Los dos desplazamientos X+Y avanzan juntos; nunca se ejecutan dos scrolls cardinales separados.
- Conserva el `plan_step` original, doble buffer, un solo swap, Fine X/Fine Y, Color RAM de 25 filas, Ticks/Step, Pixels/Step, group scheduler y SID.
- Recupera las **listas precompiladas de cambios de color** por posición/cámara de TEST221B (compatible con la idea de TEST220 RLE), sin reconstruir/sombrear Color RAM en cada paso.
- Optimiza el intérprete RLE dentro de IRQ: **un solo cambio de color** evita actualizar el puntero de destino; una racha vertical de **2–6** usa desplazamiento relativo con Y; las de **7–25** siguen el procedimiento clásico, recargando el color en cada escritura.
- Si el plan original no entra, intenta **deduplicar** bloques RLE idénticos de distintas fases, manteniendo zonas de memoria libres `$B000–$B7FF`; solo activa esta ruta si todas las tablas caben en `$A100–$AFFF` y `$B800–$CFFF`.
- Si no cabe, usa la ruta original del motor sin modificar el ensamblado. **No reemplaza colores con tonos aproximados ni elimina celdas.**
- Los caminos vertical TEST232, horizontal TEST220 y SID TEST229 **no se modifican**.

## Verificaciones
- 768 configuraciones (4 diagonales × 8 Pixels/Step × 4 tamaños de mapa × 6 patrones); **256** usaron el decodificador RLE más rápido; **512** mantuvieron el código original.
- 720 fases RLE (4 diagonales × 3 patrones × 60 posiciones), ejecutadas en **intérprete de instrucciones 6502 de prueba** y comparadas celda por celda: **720.000 colores correctos**.
- 192 escenarios de integración ASM/SID sintéticos (4 diagonales × 3 velocidades × 4 patrones × 4 tamaños PSID) sin errores de construcción de fuentes.
- Todas estas son **pruebas de fuente/simulación**, no medición de ciclos reales ni validación de VICE.

## Uso
1. Descargar el ZIP TEST236 y extraerlo. Abrir con el **START_LVLLVL_TEST01.bat** original, desde el navegador/perfil habitual.
2. Exportar el mismo mapa real que usaste con TEST235, en diagonal y luego Up, con igual Ticks/Step y Pixels/Step (empezar por 8 px y 1 tick).
3. Ver en consola `window.RICO_TEST236_LAST_BUILD`:
   - `selected:true, mode:'RLE-optimized-executor'`: mejora activa (sin promesa de fps).
   - `selected:true, mode:'deduplicated-RLE-fast'`: plan comprimido activo.
   - `selected:false, mode:'original fallback'`: este mapa sigue por la ruta original, **no esperar cambio de velocidad**.
4. Validar ausencia de color blanco, franjas, flicker o congelamiento con y sin SID.
5. Si aparece FAIL, volver a TEST232 PASS. Mantener el MASTER sin cambios.

**No se publica en GitHub Pages.** Solo existe como rama ZIP local:
`release/test236-diagonal-dual-fast-color-only`.
