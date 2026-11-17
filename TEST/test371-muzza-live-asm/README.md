# TEST371 — Muzza's Export Tass 64: fuente ASM del PRG real

**Fecha: 16/11/2026 (Argentina)** · **Estado: experimental, SIN PASS de ejecución en VICE.**

## Implementado
- Nueva opción `Interface → 64tass Export`, debajo de Export C64 (NEW).
- Captura el ASM enviado por el exportador PRG activo al ensamblador de LVLLVL, compara los bytes producidos y genera un ZIP con `main.asm`, datos `*.bin`, `reference.prg`, `manifest.json` y scripts `build.bat` / `build.sh`.
- Se intenta convertir las directivas ACME compatibles con 64tass; se rechazan fuentes faltantes o resultados que no coinciden con el PRG interno.

## Pendiente comprobado

El usuario informó que **una animación exportada desde TASS produce un PRG que vuelve a BASIC**, por lo que **no se considera un exportador 64tass completo**. La correspondencia con el ensamblador interno no garantiza equivalencia con 64tass real.

**Siguiente prueba:** compilar en 64tass real, comparar el binario con `reference.prg`, verificar origen/código de arranque y ejecutar en VICE. Luego evaluar Map Scroll, EBCM, bancos, frames, SID y Group por separado.

El antiguo TEST370 se reemplazó porque el ZIP C64 NEW aportado tenía nueve supuestos módulos `asm/*.asm` que eran páginas HTML 404.

[Investigación](../../docs/TEST370_INVESTIGACION_MUZZA_EXPORT_TASS64_2026-11-16.md) · [Progreso del día](../../docs/PROGRESO_2026-11-16.md)
