# Limpieza conservadora de laboratorios — 14/11/2026

**Objetivo:** quitar clones y tests numéricos viejos de la portada sin perder un solo byte de historia y sin alterar los motores.

## Respaldo verificable

- **Rama archivada ANTES de la limpieza:** [`archive/tests-pre-audit-2026-11-14-test362-pass`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/archive/tests-pre-audit-2026-11-14-test362-pass)
- **Commit congelado:** `459d95961cc3f2dfb6989ad01bbf04a5626cee0a`. Contiene el README anterior, **todos los 39 laboratorios numéricos**, módulos actuales, docs y checkpoint TEST362.
- Los antiguos branches MASTER y release ya existentes no se borraron.
- Los archivos borrados de `gh-pages` siguen accesibles mediante la rama archivada y la historia Git. Las antiguas direcciones publicadas bajo esos `TEST/testNNN/` ya no se sirven desde la web canónica; usar los archivos de la rama archivada para recuperación.

## Archivos retirados de `gh-pages`

**39 carpetas, 199 archivos:**
- `TEST/test150/` … `TEST/test165/` (16 carpetas).
- `TEST/test238/` … `TEST/test260/` (23 carpetas).

El criterio NO es que un test tenga nombre antiguo: estas carpetas **numéricas sin sufijo** no suministraban **ninguno de los 127 scripts declarados en el index principal**. Se mantuvieron rutas activas con nombres históricos, por ejemplo `TEST/test242-ondas-pingpong`, `TEST/test247-group-scroll-fast`, `TEST/test327-horizontal-animated-map`, `TEST/test354-calaca-diagonal-frames`, `TEST/test358-native-right-dock` y `TEST/test361-diagonal-charset`.

## Validación realizada

- `index.html` mantiene el **mismo orden de 127 scripts**.
- De ellos, **123 locales están presentes** en el árbol resultante; ninguno referencia un fichero eliminado.
- Se conservan `TEST362` en el exportador diagonal y el diagnóstico pasivo `TEST361`.
- No se editaron las rutinas de exportación, animation, SID, charset, CSS ni layout durante la operación de limpieza.
- **No se ejecutó VICE sobre cada modo** tras una limpieza que solo borra laboratorios que el `index.html` no carga. Se requiere smoke test de la web para cerrar el checkpoint de mantenimiento.

## Qué NO se borró y por qué

Las carpetas de laboratorio **con nombre descriptivo**, aunque algunas no estén activas, todavía contienen investigaciones de ECM, bitmap, SID, scroll combinado, frames y múltiples grupos. Se conservan por valor técnico y porque sus rutas están enlazadas desde documentos antiguos. **No confundir “no cargado por index.html” con “seguro para borrar sin evaluación”.**

## Recuperación rápida

Para copiar un archivo histórico, abrir el branch congelado y localizar su ruta original. Para revertir toda la limpieza, obtener los paths del commit `459d959...` y restaurar únicamente las rutas numéricas necesarias; **no hacer reset o merge bruto**, porque perdería mejoras/documentación posteriores.
