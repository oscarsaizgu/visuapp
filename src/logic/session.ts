// Construcción de una sesión de identificación.
import type { Ejemplar } from '../types/content';
import type { EntradaIndice, Pregunta } from '../types/game';
import type { ProgresoEjemplar } from '../types/progress';
import { elegirDistractores } from './distractors';
import { elegirFoto } from './imagePick';
import { opcionDesdeEjemplar, opcionDesdeIndice } from './optionText';
import { barajar, type Rng } from './rng';
import { planificarSesion, TAMANO_SESION } from './sessionPlan';

export interface Contexto {
  progreso: Record<string, ProgresoEjemplar>;
  indice: EntradaIndice[];
  porId: Map<string, EntradaIndice>;
  rng: Rng;
  /** Fotos marcadas como "da pistas" (se actualiza durante la sesión). */
  ocultas: Set<string>;
}

export function crearPregunta(
  e: Ejemplar,
  ctx: Contexto,
  opts: { reintento: boolean; pendiente: boolean; evitarImagen?: string; n?: number },
): Pregunta | undefined {
  const p = ctx.progreso[e.id];
  const imagen = elegirFoto(e, p, ctx.rng, ctx.ocultas, opts.evitarImagen);
  const entrada = ctx.porId.get(e.id);
  if (!imagen || !entrada) return undefined;
  const distractores = elegirDistractores(entrada, ctx.indice, p?.caja ?? 0, ctx.rng);
  return {
    clave: `${e.id}#${opts.n ?? 0}${opts.reintento ? 'r' : ''}`,
    ejemplarId: e.id,
    imagen,
    opciones: barajar([opcionDesdeEjemplar(e), ...distractores.map(opcionDesdeIndice)], ctx.rng),
    reintento: opts.reintento,
    pendiente: opts.pendiente,
  };
}

/**
 * Sesión recomendada (repasos + nuevos). Si no queda nada pendiente, práctica libre con
 * los ejemplares menos dominados; en ese caso no da la XP completa.
 */
export function crearSesion(activos: Ejemplar[], ctx: Contexto, hoy: string): { preguntas: Pregunta[]; practica: boolean } {
  const plan = planificarSesion(activos, ctx.progreso, hoy);
  const porId = new Map(activos.map((e) => [e.id, e]));
  let lista = plan.ejemplares.map((id) => porId.get(id)!).filter(Boolean);
  const practica = lista.length === 0;
  if (practica) {
    lista = barajar(activos, ctx.rng)
      .sort((a, b) => (ctx.progreso[a.id]?.caja ?? 0) - (ctx.progreso[b.id]?.caja ?? 0))
      .slice(0, TAMANO_SESION);
  }
  const preguntas = lista
    .map((e, n) => crearPregunta(e, ctx, { reintento: false, pendiente: !practica, n }))
    .filter((q): q is Pregunta => q !== undefined);
  return { preguntas, practica };
}
