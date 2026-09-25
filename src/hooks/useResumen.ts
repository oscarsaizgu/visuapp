// Datos derivados para la pantalla de inicio (sin lógica dentro de los componentes).
import { useMemo } from 'react';
import { EJEMPLARES, categoriasActivas, ejemplaresDe } from '../content';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia, hechasHoy, rachaVigente } from '../logic/daily';
import { nivelDesdeXp, rangoDeNivel } from '../logic/levels';
import { dominioMedio } from '../logic/mastery';
import { planificarSesion } from '../logic/sessionPlan';
import { indiceDelDia } from '../logic/dailyPick';

export function useResumen() {
  const perfil = useProgressStore((s) => s.perfil);
  const progreso = useProgressStore((s) => s.progreso);

  return useMemo(() => {
    const hoy = claveDia();
    const nivel = nivelDesdeXp(perfil.xp);
    const ids = (dom?: string) => EJEMPLARES.filter((e) => !dom || e.dominio === dom).map((e) => e.id);

    const categorias = categoriasActivas().map((c) => {
      const lista = ejemplaresDe(c.id);
      return {
        ...c,
        total: lista.length,
        descubiertos: lista.filter((e) => progreso[e.id]?.descubierto).length,
        dominado: dominioMedio(lista.map((e) => e.id), progreso),
        portada: lista[0],
      };
    });

    const conHistoria = EJEMPLARES.filter((e) => e.visu.anios.length || e.visu.otros.length);
    const delDia = conHistoria[indiceDelDia(hoy, conHistoria.length)];

    return {
      hoy,
      nivel,
      rango: rangoDeNivel(nivel.nivel),
      xp: perfil.xp,
      racha: rachaVigente(perfil, hoy),
      hechasHoy: hechasHoy(perfil, hoy),
      objetivo: perfil.objetivoDiario,
      dominio: { total: dominioMedio(ids(), progreso), biologia: dominioMedio(ids('biologia'), progreso), geologia: dominioMedio(ids('geologia'), progreso) },
      descubiertos: EJEMPLARES.filter((e) => progreso[e.id]?.descubierto).length,
      totalActivos: EJEMPLARES.length,
      plan: planificarSesion(EJEMPLARES, progreso, hoy),
      categorias,
      delDia,
    };
  }, [perfil, progreso]);
}
