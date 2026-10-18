# MASTER LVL-RICO — TEST138 / SCUMM PIXEL GEAR — PASS

**Fecha:** 18 de octubre de 2026  
**Estado:** MASTER promovido tras PASS visual confirmado por usuario en VICE.  
**Repositorio:** https://github.com/serigrafiamdp-web/lvllvl-scummpet-export

## Avances validados

1. **Engranaje de sincronización SCUMM-inspired:** Animated Chars conserva el intervalo de ticks configurado en LVLLVL, pero cuenta sus ticks cuando el Map Scroll registra realmente un paso de píxel fino. Evita movimientos exclusivos de un eje por esperas de preparación del mapa.
2. **Scroll combinado a 1 tick:** El usuario confirmó PASS visual con Map Scroll UP 1 tick / 1 px por paso y Animated Char RIGHT 1 tick. Desaparece el desplazamiento lateral intermitente: movimiento diagonal fluido.
3. **Geometría de pantalla — NUEVO PASS confirmado:** Scroll horizontal perfecto utilizando **las 40 columnas de ancho**; scroll vertical perfecto utilizando **24 de las 25 filas**. **Una fila no integra el área de scroll vertical perfecto**. El usuario afirma que desaparecieron las filas problemáticas de las versiones anteriores. No se ha establecido qué ubicación ocupa esa fila ni que el comportamiento se extienda sin pruebas a todos los modos de scroll o mapas no uniformes.
4. **Optimización de pantalla uniforme:** Para scroll area de 40x25 con todas las celdas de igual código y color, el motor evita reconstruir pantallas idénticas cada 8 píxeles. Esta ruta especial contribuye a preservar la continuidad.
5. **Compatibilidad histórica:** Permanecen los avances TEST134 de colores C64, borde, fondo y animación nativa. La compilación TEST138 pasó 48/48 escenarios; el PASS visual documentado corresponde al caso real probado.

## Comienzo documentado de la integración de SCUMM

**No se ha importado ni reemplazado el motor SCUMM-PET-C64 completo.** Se inició una **integración arquitectónica** de sus principios ya probados en el exportador PRG de LVLLVL:

- Una única referencia temporal en IRQ / scheduler visual.
- Subcontadores por Animated Char, conservando velocidad y tipo independiente.
- Confirmar un avance real del mapa antes de permitir que se contabilice un paso de carácter dependiente de ese avance.
- Mantener la sesión de animación continua, sin dividirla artificialmente.
- Preparar datos en segundo plano de forma que no se frene el ritmo de presentación.

**Referencias técnicas del motor propio:**

- https://github.com/serigrafiamdp-web/SCUMM-PET-C64
- https://github.com/serigrafiamdp-web/SCUMM-PET-C64/blob/main/milestones/ECM_SINGLE_SCHEDULER_PASS_13_OCT_2026/README.md

El motor LVLLVL conserva su propio mapa de memoria, rutinas y exportación; **no** se copiaron binarios ni direcciones de memoria de SCUMM-PET-C64. Las siguientes funciones SCUMM se evaluarán por separado.

## Archivo congelado y reversión

- MASTER definitivo: `MASTER_LVL_RICO_SCUMM_PIXEL_GEAR_TEST138_PASS_18_OCT_2026.zip`
- SHA256: `a8835ed08e0b4eab2a26150531e72ba7d5e138f1e311e815c9ffb1ccb3a89227`
- Este MASTER es **copia byte a byte** del ZIP que se congeló como `MILESTONE_LVL_RICO_TEST138_PIXEL_GEAR_PASS_18_OCT_2026.zip` (692 entradas). La documentación se publica por separado para no alterar el ZIP probado.
- Hito original intacto: `milestone/lvl-rico-pixel-gear-test138-pass-18-oct-2026`.
- MASTER antiguo intacto: `backup/master-lvl-rico-test134-before-test138-18-oct-2026`.
- Rama de promoción: `release/master-lvl-rico-test138-scumm-18-oct-2026`.
- Rama principal `main` asciende a código TEST138 ya validado, **sin modificar** `dist/index.html` ni `dist/js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js` respecto del milestone.

## Alcance y próximos pasos

- **PASS:** funcionamiento que el usuario validó visualmente, incluidos scroll horizontal de 40 columnas y vertical de 24 filas, bajo su configuración de prueba.
- **Pendiente:** otras combinaciones de mapa no uniforme, scroll diagonal nativo, velocidades distintas, Ping Pong y 25 filas de scroll vertical si se busca recuperarlas. No afirmar PASS general sin nuevas verificaciones.
- **Regla:** todo desarrollo posterior partirá de este MASTER y usará una rama TEST139+; no sobrescribir MASTER ni milestone.
