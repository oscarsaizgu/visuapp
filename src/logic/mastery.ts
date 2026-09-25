// Nivel de dominio de un ejemplar, derivado del comportamiento (caja Leitner + aciertos).
import type { ProgresoEjemplar } from '../types/progress';

export type NivelDominio = 'nuevo' | 'aprendiendo' | 'familiar' | 'dominado' | 'muy-dominado';

export const NIVELES_DOMINIO: NivelDominio[] = ['nuevo', 'aprendiendo', 'familiar', 'dominado', 'muy-dominado'];

export const NOMBRE_NIVEL: Record<NivelDominio, string> = {
  nuevo: 'Nuevo',
  aprendiendo: 'Aprendiendo',
  familiar: 'Familiar',
  dominado: 'Dominado',
  'muy-dominado': 'Muy dominado',
};

const PESO: Record<NivelDominio, number> = {
  nuevo: 0, aprendiendo: 0.25, familiar: 0.5, dominado: 0.8, 'muy-dominado': 1,
};

/**
 * @param fotosJugables nº de fotos aptas para jugar: para "muy dominado" hay que haber
 * acertado con 2 fotos distintas (o con la única que haya).
 */
export function nivelDominio(p: ProgresoEjemplar | undefined, fotosJugables = 2): NivelDominio {
  if (!p || p.vecesVisto === 0) return 'nuevo';
  if (p.caja <= 1) return 'aprendiendo';
  if (p.caja === 2) return 'familiar';
  const variedad = p.imagenesAcertadas.length >= Math.min(2, Math.max(1, fotosJugables));
  if (p.caja >= 5 && variedad) return 'muy-dominado';
  return 'dominado';
}

export function pesoDominio(n: NivelDominio): number {
  return PESO[n];
}

/** Dominio medio (0–1) de un conjunto de ejemplares. */
export function dominioMedio(ids: string[], progreso: Record<string, ProgresoEjemplar>): number {
  if (!ids.length) return 0;
  return ids.reduce((acc, id) => acc + PESO[nivelDominio(progreso[id])], 0) / ids.length;
}

/** Cuántos ejemplares hay en cada nivel de dominio. */
export function distribucionDominio(
  ids: string[],
  progreso: Record<string, ProgresoEjemplar>,
): Record<NivelDominio, number> {
  const d: Record<NivelDominio, number> = { nuevo: 0, aprendiendo: 0, familiar: 0, dominado: 0, 'muy-dominado': 0 };
  for (const id of ids) d[nivelDominio(progreso[id])]++;
  return d;
}
