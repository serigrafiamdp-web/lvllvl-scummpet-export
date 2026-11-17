# TEST370 — Primer prototipo Muzza 64tass y diagnóstico de fuentes

**Fecha: 16/11/2026 (Argentina)** · **Estado: histórico, reemplazado por TEST371.**

- Agregó la opción `Interface → Muzza`s Export Tass 64` y un botón de ZIP TASS.
- Probó conversiones de `!source`, `!binary`, `!byte`, `!word` a directivas 64tass y validó referencias.
- Con el ZIP real de Export C64 NEW, identificó **nueve módulos ASM que eran páginas HTML 404 de 9.379 bytes**. Rechazó el ZIP incompleto en vez de inventar código.
- La vía se sustituyó por TEST371, que captura el ASM del motor PRG activo. **TEST371 sigue experimental** y tiene un caso con PRG que vuelve a BASIC; sin PASS universal.

[TEST371 actual](../test371-muzza-live-asm/README.md) · [Auditoría de fuentes](../../docs/TEST370_INVESTIGACION_MUZZA_EXPORT_TASS64_2026-11-16.md)
