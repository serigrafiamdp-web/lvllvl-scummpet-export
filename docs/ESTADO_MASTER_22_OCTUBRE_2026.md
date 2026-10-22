# MASTER LVLLVL RICO — 22 OCTUBRE 2026

**Fuente aprobada:** `gh-pages` con TEST228 **PASS confirmado por el usuario** antes de limpiar carpetas. Este MASTER se basa exactamente en esa implementación; no se han cambiado archivos activos de la aplicación por la reorganización.

## PASS confirmados y restricciones

- **TEST220 PASS** — Left/Right, desplaza ventana completa; Color RAM RLE.
- **TEST227 PASS** — Up/Down a 8 píxeles y 1 tick, sin bugs visuales; la reparación elimina el congelamiento introducido por TEST226.
- **TEST228 PASS** — exportación SID + scroll integrado a motores nativos. PSID compatibles; selector AUTO CIA, 50/100 Hz.
- **TEST221** — diagonales preparadas, comprobadas por simulación/generación; no atribuirles automáticamente un PASS visual.
- **TEST225** — 1–7 px vertical experimental; no sustituye la ruta 8 px PASS.
- **TEST226 FAIL** — `JMP $0000` en PRG; reparado en TEST227. Archivo JS actual conserva nombre histórico TEST226.
- **TEST223** — instrumentación, no una optimización por sí misma.

## Cómo quedó ordenado Git

- Antes de cambiar estructura, se creó `backup/PRE_MASTER_22_OCTUBRE_2026_TEST228_PASS`.
- Las pruebas aisladas **test150–test165** (34 archivos) fueron a `TEST/test150`…`TEST/test165`; sus HTML ajustaron `<base href="../../">` y referencias cruzadas.
- `log.txt` y `mapaconceptual.txt` se preservaron **íntegros**, concatenados en `docs/HISTORIAL_UNIFICADO_PRUEBAS.md`; originales accesibles en backup/historia Git.
- Los 7 documentos antiguos `docs/RICO_TEST207–213_*.md` se guardaron en `docs/historico/`.
- El README antiguo de la rama `main` se preservó en `docs/historico/README_MAIN_LEGACY_20_OCT_2026.md`.
- Documentación canónica: README, arquitectura, handoff IA, esta hoja de estado y cronología de los TEST214–228.

## Ramas

- `gh-pages`: funcionamiento web actual.
- `MASTER_LVLLVL_RICO_22_OCTUBRE_2026`: checkpoint congelado.
- `backup/PRE_MASTER_22_OCTUBRE_2026_TEST228_PASS`: rollback exacto antes de mover archivos.
- `main`: línea antigua divergente; **no fusionar o forzar** sin comparar.

## Política de mantenimiento

Evitar cambios visuales en un commit de limpieza documental. No borrar evidencias de FAIL. No subir archivos privados .sid, .prg o videos. Probar cambios desde rama `test/...`, entregar web+ZIP limpio y consolidar solo tras PASS confirmado en VICE.
