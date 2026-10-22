# Cronología del motor — TEST214 a TEST228

**Solo los PASS confirmados por usuario en VICE son definitivos.** Esta tabla conserva los intentos que NO debemos repetir a ciegas.

| TEST | Estado | Hecho técnico |
| --- | --- | --- |
| 214 | FAIL | Unroll 8 aceleró copia horizontal, pero cortó parte de pantalla. |
| 215 | Insuficiente | Unroll 4 mantuvo 40×25; velocidad volvió a caer. |
| 216 | Insuficiente | Comparación Color RAM más compacta, todavía muy lenta. |
| 217 | Intermedio | Copia segura con salto de retorno legal y recuperación de pantalla. |
| 218 | Experimental | Tablas de diferencias Color RAM precalculadas, con fallback si no caben. |
| 219 | Intermedio | Copia horizontal entre pantallas y nueva columna. |
| **220** | **PASS** | Left/Right; tramos verticales RLE de Color RAM y ruta incremental. |
| 221 | Simulado | Optimización de Up/Down + las cuatro diagonales; falta declaración PASS VICE específica de diagonal. |
| 222 | FAIL de rendimiento | Up/Down seguían con frenazos; atajos de filas/colores no bastaron. |
| 223 | Diagnóstico | Contadores `$28/$29/$2A`; `main_busy` consumía muchas IRQ, datos de 8 bits. |
| 224 | Sin PASS final | Actualización de caracteres por diferencias de doble buffer; no confirmó solución. |
| 225 | Experimental | Avance atómico 1–7 píxeles; usuario reportó que seguía el defecto. |
| 226 | **FAIL** | Pantalla congelada en VICE: salto ASM codificado como `JMP $0000`. |
| **227** | **PASS** | Salto absoluto autocorregido en runtime, Color RAM directa: Up/Down 8 píxeles sin bugs. |
| **228** | **PASS** | Integración del SID en las 8 direcciones usando el ASM del exportador nativo. |

## Particularidades del último MASTER

- La versión actual de TEST227 está dentro de un módulo cuyo **nombre de archivo termina en TEST226**. No asumir que el archivo vigente contiene el FAIL histórico.
- La versión actual de TEST228 está dentro de `RICO_PRG_EIGHT_FRAMES_ORIGINAL_SID_TEST207.js`, porque se preservó la cadena de compatibilidad y nombres usados en `index.html`.
- Con SID activado, TEST228 intercepta el ensamblado final, conserva los motores de scroll visuales y rechaza la exportación silenciosa sin audio.
- Esta cronología complementa, pero **no sustituye**, el historial consolidado original.

## Estudio previo de RicOS

Las demos de `serigrafiamdp-web/RICOFBPARTY2026` demostraron scroll vertical muy rápido con mapas grandes y música. Lección trasladada: separar reloj visual/musical, aprovechar VIC-II fino y preparación incremental de recursos. No copiar un mapa de memoria entre motores sin adaptación.
