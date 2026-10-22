# LVLLVL RICO — MASTER 22 OCTUBRE 2026

**Estado aprobado: TEST228 PASS confirmado por el usuario en VICE.**

> **IMPORTANTE:** esta rama `main` conserva código histórico y diverge de `gh-pages`. **No usar el código de main para modificar el MASTER actual.** El motor que usa la página y su documentación completa están en `gh-pages`; este README está actualizado para orientar a GitHub y a un próximo chat IA.

## Accesos a la versión actual

- [MASTER LVLLVL RICO 22 OCTUBRE 2026](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_22_OCTUBRE_2026) — checkpoint congelado.
- [Rama gh-pages](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages) — versión que ejecuta la web.
- [Editor web](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/).
- [ZIP MASTER 22 OCTUBRE](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/archive/refs/heads/MASTER_LVLLVL_RICO_22_OCTUBRE_2026.zip).

## Últimas funciones verificadas

- **TEST220 PASS:** scroll horizontal Left/Right y optimización de Color RAM.
- **TEST227 PASS:** scroll vertical Up/Down a 8 píxeles por tick fluido, sin errores visuales.
- **TEST228 PASS:** reproducción SID integrada sobre el exportador nativo de cada dirección. Auto CIA / 50 / 100 Hz para PSID compatibles, sin omitir música silenciosamente.
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
