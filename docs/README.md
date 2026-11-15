# LVLLVL RICO — índice técnico (actualizado 15/11/2026)

**Primera lectura:** [README principal](../README.md) · [Editor publicado](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)

## Documentación vigente para desarrollar

1. [Arquitectura Map Scroll y Group Animate — esquema, fuentes de datos, motores, memoria y rutinas](ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md)
2. [Manifiesto exacto de scripts de index.html — 128 módulos, orden inalterable](MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md)
3. [TEST363 multiframe diagonal recuperado de TEST342 PASS; pendiente VICE](../TEST/test363-diagonal-multiframe-unlocked/README.md)
4. [TEST362 PASS en VICE y matriz de validación real](PASS_Y_REGRESIONES_2026-11-14.md)
5. [Análisis de 64tass: ASM completo, binarios por banco/frame/grupo y ZIP](PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md)
6. [Limpieza de 39 directorios numéricos, respaldo y recuperación](LIMPIEZA_TESTS_Y_ARCHIVO_2026-11-14.md)
7. [Caso de regresión TEST361/362 y selección de charset en diagonal](../TEST/test361-diagonal-charset/README.md)

## Referencia técnica anterior (conservada)

- [Arquitectura histórica, mapa de memoria y SID](ARQUITECTURA_MOTOR_Y_EXPORT.md) — MASTER 22/10; leer junto a la nueva arquitectura.
- [Auditoría de exportadores, modos y restricciones TEST330](AUDITORIA_MODOS_Y_EXPORT_TEST330_2026-11-05.md).
- [Mapa de funciones y rutas TEST331](MAPA_FEATURES_EXPORT_TEST331_2026-11-05.md).
- [Exportación ECM horizontal TEST326–328](FEATURES_EXPORT_PRG_ECM_TEST326_328.md).
- [Estado previo 04/11 y TEST329](ESTADO_PROYECTO_2026-11-04.md) · [PARED](TEST329_PARED_LEFT_EXPORT.md).
- [Cronología TEST214–228](CRONOLOGIA_TEST214_228.md).
- [Historial unificado de pruebas](HISTORIAL_UNIFICADO_PRUEBAS.md).
- [Antiguas guías para otro chat / MASTER](GUIA_PARA_NUEVO_CHAT_IA.md) y [22 octubre](ESTADO_MASTER_22_OCTUBRE_2026.md).
- [Documentos históricos SID y README de main](historico/).

**Importante:** los documentos anteriores a 14/11 mencionan TEST297/329 como portada y contienen enlaces a laboratorios archivados; son historia, no estado actual. Para recuperar los laboratorios antiguos usar la [rama archivada TEST362](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass).

## Reglas de publicación y PASS

- Ejecutar y publicar solamente desde `gh-pages` en la URL canónica.
- `main` diverge. No fusionar ramas sin revisar.
- No eliminar extensiones activas por sus nombres históricos ni imponer bloqueos artificiales para hacer funcionar un caso.
- Documentar separado: análisis JSON, fuente ASM, PRG generado, prueba real en VICE y PASS dado por el usuario.
