# LVLLVL RICO — Editor C64, Map Scroll y exportación PRG

**MASTER LVLLVL RICO — 22 OCTUBRE 2026 · TEST228 PASS confirmado en VICE.**

- **Web actual:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- **Rama activa de la web:** [gh-pages](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages)
- **MASTER congelado:** [MASTER_LVLLVL_RICO_22_OCTUBRE_2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026)
- **ZIP del MASTER:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_22_OCTUBRE_2026.zip

> **ATENCIÓN:** `main` y `gh-pages` tienen historias divergentes. El código aprobado que ejecuta GitHub Pages es **gh-pages**. No trabajar desde `main` por accidente ni fusionarla a ciegas.

## Características principales

- Edición PETSCII y charsets C64; 2 bancos de 256 caracteres, bancos por frame, selección de Tileset C64 y **Rico's Remix a Tileset** (8×8, 8×16, 16×16).
- Animación individual y Group Animate; preview coordinada, paleta C64, colores por carácter, librería de tilesets local, controles de editor y frames.
- Map Scroll en cuatro direcciones cardinales y cuatro diagonales; controles de **Ticks/Step** y **Pixels/Step (1–8)**. Scroll, Ping Pong, Move Out e In en las rutas de ejecución compatibles.
- Scroll Area / Window Dimensions separados; viewport de 40×24/25 en las rutas principales; C64 VIC-II con doble pantalla y dos bancos charset.
- Exportación PRG de mapas mayores que la ventana visible y exportación multiframe horizontal según memoria disponible.
- **Left/Right:** TEST220 PASS, desplazamiento incremental con colores RLE.
- **Up/Down, 8 píxeles y 1 tick:** TEST227 PASS, scroll sin bugs; colores precompilados, salto absoluto corregido.
- **SID opcional, todas las direcciones:** TEST228 PASS. El adaptador usa el motor de scroll nativo de cada proyecto e integra INIT/PLAY, Auto CIA/50/100 Hz según PSID compatible.

## Estado aprobado (22/10/2026)

| Área | Resultado |
| --- | --- |
| TEST220 — Left/Right | **PASS usuario** |
| TEST227 — Up/Down 8 px/tick | **PASS usuario** |
| TEST228 — SID + scroll | **PASS usuario** |
| TEST221 — diagonales | Generación y simulación verificadas; no atribuir PASS específico de VICE |
| TEST225 — vertical 1–7 px | Experimental; el defecto a 4 px no había quedado resuelto |
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
