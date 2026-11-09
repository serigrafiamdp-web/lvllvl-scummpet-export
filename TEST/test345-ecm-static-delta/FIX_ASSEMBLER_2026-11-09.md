# TEST345 – FIX del ensamblador / 09-11-2026

Usuario reportó alert del ensamblador C64 al exportar REMISERIA 64: `unknown value: 24576+$000,x` y `undefined label: frame345_screen+$000,x`, y versiones +$100,+$200,+$300, así como frame345_color.

Origen: el ensamblador usado por el editor no soporta la notación indexada `symbol+$offset,x`, aunque es semánticamente una dirección constante.

Se sustituyeron las ocho cargas por direcciones absolutas indexadas: `$6000,x`, `$6100,x`, `$6200,x`, `$6300,x`, `$6400,x`, `$6500,x`, `$6600,x`, `$6700,x`. No se alteraron los valores/bytes de datos iniciales.

Se actualizó el parámetro JS de `TEST345/index.html` a `test345-a4-absolute-addresses` para evitar caché de la fuente previa.

Verificación: sintaxis JavaScript PASS, 8/8 direcciones presentes, cero expresiones `frame345_(screen|color)+$` residuales, ambas rutas recuperadas desde GitHub. Aún no se verificó el compilado real ni VICE.

Archivo: `TEST/test345-ecm-static-delta/js/RICO_ECM_STATIC_DELTA_TEST345.js` en gh-pages. Página principal y TEST342 PASS intactos.