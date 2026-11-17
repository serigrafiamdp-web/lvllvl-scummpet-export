# Documentación técnica de LVLLVL RICO

**Actualizada: 17/11/2026 (Argentina)** · [README principal con nuevas features RICO](../README.md) · [Editor público](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)

## Novedades y progreso

- [**Inventario actualizado de funciones RICO (17/11)**](FEATURES_RICO_2026-11-17.md): qué existe en la interfaz, qué tiene PASS y qué sigue experimental.
- [**Progreso del 16/11 — TEST364–372**](PROGRESO_2026-11-16.md): estados de PASS, fuentes y exportaciones pendientes.
- [**TEST372 — restauración EBCM PRG**](../TEST/test372-restore-ebcm-export/README.md): **PASS del usuario**. Los wrappers 104/264 dejaban de respetar Extended.
- [**TEST371 — Muzza 64tass**](../TEST/test371-muzza-live-asm/README.md): ZIP experimental con ASM capturado del PRG; todavía falta un PRG reconstruido que funcione en VICE.
- [**TEST370 — fuentes ASM ausentes**](../TEST/test370-muzza-tass64/README.md): nueve módulos del ZIP C64 NEW eran HTML 404.
- [**TEST369 — parpadeo del área de trabajo**](../TEST/test369-startup-workspace-flicker/README.md): PASS.
- [**TEST366 — paletas exclusivas C64**](../TEST/test366-c64-only-palettes/README.md): PASS.

## Arquitectura para programadores

1. [Mapa de Map Scroll, Group Animate, bancos y recursos RAM](ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md).
2. [Manifiesto y orden de scripts del 14/11](MANIFIESTO_SCRIPTS_ACTIVOS_2026-11-14.md) — **instantánea histórica**; actualizar la comparación con `gh-pages/index.html`.
3. [Registro de PASS y regresiones hasta TEST362](PASS_Y_REGRESIONES_2026-11-14.md).
4. [Plan para ASM completo, binarios y ZIP 64tass](PLAN_EXPORTACION_COMPLETA_64TASS_ASM_BIN_2026-11-14.md).
5. [Análisis de fuentes C64 NEW y TEST370](TEST370_INVESTIGACION_MUZZA_EXPORT_TASS64_2026-11-16.md).
6. [Auditoría TEST330](AUDITORIA_MODOS_Y_EXPORT_TEST330_2026-11-05.md) · [Mapa de rutas TEST331](MAPA_FEATURES_EXPORT_TEST331_2026-11-05.md).
7. [Limpieza y recuperación histórica](LIMPIEZA_TESTS_Y_ARCHIVO_2026-11-14.md).

## Documentos históricos conservados

[Arquitectura anterior y SID](ARQUITECTURA_MOTOR_Y_EXPORT.md) · [EBCM horizontal TEST326–328](FEATURES_EXPORT_PRG_ECM_TEST326_328.md) · [Cronología TEST214–228](CRONOLOGIA_TEST214_228.md) · [Historial unificado](HISTORIAL_UNIFICADO_PRUEBAS.md) · [Estado 04/11](ESTADO_PROYECTO_2026-11-04.md) · [MASTER 22/10](ESTADO_MASTER_22_OCTUBRE_2026.md) · [Cierre anterior TEST369](CIERRE_TEST369_PASS_2026-11-16.md).

Las fechas 04/11 y 14/11 de archivos históricos **son correctas para esos registros**. Lo que se corrigió es la **fecha del estado actual de los índices**, ahora 16/11.

**Reglas:** desarrollar en `gh-pages`, mantener orden de wrappers, no agregar restricciones globales, separar PASS del usuario, test JS, ensamblado y VICE. No publicar proyectos privados de prueba sin permiso.

[Volver a nuevas features](../README.md) · [Índice de TEST](../TEST/README.md)
