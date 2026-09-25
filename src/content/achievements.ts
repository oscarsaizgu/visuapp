// Insignias. Cada una es un dato: título, descripción, icono y cómo se mide su progreso.
// Para añadir una nueva basta con añadir una entrada a la lista.
import type { Icon } from '@phosphor-icons/react';
import { Binoculars, Eye, Fire, Flame, Lightning, Medal, Seal, Sparkle, Target, Timer, Trophy, Crown, Star, Books, GraduationCap, Globe, Path } from '@phosphor-icons/react';
import type { CategoriaId } from '../types/content';
import type { Snapshot } from '../logic/snapshot';
import { CATEGORIAS } from './categories';

export interface Insignia {
  id: string;
  titulo: string;
  descripcion: string;
  icono: Icon;
  /** [actual, objetivo]: se desbloquea cuando actual ≥ objetivo. */
  progreso: (s: Snapshot) => [number, number];
}

const PRIMERO: Record<CategoriaId, string> = {
  botanica: 'Primera planta o alga', zoologia: 'Primer animal', hongos: 'Primer hongo', microscopia: 'Primera preparación',
  minerales: 'Primer mineral', rocas: 'Primera roca', fosiles: 'Primer fósil', geomorfologia: 'Primer relieve',
};

const n = (x: number | undefined) => x ?? 0;

export const INSIGNIAS: Insignia[] = [
  { id: 'primera-leccion', titulo: 'Primera lección', descripcion: 'Completa tu primera lección de la ruta.', icono: Path, progreso: (s) => [s.leccionesCompletadas, 1] },
  { id: 'lecciones-25', titulo: 'Veinticinco lecciones', descripcion: 'Completa 25 lecciones de la ruta.', icono: GraduationCap, progreso: (s) => [s.leccionesCompletadas, 25] },
  { id: 'mundo-1', titulo: 'Primer mundo superado', descripcion: 'Aprueba el examen final de un mundo.', icono: Globe, progreso: (s) => [s.mundosSuperados, 1] },
  { id: 'mundos-5', titulo: 'Cinco mundos', descripcion: 'Aprueba el examen final de 5 mundos.', icono: Globe, progreso: (s) => [s.mundosSuperados, 5] },
  { id: 'primer-acierto', titulo: 'Primer hallazgo', descripcion: 'Acierta tu primera identificación.', icono: Sparkle, progreso: (s) => [s.aciertos, 1] },
  { id: 'aciertos-100', titulo: 'Cien identificaciones', descripcion: 'Acierta 100 identificaciones.', icono: Target, progreso: (s) => [s.aciertos, 100] },
  { id: 'aciertos-500', titulo: 'Ojo clínico', descripcion: 'Acierta 500 identificaciones.', icono: Eye, progreso: (s) => [s.aciertos, 500] },
  { id: 'racha-3', titulo: 'Tres días seguidos', descripcion: 'Cumple el objetivo diario 3 días seguidos.', icono: Flame, progreso: (s) => [s.mejorRacha, 3] },
  { id: 'racha-7', titulo: 'Una semana entera', descripcion: 'Cumple el objetivo diario 7 días seguidos.', icono: Fire, progreso: (s) => [s.mejorRacha, 7] },
  { id: 'racha-30', titulo: 'Un mes sin fallar', descripcion: 'Cumple el objetivo diario 30 días seguidos.', icono: Crown, progreso: (s) => [s.mejorRacha, 30] },
  { id: 'sesion-perfecta', titulo: 'Sesión perfecta', descripcion: 'Termina una sesión sin fallar ninguna a la primera.', icono: Star, progreso: (s) => [s.sesionesPerfectas, 1] },
  { id: 'combo-10', titulo: 'Combo ×10', descripcion: 'Encadena 10 aciertos seguidos.', icono: Lightning, progreso: (s) => [s.comboMax, 10] },
  { id: 'veloz-15', titulo: 'Reflejos', descripcion: 'Consigue 15 aciertos en una partida Veloz.', icono: Timer, progreso: (s) => [s.velozMejor, 15] },
  {
    id: 'examen-10', titulo: 'Carne de examen', descripcion: 'Acierta 10 ejemplares distintos que ya han salido en algún VISU.', icono: Seal,
    progreso: (s) => [s.examenAcertados, Math.max(1, Math.min(10, s.examenActivos))],
  },
  { id: 'minerales-10', titulo: '10 minerales identificados', descripcion: 'Acierta 10 identificaciones de minerales.', icono: Medal, progreso: (s) => [n(s.aciertosPorCategoria.minerales), 10] },
  {
    id: 'cazador-fosiles', titulo: 'Cazador de fósiles', descripcion: 'Acierta al menos una vez cada fósil de los mundos abiertos.', icono: Binoculars,
    progreso: (s) => [n(s.distintosAcertadosPorCategoria.fosiles), Math.max(1, n(s.totalPorCategoria.fosiles))],
  },
  { id: 'coleccion-completa', titulo: 'Todo lo desbloqueado', descripcion: 'Descubre todos los ejemplares de los mundos que tienes abiertos.', icono: Trophy, progreso: (s) => [s.descubiertos, Math.max(1, s.totalActivos)] },
  { id: 'estudiados-50', titulo: '50 especies estudiadas', descripcion: 'Identifica en el juego 50 ejemplares distintos.', icono: Books, progreso: (s) => [s.estudiados, 50] },
  ...CATEGORIAS.flatMap((c): Insignia[] => [
    { id: `primero-${c.id}`, titulo: PRIMERO[c.id], descripcion: `Acierta tu primera identificación de ${c.nombre}.`, icono: c.icono, progreso: (s) => [n(s.aciertosPorCategoria[c.id]), 1] },
    {
      id: `maestro-${c.id}`, titulo: `Maestro de ${c.nombre}`, descripcion: `Domina todos los ejemplares de ${c.nombre} de los mundos abiertos.`, icono: c.icono,
      progreso: (s) => [n(s.dominadosPorCategoria[c.id]), Math.max(1, n(s.totalPorCategoria[c.id]))],
    },
  ]),
];

/** Insignias visibles: se ocultan las de categorías sin ejemplares activos. */
export function insigniasVisibles(s: Snapshot): Insignia[] {
  return INSIGNIAS.filter((i) => {
    const m = i.id.match(/^(primero|maestro)-(.+)$/);
    return !m || n(s.totalPorCategoria[m[2] as CategoriaId]) > 0;
  });
}

export function desbloqueadas(s: Snapshot): string[] {
  return insigniasVisibles(s).filter((i) => { const [a, o] = i.progreso(s); return a >= o; }).map((i) => i.id);
}
