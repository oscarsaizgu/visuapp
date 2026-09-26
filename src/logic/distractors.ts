// Distractores "inteligentes": salen del catálogo completo (no solo de lo activo) y se
// eligen por cercanía taxonómica. Cuanto más dominas un ejemplar, más parecidos son.
import type { EntradaIndice } from '../types/game';
import { barajar, type Rng } from './rng';
import { opcionDesdeIndice } from './optionText';

/** Nivel de parecido con el ejemplar correcto (menor = más parecido). */
function cercania(x: EntradaIndice, ok: EntradaIndice): number {
  if (ok.gen && x.gen === ok.gen) return 0; // mismo género
  if (ok.fam && x.fam === ok.fam) return 1; // misma familia
  if (x.a === ok.a) return 2; // mismo álbum (grupo del catálogo)
  return 3; // misma categoría
}

/** Misma especie con otro nombre (p. ej. una variedad): no puede ser distractor. */
function mismaEspecie(x: EntradaIndice, ok: EntradaIndice): boolean {
  const base = (s?: string) => (s ?? '').split(' ').slice(0, 2).join(' ').toLowerCase();
  return !!ok.sci && !!x.sci && base(x.sci) === base(ok.sci);
}

/**
 * Cuántos distractores de cada nivel de parecido se piden según la caja Leitner:
 * al principio, pocos parecidos; después, los más difíciles primero.
 */
function cupos(caja: number): number[] {
  if (caja <= 0) return [0, 0, 1, 2];
  if (caja <= 2) return [1, 1, 1, 0];
  return [3, 0, 0, 0];
}

export function elegirDistractores(
  correcto: EntradaIndice,
  indice: EntradaIndice[],
  caja: number,
  rng: Rng,
  n = 3,
  /** Se ponen primero si son válidos (p. ej. los nombres que el jugador confunde). */
  preferidos: EntradaIndice[] = [],
): EntradaIndice[] {
  const textoOk = opcionDesdeIndice(correcto).texto.toLowerCase();
  const niveles: EntradaIndice[][] = [[], [], [], []];
  const noDistractor = new Set(correcto.nd ?? []);
  for (const x of indice) {
    if (x.id === correcto.id || x.c !== correcto.c || mismaEspecie(x, correcto) || noDistractor.has(x.id)) continue;
    if (opcionDesdeIndice(x).texto.toLowerCase() === textoOk) continue;
    niveles[cercania(x, correcto)].push(x);
  }
  // Dentro de cada nivel: al azar, pero primero los de prioridad A (los que más caen en examen).
  const ordenados = niveles.map((g) => barajar(g, rng).sort((a, b) => (b.p ?? 0) - (a.p ?? 0)));

  const elegidos: EntradaIndice[] = [];
  const textos = new Set([textoOk]);
  const tomar = (x: EntradaIndice) => {
    const t = opcionDesdeIndice(x).texto.toLowerCase();
    if (elegidos.length >= n || textos.has(t)) return; // sin textos repetidos
    textos.add(t);
    elegidos.push(x);
  };
  for (const x of preferidos) {
    if (x.id === correcto.id || x.c !== correcto.c || mismaEspecie(x, correcto) || noDistractor.has(x.id)) continue;
    tomar(x);
  }
  const cupo = cupos(caja);
  ordenados.forEach((g, i) => {
    let tomados = 0;
    for (const x of g) {
      if (tomados >= cupo[i]) break;
      const antes = elegidos.length;
      tomar(x);
      if (elegidos.length > antes) tomados++;
    }
  });
  // Si faltan, se rellena del más parecido al menos parecido.
  for (const g of ordenados) for (const x of g) tomar(x);
  return elegidos;
}
