// Listas de la sección Estudiar: qué repasar, qué descubrir y búsqueda por nombre.
import type { Ejemplar } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';
import { diasEntre } from './daily';

export type MotivoRepaso = 'toca-hoy' | 'fallado' | 'cuesta';

export const TEXTO_MOTIVO: Record<MotivoRepaso, string> = {
  'toca-hoy': 'Toca repasarlo',
  fallado: 'Lo fallaste la última vez',
  cuesta: 'Te está costando',
};

/**
 * Ejemplares que conviene volver a estudiar, del más urgente al menos:
 * 1) repaso vencido, 2) último intento fallado, 3) más fallos que aciertos o caja ≤ 1.
 */
export function listaRepaso(
  ejemplares: Ejemplar[],
  progreso: Record<string, ProgresoEjemplar>,
  hoy: string,
): { ejemplar: Ejemplar; motivo: MotivoRepaso }[] {
  const out: { ejemplar: Ejemplar; motivo: MotivoRepaso; orden: number }[] = [];
  for (const e of ejemplares) {
    const p = progreso[e.id];
    if (!p || p.vecesVisto === 0) continue;
    const ultimo = p.historial.at(-1);
    if (p.proximaRevision != null && p.proximaRevision <= hoy) out.push({ ejemplar: e, motivo: 'toca-hoy', orden: diasEntre(hoy, p.proximaRevision) });
    else if (ultimo && !ultimo.ok) out.push({ ejemplar: e, motivo: 'fallado', orden: 1000 });
    else if (p.errores > p.aciertos || p.caja <= 1) out.push({ ejemplar: e, motivo: 'cuesta', orden: 2000 - p.errores });
  }
  return out.sort((a, b) => a.orden - b.orden).map(({ ejemplar, motivo }) => ({ ejemplar, motivo }));
}

/** Ejemplares activos que aún no has descubierto (ni en el juego ni abriendo su ficha). */
export function sinDescubrir(ejemplares: Ejemplar[], progreso: Record<string, ProgresoEjemplar>): Ejemplar[] {
  return ejemplares.filter((e) => !progreso[e.id]?.descubierto);
}

/** Minúsculas y sin tildes, para buscar "galena" o "Salamandra" sin preocuparse de acentos. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function coincide(e: Ejemplar, consulta: string): boolean {
  const q = normalizar(consulta);
  if (!q) return true;
  return [e.nombre.principal, e.nombre.cientifico ?? '', ...e.aceptados, ...(e.nombre.variantes ?? []), e.album]
    .some((t) => normalizar(t).includes(q));
}

/** "hoy", "mañana", "en 3 días", "hace 2 días"… */
export function diaRelativo(dia: string, hoy: string): string {
  const d = diasEntre(hoy, dia);
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d === -1) return 'ayer';
  if (Math.abs(d) > 60) {
    const [y, m, dd] = dia.split('-').map(Number);
    return `el ${new Date(y, m - 1, dd).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return d > 0 ? `en ${d} días` : `hace ${-d} días`;
}
