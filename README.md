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
  image-review.json      curación de fotos: papel (principal/identificación/ficha/excluida), marcas y motivo
  name-review.json       revisión de nombres: discrepancias registradas (no corregidas) y pares que no se usan como distractor
  external-sources.json  fotos externas elegidas (Wikimedia Commons)
  external-images.json   las mismas con su procedencia completa (lo genera fetch-external)
  specimen-fixes.json    correcciones y añadidos por ejemplar
  custom-images.json     fotos propias (archivos en public/img/propias/)
  packs/piloto.json      los 40 ejemplares revisados que forman el Mundo 1
  ruta.json              reglas de la ruta (tamaño de mundo, lecciones, examen)
content/audit/          auditoría técnica automática de las fotos (audit-images)
src/content/generated/ ← lo que carga la app (npm run content)
```

- `npm run import-catalog -- <ruta>`: regenera `content/base` y copia las fotos byte a byte (`--sin-fotos` para no copiarlas).
- `npm run content`: combina base + curación y genera `catalogo.json` (los 3.132 ejemplares), `ruta.json` (mundos y lecciones) y `name-index.json`. Avisa si una revisión apunta a algo que no existe y comprueba que ningún ejemplar se queda fuera de la ruta.
- Una foto marcada `da-pistas`, `rotulada`, `ilustracion`, `calidad`, `taxon-dudoso`, `otra-especie`, `sin-contenido` o `archivo-danado` **nunca se usa para preguntar**, diga lo que diga su papel.

## Curación de fotos y nombres

El objetivo es la asociación **foto → organismo → nombre científico**. Una foto bonita que no ayuda a identificar no sirve para jugar.

- **Papel de cada foto** (`image-review.json`):
  - `principal`: la de APRENDER; va la primera en la lección y en la ficha.
  - `identificacion`: se usa para preguntar.
  - `ficha`: útil para estudiar (esquemas, rótulos, puestas…), pero no para preguntar.
  - `excluida`: no se muestra.
  - Cada decisión lleva su motivo.
- **Rotación**: para preguntar se usan las fotos de identificación, no la principal, y cada modo (Identifica, Repaso, Veloz, Escribir) empieza por una distinta. Se aprende el organismo, no una foto.
- **Procedencia y licencia**:
  - Las 9.657 fotos del catálogo original no documentan autor ni licencia (el propio origen las describe como material de terceros), así que quedan como **licencia no verificada**.
  - Las externas (solo Wikimedia Commons con CC0, CC BY, CC BY-SA o dominio público) guardan URL, autor, licencia, fecha, taxón de origen y cambios. Su crédito se muestra en la ficha y tras responder.
- **Versión distribuible**: `npm run build:distribuible` genera `dist-distribuible/` solo con fotos de licencia verificada, más un `CREDITOS.txt`. No toca el contenido normal.
- **Nombres**:
  - `name-review.json` registra las posibles discrepancias (sinónimos, taxonomía, categoría) con su fuente, **sin corregir el catálogo**.
  - Solo se aplica una cosa en el juego: los pares con dos respuestas defendibles nunca salen como distractor el uno del otro.
- **Nombre científico primero**: en biología la etiqueta muestra el científico en grande y el común como apoyo. En Escribir solo vale el científico; si escribes el común, se avisa.
- **Herramientas**:
  - `npm run audit-images`: mide resolución, nitidez, exposición y texto (OCR, opcional) y busca duplicados por huella perceptual. Solo lee. Necesita Python con Pillow, numpy e imagehash, y tesseract para el OCR.
  - `npm run fetch-external`: descarga las fotos de `external-sources.json` y rechaza las que no tengan licencia libre.
  - `/curacion` (enlace en Progreso → Ajustes): revisión visual de todo lo anterior.
- **Estado**: piloto de 29 ejemplares de las 8 disciplinas. El resto del catálogo sigue con las reglas automáticas de antes.

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
- El progreso se guarda con versión (`version: 4`) y migra automáticamente desde las anteriores.
- **Confusiones**: si eliges un nombre en lugar de otro, se apunta. Los repasos usan esos nombres como distractores.

## La nutria

Es la compañera de campo: una ilustración propia en SVG (`src/components/nutria/`) con seis poses. Solo aparece en momentos puntuales y nunca bloquea:
- en la ruta, mientras no has completado ninguna lección;
- al empezar las primeras lecciones, para explicar la mecánica;
- con el examen disponible;
- al segundo fallo seguido;
- al llegar a 5 o 10 aciertos seguidos;
- al aprobar o suspender un examen de mundo.

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

Las fotografías del catálogo original son de terceros y su licencia no está verificada. En la rama de trabajo se subieron a `public/img/` por decisión del propietario del repositorio. Mientras el repositorio sea público, esas fotos quedan expuestas: conviene ponerlo en privado o usar la versión distribuible. Las fotos de `public/img/ext/` tienen licencia libre verificada (ver `content/curation/external-images.json`).
