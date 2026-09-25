// Datos de la sección Estudiar a partir del contenido activo y del progreso.
import { useMemo } from 'react';
import { CATALOGO } from '../content';
import { useActivos } from './useActivos';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia } from '../logic/daily';
import { listaRepaso, sinDescubrir } from '../logic/study';
import { nivelDominio, type NivelDominio } from '../logic/mastery';

export function useStudy() {
  const progreso = useProgressStore((s) => s.progreso);
  const activos = useActivos();
  return useMemo(() => {
    const nivel = (id: string): NivelDominio => nivelDominio(progreso[id]);
    return {
      /** Catálogo completo: Estudio libre puede consultar cualquier ejemplar. */
      todos: CATALOGO,
      /** Repaso sobre todo lo que tenga progreso, venga de la ruta o del estudio libre. */
      repaso: listaRepaso(CATALOGO.filter((e) => progreso[e.id]), progreso, claveDia()),
      /** Por descubrir: lo desbloqueado en la ruta que aún no has visto. */
      nuevos: sinDescubrir(activos, progreso),
      activos,
      nivel,
    };
  }, [progreso, activos]);
}
