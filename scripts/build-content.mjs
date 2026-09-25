// Compone el contenido del juego: content/base + content/curation → src/content/generated.
// Uso: node scripts/build-content.mjs   (también se ejecuta con `npm run content`)
//
// - game-content.json: solo los ejemplares ACTIVOS (packs con "activo": true),
//   con sus fotos ya resueltas (qué se puede usar para jugar y qué solo para estudiar).
// - name-index.json: índice ligero de TODO el catálogo, para generar distractores.
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

const activeIds = new Set();
const activePacks = [];
for (const p of packs) {
  if (!p.activo) continue;
  activePacks.push({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, ejemplares: p.ejemplares.length });
  for (const id of p.ejemplares) {
    if (byId.has(id)) activeIds.add(id);
    else warnings.push(`pack ${p.id}: ejemplar desconocido ${id}`);
  }
}

const ejemplares = [];
for (const s of specimens) {
  if (!activeIds.has(s.id)) continue;
  const merged = { ...s, ...(fixes[s.id] || {}) };
  const imgs = merged.imagenes.map(resolveImage).filter((i) => i.ficha);
  if (!imgs.some((i) => i.juego)) warnings.push(`${s.id}: ninguna foto apta para jugar`);
  delete merged.origen;
  ejemplares.push({ ...merged, imagenes: imgs, portada: pickCover(imgs) });
}

const porCategoria = {};
for (const s of specimens) porCategoria[s.categoria] = (porCategoria[s.categoria] || 0) + 1;

const outDir = path.join(ROOT, 'src/content/generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'game-content.json'), JSON.stringify({
  version: 1,
  catalogo: { ejemplares: specimens.length, fotos: images.size, porCategoria },
  packs: activePacks,
  ejemplares,
}, null, 1) + '\n');

const nameIndex = specimens.map((s) => {
  const x = { id: s.id, c: s.categoria, a: s.album, n: s.nombre.principal };
  if (s.nombre.cientifico && s.nombre.cientifico !== s.nombre.principal) x.sci = s.nombre.cientifico;
  if (s.taxonomia?.familia) x.fam = s.taxonomia.familia;
  if (s.taxonomia?.genero) x.gen = s.taxonomia.genero;
  if (s.nombre.formato === 'cientifico') x.f = 1;
  if (s.prioridad === 'A') x.p = 1;
  return x;
});
fs.writeFileSync(path.join(outDir, 'name-index.json'), JSON.stringify(nameIndex) + '\n');

const playable = ejemplares.reduce((n, s) => n + s.imagenes.filter((i) => i.juego).length, 0);
console.log(`Activos: ${ejemplares.length} ejemplares · ${playable} fotos para jugar · catálogo ${specimens.length} / ${images.size} fotos`);
for (const w of warnings) console.warn('⚠', w);
if (warnings.length) process.exitCode = 1;
