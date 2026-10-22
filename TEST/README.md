# TEST — Laboratorios aislados

El MASTER del 22/10/2026 agrupó las carpetas `test150` a `test165` aquí. Se preservaron **34 archivos** (cada `index.html` y sus scripts de prueba), sin alterar los JS originales. Los 16 HTML recibieron `<base href="../../">` y las referencias cruzadas ahora apuntan a `TEST/testN/`.

## Abrir las pruebas

- Web de pruebas: `https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test150/` hasta `/TEST/test165/`.
- Abrir siempre desde servidor web; la carga de módulos depende de `js/`, `css/`, `c64/` en la raíz del proyecto.
- No se mantienen los URLs antiguos `/test150/` como ruta canónica para evitar volver a llenar raíz.
- Backup previo: rama `backup/PRE_MASTER_22_OCTUBRE_2026_TEST228_PASS` conserva rutas originales si alguna prueba debe reproducirse idéntica.

Estos laboratorios **no equivalen al código actual del MASTER** ni deben usarse para exportar por defecto. La app principal sigue en `../index.html` y el estado actual está en [docs/ESTADO_MASTER_22_OCTUBRE_2026.md](../docs/ESTADO_MASTER_22_OCTUBRE_2026.md).

Las nuevas pruebas deben quedar en ramas `test/...` o dentro de `TEST/`; no crear más carpetas sueltas de tests en la raíz.
