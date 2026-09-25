// Qué toca practicar ahora (botón CONTINUAR).
// Primero repasos pendientes; después nuevos, priorizando los de prioridad A y los que
// ya han salido en algún VISU, e intercalando categorías para que la sesión sea variada.
import type { Ejemplar } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';

export interface PlanSesion {
  repasos: string[];
  nuevos: string[];
  ejemplares: string[];
  categorias: string[];
}

export const TAMANO_SESION = 10;

function haSalido(e: Ejemplar): boolean {
  return e.visu.anios.length > 0 || e.visu.otros.length > 0;
}

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
  const repasos = ejemplares
    .filter((e) => { const p = progreso[e.id]; return p?.proximaRevision != null && p.proximaRevision <= hoy; })
    .sort((a, b) => (progreso[a.id].proximaRevision! < progreso[b.id].proximaRevision! ? -1 : 1))
    .slice(0, tamano);

  const nuevos = intercalar(
    ejemplares
      .filter((e) => !progreso[e.id] || progreso[e.id].vecesVisto === 0)
      .sort((a, b) => (a.prioridad < b.prioridad ? -1 : a.prioridad > b.prioridad ? 1 : 0)
        || Number(haSalido(b)) - Number(haSalido(a))),
  ).slice(0, Math.max(0, tamano - repasos.length));

  const elegidos = [...repasos, ...nuevos];
  return {
    repasos: repasos.map((e) => e.id),
    nuevos: nuevos.map((e) => e.id),
    ejemplares: elegidos.map((e) => e.id),
    categorias: [...new Set(elegidos.map((e) => e.categoria))],
  };
}
