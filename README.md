# LVLLVL RICO — MASTER VIERNES 23 DE OCTUBRE DE 2026

**MASTER congelado del editor y motor C64 · TEST254 — PASS de rendimiento en VICE (~47,2 avances/s).** La revisión detallada de fidelidad visual queda pendiente; la prioridad es que se vea correcto antes que perseguir los 50 Hz teóricos.

- **MASTER 23 OCT — rama fuente:** [MASTER_LVLLVL_RICO_23_OCTUBRE_2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026)
- **Descargar MASTER 23 OCT — ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_23_OCTUBRE_2026.zip
- **WEB aislada de la base TEST254:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test254/
- **Guía para retomar mañana:** [MASTER_VIERNES_23_OCTUBRE_2026.md](docs/MASTER_VIERNES_23_OCTUBRE_2026.md)
- **Detalles técnicos y medición:** [TEST254_UNROLLED_EDGES_6502.md](docs/TEST254_UNROLLED_EDGES_6502.md)
- **Test posterior que NO integra este MASTER:** TEST255 (~47,1/s, desincronización visual percibida). Se conserva aislado en `TEST/test255/` de `gh-pages`.
- **MASTER anterior del 22 OCT (rollback):** [MASTER_LVLLVL_RICO_22_OCTUBRE_2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026)

**ATENCIÓN:** `main` y `gh-pages` divergen: `main` no es la base correcta para modificar este motor. Este branch congela el código completo derivado de TEST254; **no se han cambiado las rutinas de pantalla ni Color RAM durante la congelación**. La web de la raíz de GitHub Pages se mantiene sin reemplazar para evitar regresiones.

## Evolución y estados de referencia

- **22 OCT:** MASTER previo de TEST228 PASS, ampliación TEST232 PASS; optimización diagonal aún abierta.
- **23 OCT:** TEST244–253 exploraron un scroll multicolor diagonal de 25 avances/s y localizaron el cuello de CPU.
- **TEST254:** copias ASM de bordes desenrolladas y preparación optimizada, subida verificada por video desde ~25 a **~47,2 avances/s**.
- **TEST255:** quitar profiler CIA y máscaras de color no aumentó FPS; se reportó una posible desincronización visual y se excluyó.
- **Próximo objetivo:** revisar costuras raster, colores y estabilidad de pantalla sobre TEST254. No promocionar un cambio nuevo sin PASS visual.

---

## Nuevas funciones incorporadas al LVLLVL original

Este inventario reúne las **extensiones RICO** agregadas al editor original: herramientas de creación, funciones de animación y nuevas rutas de exportación C64. **Integrada** no significa que todas las combinaciones tengan PASS visual en VICE; los experimentos se distinguen en el historial de pruebas.

### Bancos de caracteres y Tilesets

1. **Dual Charset C64:** BANK 1 y BANK 2, con 256 caracteres por banco (hasta 512 diseños de glyphs).
2. **Charset Bank por frame:** selección independiente de BANK 1 o BANK 2 en cada frame.
3. **BANK 2 Shifted por defecto**, editable sin alterar BANK 1.
4. **Paleta dual-bank:** vista simultánea de bancos, con el inactivo atenuado.
5. **Tile Editor dual-bank:** dibujo y edición en el banco seleccionado.
6. **Rico's Remix a Tileset:** mezcla de diferentes fuentes carácter por carácter.
7. **Navegador de fuentes C64, Swedish y Japanese**, incluyendo Shifted.
8. **Importación 7×8 → 8×8** para fuentes C64.
9. **Importación 8×16** dividida en pares verticales de caracteres C64.
10. **Importación 16×16** dividida en bloques de 2×2 caracteres.
11. **Biblioteca local de Tilesets** personalizados con importación/exportación.
12. **Edit Group Chars:** edición conjunta, pixel a pixel, con selección, copiar/pegar y zoom.
13. **Herramientas ECM C64:** repack, selección y reselección de glyphs y protección de caracteres utilizados.

### Animaciones de caracteres

14. **Animated Chars independientes entre BANK 1 y BANK 2.**
15. **Scroll individual** Left, Right, Up y Down.
16. **Ping Pong individual** en cuatro direcciones, sin wrap circular.
17. **Blink y Frames** integrados en las rutas compatibles del exportador.
18. **Animated Tileset Preview** en la paleta lateral.
19. **Group Animate:** selección de caracteres animada como una superficie continua.
20. **Velocidad de Group Animate configurable** mediante ticks y píxeles por paso.
21. **Exportación de grupos grandes:** optimizaciones hasta 256 caracteres animados, según configuración.
22. **Animated Chars y Map Scroll simultáneos**, con sincronización de movimientos tipo *Pixel Gear*.

### Rico's Map Scroll

23. **Rico's Map Scroll:** ventana específica para configurar el movimiento del mapa.
24. **Scroll en ocho direcciones:** cuatro cardinales y cuatro diagonales.
25. **Ping Pong Map Scroll** (ida y vuelta) en rutas compatibles.
26. **Move Out** en las cuatro direcciones cardinales.
27. **Move In** en las cuatro direcciones cardinales.
28. **Ticks/Step:** velocidad temporal del movimiento.
29. **Pixels/Step:** desplazamiento configurable de 1 a 8 píxeles.
30. **Frame Duration** ampliado hasta 1024 ticks.
31. **Configuración de Map Scroll por frame.**
32. **Navegación entre frames con `<` y `>`** dentro del diálogo.
33. **Play/Pause global** de previsualizaciones sin perder parámetros.
34. **Preview PAL** ajustada para aproximarse al comportamiento del PRG.

### Dimensiones, ventana y Scroll Area

35. **Rico's Dimensions:** redimensionado desde Left, Right, Top y Bottom.
36. **Rico's Window Dimensions:** viewport visible independiente del tamaño del mapa.
37. **Scroll Area independiente** de Screen y Window.
38. **Controles de recorte por los cuatro lados** de la ventana.
39. **Window y Scroll Area por frame**, sin bloquear el dibujo exterior.
40. **Ventanas C64 de 24 o 25 filas** según ruta y configuración.
41. **Mapas mayores que la ventana**, por ejemplo 40×50 con viewport reducido.

### Interfaz de edición

42. **Nueva distribución de interfaz:** reorganización de Frames, editor y paneles.
43. **Paleta C64 compacta** para colores foreground/background.
44. **Panel Colours minimizable**, con apertura inicial plegada.
45. **Tileset Columns of 16** como disposición inicial.
46. **Vistas alternativas de los bancos**, incluido Banks 32×8.
47. **Divisor lateral ajustable** sin desplazar el área de frames.
48. **Zonas exteriores negras en previews** para evitar transparencias ajenas al viewport.
49. **Correcciones de refresco y flicker** de paleta y caracteres animados.

### Exportación PRG para Commodore 64

50. **Exportación PRG Dual Charset**, con selección BANK 1/2.
51. **Motor de Map Scroll para PRG**, independiente del reproductor clásico.
52. **Doble buffer de pantalla VIC-II**, con preparación de pantalla oculta.
53. **Scroll horizontal y vertical incremental**, evitando copias completas cuando es posible.
54. **Exportación de cuatro diagonales**, con rendimiento todavía en investigación.
55. **Exportación horizontal multiframe**, condicionada por memoria disponible.
56. **Animación de caracteres más Map Scroll en un mismo PRG**, en combinaciones compatibles.
57. **Actualizaciones optimizadas de Color RAM** con RLE y escrituras directas.
58. **Música SID embebida** usando el motor de scroll correspondiente.
59. **Selector SID AUTO/CIA/50/100 Hz** para PSID compatibles.
60. **Ampliación de SID hasta aproximadamente 8 KB**, con relocación del núcleo cuando es necesario.
61. **Relojes de música y vídeo independientes**, para que la velocidad musical no dependa del número de frames.
62. **Instrumentación de diagnóstico de VICE:** contadores de espera, preparación y confirmación de buffers.

**Alcance:** los modos, tamaños y optimizaciones dependen del tipo de proyecto, memoria y exportador. Las diagonales y combinaciones multiframe tienen limitaciones verificadas; TEST233 y TEST234 no se consideran mejoras consolidadas.

## Estado del MASTER anterior (22/10/2026)

| Área | Resultado |
| --- | --- |
| TEST220 — Left/Right | **PASS usuario** |
| TEST227 — Up/Down 8 px/tick | **PASS usuario** |
| TEST228 — SID + scroll | **PASS usuario** |
| TEST229 — SID ampliado | **PASS usuario** |
| TEST232 — Color RAM directa vertical fina | **PASS usuario** |
| TEST233 — optimización de diagonales | Sin mejora general de velocidad confirmada |
| TEST234 — color diagonal incremental | **FAIL visual** |
| TEST235 — diagonal con Color RAM parcial | Experimental, ZIP local; pendiente VICE |
| TEST221 — diagonales | Generación y simulación verificadas; no atribuir PASS específico de VICE |
| TEST225 — vertical 1–7 px | Experimento anterior; ruta de color vertical fino corregida posteriormente en TEST232 PASS |
| TEST226 — Color RAM con JMP indirecto | **FAIL** congelamiento, corregido por TEST227 |

Un PASS real requiere confirmación visual/musical en VICE; compilar JS o simular 6502 no equivale a PASS.

## Documentación para retomar desde otro chat

1. **[Guía para otro chat IA](docs/GUIA_PARA_NUEVO_CHAT_IA.md):** pasos, repositorio, qué no romper.
2. **[Arquitectura y mapa de memoria](docs/ARQUITECTURA_MOTOR_Y_EXPORT.md):** rutas, módulos, SID.
3. **[MASTER 22 octubre](docs/ESTADO_MASTER_22_OCTUBRE_2026.md):** PASS/FAIL y respaldo.
4. **[Historial TEST214–228](docs/CRONOLOGIA_TEST214_228.md):** optimizaciones y regresiones recientes.
5. **[Historial de pruebas consolidado](docs/HISTORIAL_UNIFICADO_PRUEBAS.md):** transcripción íntegra de los antiguos `log.txt` y `mapaconceptual.txt`.
6. **[Índice documental](docs/README.md)** y **[TEST históricos](TEST/README.md)**.

## Estructura limpia

```text
index.html              # entrada web actual; el orden de scripts JS es crítico
js/                     # editor original + módulos RICO
c64/, css/, charsets/   # recursos del editor
TEST/test150..test165/  # laboratorios históricos separados, con rutas reparadas
docs/                   # README técnico, historia y guía de continuidad
docs/historico/         # documentación SID207–213 original y README de main antiguo
```

Los PRG, SID, vídeos y archivos privados de pruebas **no se suben al repositorio**. Para desarrollar: rama nueva `test/...`, web y ZIP limpio, prueba VICE, PASS/FAIL explícito; congelar un nuevo MASTER solo con aceptación del usuario.
