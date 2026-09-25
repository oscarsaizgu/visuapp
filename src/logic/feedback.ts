// Explicaciones del feedback. Todo sale de datos del catálogo: rasgos, grupo y taxonomía.
// Nunca se inventan rasgos que la ficha no tiene.
import type { Ejemplar } from '../types/content';
import type { EntradaIndice } from '../types/game';

/** Cómo se clasifica el ejemplar: grupo y, si existen, orden y familia. */
export function clasificacion(e: Ejemplar): string {
  const partes = [e.album];
  if (e.taxonomia?.orden) partes.push(`orden ${e.taxonomia.orden}`);
  if (e.taxonomia?.familia) partes.push(`familia ${e.taxonomia.familia}`);
  return partes.join(' · ');
}

/** En qué se parece o se diferencia la opción elegida (errónea) del ejemplar correcto. */
export function comparacion(e: Ejemplar, x: EntradaIndice): string {
  const gen = e.taxonomia?.genero, fam = e.taxonomia?.familia;
  if (gen && x.gen === gen) return `Es del mismo género (${gen}): la diferencia está en los detalles.`;
  if (fam && x.fam === fam) return `Es de la misma familia (${fam}), pero de otro género.`;
  if (x.a === e.album) {
    return fam && x.fam
      ? `Es del mismo grupo (${e.album}), pero de otra familia: ${x.fam} frente a ${fam}.`
      : `Es del mismo grupo (${e.album}).`;
  }
  return `Es de otro grupo: ${x.a}, frente a ${e.album}.`;
}
