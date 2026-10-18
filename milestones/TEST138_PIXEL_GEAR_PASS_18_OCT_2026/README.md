# MILESTONE LVL-RICO — TEST138 PIXEL GEAR — PASS

**Fecha:** 18 octubre 2026

**ESTADO:** PASS VISUAL CONFIRMADO en VICE por el usuario.

## Lo validado

- Map Scroll UP a **1 tick / 1 pixel por paso** + Animated Char RIGHT a **1 tick** con movimiento diagonal fluido y sin los pasos laterales periodicos vistos en TEST135–137.
- El caracter mantiene su intervalo de ticks configurable, pero el conteo avanza a partir del movimiento fino **real** del mapa; un buffer que espera no hace adelantar solo al caracter.
- El mapa uniforme de **40 x 25**, con codigos y colores constantes en el area de scroll, evita reconstruir un buffer identico cada 8 pixeles. La optimizacion esta restringida a este caso uniforme.
- Se reutilizo el principio del **scheduler/IRQ maestro** documentado en SCUMM-PET-C64. No se copiaron sus binarios ni su layout de RAM al exportador LVLLVL.
- Compilaciones de regresion: **48/48 PASS**. Prueba simulada en el mapa uniforme: 32 ticks finos seguidos sin detenerse. Estos ensayos no sustituyen la validacion en VICE de los demas casos.

## Archivos congelados

- ZIP exacto: `MILESTONE_LVL_RICO_TEST138_PIXEL_GEAR_PASS_18_OCT_2026.zip`
- **SHA-256**: `a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227`
- Ruta Library: `/MILESTONE_LVL_RICO_TEST138_PIXEL_GEAR_PASS_18_OCT_2026.zip`
- Rama de milestone: `milestone/lvl-rico-pixel-gear-test138-pass-18-oct-2026`
- Commit fuente TEST138: `370c92d4921634e4b85be11af2ce1151aa74c8dc`
- HTML exportador: Git blob `8c9bfb3af739d0dfdd309214c7096318d935997f`
- JS exportador: Git blob `f1efaad7bd7a5baadca0af453caa15694ecfd3d1`

## Regla de preservacion

**No modificar este milestone para probar funciones nuevas.** Crear TEST139, TEST140, etc. en ramas independientes. Conservar el **MASTER TEST134** en `main`, hasta que expresamente se decida una promocion global.

El PASS visual se refiere al caso real 1 tick del usuario; para mapas no uniformes y combinaciones mas amplias de velocidades quedan pruebas visuales futuras.

## Antecedentes

- TEST134: MASTER PASS de animacion de caracteres + scroll + colores.
- TEST135–137: mejora progresiva de velocidad, pero aun con interrupciones laterales.
- TEST138: engranaje de avance efectivo + fast path uniforme, **PASS visual**.
- Repositorio de referencia: `serigrafiamdp-web/SCUMM-PET-C64`, milestone `ECM_SINGLE_SCHEDULER_PASS_13_OCT_2026`.
