// SOLO DESARROLLO: rellena progreso ficticio para revisar la interfaz con datos (abrir con ?demo).
// ?demo=reset vuelve al estado inicial. No se incluye en la versión de producción.
import { EJEMPLARES } from '../content';
import { claveDia } from '../logic/daily';
import type { ProgresoEjemplar } from '../types/progress';
import { PERFIL_INICIAL, useProgressStore } from './useProgressStore';

export function aplicarDemoSiProcede() {
  const q = new URLSearchParams(location.search).get('demo');
  if (q === null) return;
  if (q === 'reset') { useProgressStore.getState().reiniciar(); return; }
  const hoy = claveDia();
  const progreso: Record<string, ProgresoEjemplar> = {};
  EJEMPLARES.slice(0, 22).forEach((e, i) => {
    progreso[e.id] = {
      descubierto: true, vecesVisto: 3 + (i % 4), aciertos: 2 + (i % 3), errores: i % 2,
      aciertosSeguidos: i % 4, lapsos: 0, caja: i % 6, ultimoIntento: hoy,
      proximaRevision: i % 3 === 0 ? hoy : '2099-01-01', imagenesAcertadas: e.imagenes.slice(0, 2).map((x) => x.id), historial: [],
    };
  });
  useProgressStore.setState({
    progreso,
    perfil: { ...PERFIL_INICIAL, xp: 740, actividad: { [hoy]: 6 }, rachaActual: 5, mejorRacha: 9, ultimoDiaConObjetivo: hoy },
  });
}
