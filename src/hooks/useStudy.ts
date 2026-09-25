// Datos de la sección Estudiar a partir del contenido activo y del progreso.
import { useMemo } from 'react';
import { EJEMPLARES } from '../content';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia } from '../logic/daily';
import { listaRepaso, sinDescubrir } from '../logic/study';
import { nivelDominio, type NivelDominio } from '../logic/mastery';

export function useStudy() {
  const progreso = useProgressStore((s) => s.progreso);
  return useMemo(() => {
    const nivel = (id: string): NivelDominio => nivelDominio(progreso[id]);
    return {
      todos: EJEMPLARES,
      repaso: listaRepaso(EJEMPLARES, progreso, claveDia()),
      nuevos: sinDescubrir(EJEMPLARES, progreso),
      nivel,
    };
  }, [progreso]);
}
