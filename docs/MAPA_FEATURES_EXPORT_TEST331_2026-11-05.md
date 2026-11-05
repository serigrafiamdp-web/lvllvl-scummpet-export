# Mapa de capacidades y exportadores LVLLVL RICO — TEST331
**Fecha:** 05/11/2026 · **Estado:** auditoría técnica + generación de ASM sintética. **No hay PASS de VICE para TEST331**.

## Propósito
Corregir las restricciones heredadas de los tests sin confundirlas con límites reales de C64. El editor usa una cadena de envoltorios de `ToPRGAdv.prototype.createPRG`; el orden de scripts determina qué motor procesa cada proyecto. TEST331 comparte el mismo **asignador físico de 64 glifos ECM** entre cuatro exportadores distintos. No modifica el JSON original ni los 256 tiles que se muestran en el editor.

## Núcleo ECM común

`TEST/test331-ecm-map-only-glyphs/js/RICO_ECM_64_ALLOCATOR_TEST331.js`

- Cuenta únicamente **códigos pintados en el mapa que se exportará**, no los 256 índices disponibles en la paleta ni todo el catálogo del Group.
- Fusiona *dibujos realmente idénticos* si coinciden los 8 bytes **en ambos bancos**; los códigos de pantalla pueden seguir teniendo distintos colores de primer plano.
- Conserva índices físicos independientes para **destinos grupales visibles** y **caracteres con movimiento individual visible**, aunque su dibujo inicial sea idéntico.
- Un carácter del grupo que es **fuente de Ondas/Scroll pero no aparece en el mapa** conserva sus bytes de origen; su escritura de destino va a RAM de CPU `$E000`, no a los 64 glifos visibles de VIC-II.
- Copia los patrones seleccionados a `0–63`, traduce los códigos de pantalla a `(fondo<<6)|glifo`, mantiene `$D011` en ECM y escribe `$D021–$D024`.
- Solo falla por una razón técnica verificable: por ejemplo, **más de 64 glifos físicos realmente necesarios** incluso después de compactar, o más de **cuatro fondos efectivos**. Para más de 64 en todo el mapa con ventanas que usan menos, se necesitará un cargador dinámico de glyphs por cámara; ese motor **todavía no existe**.

## Rutas de ejecución y conexión a scripts

| Modo seleccionado | Exportador y conexión en TEST331 | Integración nueva | Comprobado | Límite pendiente |
| --- | --- | --- | --- | --- |
| Map Scroll **Left / Right**, 1 frame | `RICO_PRG_HORIZ_WIDE_TEST330.js` + `RICO_HORIZ_CHAR_SCHEDULER_TEST327.js` + `RICO_ECM_EXPORT_REPACK_TEST331.js` | ECM 64 glifos del **Scroll Area completo**, Ondas/Group e individuales | ASM sintético 100 y 120×25, 256 índices → 19 glifos; Group 256 fuentes → 4 destinos visibles | >245 columnas de buffer; multiframe y múltiples grupos |
| **Group-only** Ondas, circular y Ping Pong | `RICO_GROUP_STANDALONE_TEST331.js` | Repack sobre ventana 40×25; fuentes de Group fuera del mapa no usan glifos físicos | ASM sintético con grupo de 256 fuentes y solo 4 códigos visibles; cuatro fondos ECM | Ping Pong **atómico** + Individual requiere sincronizar animación con flip de bancos |
| **Group-only + Individual** en glifos distintos | `RICO_GROUP_STANDALONE_TEST331.js` + kernel nativo TEST175 | Los dos efectos comparten IRQ; el grupo tiene prioridad y el individual avanza desde main loop | ASM sintético Ondas + Individual en Text y ECM | Un mismo glyph con dos escritores requiere compositor |
| Map Scroll **Up / Down**, 40×N | `RICO_PRG_LARGE_MAP_UNLOCK_TEST168.js` + `RICO_ECM_VERTICAL_TEST331.js` | ECM en Fine Scroll vertical, 4 fondos, mapa completo, grupos e individuales | ASM sintético 40×120 Up y Down, 256 índices → 9/25 glifos | Ventanas y multiframe fuera de esa ruta; Ondas vertical utiliza normalización antigua a Ping Pong |
| Map Scroll **diagonal (cuatro sentidos)** | `RICO_PRG_DIAGONAL_TEST196.js` + `RICO_ECM_DIAGONAL_TEST331.js` | ECM y fondo en Fine Scroll diagonal; Group e individual; reconoce duplicación interna de filas | ASM sintético 60×32 Up-Left y Down-Right, 256 índices → 25 glifos | Multiframe, sincronización Ondas original en la ruta diagonal y performance |
| **Horizontal multiframe** | `RICO_PRG_HORIZ_MULTIFRAME_TEST205.js` + `RICO_PRG_HORIZ_COMPACT_TEST326.js` | Sin conexión ECM nueva todavía | Generador histórico de texto | Buffer de 5.120 B por frame, 102 columnas calculadas; ECM y caracteres individuales multiframe sin port |
| **Switch Bank** con Map / Group | Varias rutinas históricas TEST168/186/196 | No está unificado con todos los scrolls | Solo los casos anteriores registrados | Requiere coordinación real de $D018 y buffers, no eliminar guard |
| **Bitmap Multicolor** | `RICO_BITMAP_MC_DISTRIBUTED_TEST297.js` y pipeline Bitmap | Intacto; no usa 64 glifos ECM | PASS histórico TEST297 Bitmap | No confundir Bitmap MC con modo ECM |
| **Manual Scroll / WASD** | TEST304–321 aislados | No promovidos a la portada | Pendiente | Integrar controles sin perder los motores PRG |
| **SID** | TEST207 y exportadores relacionados | No modificado | PASS históricos parciales | Comprobar colisiones reales de RAM y velocidad por combinación |

## Pruebas programáticas realizadas para TEST331

| Caso | Resultado |
| --- | --- |
| 256 códigos del mapa con un único dibujo estático | Asignador: **1 glifo** físico |
| 256 códigos del mapa, grupo 16 glifos animados y dos individuales | Asignador: **19 glifos** físicos |
| Group de 256 caracteres **fuente** y mapa de cuatro códigos | Compilación ASM de Group-only y horizontal: **4 glifos**, 252 fuentes sin destino visible |
| Horizontal 120×25 + ECM + Ondas + individual | Generación ASM con bit ECM, cuatro registros BG y ambos schedulers |
| Vertical Up/Down 40×120 + ECM | Generación ASM; 256 índices compuestos en 9/25 glifos |
| Diagonal Up-Left y Down-Right 60×32 + ECM | Generación ASM; Group e individual presentes |
| Group-only Ondas + Individual, Text y ECM | Generación ASM con kernel TEST175 y scheduler grupal |
| Ping Pong atómico + Individual | Error explícito; configuración conservada; **pendiente sincronización entre bancos** |
| 256 dibujos realmente distintos en un mismo charset | Error correcto por límite hardware; sin modificación del mapa |

**Todo esto son pruebas de JavaScript/generación de ASM con ensamblador simulado**. No valida resolución de etiquetas, tamaño real de código 6502 ni ejecución/velocidad PAL en VICE.

## Verificación adicional del botón Export PRG (05/11)

Se ejecutó la cadena de envoltorios de `ToPRGAdv.prototype.createPRG` con el mismo editor sintético y **ECM + Ondas + dos animaciones individuales** para comprobar que el asignador compartido llega a la ruta realmente seleccionada:

| Motor | Screen | ASM generado | Registros de fondo ECM | Grupo + Individual | Glifos |
| --- | --- | --- | --- | --- | --- |
| Horizontal Left | 120×25 | Sí | $D021–$D024 | Sí | 22 |
| Vertical Up | 40×60 | Sí | $D021–$D024 | Sí | 22 |
| Diagonal Up-Left | 60×30 | Sí | $D021–$D024 | Sí | 22 |
| Group-only Ondas | 40×25 | Sí | $D021–$D024 | Sí | 22 |

**Limitación:** se usó un ensamblador simulado; no se ejecutó un binario 6502 en VICE. No etiquetar estas rutas como PASS funcional hasta la prueba del usuario.

**Arreglo de diagnóstico:** TEST331 diagonal ahora conserva la causa técnica en `window.RICO_TEST331_ECM_DIAGONAL.error` y la entrega al monitor de Export PRG. Switch Bank diagonal no integrado, varios grupos y efectos grupales desconocidos se rechazan explícitamente; antes podían omitirse por el recopilador TEST196.

## TEST332 — Mapa de 120×120 sin techos distintos de prueba

[**Editor TEST332 experimental**](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test332-unified-120x120/) · [Diseño técnico, límites reales y pruebas](../TEST/test332-unified-120x120/README.md).

El **Screen editable 120×120** es la meta común. La **Window C64 sigue siendo 40×25** por hardware. La ruta horizontal recorre la franja 120×25 elegida por Window Y; la vertical recorre 40×120 desde Window X. La diagonal necesita las dos dimensiones completas y superaba los 12 KiB anteriores.

**Nuevo motor diagonal aislado:** map 120×120 = 14.400 bytes en $4000–$7FFF y 16 colores de primer plano empaquetados en 7.200 bytes a $8000–$9FFF. Un lector en 6502 desempaqueta un nibble por celda. Admite ancho impar y conserva el asignador ECM de TEST331, Group/Ondas e Individual en glifos distintos. El límite de 64 patrones físicos ECM sigue siendo hardware y hay que implementar streaming por cámara para excederlo.

**Validación:** generación ASM sintética de 4 diagonales 120×120, 119×120, 120×119; regresión 60×30 con Window válida en Up-Left y Down-Right pasó sin activar el motor compacto. **No hay PASS de compilación 6502/VICE**, y ECM multiframe, multigrupo y compositor de glyph solapado siguen pendientes. No se agregaron advertencias de tamaño al editar.

## Puntos desconectados y trabajos pendientes

1. **Límite real ECM 64 simultáneos:** si existen 65 patrones distintos repartidos a lo largo de un mapa grande, implementar un compositor de charset **por ventana/posición de cámara** para superar el límite global sin cambiar el modo C64.
2. **Multiframe**: combinar el asignador ECM con el motor de frames TEST205/206 y las animaciones individuales durante cambios de frame.
3. **Múltiples grupos y destinos solapados**: scheduler multi-grupo y compositor por glyph, con orden de escrituras explícito. Conservar siempre el JSON.
4. **Ondas original en vertical y diagonal**: algunas rutas todavía normalizan `ondas-*` a `pingpong-*`. Restaurar la actualización progresiva usando las fuentes originales.
5. **Ping Pong atómico + Individual**: sincronizar los cambios de banco para que las animaciones individuales sigan visibles.
6. **Conversión ECM dentro del editor**: las herramientas TEST01/04/06 alteran propiedades y pueden borrar animaciones o reemplazar tiles. Diseñar un procedimiento transaccional, reversible y con deshacer. Por ahora usar el repack no destructivo **solo al exportar**.
7. **Compilación 6502 + VICE PAL**: comprobar los binarios reales en cada modo, 1–8 píxeles/tick, Color RAM, BANK2, 4 fondos y casos de grupos grandes.

## Política de versiones / seguridad

- **TEST331 (pruebas nuevas):** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test331-ecm-map-only-glyphs/
- **TEST330 (Ondas/UI independiente):** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test330-effects-recovery/
- **TEST328 (PASS confirmado del usuario):** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test328-ecm-preserve-4-backgrounds/
- **Principal TEST329**: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- Respaldo previo a TEST331: `backup/gh-pages-before-test331-map-only-ecm-2026-11-05`.

El árbol `gh-pages` solo agrega una página y módulos aislados para TEST331. **No promover a raíz ni declarar PASS de VICE sin una prueba del usuario**.
