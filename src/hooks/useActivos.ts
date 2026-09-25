// Ejemplares desbloqueados (mundos abiertos de la ruta), reactivo al progreso.
import { ejemplaresDesbloqueados } from '../content';
import { superados, useProgressStore } from '../store/useProgressStore';
import { useMemo } from 'react';

export function useActivos() {
  const examenes = useProgressStore((s) => s.ruta.examenes);
  return useMemo(() => ejemplaresDesbloqueados(superados({ lecciones: {}, repasos: {}, examenes, ultimoSubmundo: null })), [examenes]);
}
