# TEST340 — Map Scroll diagonal + varios grupos de caracteres

Fecha: 2026-11-09. **Experimental; sin PASS de ensamblador o VICE**.

## Motivo
El usuario informó un bloqueo al combinar Map Scroll diagonal con dos grupos de caracteres:
«La ruta diagonal actual solo usa un grupo. Hay 2 y faltaría el resto. Necesita scheduler multigrupo.»

El código de TEST196 conserva la limitación: `groupFromStore` selecciona `[0]` y `build(d)` emite un único `d.group`. Aceptar el PRG anterior perdería silenciosamente las animaciones de los demás.

## Enfoque TEST340
- Fork aislado de TEST339 con su corrector del índice lateral (PASS confirmado).
- Solo intercepta la exportación cuando está configurado Map Scroll diagonal (4 direcciones) y existen **2 o más** grupos. Con 0 o 1 grupos ejecuta la cadena anterior intacta.
- Obtiene configuración real desde `ricoGroupAnimationsV1` BANK 1/2. Cada grupo se valida a través del lector independiente de `RICO_TEST247_STANDALONE.readGroup`.
- Reutiliza `RICO_TEST186_HORIZONTAL.groupASM` por grupo y reubica cada bloque en memoria segura $A000..$CFFF; símbolos `group182`, `group183`, `group239` se renombran por grupo.
- Planificador en bucle principal ejecuta hasta un paso pendiente de **cada grupo** por pasada, después de atender la preparación del mapa. En interrupción se actualizan los relojes independientes.
- Reemplaza de manera verificable (una sola coincidencia) la rutina de grupo anterior en el source ASM diagonal, sin reescribir la animación del mapa ni sus colores.
- No establece límite artificial de 2 grupos. RAM y caracteres solapados se verifican explícitamente.
- No modifica los datos del editor, los bancos ni el código de TEST334/TEST339.

## Compatibilidad y límites actuales
- Soporta las 4 direcciones del **mapa diagonal** y las direcciones Left, Right, Up, Down, Ping Pong y Ondas de **grupos** mediante el motor ya usado en TEST334.
- 1 frame; el exportador diagonal base no garantiza el planificador de grupos en varias frames.
- No omitir SID, Switch Bank o animación individual: en esta prueba, si están habilitados se presenta un error claro hasta que se integre su composición.
- ECM/bitmap requieren sus propios exportadores y no deben ser degradados a modo texto sin advertencia.
- Una animación del BANK no visible puede exportarse correctamente sin ser visible hasta conmutar el charset; no confundir con pérdida del grupo.

## Orden de pruebas
1. Abrir https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test340-diagonal-multigroup/
2. Cargar un proyecto de **1 frame**, Map Scroll **Diagonal Up Left**, dos grupos independientes (por ejemplo Left + Right), sin SID ni animaciones individuales.
3. Exportar PRG. Cualquier error aparece como «TEST340 diagonal multigrupo: ...» y también en `window.RICO_TEST340_LAST_ERROR`.
4. Si exporta, probar en **VICE PAL**: comprobar movimiento diagonal y de ambos grupos, colores, BANK y velocidad.
5. Repetir en las otras 3 diagonales y con Ondas/Ping Pong. Registrar resultados antes de declarar PASS.
6. Reprobar TEST339 para garantizar que la previsualización lateral no tiene regresión.

## Estado
La sintaxis JavaScript fue verificada. **No hay prueba real de ensamblador LVLLVL ni VICE.** No promover a principal hasta PASS confirmado por el usuario.
