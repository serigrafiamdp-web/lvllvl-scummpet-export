RICO / LVLLVL TEST144 — NORMAL PREVIEW CALIBRADA — 19/10/2026
ESTADO: PRUEBAS ESTATICAS PASS; PENDIENTE PASS VISUAL DEL USUARIO.

MOTIVO: en LVLLVL original 1 tick, la velocidad visual baja cuando se
animan muchos caracteres. Videos del usuario sugieren ~15 cambios/s con 128
y ~8 cambios/s con 256. Hasta 64, degradacion poco apreciable.

CORRECCION:
- Adaptador RICO_NORMAL_PREVIEW_LOAD_TEST144.js tras TEST139.
- Cuenta animaciones NORMAL activas en cada banco; reloj virtual comun
  para lienzo e indice, sin modificar ticks de proyecto ni PRG.
- Tasa orientativa: 1-16 ~50Hz, 64 ~46Hz, 128 ~15Hz, 256 ~8Hz.
- No se activa con Map Scroll ni Group Animate.
- TEST139 indice: 95 ms -> 16 ms para evitar aliasing/sentido aparente
  inverso a 1 tick. Render por fase efectiva.
- No altera tileset, Color RAM, Map Scroll, Group Animate ni motor SCUMM.
- Exportador TEST143 byte-identico. No se promete FPS real en VICE.

VALIDACION:
- TEST144_PREVIEW_CALIBRATION_CHECK.cjs: 16/16 PASS.
- Exportador PRG git blob: 264451e7803c3cf7756000a05867fc477a642c45.
- TEST140/141/142/143 preservados salvo la preview indicada arriba.

PRUEBA VISUAL:
- Abrir online o mediante servidor local, usar CHAR ANIMATE NORMAL UP 1T,
  Map Scroll y Group Animate OFF, elegir 1/16/32/64/96/128/256.
- Comparar indice y area de trabajo y verificar el sentido correcto.
- Exportar para confirmar comportamiento del PRG sin cambios.
- Al habilitar Map Scroll se desactiva deliberadamente la calibracion;
  el rendimiento conjunto se estudiara en otro test.

VERSION LOCAL:
- Abrir index.html por file:// puede tener diferencias del navegador.
- Para utilizar el mismo contexto HTTP que la web, ejecutar
  ABRIR_TEST144_LOCAL.bat (requiere Python 3 instalado) o ejecutar
  python -m http.server 8765 en esta carpeta y abrir localhost:8765.

MASTER TEST138 y MILESTONE TEST139 conservados sin modificaciones.
