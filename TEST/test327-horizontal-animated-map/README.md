# TEST327 — Map Scroll horizontal hasta 100 columnas + Character Scroll simultáneo

**TEST327 aislado sigue sin PASS propio.** La integración corregida en TEST328 obtuvo **PASS usuario 04/11** para MEGASOFT 100×25 con ECM, pero el archivo no incluye Group Scroll real; esa triple combinación sigue pendiente. [Registro TEST328](../test328-ecm-preserve-4-backgrounds/PASS_04_NOV_2026.md). Se publica en una ruta aislada basada en TEST326. El editor principal TEST297, la fuente original de TEST168, sus PRG y todos los JSON permanecen intactos.

## Problema identificado en MEGASOFT 100 filas.json
- El archivo real tiene **100 columnas × 25 filas**, 1 frame, modo **Text/HiRes**, Map Scroll **Left**, 1 px / 2 ticks, Rico's Window **40×25**, Scroll Area **100×25**.
- Hay **8 caracteres con scroll individual Left**, 8 fases, cada 16 ticks; están en BANK1.
- No hay **Group Scroll configurado** en ese JSON. Para verificar simultaneidad de los tres motores hay que configurar y probar un grupo adicional en la UI.

## Cambios
1. Se parte del TEST326: Screen/Scroll Area horizontal de hasta **245 columnas** por memoria para 1 frame (100 cabe). El límite multiframe compacto sigue 102 columnas, pero no se promociona a compatibilidad de animaciones multiframe.
2. TEST327 retira exclusivamente el bloqueo antiguo `TEST186: animaciones individuales detectadas` de su **copia aislada** del motor horizontal.
3. Reutiliza **la rutina nativa de scroll individual TEST175/176** del motor vertical (Left, Right, Up, Down y Blink) y comparte la IRQ PAL. El IRQ **prepara las tareas** y el lazo principal realiza un carácter por iteración, después de dar prioridad al mapa y a Group Scroll. Bancos 1 y 2 con punteros $3000/$3800.
4. Conserva el Group Scroll original TEST182/183 a través del scheduler del motor horizontal. **Mapa + scroll individual + Group Scroll** se planifican en el mismo PRG para códigos diferentes.
5. Si el mismo código de un mismo banco pertenece simultáneamente a Group Scroll e individual, se detiene la exportación con explicación: ambos escriben los mismos 8 bytes y hace falta un compositor, no sirve quitar el guard.
6. Una combinación de **varios frames + animación individual** también se rechaza expresamente: el motor TEST205/206 no tiene aún un planificador de animación entre frames; no se eliminan ni desactivan efectos en el PRG.
7. La ruta con mapa/grupo sin scroll individual deja intacto su código ASM de TEST326. Se muestra una alerta **solo ante errores reales**, no se restauran carteles informativos.

## Protocolo
1. Abrir <https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test327-horizontal-animated-map/> y actualizar con Ctrl+F5.
2. Importar **MEGASOFT 100 filas.json** directamente, sin modificarlo. La Window y Scroll Area están correctamente dimensionadas para esta prueba.
3. Exportar PRG normal y abrirlo con **VICE PAL**. Verificar scroll del mapa en las 100 columnas y desplazamiento individual de los 8 caracteres.
4. Agregar un Group Scroll de caracteres **distintos** de los 8 individuales, volver a exportar; probar que los tres efectos sigan activos.
5. Si falla, revisar mensaje de alerta y, en la consola, `window.RICO_TEST327_HORIZONTAL.last`, `window.RICO_TEST327_HORIZONTAL.error`, `window.RICO_TEST327_HORIZONTAL.builds` y `window.RICO_TEST326_HORIZONTAL_LAST_ERROR`.

## Pendientes
- No se ha verificado el ensamblado real ni VICE con los efectos simultáneos.
- Rendimiento raster e intercalado de animaciones a alta densidad requiere pruebas sobre hardware o VICE.
- Superposición de Group Scroll e individual en los mismos caracteres necesita composición real.
- Multiframe con caracteres individuales requiere nueva planificación.
