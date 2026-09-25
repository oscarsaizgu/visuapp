// Foto fija del progreso del jugador sobre el contenido activo; alimenta insignias y estadísticas.
import type { CategoriaId, Ejemplar } from '../types/content';
import type { Estadisticas, Perfil, ProgresoEjemplar } from '../types/progress';
import { nivelDominio, pesoDominio } from './mastery';
import { nivelDesdeXp } from './levels';
import { haSalidoEnExamen } from './dailyPick';

export interface Snapshot {
  totalActivos: number;
  totalPorCategoria: Partial<Record<CategoriaId, number>>;
  descubiertos: number;
  estudiados: number;
  dominados: number;
  aciertosPorCategoria: Partial<Record<CategoriaId, number>>;
  /** Ejemplares distintos acertados al menos una vez, por categoría. */
  distintosAcertadosPorCategoria: Partial<Record<CategoriaId, number>>;
  dominadosPorCategoria: Partial<Record<CategoriaId, number>>;
  examenAcertados: number;
  examenActivos: number;
  aciertos: number;
  respuestas: number;
  mejorRacha: number;
  sesionesPerfectas: number;
  comboMax: number;
  velozMejor: number;
  nivel: number;
}

export function construirSnapshot(
  ejemplares: Ejemplar[],
  progreso: Record<string, ProgresoEjemplar>,
  perfil: Perfil,
  est: Estadisticas,
): Snapshot {
  const s: Snapshot = {
    totalActivos: ejemplares.length, totalPorCategoria: {}, descubiertos: 0, estudiados: 0, dominados: 0,
    aciertosPorCategoria: {}, distintosAcertadosPorCategoria: {}, dominadosPorCategoria: {},
    examenAcertados: 0, examenActivos: 0,
    aciertos: est.aciertos, respuestas: est.respuestas, mejorRacha: perfil.mejorRacha,
    sesionesPerfectas: est.sesionesPerfectas, comboMax: est.comboMax, velozMejor: est.velozMejor,
    nivel: nivelDesdeXp(perfil.xp).nivel,
  };
  const inc = (m: Partial<Record<CategoriaId, number>>, c: CategoriaId, n = 1) => { m[c] = (m[c] ?? 0) + n; };
  for (const e of ejemplares) {
    const p = progreso[e.id];
    inc(s.totalPorCategoria, e.categoria);
    if (haSalidoEnExamen(e)) s.examenActivos++;
    if (!p) continue;
    if (p.descubierto) s.descubiertos++;
    if (p.vecesVisto > 0) s.estudiados++;
    if (pesoDominio(nivelDominio(p)) >= pesoDominio('dominado')) { s.dominados++; inc(s.dominadosPorCategoria, e.categoria); }
    if (p.aciertos > 0) {
      inc(s.aciertosPorCategoria, e.categoria, p.aciertos);
      inc(s.distintosAcertadosPorCategoria, e.categoria);
      if (haSalidoEnExamen(e)) s.examenAcertados++;
    }
  }
  return s;
}
