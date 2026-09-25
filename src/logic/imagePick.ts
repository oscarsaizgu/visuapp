// Qué foto se enseña: se rota entre las fotos jugables para aprender la especie y no la foto.
import type { Ejemplar, Imagen } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';
import { barajar, type Rng } from './rng';

export function elegirFoto(
  e: Ejemplar,
  p: ProgresoEjemplar | undefined,
  rng: Rng,
  ocultas: ReadonlySet<string> = new Set(),
  evitar?: string,
): Imagen | undefined {
  const jugables = e.imagenes.filter((i) => i.juego && !ocultas.has(i.id));
  if (!jugables.length) return undefined;
  const ultima = evitar ?? p?.historial.at(-1)?.imagenId;
  const acertadas = new Set(p?.imagenesAcertadas ?? []);
  const pool = jugables.length > 1 ? jugables.filter((i) => i.id !== ultima) : jugables;
  // Primero las que aún no has acertado; entre ellas, al azar.
  const nuevas = pool.filter((i) => !acertadas.has(i.id));
  return barajar(nuevas.length ? nuevas : pool, rng)[0];
}
