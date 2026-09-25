// Compone el contenido del juego: content/base + content/curation → src/content/generated.
// Uso: node scripts/build-content.mjs   (también se ejecuta con `npm run content`)
//
// - catalogo.json: TODO el catálogo (3.132 ejemplares) con las fotos resueltas
//   (cuáles sirven para jugar y cuáles solo para estudiar).
// - ruta.json: la ruta de aprendizaje Mundo → Submundo → Lección/Repaso → Examen (solo ids).
// - name-index.json: índice ligero de todo el catálogo, para generar distractores.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const warnings = [];

const specimens = readJson('content/base/specimens.json');
const baseImages = readJson('content/base/images.json');
const review = readJson('content/curation/image-review.json').imagenes;
const fixes = readJson('content/curation/specimen-fixes.json').ejemplares;
const custom = readJson('content/curation/custom-images.json').imagenes;

const packDir = path.join(ROOT, 'content/curation/packs');
const packs = fs.readdirSync(packDir).filter((f) => f.endsWith('.json'))
  .map((f) => readJson(`content/curation/packs/${f}`));

const byId = new Map(specimens.map((s) => [s.id, s]));
const images = new Map([...baseImages, ...custom].map((i) => [i.id, i]));

for (const id of Object.keys(review)) if (!images.has(id)) warnings.push(`image-review: imagen desconocida ${id}`);
for (const id of Object.keys(fixes)) if (!byId.has(id)) warnings.push(`specimen-fixes: ejemplar desconocido ${id}`);

// Fotos propias: se añaden a su ejemplar.
for (const img of custom) {
  const s = byId.get(img.ejemplarId);
  if (s) s.imagenes = [...s.imagenes, img.id];
  else warnings.push(`custom-images: ejemplar desconocido ${img.ejemplarId}`);
}

const NO_JUEGO = new Set(['da-pistas', 'rotulada', 'ilustracion', 'calidad']);

function resolveImage(id) {
  const base = images.get(id);
  const r = review[id] || {};
  const marcas = [...new Set([...(base.marcas || []), ...(r.marcas || [])])];
  const excluida = r.estado === 'excluida';
  const juego = !excluida && (r.usoEnJuego ?? !marcas.some((m) => NO_JUEGO.has(m)));
  const ficha = !excluida && (r.usoEnFicha ?? true);
  const out = { id, archivo: base.archivo, ancho: base.ancho, alto: base.alto, marcas, juego, ficha };
  for (const k of ['vista', 'fuente', 'deExamen', 'pie', 'autor', 'licencia']) if (base[k]) out[k] = base[k];
  return out;
}

const size = (i) => Math.max(i.ancho, i.alto);
function pickCover(imgs) {
  const ok = imgs.filter((i) => i.juego);
  const pool = ok.length ? ok : imgs.filter((i) => i.ficha);
  // La portada prefiere fotos grandes y apaisadas: lucen mejor en tarjetas.
  return [...pool].sort((a, b) =>
    (size(b) >= 600) - (size(a) >= 600) || (b.ancho >= b.alto) - (a.ancho >= a.alto) || size(b) - size(a),
  )[0]?.id;
}


// ---------- Catálogo completo (todos los ejemplares, con fotos resueltas) ----------

const catalogo = specimens.map((s) => {
  const merged = { ...s, ...(fixes[s.id] || {}) };
  const imgs = merged.imagenes.map(resolveImage).filter((i) => i.ficha);
  delete merged.origen;
  return { ...merged, imagenes: imgs, portada: pickCover(imgs) };
});
const porId = new Map(catalogo.map((e) => [e.id, e]));
const jugable = (e) => e.imagenes.some((i) => i.juego);

// ---------- Ruta: Mundo → Submundo (disciplina) → Lecciones y repasos → Examen ----------

const ruta = readJson('content/curation/ruta.json');
const CATEGORIAS = ['botanica', 'zoologia', 'hongos', 'microscopia', 'minerales', 'rocas', 'fosiles', 'geomorfologia'];
const primerAlbum = new Map();
catalogo.forEach((e, i) => { const k = `${e.categoria}|${e.album}`; if (!primerAlbum.has(k)) primerAlbum.set(k, i); });
const posicion = new Map(catalogo.map((e, i) => [e.id, i]));
const nivel = (e) => (e.visu.anios.length || e.visu.otros.length ? 0 : e.prioridad === 'A' ? 1 : 2);
/** Orden pedagógico: importancia y, dentro de ella, los grupos del catálogo juntos y en su orden natural. */
const ordenar = (xs) => [...xs].sort((a, b) => nivel(a) - nivel(b)
  || primerAlbum.get(`${a.categoria}|${a.album}`) - primerAlbum.get(`${b.categoria}|${b.album}`)
  || posicion.get(a.id) - posicion.get(b.id));

/** Parte una lista (ya ordenada) en lecciones coherentes: por grupo del catálogo, entre min y max. */
function hacerLecciones(lista, { min, max }) {
  const grupos = [];
  for (const e of lista) {
    const g = grupos.at(-1);
    if (g && g.album === e.album) g.xs.push(e); else grupos.push({ album: e.album, xs: [e] });
  }
  const lecciones = [];
  for (const g of grupos) {
    const k = Math.ceil(g.xs.length / max);
    const base = Math.floor(g.xs.length / k), extra = g.xs.length % k;
    let i = 0;
    for (let j = 0; j < k; j++) {
      const trozo = g.xs.slice(i, i + base + (j < extra ? 1 : 0)); i += trozo.length;
      const ultima = lecciones.at(-1);
      if (ultima && ultima.length < min && ultima.length + trozo.length <= max) ultima.push(...trozo);
      else lecciones.push([...trozo]);
    }
  }
  // Ninguna lección por debajo del mínimo: se une a su vecina más grande si caben juntas;
  // si no, toma prestados de ella los ejemplares contiguos que le falten.
  for (let i = lecciones.findIndex((l) => l.length < min); i !== -1 && lecciones.length > 1; i = lecciones.findIndex((l) => l.length < min)) {
    const prev = lecciones[i - 1], next = lecciones[i + 1];
    const j = !prev ? i + 1 : !next ? i - 1 : prev.length >= next.length ? i - 1 : i + 1;
    const vecina = lecciones[j];
    if (lecciones[i].length + vecina.length <= max) {
      const unidas = j < i ? [...vecina, ...lecciones[i]] : [...lecciones[i], ...vecina];
      lecciones.splice(Math.min(i, j), 2, unidas);
    } else {
      const faltan = min - lecciones[i].length;
      if (j < i) lecciones[i].unshift(...vecina.splice(vecina.length - faltan, faltan));
      else lecciones[i].push(...vecina.splice(0, faltan));
    }
  }
  return lecciones;
}

function titulo(xs) {
  const albums = [...new Set(xs.map((e) => e.album))];
  if (albums.length === 1) return albums[0];
  if (albums.length === 2) return `${albums[0]} y ${albums[1]}`;
  return `${albums[0]}, ${albums[1]} y más`;
}

const ROMANO = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function hacerSubmundo(mundoId, categoria, lista) {
  const lecciones = hacerLecciones(lista, ruta.leccion);
  // Si un mismo título se repite (un grupo repartido en varias lecciones), se numera: I, II…
  const titulos = lecciones.map(titulo);
  const vistos = {};
  const finales = titulos.map((t) => {
    if (titulos.filter((x) => x === t).length < 2) return t;
    vistos[t] = (vistos[t] || 0) + 1;
    return `${t} ${ROMANO[vistos[t] - 1] ?? vistos[t]}`;
  });
  const id = `${mundoId}-${categoria}`;
  const nodos = [];
  let desdeRepaso = [];
  lecciones.forEach((xs, i) => {
    nodos.push({ id: `${id}-l${i + 1}`, tipo: 'leccion', titulo: finales[i], ejemplares: xs.map((e) => e.id) });
    desdeRepaso.push(...xs.map((e) => e.id));
    if ((i + 1) % ruta.repasoCada === 0) {
      nodos.push({ id: `${id}-r${(i + 1) / ruta.repasoCada}`, tipo: 'repaso', titulo: 'Repaso', ejemplares: desdeRepaso });
      desdeRepaso = [];
    }
  });
  if (desdeRepaso.length && lecciones.length > ruta.repasoCada) {
    nodos.push({ id: `${id}-rf`, tipo: 'repaso', titulo: 'Repaso final', ejemplares: lista.map((e) => e.id) });
  }
  return { id, categoria, total: lista.length, nodos };
}

function hacerMundo(numero, porCategoria) {
  const id = `m${numero}`;
  const submundos = CATEGORIAS.filter((c) => porCategoria[c]?.length).map((c) => hacerSubmundo(id, c, porCategoria[c]));
  const total = submundos.reduce((n, s) => n + s.total, 0);
  return { id, numero, total, submundos, examen: { preguntas: Math.min(ruta.examen.preguntas, total) } };
}

const mundos = [];
const enRuta = new Set();
const packRuta = packs.find((p) => p.id === ruta.primerMundo);
if (!packRuta) warnings.push(`ruta: no existe el pack ${ruta.primerMundo}`);
{
  const xs = (packRuta?.ejemplares ?? []).map((id) => {
    const e = porId.get(id);
    if (!e) warnings.push(`ruta: ejemplar desconocido ${id}`);
    else if (!jugable(e)) warnings.push(`ruta: ${e.id} no tiene fotos para jugar`);
    return e && jugable(e) ? e : null;
  }).filter(Boolean);
  const porCat = {};
  for (const e of ordenar(xs)) { (porCat[e.categoria] ??= []).push(e); enRuta.add(e.id); }
  mundos.push(hacerMundo(1, porCat));
}
const restantes = {};
for (const e of ordenar(catalogo.filter((e) => !enRuta.has(e.id) && jugable(e)))) (restantes[e.categoria] ??= []).push(e);
while (Object.values(restantes).some((l) => l.length)) {
  const quedan = Object.fromEntries(CATEGORIAS.map((c) => [c, restantes[c]?.length ?? 0]));
  const total = Object.values(quedan).reduce((a, b) => a + b, 0);
  const tam = Math.min(ruta.tamanoMundo, total);
  const minimo = (c) => Math.min(ruta.minPorDisciplina, quedan[c]);
  const cuota = {};
  for (const c of CATEGORIAS) if (quedan[c]) cuota[c] = Math.min(quedan[c], Math.max(minimo(c), Math.round((tam * quedan[c]) / total)));
  const suma = () => Object.values(cuota).reduce((a, b) => a + b, 0);
  // Ajuste al tamaño del mundo: se recorta de la disciplina con más cuota y se añade a la que más contenido tiene pendiente.
  while (suma() > tam) {
    const c = Object.keys(cuota).filter((k) => cuota[k] > minimo(k)).sort((a, b) => cuota[b] - cuota[a])[0];
    if (!c) break;
    cuota[c]--;
  }
  while (suma() < tam) {
    const c = Object.keys(cuota).filter((k) => cuota[k] < quedan[k]).sort((a, b) => (quedan[b] - cuota[b]) - (quedan[a] - cuota[a]))[0];
    if (!c) break;
    cuota[c]++;
  }
  // No dejar restos diminutos de una disciplina para el mundo siguiente.
  for (const c of Object.keys(cuota)) if (quedan[c] - cuota[c] > 0 && quedan[c] - cuota[c] < ruta.minPorDisciplina) cuota[c] = quedan[c];
  const porCat = {};
  for (const c of Object.keys(cuota)) { porCat[c] = restantes[c].splice(0, cuota[c]); porCat[c].forEach((e) => enRuta.add(e.id)); }
  mundos.push(hacerMundo(mundos.length + 1, porCat));
}
const fueraDeRuta = catalogo.filter((e) => !enRuta.has(e.id)).map((e) => e.id);

// ---------- Índice ligero para distractores ----------

const nameIndex = specimens.map((s) => {
  const x = { id: s.id, c: s.categoria, a: s.album, n: s.nombre.principal };
  if (s.nombre.cientifico && s.nombre.cientifico !== s.nombre.principal) x.sci = s.nombre.cientifico;
  if (s.taxonomia?.familia) x.fam = s.taxonomia.familia;
  if (s.taxonomia?.genero) x.gen = s.taxonomia.genero;
  if (s.nombre.formato === 'cientifico') x.f = 1;
  if (s.prioridad === 'A') x.p = 1;
  return x;
});

// ---------- Salida ----------

const outDir = path.join(ROOT, 'src/content/generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'catalogo.json'), JSON.stringify(catalogo) + '\n');
fs.writeFileSync(path.join(outDir, 'ruta.json'), JSON.stringify({
  version: 1,
  config: { aprobado: ruta.examen.aprobado },
  catalogo: { ejemplares: catalogo.length, fotos: images.size, enRuta: enRuta.size, fueraDeRuta: fueraDeRuta.length },
  mundos,
}, null, 1) + '\n');
fs.writeFileSync(path.join(outDir, 'name-index.json'), JSON.stringify(nameIndex) + '\n');
const antiguo = path.join(outDir, 'game-content.json');
if (fs.existsSync(antiguo)) fs.unlinkSync(antiguo); // sustituido por catalogo.json + ruta.json

const lecciones = mundos.flatMap((m) => m.submundos.flatMap((sm) => sm.nodos)).filter((n) => n.tipo === 'leccion').length;
console.log(`Catálogo: ${catalogo.length} ejemplares · ${images.size} fotos`);
console.log(`Ruta: ${mundos.length} mundos · ${lecciones} lecciones · ${enRuta.size} ejemplares en ruta · fuera de ruta (sin foto para jugar): ${fueraDeRuta.length}`);
for (const w of warnings) console.warn('⚠', w);
if (warnings.length) process.exitCode = 1;
