// "Ejemplar del día": un ejemplar que ya ha salido en examen, elegido según lo que
// más te conviene estudiar hoy. Dentro de cada grupo, la elección es estable para el día.
import type { Ejemplar } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';

export function indiceDelDia(dia: string, n: number): number {
  let h = 2166136261;
  for (let i = 0; i < dia.length; i++) h = Math.imul(h ^ dia.charCodeAt(i), 16777619);
  return n ? (h >>> 0) % n : 0;
}

export type MotivoDelDia = 'repaso' | 'dificil' | 'nuevo' | 'mantener';

export function haSalidoEnExamen(e: Ejemplar): boolean {
  return e.visu.anios.length > 0 || e.visu.otros.length > 0;
}

/**
 * Prioridad: 1) toca repasarlo hoy, 2) te está costando (más fallos que aciertos o caja ≤ 1),
 * 3) aún no lo has visto, 4) ya lo dominas (para mantenerlo).
 */
export function elegirEjemplarDelDia(
  ejemplares: Ejemplar[],
  progreso: Record<string, ProgresoEjemplar>,
  hoy: string,
): { ejemplar: Ejemplar; motivo: MotivoDelDia } | undefined {
  const pool = ejemplares.filter(haSalidoEnExamen);
  const grupos: Record<MotivoDelDia, Ejemplar[]> = { repaso: [], dificil: [], nuevo: [], mantener: [] };
  for (const e of pool) {
    const p = progreso[e.id];
    if (!p || p.vecesVisto === 0) grupos.nuevo.push(e);
    else if (p.proximaRevision != null && p.proximaRevision <= hoy) grupos.repaso.push(e);
    else if (p.errores > p.aciertos || p.caja <= 1) grupos.dificil.push(e);
    else grupos.mantener.push(e);
  }
  for (const motivo of ['repaso', 'dificil', 'nuevo', 'mantener'] as const) {
    const g = grupos[motivo];
    if (g.length) return { ejemplar: g[indiceDelDia(hoy, g.length)], motivo };
  }
  return undefined;
}
