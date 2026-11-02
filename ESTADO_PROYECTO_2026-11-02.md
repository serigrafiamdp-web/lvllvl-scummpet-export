# Estado del proyecto LVLLVL RICO / SCUMM PET — 2 de noviembre de 2026

> Documento de navegación, **no es una fusión de código ni un nuevo MASTER**. Actualizado tras revisar las ramas, los checkpoints, README y los commits de GitHub.
>
> **Publicación 2/11:** la URL principal ahora abre el editor TEST297; el anterior TEST232 está en `backup/gh-pages-before-test297-2026-11-02`. La publicación no constituye un PASS adicional.

## Qué versión usar

| Propósito | Referencia | Validación |
| --- | --- | --- |
| **Último PASS VICE registrado expresamente en GitHub** | **TEST297**, `release/test297-pass-2026-10-24` | El commit `dbf599c68` documenta PASS informado para optimización Bitmap Multicolor con distributed speedcode el 24/10. No implica compatibilidad universal de todos los movimientos. |
| **MASTER congelado de Multicolor** | `MASTER_LVLLVL_RICO_24_OCTUBRE_2026` / TEST264 | PASS en VICE de PRG Multicolor simple, **1 frame, sin Map Scroll ni SID**. |
| **MASTER congelado del scroll diagonal** | `MASTER_LVLLVL_RICO_23_OCTUBRE_2026` / TEST254 | Motor multicolor de caracteres rápido, ~47,2 avances/s reportados en pruebas, con foco en integridad visual. |
| **Último PASS provisional en la serie de ASM diagonal discutida** | `release/test257-vic-fine-register-stability` / TEST257 | Usuario lo dio por PASS provisional; no es parte automática del MASTER TEST264. |
| **Última integración de Map + Group + Individual** | `release/test260-diagonal-map-group-individual` / TEST260 | **Experimental**: generación ASM y regresiones sintéticas; **sin PASS en VICE** de coexistencia. |
| **Prototipo más avanzado de la familia Bitmap/WASD con rama de trabajo** | `release/test321-native-vic-40x50-vertical-wasd` / TEST321 | **Experimental**: ruta vertical grande 40×N; no es un MASTER consolidado. |
| **Últimos cambios publicados en la página experimental TEST304** | `gh-pages/TEST/test304-bgfont-wasd-hardscroll` | Commits etiquetados hasta TEST325 (26/10) modifican esta ruta experimental; no se crea automáticamente carpeta TEST325 ni se declara PASS en VICE. |

## Estado de GitHub y GitHub Pages

- `main` es la línea **legada divergente**: su README se mantiene como punto de entrada, pero **no** se fusiona con `gh-pages` ni con los MASTER.
- `gh-pages` aloja la web. **El 2/11/2026 la raíz fue actualizada intencionalmente a TEST297**, a partir del mismo `index.html` de la rama `release/test297-pass-2026-10-24`, sin el `<base href="../../">` que requiere la página anidada. **TEST232 fue respaldado** en `backup/gh-pages-before-test297-2026-11-02`. TEST321, TEST325 y otros prototipos no se integraron.
- Los editor(es) independientes de prueba siguen accesibles en `/TEST/...`.
- **Página de estado actual (sin modificar motores):** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/ESTADO/

## Enlaces seguros

- Repositorio: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export
- Web principal (editor raíz legacy): https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/
- **TEST297 PASS VICE:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test297-bitmap-distributed-speedcode/
- Rama PASS TEST297: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test297-pass-2026-10-24
- **TEST257 PASS provisional:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test257/
- **TEST264 PASS multicolor básico:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test264-native-multicolor-export/
- **TEST260 integración pendiente:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test260/
- **TEST304 experimental:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test304-bgfont-wasd-hardscroll/
- MASTER 24/10: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_24_OCTUBRE_2026
- MASTER 23/10: https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/MASTER_LVLLVL_RICO_23_OCTUBRE_2026

## Trabajo pendiente — siguiente prueba útil

**TEST260: Map Scroll + Group Animate + animación individual de caracteres.** El diagnóstico en el código encontró que el exportador diagonal recogía Group Animate pero no los efectos de `tile.props.animated`; el horizontal ancho rechazaba explícitamente individuales, y el vertical daba prioridad permanente al grupo. La rama TEST260 integró detección y planificación compartida de los tres motores. Falta ejecutar PRG reales en VICE, comprobar que las tres animaciones coexisten y leer `m cfe0 cfe4` (firma 60/01, contadores de IRQ/animación individual/grupo) cuando hay individuos en diagonal u horizontal. No promover hasta PASS.

**Bitmap Multicolor / WASD / mapa grande:** las pruebas posteriores a TEST297 son experimentos independientes o variantes. No afirmar que el último prototipo está integrado con la ruta de TEST260 ni con el MASTER24. Seguir matriz de regresión y probar color RAM, glyphs Bank1/2, scroll, SID y frames de forma independiente.

## Política de seguridad para futuras actualizaciones

1. **PASS** solo si lo confirmó el usuario sobre PRG real en VICE para una configuración explícita (o está registrado inequívocamente así en GitHub).
2. **PASS provisional** se conserva en su rama; no equivale a MASTER ni certifica otras rutas.
3. **Prueba estática / compilación** no equivale a comportamiento correcto en C64.
4. Nunca hacer merge ciego de `main` y `gh-pages`: historias divergentes.
5. No sobrescribir `MASTER_LVLLVL_RICO_23_OCTUBRE_2026`, `MASTER_LVLLVL_RICO_24_OCTUBRE_2026`, ni el editor raíz con pruebas no confirmadas.
