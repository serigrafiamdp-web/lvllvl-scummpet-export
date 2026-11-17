# TEST372 — EBCM / Extended PRG restaurado

**Fecha: 16/11/2026 (Argentina)** · **Estado: PASS confirmado por el usuario** en el caso LILCHEB («ESTA ok»). No implica validación de todas las combinaciones avanzadas.

## Reproducción

Comparación de dos JSON y PRG de `LILCHEB.zip`:
- Ambos JSON contienen **26 frames**, mismo dibujo, fondos de celda que incluyen `9, 11, 12, 15` y transparente `-1`. La capa guarda `screenMode: textmode`, pero el modo PRG Extended se elige en el diálogo.
- **James:** PRG 44.122 bytes, carga `$0801`, `$0811=$01` (Extended).
- **RICO anterior:** PRG 47.119 bytes, `$0811=$00` (standard).

## Regresión encontrada y solución

Los wrappers de **TEST104 y TEST264** imponían `safeArgs.mode='standard'` aunque se pidiera `extended`. Además, su hook de cambio de BANK intervenía `$D024`, que en EBCM almacena el cuarto color de fondo.

**Solución mínima:** ambos wrappers delegan intactos al exportador anterior cuando `args.mode === 'extended'`. Conservan sus rutas previas para standard/multicolor. No se cambió el JSON, paletas, TASS ni `js/main.js`.

Scripts efectivos:
- `TEST/test372-restore-ebcm-export/js/RICO_PRG_DUAL_BANK_TEST264_EBC_GUARD_TEST372.js`
- `TEST/test372-restore-ebcm-export/js/RICO_PRG_DUAL_BANK_TEST104_EBC_GUARD_TEST372.js`

**QA:** PASS reportado por el usuario para LILCHEB; prueba automatizada de delegación preservó los argumentos originales. EBCM con un BANK 2 efectivo o combinaciones SID/Group/Scroll exige compositor o pruebas adicionales; este PASS no significa soporte universal.

[Progreso 16/11](../../docs/PROGRESO_2026-11-16.md) · [README principal](../../README.md)
