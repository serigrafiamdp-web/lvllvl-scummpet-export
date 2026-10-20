# RICO TEST169 — Rico's Window / Full Screen Guide

**20/10/2026 — PENDIENTE PASS/FAIL VISUAL.** Basado en TEST168, separado de main. MASTER LVL RICO 20 OCT no se modifica.

- Screen sigue completo para dibujar, pegar y editar (ej.: 40x50).
- Window = ventana visible C64, con origen y recortes por frame, inicial 40x25 para Screen grande.
- Scroll Area = fuente original completa, e.g. 40x50.
- Map Scroll OFF = editor muestra 40x50 entero; marco ROJO delimita maximo 40x25 y marco BLANCO discontinuo si Window es personalizada.
- Map Scroll ON = preview aplica la Window elegida; fuente completa de Scroll Area en 16 opciones del menu, sin editar datos del Screen.
- Dialogo Window destaca rojo MAX C64, blanco Window, gris Scroll Area.
- Los exportadores PRG NO se modifican. La ruta horizontal experimental TEST168 aun requiere evaluacion de fidelidad de fuente antes de declararla PASS.

Verificaciones de codigo: 16/16 tipos con viewport 40x25 en mapa 40x50, OFF recupera pantalla completa, caso 24 filas / Window Y=10, 40x25 tradicional sin marco. Prueba en navegador real y VICE pendiente.

ZIP TEST169: `LVLLVL_TEST169_RICOS_WINDOW_VIEWPORT_ROJO_WEB_LOCAL.zip`.
SHA256: `07382e21a1ee8d76a9decdef264fb4abaab1a6abeabe9721cab3bfd5aecd47cc`.
