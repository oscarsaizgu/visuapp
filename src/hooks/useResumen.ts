// Datos derivados para la pantalla de inicio (sin lógica dentro de los componentes).
// Todo sale del contenido importado (src/content) y del progreso guardado del jugador.
import { useMemo } from 'react';
import { EJEMPLARES, PACKS, categoriasActivas, ejemplaresDe, portada } from '../content';
import { DOMINIOS } from '../content/categories';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia, hechasHoy, rachaVigente } from '../logic/daily';
import { nivelDesdeXp, rangoDeNivel } from '../logic/levels';
import { distribucionDominio, dominioMedio, nivelDominio } from '../logic/mastery';
import { planificarSesion } from '../logic/sessionPlan';
import { elegirEjemplarDelDia } from '../logic/dailyPick';
import type { Ejemplar, Imagen } from '../types/content';

/** Foto de portada de una categoría: la más grande y apaisada entre las portadas de sus ejemplares. */
function mejorPortada(lista: Ejemplar[]): Imagen | undefined {
  const fotos = lista.map(portada).filter((i): i is Imagen => i !== undefined);
  const score = (i: Imagen) => (i.juego ? 1e7 : 0) + (i.ancho >= i.alto ? 1e6 : 0) + i.ancho * i.alto / 1e3;
  return [...fotos].sort((a, b) => score(b) - score(a))[0];
}

export function useResumen() {
  const perfil = useProgressStore((s) => s.perfil);
  const progreso = useProgressStore((s) => s.progreso);

  return useMemo(() => {
    const hoy = claveDia();
    const nivel = nivelDesdeXp(perfil.xp);
    const idsTodos = EJEMPLARES.map((e) => e.id);
    const plan = planificarSesion(EJEMPLARES, progreso, hoy);

    const categorias = categoriasActivas().map((c) => {
      const lista = ejemplaresDe(c.id);
      const ids = lista.map((e) => e.id);
      return {
        ...c,
        total: lista.length,
        descubiertos: lista.filter((e) => progreso[e.id]?.descubierto).length,
        distribucion: distribucionDominio(ids, progreso),
        dominado: dominioMedio(ids, progreso),
        foto: mejorPortada(lista),
      };
    });

    const distribucion = distribucionDominio(idsTodos, progreso);
    const porDominio = DOMINIOS.map((d) => {
      const ids = EJEMPLARES.filter((e) => e.dominio === d.id).map((e) => e.id);
      return { ...d, total: ids.length, dominado: dominioMedio(ids, progreso) };
    }).filter((d) => d.total > 0);

    const elegido = elegirEjemplarDelDia(EJEMPLARES, progreso, hoy);

    return {
      nivel,
      rango: rangoDeNivel(nivel.nivel),
      xp: perfil.xp,
      racha: rachaVigente(perfil, hoy),
      hechasHoy: hechasHoy(perfil, hoy),
      objetivo: perfil.objetivoDiario,
      dominio: {
        medio: dominioMedio(idsTodos, progreso),
        distribucion,
        dominados: distribucion.dominado + distribucion['muy-dominado'],
        porDominio,
      },
      coleccion: {
        descubiertos: EJEMPLARES.filter((e) => progreso[e.id]?.descubierto).length,
        total: EJEMPLARES.length,
        packs: PACKS.map((p) => p.nombre),
      },
      plan,
      categorias,
      delDia: elegido && {
        ...elegido,
        nivel: nivelDominio(progreso[elegido.ejemplar.id]),
        enSesion: plan.ejemplares.includes(elegido.ejemplar.id),
      },
    };
  }, [perfil, progreso]);
}

export type Resumen = ReturnType<typeof useResumen>;
