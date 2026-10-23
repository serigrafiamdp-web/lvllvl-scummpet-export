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

**MASTER congelado:** TEST228 PASS · **Última ampliación vertical aprobada:** TEST232 PASS · **Diagonales:** optimización aún experimental.

> **IMPORTANTE:** esta rama `main` conserva código histórico y diverge de `gh-pages`. **No usar el código de main para modificar el MASTER actual.** El motor que usa la página y su documentación completa están en `gh-pages`; este README está actualizado para orientar a GitHub y a un próximo chat IA.

## Accesos a la versión actual

- [MASTER LVLLVL RICO 22 OCTUBRE 2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026) — checkpoint congelado.
- [Rama gh-pages](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages) — versión que ejecuta la web.
- [Editor web](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/).
- [ZIP MASTER 22 OCTUBRE](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_22_OCTUBRE_2026.zip).

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

## Últimas funciones verificadas

- **TEST220 PASS:** scroll horizontal Left/Right y optimización de Color RAM.
- **TEST227 PASS:** scroll vertical Up/Down a 8 píxeles por tick fluido, sin errores visuales.
- **TEST228 PASS:** reproducción SID integrada sobre el exportador nativo de cada dirección. Auto CIA / 50 / 100 Hz para PSID compatibles, sin omitir música silenciosamente.
- **TEST229 PASS:** ampliación SID y reubicación cuando se requiere.
- **TEST232 PASS:** Color RAM directa para scroll vertical fino de 1–7 píxeles.
- **TEST233:** optimización diagonal limitada, sin mejora general de velocidad confirmada.
- **TEST234 FAIL:** anomalías visuales de Color RAM; descartado.
- **TEST235:** experimento diagonal solo ZIP local, pendiente de VICE.
- Map Scroll cardinal y diagonal, scroll fino VIC-II, viewport 40×24/25 según exportador, mapas mayores que la ventana, doble charset BANK1/2, Group Animate, Remix a Tileset y editor extendido.
- Algunas combinaciones multiframe/diagonales requieren PASS VICE específico; no generalizar los PASS ya confirmados.

## Documentación técnica para continuar en otro chat

**Leer en este orden desde gh-pages:**

1. [Guía para otro chat IA](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/GUIA_PARA_NUEVO_CHAT_IA.md).
2. [Arquitectura, motores de scroll, SID y mapa de memoria](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/ARQUITECTURA_MOTOR_Y_EXPORT.md).
3. [Estado del MASTER y PASS/FAIL](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/ESTADO_MASTER_22_OCTUBRE_2026.md).
4. [Historial TEST214–228](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/CRONOLOGIA_TEST214_228.md).
5. [Bitácora y conceptualización originales consolidadas](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/HISTORIAL_UNIFICADO_PRUEBAS.md).

## Orden y backups

- Laboratorios antiguos `test150`–`test165` agrupados bajo `TEST/` en el MASTER.
- Los antiguos `log.txt` y `mapaconceptual.txt` se conservaron íntegros y fusionados en un solo Markdown dentro de `docs/`.
- Documentos antiguos SID TEST207–213 en `docs/historico/`.
- [Backup anterior a la limpieza](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/backup/PRE_MASTER_22_OCTUBRE_2026_TEST228_PASS), por si necesitamos los paths antiguos.
- README anterior de esta rama resguardado en `docs/historico/README_MAIN_LEGACY_20_OCT_2026.md` dentro del MASTER.

**Proceso de trabajo:** hacer cambios en rama `test/...` desde `gh-pages`, entregar web y ZIP, medir en VICE, documentar PASS/FAIL. No sobrescribir el MASTER ni fusionar `main` por fuerza.
