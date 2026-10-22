# TEST235 — Scroll diagonal: preparación incremental y Color RAM dispersa (ZIP local)

**Estado:** EXPERIMENTAL. Pendiente de prueba en VICE. **NO es PASS.**  
**Fecha:** 22 de octubre de 2026.  
**Base exacta:** `CHECKPOINT_TEST232_FINE_COLOR_PASS_22_OCT_2026` (`fa8b53feeeef8daba4713d3f6d38974ba613bb64`).  
**Distribución:** solamente rama ZIP descargable, **sin actualizar GitHub Pages ni el MASTER**.

## Objetivo
Probar mejor velocidad del desplazamiento diagonal Up/Left, Up/Right, Down/Left y Down/Right a 1–8 píxeles/tick, después de los **FAIL** de TEST233 y TEST234. Los videos de comparación sugirieron cadencia diagonal inferior a la vertical en el mismo proyecto.

## Cambio exacto
Se carga `js/RICO_PRG_DIAGONAL_COLOR_PREP_TEST235.js` inmediatamente después del módulo diagonal original TEST196/221 y antes del adaptador SID.

En las diagonales con `fastRows`, varios colores y sin grupo animado:
- Prepara la sombra de Color RAM `$0C00–$0FE7` en el **main loop**, copiando en la dirección correcta el shadow anterior y leyendo del mapa **solo una fila y una columna entrantes**.
- Sigue ejecutando `prepare_sparse_colors203` en el main loop.
- El IRQ sigue llamando a **`commit_sparse_colors203`**, la rutina ya conocida de escrituras parciales de color. Si antes se seleccionaba RLE TEST221B, se reemplaza su callback por la misma rutina de escrituras parciales.
- No se ejecuta el `commit_colors199` de 1000 celdas dentro del IRQ (causa sospechada del FAIL visual de TEST234).
- `plan_step`, doble buffer de caracteres, `fine_x/fine_y`, `Pixels/Step`, `Ticks/Step`, modo de pantalla y reproductor SID no se modifican.
- Los escenarios no compatibles continúan usando el mismo ASM de TEST232, byte por byte.

## Estado observable
Después de exportar, inspeccionar en consola:
`window.RICO_TEST235_LAST_BUILD` debe indicar `selected: true`,
`colorPrepare: incremental off-IRQ shadow shift + sparse scan`,
`irqCommit: unchanged TEST203 sparse`.

## Verificación previa a VICE
- **768 combinaciones** de generación (4 diagonales × 8 velocidades × 4 tamaños de mapa × 6 patrones): 640 eligieron TEST235, 128 generaron **ASM idéntico a TEST232**.
- **2.048 transiciones** simuladas de los 1000 colores visibles con 4 diagonales, 4 velocidades y 4 patrones: todas coincidieron celda por celda.
- **192 integraciones** de fuente ASM con PSID sintéticos de 4096/6144/8192 bytes: módulos SID incorporados correctamente.
- Se conservan intactos JS de TEST232 vertical, TEST220 horizontal y adaptador SID TEST229.
- **Todavía no se probó ejecución real ni velocidad en VICE.**

## Cómo probar
1. Descargar ZIP `TEST235`, extraer una sola carpeta; abrir su `START_LVLLVL_TEST01.bat` **sin cambiar perfil de Edge**.
2. Reutilizar exactamente el diseño y configuración usados en las capturas diagonal y Up; exportar diagonal **8 Pixel/Step y 1 Tick/Step**.
3. Confirmar en consola `RICO_TEST235_LAST_BUILD.selected === true`.
4. Observar en VICE colores, flicker, diagonales y cadencia. Si hay glitch, declarar FAIL, regresar a TEST232 PASS y conservar PRG/captura.
5. Solo después comparar el resto de direcciones/velocidades.

**Rollback web estable:** `https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/?v=test232-restaurado`. TEST235 deliberadamente no se publica en la web.
