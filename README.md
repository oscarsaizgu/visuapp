# visu-game

Juego para aprender a **identificar el material del VISU** (oposiciones de Biología y Geología) con fotografías reales: sesiones cortas, colección, dominio por ejemplar y repetición espaciada.

## Arrancar

```bash
npm install
npm run import-catalog -- <ruta a Visu-Oposicion>   # solo la primera vez: copia las fotos a public/img
npm run dev
```

Para abrirlo en el móvil desde la misma wifi: `npm run dev -- --host` y abre la URL "Network" que aparece.

Sin la importación la app funciona igual, pero las fotos aparecen como "Imagen pendiente".

## Contenido

El catálogo procede de **Visu-Oposicion**, que es solo materia prima: se lee una vez y **no se modifica ni se ejecuta** su código.

```
content/base/          ← generado por el importador (no editar a mano)
  specimens.json         3.132 ejemplares con el esquema propio de visu-game
  images.json            registro de 9.657 fotos (medidas, origen, marcas)
content/curation/      ← decisiones propias; el importador nunca las toca
  image-review.json      fotos que dan pistas, rotuladas, de mala calidad…
  specimen-fixes.json    correcciones y añadidos por ejemplar
  custom-images.json     fotos propias (archivos en public/img/propias/)
  packs/piloto.json      los 40 ejemplares revisados que forman el Mundo 1
  ruta.json              reglas de la ruta (tamaño de mundo, lecciones, examen)
src/content/generated/ ← lo que carga la app (npm run content)
```

- `npm run import-catalog -- <ruta>`: regenera `content/base` y copia las fotos byte a byte (`--sin-fotos` para no copiarlas).
- `npm run content`: combina base + curación y genera `catalogo.json` (los 3.132 ejemplares), `ruta.json` (mundos y lecciones) y `name-index.json`. Avisa si una revisión apunta a algo que no existe y comprueba que ningún ejemplar se queda fuera de la ruta.
- Una foto marcada `da-pistas`, `rotulada`, `ilustracion` o `calidad` se muestra en la ficha, pero **nunca se usa para preguntar**.

## Tres capas

| Capa | Qué es | Dónde |
|---|---|---|
| Catálogo completo | Los 3.132 ejemplares y 9.657 fotos. Se ve entero en Colección, Estudio libre y fichas. | `catalogo.json` |
| Contenido jugable | La ruta: 63 mundos que reparten todo el catálogo. Lo «desbloqueado» son los ejemplares de los mundos abiertos. | `ruta.json` |
| Progreso del usuario | Dominio, XP, colección, lecciones, repasos y exámenes. Solo en el dispositivo. | `useProgressStore` |

## Ruta: Mundo → Submundo → Lección → Examen

- **Mundos** de unos 40–50 ejemplares (no simétricos). El Mundo 1 es el pack piloto revisado; los siguientes se ordenan por importancia: primero lo que ha salido en examen, luego prioridad A y después B. Cada mundo mezcla disciplinas con cupos proporcionales a lo que queda de cada una (mínimo 3), así que la geología se agota antes que la zoología.
- **Submundos:** las disciplinas de ese mundo (Botánica, Zoología, Hongos…). Se pueden hacer en cualquier orden; dentro de cada una, los nodos van en orden.
- **Lecciones** de 3–6 ejemplares (una de 2 en el Mundo 1, porque el piloto solo trae 2 de geomorfología) del mismo grupo del catálogo: primero APRENDER (fotos y datos del catálogo) y después IDENTIFICA (dos rondas: opción múltiple y elegir foto). Sin esperas: se pueden hacer todas las que se quiera. Estrellas: 1 al completar, 2 con ≥70 %, 3 con ≥90 %.
- **Repasos** cada 2 lecciones (y uno final). No hay game over: por debajo del 70 % solo recomienda reforzar.
- **Examen final del mundo:** aparece al completar todas sus disciplinas. 20 preguntas de todas ellas, distractores más difíciles, 1 de cada 4 por escrito. Se aprueba con el 75 % y abre el mundo siguiente. Si se suspende no se pierde nada (XP, dominio, lecciones) y se puede repetir cuando se quiera.
- **Estudio libre** (`/estudiar/elegir`): cualquier categoría o bloque del catálogo completo. Mejora el dominio pero **no desbloquea mundos**.
- Reglas en `src/logic/route.ts`; configuración en `content/curation/ruta.json`.

## Cómo funciona el juego

- **Sesión libre:** 10 identificaciones sobre los mundos abiertos. Primero los repasos que tocan hoy y después ejemplares nuevos (prioridad A y los que han salido en examen, intercalando categorías).
- **Opciones:** 4 respuestas. En biología se pregunta por el nombre científico. Los distractores salen del catálogo completo por cercanía taxonómica (género → familia → grupo → categoría) y son más parecidos cuanto más dominas el ejemplar.
- **Fallos:** el feedback muestra cuál era, qué marcaste y en qué se diferencian (según el catálogo). El ejemplar vuelve al final de la sesión, con otra foto si la hay.
- **Dominio:** cajas Leitner 0–5 (`src/logic/srs.ts`). Acierto = sube una caja (repaso en 1, 3, 7, 16 o 35 días); fallo = baja dos y vuelve hoy.
- **XP** (`src/logic/xp.ts`): 10 por acierto pendiente, 5 en reintento, 2 si no tocaba; combo +2 por acierto seguido (máx. +10); +5 al subir el dominio; +20 al terminar (+10 si es perfecta).
- **Da pistas:** marca una foto para que no se vuelva a usar al preguntar (se guarda en el dispositivo).

## Modos de juego (`/jugar/sesion?modo=…`)

| Modo | Qué es | Dominio |
|---|---|---|
| `opcion-multiple` | Foto + 4 nombres (sesión recomendada) | Sí |
| `escribir` | Foto + escribir el nombre (sin tildes/mayúsculas, se admite 1–2 erratas según longitud) | Sí, +15 XP |
| `elegir-foto` | Nombre + 4 fotos de ejemplares desbloqueados | Sí |
| `veloz` | Todas las posibles en 90 s, avanza solo | No (5 XP por acierto) |
| `repaso` | Solo vencidos, fallados y difíciles | Sí |

## Colección, progreso, insignias y retos

- **Colección:** por categoría y grupo; lo no descubierto aparece como «???» con la foto velada.
- **Progreso:** racha, identificaciones, % de aciertos a la primera, tiempo de estudio, practicados, dominados, sesiones, gráfica de 14 días, categorías más fuerte y más débil, «Necesitas repasar», insignias y ajustes (objetivo diario, exportar/importar/borrar progreso).
- **Insignias** (`src/content/achievements.ts`): cada una es un dato con su forma de medir el progreso. Se comprueban tras cada acción y al abrir la app.
- **Retos diarios** (`src/logic/challenges.ts`): 3 al día, estables por fecha, +30 XP cada uno.
- **Plan de repaso:** prioriza el retraso relativo al intervalo de la caja y los olvidos. Sin límite diario: se puede avanzar tanto como se quiera.
- El progreso se guarda con versión (`version: 3`) y migra automáticamente desde la versión anterior.

## Estudiar

- **Repasar:** repasos vencidos, luego lo que fallaste la última vez y luego lo que más te cuesta.
- **Descubrir:** ejemplares desbloqueados que aún no has visto. Abrir su ficha los añade a la colección (sin XP ni dominio).
- **Estudio libre:** Biología / Geología → categoría → bloque del catálogo completo, con buscador (sin tildes ni mayúsculas) y botones para practicar ese bloque. Los filtros viven en la URL.
- **Ficha** (`/ejemplar/:id`): galería con todas las fotos de estudio (incluidas las rotuladas), nombres, prioridad, estatus, exámenes, tu progreso, rasgos, clasificación, notas y emparentados del catálogo completo. Solo muestra datos que existen en el catálogo; si faltan rasgos, lo dice.

## Código

```
src/
  app/          rutas
  pages/        pantallas
  components/   interfaz (layout, home, specimen, ui)
  content/      acceso al contenido y categorías
  logic/        reglas puras y testeadas: niveles, dominio, racha, plan de sesión
  store/        progreso del jugador (localStorage, versionado)
  hooks/        datos derivados para las pantallas
  styles/       tokens de diseño y estilos globales
  types/        esquemas de contenido y progreso
```

`npm test` (lógica y contenido) · `npm run lint` · `npm run build`.

En desarrollo, `?demo` rellena progreso ficticio para revisar la interfaz y `?demo=reset` lo borra.

## Aviso sobre las fotos

Las fotografías son de terceros y no tienen licencia libre. Este repositorio **no debe incluirlas mientras sea público** (`public/img/` está en `.gitignore`).
