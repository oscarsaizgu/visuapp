// Ejemplares del catálogo completo emparentados con uno dado. No son "confusiones"
// verificadas: son parientes (mismo género, familia o grupo) según la clasificación del catálogo.
import type { Ejemplar } from '../types/content';
import type { EntradaIndice } from '../types/game';

export type Parentesco = 'genero' | 'familia' | 'grupo';

export function parientes(e: Ejemplar, indice: EntradaIndice[], max = 8): { entrada: EntradaIndice; parentesco: Parentesco }[] {
  const gen = e.taxonomia?.genero, fam = e.taxonomia?.familia;
  const base = (s?: string) => (s ?? '').split(' ').slice(0, 2).join(' ').toLowerCase();
  const miEspecie = base(e.nombre.cientifico);
  const out: { entrada: EntradaIndice; parentesco: Parentesco; orden: number }[] = [];
  for (const x of indice) {
    if (x.id === e.id || x.c !== e.categoria) continue;
    if (miEspecie && x.sci && base(x.sci) === miEspecie) continue; // variedades de la misma especie
    if (gen && x.gen === gen) out.push({ entrada: x, parentesco: 'genero', orden: 0 });
    else if (fam && x.fam === fam) out.push({ entrada: x, parentesco: 'familia', orden: 1 });
    else if (!gen && !fam && x.a === e.album) out.push({ entrada: x, parentesco: 'grupo', orden: 2 });
  }
  return out
    .sort((a, b) => a.orden - b.orden || (b.entrada.p ?? 0) - (a.entrada.p ?? 0) || a.entrada.n.localeCompare(b.entrada.n))
    .slice(0, max)
    .map(({ entrada, parentesco }) => ({ entrada, parentesco }));
}
