# LVLVL RICO — MASTER SÁBADO 24 DE OCTUBRE DE 2026

**MASTER ACTUAL DE TRABAJO: TEST264 C64 Multicolor — PASS básico en VICE confirmado por usuario.** Este snapshot conserva el editor y los módulos RICO hasta TEST264, incluyendo UI compacta, índice y pincel multicolor, Replace Color, BANK1/BANK2 y rutas históricas de Map/Group Scroll. **Ninguna combinación adicional Scroll + MC ha sido marcada PASS sin pruebas en VICE.**

- **MASTER 24/10:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026
- **Descargar MASTER ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_24_OCTUBRE_2026.zip
- **Web TEST264 con exportación MC simple PASS:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test264-native-multicolor-export/
- **Documentación consolidada:** [docs/MASTER_LVLVL_RICO_24_OCTUBRE_2026.md](docs/MASTER_LVLVL_RICO_24_OCTUBRE_2026.md)
- **Auditoría de compatibilidad Multicolor TEST265:** [docs/TEST265_AUDITORIA_EXPORT_MULTICOLOR.md](docs/TEST265_AUDITORIA_EXPORT_MULTICOLOR.md)
- **Matriz preparada para mañana, 25/10 — TEST266:** [docs/PLAN_TEST266_MATRIZ_MULTICOLOR_25_OCTUBRE_2026.md](docs/PLAN_TEST266_MATRIZ_MULTICOLOR_25_OCTUBRE_2026.md)
- **MASTER 23/10 diagonal TEST254, preservado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026
- **MASTER 23/10 Group TEST247, preservado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026_GRUPALES_TEST247_PASS

**Preservación:** este MASTER es un checkpoint recuperable creado desde `release/test264-native-multicolor-export`; los tests nuevos deben derivar del MASTER en ramas separadas. El editor de la raíz pública `gh-pages` no ha sido reemplazado. El MASTER diagonal TEST254 sigue en otra rama, no se promete convivencia validada con el editor TEST264.

---

## Archivo histórico: documentación previa del MASTER del 23/10

# LVLLVL RICO — MASTER VIERNES 23 DE OCTUBRE DE 2026

**Nuevo MASTER de referencia: TEST254 · ~47,2 avances/s en VICE, rendimiento validado.** Se eligió TEST254 en lugar de TEST255 para priorizar la calidad visual sobre acercarse a 50/s; queda una revisión fina de sincronización y costuras para continuar. **La web principal no cambia de motor en este checkpoint.**

- **MASTER del 23/10/2026:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026
- **Descargar ZIP completo:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_23_OCTUBRE_2026.zip
- **Probar la versión guardada en web:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test254/
- **Documentación de recuperación para el próximo día:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/MASTER_LVLLVL_RICO_23_OCTUBRE_2026/docs/MASTER_VIERNES_23_OCTUBRE_2026.md
- **MASTER del 22/10/2026 preservado:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026

**Regla de continuación:** retomar desde este branch congelado, creando un TEST nuevo para mejoras gráficas. TEST255 se conserva separado, sin promocionarlo. Evitar fusionar `main` y `gh-pages` porque divergen.

---

## Archivo histórico — estado previo documentado el 22 de octubre de 2026

**MASTER LVLLVL RICO — 22 OCTUBRE 2026 · TEST228 PASS confirmado en VICE.**

- **Web actual:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- **Rama activa de la web:** [gh-pages](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages)
- **MASTER congelado:** [MASTER_LVLLVL_RICO_22_OCTUBRE_2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026)
- **ZIP del MASTER:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_22_OCTUBRE_2026.zip

> **ATENCIÓN:** `main` y `gh-pages` tienen historias divergentes. El código aprobado que ejecuta GitHub Pages es **gh-pages**. No trabajar desde `main` por accidente ni fusionarla a ciegas.

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

## Estado aprobado (22/10/2026)

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
