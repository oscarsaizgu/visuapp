// Repetición espaciada básica (cajas Leitner). La fase 6 podrá sustituir este módulo
// por un algoritmo más fino sin tocar pantallas: el historial ya se guarda.
import type { ProgresoEjemplar } from '../types/progress';
import { claveDia } from './daily';

/** Días hasta el siguiente repaso según la caja (0–5). */
export const INTERVALOS = [0, 1, 3, 7, 16, 35];
const HISTORIAL_MAX = 20;

export function progresoVacio(): ProgresoEjemplar {
  return {
    descubierto: false, vecesVisto: 0, aciertos: 0, errores: 0, aciertosSeguidos: 0, lapsos: 0, caja: 0,
    ultimoIntento: null, proximaRevision: null, imagenesAcertadas: [], historial: [],
  };
}

function sumarDias(dia: string, n: number): string {
  const [y, m, d] = dia.split('-').map(Number);
  return claveDia(new Date(y, m - 1, d + n));
}

/**
 * Aplica una respuesta al progreso de un ejemplar.
 * - Acierto: sube una caja y el repaso se aplaza según INTERVALOS.
 * - Fallo: baja dos cajas (no a cero de golpe si estaba muy alto) y vuelve a tocar hoy.
 * `cuentaParaCaja = false` (reintento en la misma sesión) solo guarda el intento.
 */
export function aplicarRespuesta(
  previo: ProgresoEjemplar | undefined,
  r: { ok: boolean; hoy: string; imagenId: string; modo: string; ms: number; cuentaParaCaja: boolean },
): ProgresoEjemplar {
  const p = previo ?? progresoVacio();
  const historial = [...p.historial, { fecha: r.hoy, ok: r.ok, modo: r.modo, imagenId: r.imagenId, ms: r.ms }].slice(-HISTORIAL_MAX);
  const base = { ...p, descubierto: true, ultimoIntento: r.hoy, historial };
  if (!r.cuentaParaCaja) return base;

  if (r.ok) {
    const caja = Math.min(5, p.caja + 1);
    return {
      ...base,
      vecesVisto: p.vecesVisto + 1,
      aciertos: p.aciertos + 1,
      aciertosSeguidos: p.aciertosSeguidos + 1,
      caja,
      proximaRevision: sumarDias(r.hoy, INTERVALOS[caja]),
      imagenesAcertadas: p.imagenesAcertadas.includes(r.imagenId) ? p.imagenesAcertadas : [...p.imagenesAcertadas, r.imagenId],
    };
  }
  return {
    ...base,
    vecesVisto: p.vecesVisto + 1,
    errores: p.errores + 1,
    aciertosSeguidos: 0,
    lapsos: p.caja >= 3 ? p.lapsos + 1 : p.lapsos,
    caja: Math.max(0, p.caja - 2),
    proximaRevision: r.hoy,
  };
}
