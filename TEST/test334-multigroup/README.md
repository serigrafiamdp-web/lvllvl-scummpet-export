# TEST334 — Ondas Left y Right multigrupo

Fecha: 2026-11-05. Experimental. TEST332 PASS reportado por el usuario para dos grupos Scroll Left + Scroll Right. TEST333 FAIL al intentar Ondas Right/Left: «TEST330: formato ASM no reconocido para grupo 1 (pingpong-right)».

## Causa identificada
`readGroup` normaliza `ondas-right` a `pingpong-right`, según contrato heredado. TEST333 solo trataba `left|right` como motores horizontales al seleccionar la tabla de punteros `group183_source_his`. Los tipos `pingpong-left|pingpong-right` se clasificaban erróneamente como verticales y buscaban `group182_sources_hi`.

## Corrección
- Clasificar `left|right|pingpong-left|pingpong-right` como grupos horizontales, con tabla `group183_source_his`.
- Mantener cálculo especial de fuentes `pingpong-right` a 24 bytes por tile y estados `group239_*` independientes por grupo.
- Guardar `selectedEffects` con los nombres originales de las opciones elegidas para el diagnóstico; la transformación de Ondas a Ping Pong sigue siendo la del código anterior.
- No modificar TEST332 ni la portada principal; URL aislada TEST334.
- Sin PASS VICE aún para el modo Ondas multigrupo.

## Próxima validación
1. Abrir TEST334 y cargar los dos grupos Ondas Right + Ondas Left, sin Map Scroll y con 1 frame.
2. Exportar PRG. Si falla registrar error literal.
3. Si exporta, ejecutar en VICE y comprobar dirección, reflejo, velocidad, integridad de charset y color.
4. Confirmar si el comportamiento Ondas en este generador coincide con lo esperado en la previsualización. La equivalencia interna Ondas/Ping Pong no debe asumirse visualmente idéntica antes de probar.
