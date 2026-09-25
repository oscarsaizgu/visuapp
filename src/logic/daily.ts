// Fechas locales, objetivo diario y racha de días.
import type { Perfil } from '../types/progress';

/** AAAA-MM-DD en hora local (no UTC: la racha debe seguir el día del usuario). */
export function claveDia(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diasEntre(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

export function hechasHoy(perfil: Perfil, hoy: string): number {
  return perfil.actividad[hoy] ?? 0;
}

/** La racha sigue viva si el objetivo se cumplió hoy o ayer. */
export function rachaVigente(perfil: Perfil, hoy: string): number {
  if (!perfil.ultimoDiaConObjetivo) return 0;
  return diasEntre(perfil.ultimoDiaConObjetivo, hoy) <= 1 ? perfil.rachaActual : 0;
}

/** Suma identificaciones de hoy y actualiza la racha al cumplir el objetivo diario. */
export function registrarActividad(perfil: Perfil, hoy: string, n = 1): Perfil {
  const hechas = (perfil.actividad[hoy] ?? 0) + n;
  const actividad = { ...perfil.actividad, [hoy]: hechas };
  if (hechas < perfil.objetivoDiario || perfil.ultimoDiaConObjetivo === hoy) return { ...perfil, actividad };
  const seguida = perfil.ultimoDiaConObjetivo !== null && diasEntre(perfil.ultimoDiaConObjetivo, hoy) === 1;
  const rachaActual = seguida ? perfil.rachaActual + 1 : 1;
  return { ...perfil, actividad, rachaActual, mejorRacha: Math.max(perfil.mejorRacha, rachaActual), ultimoDiaConObjetivo: hoy };
}
