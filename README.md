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
