// Importación única del catálogo de Visu-Oposicion → content/base de visu-game.
//
// Uso:  node scripts/import-catalog.mjs <ruta a Visu-Oposicion> [--sin-fotos]
//
// - Solo LEE el repositorio original. No escribe nada en él.
// - No ejecuta su código: sus archivos de datos son JavaScript, así que se leen
//   como texto y se extraen los literales JSON que contienen.
// - Las fotos se copian byte a byte (sin recomprimir) a public/img/<ejemplar>/<n>.webp.
// - Solo regenera content/base. Nunca toca content/curation.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const SRC = args.find((a) => !a.startsWith('--'));
const COPY_PHOTOS = !args.includes('--sin-fotos');
if (!SRC) {
  console.error('Uso: node scripts/import-catalog.mjs <ruta a Visu-Oposicion> [--sin-fotos]');
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

// ---------- Extracción de literales JSON desde texto ----------

/** Devuelve el literal JSON ([...] o {...}) que empieza tras `marker`. */
function jsonAfter(text, marker, from = 0) {
  const at = text.indexOf(marker, from);
  if (at < 0) throw new Error(`No encuentro "${marker}"`);
  let i = at + marker.length;
  while (/\s/.test(text[i])) i++;
  const open = text[i];
  const close = open === '[' ? ']' : open === '{' ? '}' : null;
  if (!close) throw new Error(`Tras "${marker}" no hay un literal JSON`);
  let depth = 0, inStr = false, esc = false;
  for (let j = i; j < text.length; j++) {
    const ch = text[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return { value: JSON.parse(text.slice(i, j + 1)), end: j + 1 };
    }
  }
  throw new Error(`Literal sin cerrar tras "${marker}"`);
}

// ---------- Lectura de datos (mismo orden que el catálogo original) ----------

const especiesTxt = read('data/especies.js');
const extraTxt = read('data/extra.js');
const loteTxt = read('data/lote.js');

const raw = [
  ...jsonAfter(especiesTxt, 'window.ESPECIES=').value,
  ...jsonAfter(extraTxt, '.concat(').value,
  ...jsonAfter(loteTxt, '.concat(').value,
];
// lote.js añade campos (visu/otros) a fichas ya existentes.
const patches = jsonAfter(loteTxt, 'var P=').value;
for (const e of raw) if (patches[e.id]) Object.assign(e, patches[e.id]);

// Fotos: manifest base; extra-manifest sustituye; lote-manifest añade al final
// (si al ejemplar le faltaban pies de foto, el original los rellena con "asturnatura.com").
const manTxt = read('fotos/manifest.js');
const photos = jsonAfter(manTxt, 'window.FOTOS=').value;
const captions = jsonAfter(manTxt, 'window.FOTOS_CAP=').value;
const extraMan = read('fotos/extra-manifest.js');
{
  const f = jsonAfter(extraMan, 'var f=').value, c = jsonAfter(extraMan, 'var c=').value;
  for (const k in f) { photos[k] = f[k]; captions[k] = c[k]; }
}
const loteMan = read('fotos/lote-manifest.js');
{
  const f = jsonAfter(loteMan, 'var f=').value, c = jsonAfter(loteMan, 'var c=').value;
  for (const k in f) {
    const a = photos[k] || [], b = (captions[k] || []).slice();
    while (b.length < a.length) b.push('asturnatura.com');
    photos[k] = a.concat(f[k]);
    captions[k] = b.concat(c[k]);
  }
}

// ---------- Normalización al esquema propio de visu-game ----------

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const splitList = (s) => clean(s).split(',').map((x) => x.trim()).filter(Boolean);
const uniq = (xs) => [...new Set(xs.filter(Boolean))];

function categoria(e) {
  switch (e.tipo) {
    case 'mineral': return 'minerales';
    case 'roca': return 'rocas';
    case 'fosil': return 'fosiles';
    case 'geomorf': return 'geomorfologia';
    case 'micro':
      if (/Citolog/.test(e.grupo)) return 'citologia';
      if (/Histolog/.test(e.grupo)) return 'histologia';
      return 'microorganismos';
    default:
      if (e.reino === 'Animales') return 'zoologia';
      if (e.reino === 'Hongos' || /mixomicetos/i.test(e.reino)) return 'hongos';
      return 'botanica';
  }
}

const GEO = new Set(['minerales', 'rocas', 'fosiles', 'geomorfologia']);

function nombres(e) {
  const sci = clean(e.sci), com = clean(e.com);
  if (e.tipo === 'bio') {
    return {
      nombre: com
        ? { principal: com, comun: com, cientifico: sci, formato: 'comun' }
        : { principal: sci, cientifico: sci, formato: 'cientifico' },
      aceptados: uniq([sci, com, ...(e.alt || [])]),
    };
  }
  // En geología y microscopía "sci" es el nombre principal y "com" una lista de variantes.
  const variantes = uniq([...splitList(com), ...(e.alt || [])]).filter((v) => v !== sci);
  const n = { principal: sci, formato: e.tipo === 'fosil' ? 'cientifico' : 'comun' };
  if (e.tipo === 'fosil') n.cientifico = sci;
  if (variantes.length) n.variantes = variantes;
  return { nombre: n, aceptados: uniq([sci, ...variantes]) };
}

const years = (s) => uniq(clean(s).split(/[,\s]+/).filter((x) => /^\d{4}$/.test(x))).map(Number);

function taxonomia(e) {
  if (e.tipo !== 'bio') return undefined;
  const t = {
    reino: clean(e.reino), filo: clean(e.filum), clase: clean(e.clase),
    orden: clean(e.orden), familia: clean(e.familia), genero: clean(e.sci).split(' ')[0],
  };
  for (const k of Object.keys(t)) if (!t[k]) delete t[k];
  return t;
}

/** Ancho y alto leyendo solo la cabecera del .webp. */
function webpSize(file) {
  const b = fs.readFileSync(file);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  return [0, 0];
}

const VISTAS = /^(Hábito|Hojas?|Flor|Flores|Fruto|Frutos|Adulto|Fronde|Inflorescencia|Tallo|Semillas?|Corteza|Esporangio|Larva|Macho|Hembra|Detalle|Cono|Conos|Raíz|Pie|Sombrero|Láminas)/i;
function describeCaption(cap) {
  const c = clean(cap);
  if (!c) return {};
  if (/asturnatura/i.test(c)) return { fuente: 'asturnatura.com' };
  if (/^Lote/i.test(c)) return { fuente: c };
  if (/^Visu /i.test(c)) return { fuente: c, deExamen: true };
  if (VISTAS.test(c)) return { vista: c };
  return { pie: c };
}

const specimens = [];
const images = [];
let copied = 0, missing = 0;

for (const e of raw) {
  const cat = categoria(e);
  const { nombre, aceptados } = nombres(e);
  const album = clean(e.grupo).split(' · ').pop();
  const s = {
    id: e.id,
    dominio: GEO.has(cat) ? 'geologia' : 'biologia',
    categoria: cat,
    album,
    nombre,
    aceptados,
    prioridad: e.pri === 'A' ? 'A' : 'B',
    visu: { anios: years(e.visu), otros: splitList(e.otros) },
    origen: { fuente: 'visu-oposicion', tipo: e.tipo, grupo: clean(e.grupo) },
  };
  const tax = taxonomia(e); if (tax) s.taxonomia = tax;
  if (clean(e.est)) s.estatus = clean(e.est);
  if (clean(e.rasgos)) s.rasgos = clean(e.rasgos);
  if (clean(e.cant)) s.notas = clean(e.cant);
  if (clean(e.url)) s.referencia = clean(e.url);

  s.imagenes = [];
  (photos[e.id] || []).forEach((rel, i) => {
    const n = i + 1;
    const id = `${e.id}-${n}`;
    const archivo = `/img/${e.id}/${n}.webp`;
    const src = path.join(SRC, rel);
    let ancho = 0, alto = 0;
    if (fs.existsSync(src)) {
      [ancho, alto] = webpSize(src);
      if (COPY_PHOTOS) {
        const dst = path.join(ROOT, 'public', archivo);
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        copied++;
      }
    } else missing++;
    const marcas = [];
    if (Math.max(ancho, alto) < 500) marcas.push('baja-resolucion');
    const cap = describeCaption((captions[e.id] || [])[i]);
    if (cap.fuente === 'asturnatura.com') marcas.push('marca-agua');
    images.push({ id, ejemplarId: e.id, archivo, origen: 'visu-oposicion', rutaOriginal: rel, ancho, alto, ...cap, marcas });
    s.imagenes.push(id);
  });
  specimens.push(s);
}

const out = (name, data) =>
  fs.writeFileSync(path.join(ROOT, 'content/base', name), JSON.stringify(data, null, 1) + '\n');
out('specimens.json', specimens);
out('images.json', images);

const byCat = {};
for (const s of specimens) byCat[s.categoria] = (byCat[s.categoria] || 0) + 1;
console.log(`Ejemplares: ${specimens.length} · Fotos registradas: ${images.length} · Copiadas: ${copied} · No encontradas: ${missing}`);
console.log('Por categoría:', byCat);
