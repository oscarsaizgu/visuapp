// Versión distribuible de visu-game: solo fotos con licencia verificada.
// Uso: npm run build:distribuible   → carpeta dist-distribuible/
//
// 1. Genera el contenido con --distribuible en .distribuible/generated (no toca src/content/generated).
// 2. Compila la app con ese contenido (VISU_DISTRIBUIBLE=1, ver vite.config.ts).
// 3. Copia solo las fotos que usa ese contenido y un fichero CREDITOS.txt con autor y licencia de cada una.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GEN = path.join(ROOT, '.distribuible/generated');
const OUT = path.join(ROOT, 'dist-distribuible');
const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env }, shell: process.platform === 'win32' });

run('node', ['scripts/build-content.mjs', '--distribuible', '--out', GEN]);
run('npx', ['vite', 'build'], { VISU_DISTRIBUIBLE: '1' });

const catalogo = JSON.parse(fs.readFileSync(path.join(GEN, 'catalogo.json'), 'utf8'));
const creditos = [];
let copiadas = 0;
for (const e of catalogo) for (const img of e.imagenes) {
  if (!img.credito) throw new Error(`Foto sin licencia verificada en la versión distribuible: ${img.id}`);
  const dest = path.join(OUT, img.archivo);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'public', img.archivo), dest);
  copiadas++;
  creditos.push(`${img.archivo}\t${e.nombre.cientifico ?? e.nombre.principal}\t${img.credito.autor}\t${img.credito.licencia}\t${img.credito.url}`);
}
fs.copyFileSync(path.join(ROOT, 'public/favicon.svg'), path.join(OUT, 'favicon.svg'));
fs.writeFileSync(path.join(OUT, 'CREDITOS.txt'), `Fotografías de visu-game (versión distribuible)\nArchivo\tTaxón\tAutor\tLicencia\tOrigen\n${creditos.join('\n')}\n`);
console.log(`Versión distribuible en ${path.relative(ROOT, OUT)}: ${catalogo.length} ejemplares · ${copiadas} fotos, todas con licencia verificada (ver CREDITOS.txt).`);
