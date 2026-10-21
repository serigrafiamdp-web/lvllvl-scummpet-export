# Rico's LVLLVL — Efecto «Ondas»

**Fecha del registro:** 21 de octubre de 2026  
**Estado:** descubrimiento visual / estudio preliminar, **NO implementado como efecto seleccionable**  
**Motor de referencia:** TEST183 → TEST184 (2 px) → TEST185 (4 px).  
**Proyecto de referencia:** TERRY; Screen 45×32, Window 40×25 (X=2), Map Scroll vertical, animaciones de grupo horizontales.  
**Estabilidad:** TEST181 es PASS del Map Scroll vertical. TEST183/184/185 son experimentales en la convivencia de efectos. Mantener intacto el MASTER del 20 de octubre.

## 1. Hallazgo y nombre provisorio

Se propone documentar un efecto nuevo llamado **«Ondas»**. Se observa una **deformación u ondulación progresiva** del dibujo, en vez de que todo el grupo de caracteres se desplace horizontalmente como una lámina uniforme. El mapa se mueve verticalmente a la vez.

### Combinación que lo produce

- **Map Scroll:** movimiento **vertical**, Up o Down.
- **Group Animate / Group Scroll:** movimiento **horizontal**, Left o Right, sobre los píxeles del charset.
- Ambas animaciones tienen contadores independientes. La combinación cruza dos ejes: se desplaza el mapa y, simultáneamente, cambian los caracteres que forman su imagen.

**Precisiones sobre la evidencia:** la observación audiovisual original corresponde al escenario **Map Up + Group Left** con TERRY. La generalización a Map Down y Group Right es una **hipótesis de comportamiento**, no una validación visual de las cuatro combinaciones.

## 2. Comparación observada

| Etapa | Paso solicitado de Group Scroll horizontal | Observación |
|---|---:|---|
| TEST183 | 1 píxel por tick | Movimiento lateral muy lento; ondas / desfasaje visibles. |
| TEST184 | 2 píxeles por tick | Sigue pareciendo lento; deformación progresiva observada en el video `2026-10-21 00-36-59.mkv`. |
| TEST185 | 4 píxeles por tick | **La persona usuaria confirmó que el efecto «Ondas» se intensifica.** |

**Hallazgo registrado:** al aumentar el paso solicitado de 2 a 4 píxeles por tick, la ondulación visual se vuelve más notoria en esta configuración. Esto **no demuestra** una relación universal ni una velocidad efectiva fija.

## 3. Explicación técnica provisional

En TEST183–185, el motor del Group Scroll horizontal prepara una fase de desplazamiento de píxeles y **reescribe el charset de forma incremental, un carácter por iteración del bucle principal**. En paralelo, el motor **prioriza preparar las nuevas posiciones del Map Scroll vertical**.

Como la actualización del grupo no es atómica, durante un intervalo algunos glifos ya muestran una fase nueva mientras sus vecinos todavía muestran la anterior. El ojo percibe ese desfasaje como **ondas, torsión o barrido progresivo** sobre la imagen que asciende o desciende. Un paso solicitado mayor puede hacer que el contraste entre fases sea más visible.

**No confundir los conceptos:**

- **Paso solicitado de fase (1, 2 o 4 px/tick):** parámetro en el código generado.
- **Velocidad real del grupo completo:** depende de cuánto tarde el bucle en actualizar todos los caracteres, del tamaño del grupo y de la carga del Map Scroll. **Aún no está medida.**
- **Efecto «Ondas»:** apariencia transitoria vinculada al desfase entre glifos; actualmente surge como efecto secundario del procesamiento progresivo, **no como función deliberada ni estable**.

Una tick PAL nominal equivale a unos 20 ms (50 Hz). Las cifras teóricas de 50/100/200 px/s **no son mediciones** de velocidad efectiva en VICE.

## 4. Decisiones que se dejan abiertas deliberadamente

**No definir todavía:** nombre final en la UI; si «Ondas» será un tipo nuevo de Group Animate o un efecto combinado de Map Scroll; direcciones admitidas; intensidad; velocidad mínima o máxima; patrón de propagación; comportamiento con Switch Bank/animaciones individuales; exclusión o superposición sobre grupos; ni persistencia en el formato JSON.

Un diseño posterior **no debería depender de fluctuaciones accidentales de CPU**: si se convierte en opción oficial, la propagación/desfase tendría que calcularse de manera controlada, reproducible y configurable, sin comprometer el scroll vertical del mapa.

## 5. Validaciones pendientes

- Reproducir y filmar los cuatro pares de direcciones: **Up+Left, Up+Right, Down+Left, Down+Right**.
- Comparar **1, 2 y 4 px/tick**, manteniendo idénticos mapa, grupo, ticks y emulador; medir el avance visual efectivo por segundo.
- Verificar si la intensidad depende del **número de caracteres del grupo**, de su disposición (ancho/alto), de la carga del mapa o de los efectos de BANK1/BANK2 y Switch Bank.
- Verificar ausencia de detenciones de Map Scroll, defectos de color y **ghost bytes** en VICE PAL durante reproducciones prolongadas.
- Definir **dos comportamientos distintos**: Group Scroll horizontal uniforme/correcto y Ondas controladas. Un defecto del primero no debe quedar implícitamente convertido en su implementación final.

## 6. Evidencia y trazabilidad

- Video estudiado: `2026-10-21 00-36-59.mkv` (TEST184; referencia privada; no subir automáticamente a un repositorio público).
- Imágenes de análisis previas: `ondas_analysis/contact.jpg`, `ondas_analysis/sequence.jpg`.
- ZIPs de prueba conservados: `LVLLVL_TEST184_GROUP_HORIZONTAL_2PX_MAP_SCROLL_WEB_LOCAL.zip` y `LVLLVL_TEST185_GROUP_HORIZONTAL_4PX_MAP_SCROLL_WEB_LOCAL.zip`.
- Confirmación del usuario en la sesión del **21 de octubre de 2026**: «se intensifica» con 4 píxeles y solicita archivar el efecto **antes de decidir su funcionamiento**.

**Este registro es documentación del hallazgo.** No introduce código, comandos, nuevos ajustes UI ni modifica ningún PRG existente.
