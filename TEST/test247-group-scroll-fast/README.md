# TEST247 — Group Scroll FAST ASM (23/10/2026)

**Prueba independiente. NO marcar PASS hasta ejecutar en VICE.**

Base aprobada: TEST246 Screen Remap Ping Pong 8px. Página principal, TEST246 y ONDAS originales sin cambios.

## Modos conectados
- Scroll Left / Right / Up / Down: **1 a 8 píxeles por tick**.
- Ping Pong Left / Right / Up / Down: **1–7 píxeles por tick**, con retorno de fases correcto.
- Ping Pong **8 píxeles** continúa usando exactamente TEST246 PASS.
- ONDAS 4 direcciones conserva el motor progresivo original; no se remapea.
- Configuración de ticks por grupo se conserva (1–255).

## Mecánica DemoScene
El movimiento circular usa tablas de remapeo de índices de caracteres. El Ping Pong recorta los píxeles fuera del área del grupo. Ambas variantes desplazan los códigos de pantalla, no reescriben todos los bytes del charset en cada fase.

**Velocidades pares (2,4,6,8):** fuentes precalculadas con residuos pares 0,2,4,6; dos buffers de pantalla $4400/$4800; cuatro fuentes en $5000/$5800/$6000/$6800, VIC bank1.

**Velocidades impares (1,3,5,7):** requieren cuatro fuentes adicionales de residuos 1,3,5,7. Se mantienen dos bancos VIC: bank1 con las fuentes pares y pantalla $4400; bank3 con fuentes impares en $C800/$E000/$E800/$F000 y pantalla $C400. Para evitar cargar bytes de un PRG a través de I/O, las fuentes impares viajan en RAM baja ($1000/$1800/$2800/$3000) y se copian al bank3 en la inicialización. $01=$35 desactiva KERNAL ROM pero **mantiene I/O visible**; por eso evitamos $D000-$DFFF. El IRQ conmuta $DD00 y $D018 al presentar cada fase. **La ruta de dos bancos VIC necesita validación real en VICE.**

RAM sin modificar: editor y proyecto; ninguna fuente se guarda de vuelta. Si no entra una tabla, falta un código vacío (solo Ping Pong) o el grupo no coincide con el banco visible, se vuelve al motor anterior con diagnóstico. No forzar valores ni recortar arte.

## Diagnóstico visual
Al exportar:
- `TEST247 SCROLL FAST ACTIVO`: nueva ruta, nombre, velocidad, celdas y bancos VIC.
- `TEST247 FALLBACK`: causa por la que no se usó el acelerador.
- `TEST246 REMAP ACTIVO`: Ping Pong 8px sigue en versión aprobada.
- ONDAS no muestra remapeo nuevo.

## Pruebas de generación realizadas
- 60 combinaciones geométricas de referencia: 4 Scroll circulares × 8 velocidades + 4 Ping Pong × 7 velocidades (sin 8px del TEST246). Comparación independiente de datos, fases y glifos: cero diferencias.
- 98 casos de integración, cubriendo BANK1/BANK2, rutas normales, Ping Pong8 heredado y ONDAS legado; sin etiquetas ASM duplicadas ni referencias a etiquetas inexistentes.
- No se realizaron todavía medidas reales de ciclos ni ejecución VICE de la nueva ruta.

## Integración siguiente
TEST247 optimiza **Group Animate sin Map Scroll**. Cuando Map Scroll está activo, el proyecto sigue pasando por el motor anterior de combinación. Se requiere otro test para compartir los VIC buffers con Map Scroll; jamás sustituir silenciosamente una animación combinada por un PRG de pantalla quieta.

URL: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test247-group-scroll-fast/

## Checkpoint de validación — 23/10/2026

**TEST247: PASS confirmado por el usuario en VICE.** Se conserva la versión del directorio `TEST/test247-group-scroll-fast/` como punto de recuperación del motor grupal optimizado. Este PASS se refiere a la prueba que el usuario acaba de validar, sin afirmar que todas las combinaciones posibles hayan sido probadas individualmente. **No modificar TEST246, ONDAS ni MASTER al continuar.**
