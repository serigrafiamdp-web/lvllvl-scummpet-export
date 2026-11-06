# TEST335 — Map Scroll horizontal + varios grupos (experimental)

Fecha: 2026-11-05. Base: TEST334 PASS multigrupo **sin** Map Scroll. TEST334 y la raíz TEST329 no se modificaron.

## Objetivo
Map Scroll Left/Right + 2 o más Group Animate independientes. Cada grupo tiene dirección, timer y fase propios. No se crea una regla de máximo 2 grupos: solo se mide memoria disponible y colisiones reales de glyphs.

## Implementación
`RICO_MAP_HORIZ_MULTIGROUP_TEST335.js` se carga después de los módulos horizontales/ECM y envuelve **H.collect / H.build**, sin reescribir los motores de movimiento horizontal ya aprobados.
- Cuenta grupos activos BANK1/BANK2 y utiliza `RICO_TEST247_STANDALONE.readGroup` para formar cada grupo según configuración real (incluye traducción interna Ondas→Ping Pong del motor heredado).
- Mantiene el kernel horizontal de Map Scroll; reemplaza exclusivamente el stub de animación de grupo que antes admitía solo uno, incorporando los kernels ASM que fueron empleados en TEST334.
- Atiende cada grupo en el loop de fondo, mientras el IRQ sigue priorizando Map Scroll y registra timers individuales. Los punteros de origen y etiquetas por grupo se reubican.
- Si una animación individual ocupa el mismo glyph de un grupo, informa el conflicto de composición sin descartar silenciosamente.
- Si un grupo excede RAM segura previa a I/O, aborta con el tamaño necesario; no reduce automáticamente cantidad de grupos.
- Otros exportadores (vertical, diagonal, bitmap, multiframe) quedan por ahora sin cambios.

## Verificación requerida
1. En TEST335, con **1 frame**, Window 40×25 y Scroll Area mayor de 40 columnas, activar Map Scroll Left. Configurar dos grupos independientes Scroll Left + Scroll Right. Exportar PRG y probar en VICE PAL.
2. Comprobar que el mapa se desplaza y AMBOS grupos se animan a sus velocidades, sin artefactos ni cambios de color.
3. Repetir con Map Scroll Right.
4. Repetir con Ondas Left/Right y luego Up/Down.
5. Repetir en TEST334 sin Map Scroll para asegurar no regresión.
6. Anotar errores completos y, de ser posible, PRG. Diagnóstico JS `window.RICO_TEST335_LAST_PLAN`.

## Estado
**Sin PASS VICE todavía**. La sintaxis JavaScript del nuevo módulo fue verificada, pero esto no valida ensamblado 6502, layout final de RAM ni funcionamiento sobre C64. No promover a editor principal hasta PASS.
