// Qué foto se enseña al preguntar. La foto principal es la de APRENDER; para preguntar se usan
// las demás fotos jugables, y cada modo empieza por una distinta. Así se aprende el organismo,
// no una foto concreta.
import type { Ejemplar, Imagen } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';
import { barajar, type Rng } from './rng';

/** Desfase de cada modo en la rotación de fotos (Identifica, Repaso, Veloz, Escribir). */
const DESFASE: Record<string, number> = { 'opcion-multiple': 0, 'elegir-foto': 0, repaso: 1, veloz: 2, escribir: 3 };

/** Fotos con las que se puede preguntar: las jugables menos la principal, si hay otras. */
export function fotosDePregunta(e: Ejemplar, ocultas: ReadonlySet<string> = new Set()): Imagen[] {
  const jugables = e.imagenes.filter((i) => i.juego && !ocultas.has(i.id));
  const sinPrincipal = jugables.filter((i) => i.id !== e.portada);
  return sinPrincipal.length ? sinPrincipal : jugables;
}

export function elegirFoto(
  e: Ejemplar,
  p: ProgresoEjemplar | undefined,
  rng: Rng,
  ocultas: ReadonlySet<string> = new Set(),
  evitar?: string,
  modo?: string,
): Imagen | undefined {
  const pool = fotosDePregunta(e, ocultas);
  if (!pool.length) return undefined;
  const ultima = evitar ?? p?.historial.at(-1)?.imagenId;
  const candidatas = pool.length > 1 ? pool.filter((i) => i.id !== ultima) : pool;
  // Primero las que aún no has acertado.
  const acertadas = new Set(p?.imagenesAcertadas ?? []);
  const nuevas = candidatas.filter((i) => !acertadas.has(i.id));
  const grupo = nuevas.length ? nuevas : candidatas;
  if (modo === undefined) return barajar(grupo, rng)[0];
  // Cada modo arranca en una foto distinta y avanza una cada vez que ves el ejemplar.
  const inicio = (DESFASE[modo] ?? 0) + (p?.vecesVisto ?? 0);
  for (let k = 0; k < pool.length; k++) {
    const foto = pool[(inicio + k) % pool.length];
    if (grupo.includes(foto)) return foto;
  }
  return grupo[0];
}
