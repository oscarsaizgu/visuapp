// Qué toca practicar ahora (botón CONTINUAR).
// Primero repasos pendientes; después nuevos, priorizando los de prioridad A y los que
// ya han salido en algún VISU, e intercalando categorías para que la sesión sea variada.
import type { Ejemplar } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';
import { haSalidoEnExamen } from './dailyPick';
import { diasEntre } from './daily';
import { INTERVALOS } from './srs';

export interface PlanSesion {
  repasos: string[];
  nuevos: string[];
  ejemplares: string[];
  categorias: string[];
  /** Estimación: TAMANO × SEGUNDOS_POR_IDENTIFICACION, redondeado hacia arriba. */
  minutos: number;
}

export const TAMANO_SESION = 10;
/** Tiempo medio supuesto por identificación (mirar, responder y leer el feedback). */
export const SEGUNDOS_POR_IDENTIFICACION = 45;

/** Reparte en turno rotatorio por categoría, respetando el orden de cada una. */
function intercalar(lista: Ejemplar[]): Ejemplar[] {
  const grupos = new Map<string, Ejemplar[]>();
  for (const e of lista) grupos.set(e.categoria, [...(grupos.get(e.categoria) ?? []), e]);
  const colas = [...grupos.values()];
  const out: Ejemplar[] = [];
  while (colas.some((c) => c.length)) for (const c of colas) { const e = c.shift(); if (e) out.push(e); }
  return out;
}

export function planificarSesion(
  ejemplares: Ejemplar[],
  progreso: Record<string, ProgresoEjemplar>,
  hoy: string,
  tamano = TAMANO_SESION,
): PlanSesion {
  // Repasos: primero los más retrasados en proporción a su intervalo (un día tarde en la caja 1
  // pesa más que un día tarde en la caja 5); a igualdad, los que más se han olvidado (lapsos).
  const retraso = (id: string) => {
    const p = progreso[id];
    return diasEntre(p.proximaRevision!, hoy) / Math.max(1, INTERVALOS[p.caja] ?? 1) + 0.01 * p.lapsos;
  };
  const repasos = ejemplares
    .filter((e) => { const p = progreso[e.id]; return p?.proximaRevision != null && p.proximaRevision <= hoy; })
    .sort((a, b) => retraso(b.id) - retraso(a.id) || (progreso[a.id].proximaRevision! < progreso[b.id].proximaRevision! ? -1 : 1))
    .slice(0, tamano);
  // Sin límite diario de nuevos: el jugador avanza tanto como quiera cada día.
  const huecoNuevos = Math.max(0, tamano - repasos.length);

  const nuevos = intercalar(
    ejemplares
      .filter((e) => !progreso[e.id] || progreso[e.id].vecesVisto === 0)
      .sort((a, b) => (a.prioridad < b.prioridad ? -1 : a.prioridad > b.prioridad ? 1 : 0)
        || Number(haSalidoEnExamen(b)) - Number(haSalidoEnExamen(a))),
  ).slice(0, huecoNuevos);

  const elegidos = [...repasos, ...nuevos];
  return {
    repasos: repasos.map((e) => e.id),
    nuevos: nuevos.map((e) => e.id),
    ejemplares: elegidos.map((e) => e.id),
    categorias: [...new Set(elegidos.map((e) => e.categoria))],
    minutos: Math.ceil((elegidos.length * SEGUNDOS_POR_IDENTIFICACION) / 60),
  };
}
