// Construcción de sesiones de identificación para cada modo de juego.
import type { Ejemplar } from '../types/content';
import type { EntradaIndice, ModoJuego, OpcionFoto, Pregunta } from '../types/game';
import type { ProgresoEjemplar } from '../types/progress';
import { elegirDistractores } from './distractors';
import { elegirFoto } from './imagePick';
import { opcionDesdeEjemplar, opcionDesdeIndice } from './optionText';
import { barajar, type Rng } from './rng';
import { planificarSesion, TAMANO_SESION } from './sessionPlan';
import { listaRepaso } from './study';

export interface Contexto {
  progreso: Record<string, ProgresoEjemplar>;
  indice: EntradaIndice[];
  porId: Map<string, EntradaIndice>;
  rng: Rng;
  /** Fotos marcadas como "da pistas" (se actualiza durante la sesión). */
  ocultas: Set<string>;
  /** Ejemplares activos (para las fotos de "Elegir la foto"). */
  activos: Ejemplar[];
}

/** Partida Veloz: preguntas de sobra para que siempre se acabe por tiempo, no por falta de preguntas. */
export const PREGUNTAS_VELOZ = 200;
export const SEGUNDOS_VELOZ = 90;

/** Tres fotos de otros ejemplares activos, a ser posible del mismo grupo o categoría. */
function fotosDistractoras(e: Ejemplar, ctx: Contexto): OpcionFoto[] {
  const candidatos = ctx.activos.filter((x) => x.id !== e.id && x.nombre.principal !== e.nombre.principal);
  const orden = (x: Ejemplar) => (x.album === e.album ? 0 : x.categoria === e.categoria ? 1 : 2);
  const ordenados = barajar(candidatos, ctx.rng).sort((a, b) => orden(a) - orden(b));
  const out: OpcionFoto[] = [];
  for (const x of ordenados) {
    const imagen = elegirFoto(x, ctx.progreso[x.id], ctx.rng, ctx.ocultas);
    if (imagen) out.push({ id: x.id, imagen });
    if (out.length === 3) break;
  }
  return out;
}

export function crearPregunta(
  e: Ejemplar,
  ctx: Contexto,
  opts: { modo: ModoJuego; reintento: boolean; pendiente: boolean; evitarImagen?: string; n?: number },
): Pregunta | undefined {
  const p = ctx.progreso[e.id];
  const imagen = elegirFoto(e, p, ctx.rng, ctx.ocultas, opts.evitarImagen);
  const entrada = ctx.porId.get(e.id);
  if (!imagen || !entrada) return undefined;
  const base = {
    clave: `${e.id}#${opts.n ?? 0}${opts.reintento ? 'r' : ''}`,
    modo: opts.modo,
    ejemplarId: e.id,
    imagen,
    reintento: opts.reintento,
    pendiente: opts.pendiente,
  };
  if (opts.modo === 'escribir') return { ...base, opciones: [] };
  if (opts.modo === 'elegir-foto') {
    const otras = fotosDistractoras(e, ctx);
    if (otras.length < 3) return undefined;
    return { ...base, opciones: [], fotos: barajar([{ id: e.id, imagen }, ...otras], ctx.rng) };
  }
  const distractores = elegirDistractores(entrada, ctx.indice, p?.caja ?? 0, ctx.rng);
  return { ...base, opciones: barajar([opcionDesdeEjemplar(e), ...distractores.map(opcionDesdeIndice)], ctx.rng) };
}

/**
 * - Normal (opción múltiple, escribir, elegir la foto): repasos + nuevos del plan; si no queda
 *   nada, práctica libre con lo menos dominado (da menos XP).
 * - Repaso: solo lo que te conviene repasar (vencido, fallado o difícil).
 * - Veloz: preguntas al azar de todo lo activo; no mueve el dominio.
 */
export function crearSesion(
  activos: Ejemplar[],
  ctx: Contexto,
  hoy: string,
  modo: ModoJuego = 'opcion-multiple',
  nuevosHoy = 0,
): { preguntas: Pregunta[]; practica: boolean } {
  let lista: Ejemplar[];
  let practica = false;
  if (modo === 'veloz') {
    const vueltas = Math.ceil(PREGUNTAS_VELOZ / Math.max(1, activos.length));
    lista = Array.from({ length: vueltas }, () => barajar(activos, ctx.rng)).flat().slice(0, PREGUNTAS_VELOZ);
    practica = true;
  } else if (modo === 'repaso') {
    lista = listaRepaso(activos, ctx.progreso, hoy).slice(0, TAMANO_SESION).map((r) => r.ejemplar);
  } else {
    const plan = planificarSesion(activos, ctx.progreso, hoy, TAMANO_SESION, nuevosHoy);
    const porId = new Map(activos.map((e) => [e.id, e]));
    lista = plan.ejemplares.map((id) => porId.get(id)!).filter(Boolean);
    if (!lista.length) {
      practica = true;
      lista = barajar(activos, ctx.rng)
        .sort((a, b) => (ctx.progreso[a.id]?.caja ?? 0) - (ctx.progreso[b.id]?.caja ?? 0))
        .slice(0, TAMANO_SESION);
    }
  }
  const preguntas = lista
    .map((e, n) => crearPregunta(e, ctx, { modo, reintento: false, pendiente: !practica, n }))
    .filter((q): q is Pregunta => q !== undefined);
  return { preguntas, practica };
}
