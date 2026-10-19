RICO / LVLLVL TEST145 — REBALANCE PREVIEW NORMAL 128 CHARS — 19/10/2026
ESTADO: PRUEBAS AUTOMATICAS; PENDIENTE COMPROBACION VISUAL CONTRA VICE DEL USUARIO.

CORRECCION EXACTA:
- Video proporcionado: LVLVL RICO 128 chars a 1tick.mkv, 157 frames / 60 FPS,
  duracion 2.623 s. En la zona de trabajo y el indice de TEST144 se detectaron
  38 cambios visibles = ~14.5 cambios/s.
- TEST144 habia fijado 128 caracteres a 15Hz por imitacion de la preview original;
  el usuario observa que el PRG RICO exportado corre MAS RAPIDO en VICE.
- TEST145 eleva el reloj visual estimado para 128 a 26Hz; 64=48, 96=37,
  160=23, 192=20, 224=18, 256=16. 1/16/32=50Hz.
- Curva de TEST145 es una aproximacion, NO velocidad medida del ejecutable.
  Para calibracion exacta falta VIDEO DE VICE reproduciendo el PRG aportado.
- Mismas configuraciones NORMAL individuales: cada tile se desplaza en su 8x8.
  Group Animate y Map Scroll NO se modifican.
- TEST143 PRG exporter byte-identical. No cambia ticks almacenados ni el
  raster IRQ, charset, fondo, colors, scroll ni SCUMM TEST138.
- TEST139 index preview 16ms permanece intacta de TEST144.

PRUEBA VISUAL:
- Comparar TEST145 en preview y PRG real en VICE con 128 animated chars UP 1T.
- Si la preview sigue mas lenta/rapida, proporcionar 2 videos de la misma prueba
  (RICO preview y VICE) capturados a 60 FPS para alinear tasa exacta.
- Probar tambien 64 y 256 para validar curva; no promocionar sin PASS.

RESTAURACION: TEST144 sigue en rama de respaldo y ZIP. MASTER TEST138 intacto.
