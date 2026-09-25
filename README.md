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
  packs/*.json           qué ejemplares están activos en el juego
src/content/generated/ ← lo que carga la app (npm run content)
```

- `npm run import-catalog -- <ruta>`: regenera `content/base` y copia las fotos byte a byte (`--sin-fotos` para no copiarlas).
- `npm run content`: combina base + curación + packs activos. Avisa si un pack o una revisión apunta a algo que no existe.
- Una foto marcada `da-pistas`, `rotulada`, `ilustracion` o `calidad` se muestra en la ficha, pero **nunca se usa para preguntar**.

## Cómo funciona el juego

- **Sesión:** 10 identificaciones. Primero los repasos que tocan hoy y después ejemplares nuevos (prioridad A y los que han salido en examen, intercalando categorías).
- **Opciones:** 4 respuestas. En biología se pregunta por el nombre científico. Los distractores salen del catálogo completo por cercanía taxonómica (género → familia → grupo → categoría) y son más parecidos cuanto más dominas el ejemplar.
- **Fallos:** el feedback muestra cuál era, qué marcaste y en qué se diferencian (según el catálogo). El ejemplar vuelve al final de la sesión, con otra foto si la hay.
- **Dominio:** cajas Leitner 0–5 (`src/logic/srs.ts`). Acierto = sube una caja (repaso en 1, 3, 7, 16 o 35 días); fallo = baja dos y vuelve hoy.
- **XP** (`src/logic/xp.ts`): 10 por acierto pendiente, 5 en reintento, 2 si no tocaba; combo +2 por acierto seguido (máx. +10); +5 al subir el dominio; +20 al terminar (+10 si es perfecta).
- **Da pistas:** marca una foto para que no se vuelva a usar al preguntar (se guarda en el dispositivo).

## Estudiar

- **Repasar:** repasos vencidos, luego lo que fallaste la última vez y luego lo que más te cuesta.
- **Descubrir:** ejemplares activos que aún no has visto. Abrir su ficha los añade a la colección (sin XP ni dominio).
- **Elegir:** Biología / Geología → categoría → grupo, con buscador (sin tildes ni mayúsculas). Los filtros viven en la URL.
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
