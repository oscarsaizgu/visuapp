// Estadísticas acumuladas y por día. Funciones puras: el store solo las aplica.
import type { Dia, Estadisticas } from '../types/progress';

export function diaVacio(): Dia {
  return { n: 0, ok: 0, xp: 0, ms: 0, nuevos: 0, comboMax: 0, sesiones: 0, perfectas: 0, veloz: 0, porCategoria: {}, porModo: {} };
}

export function estadisticasVacias(): Estadisticas {
  return { respuestas: 0, aciertos: 0, tiempoMs: 0, sesiones: 0, sesionesPerfectas: 0, comboMax: 0, velozMejor: 0, porDia: {} };
}

/** Suma una respuesta. Las repeticiones de un fallo en la misma sesión no cuentan como respuesta nueva. */
export function sumarRespuesta(
  e: Estadisticas,
  hoy: string,
  r: { ok: boolean; ms: number; xp: number; categoria: string; modo: string; combo: number; reintento: boolean; nuevo: boolean },
): Estadisticas {
  const d = { ...(e.porDia[hoy] ?? diaVacio()) };
  const cuenta = !r.reintento;
  d.n += cuenta ? 1 : 0;
  d.ok += cuenta && r.ok ? 1 : 0;
  d.xp += r.xp;
  d.ms += r.ms;
  d.nuevos += r.nuevo ? 1 : 0;
  d.comboMax = Math.max(d.comboMax, r.combo);
  if (r.ok) {
    d.porCategoria = { ...d.porCategoria, [r.categoria]: (d.porCategoria[r.categoria] ?? 0) + 1 };
    d.porModo = { ...d.porModo, [r.modo]: (d.porModo[r.modo] ?? 0) + 1 };
  }
  return {
    ...e,
    respuestas: e.respuestas + (cuenta ? 1 : 0),
    aciertos: e.aciertos + (cuenta && r.ok ? 1 : 0),
    tiempoMs: e.tiempoMs + r.ms,
    comboMax: Math.max(e.comboMax, r.combo),
    porDia: { ...e.porDia, [hoy]: d },
  };
}

export function sumarSesion(e: Estadisticas, hoy: string, s: { perfecta: boolean; xp: number; veloz?: number }): Estadisticas {
  const d = { ...(e.porDia[hoy] ?? diaVacio()) };
  d.sesiones += 1;
  d.perfectas += s.perfecta ? 1 : 0;
  d.xp += s.xp;
  if (s.veloz !== undefined) d.veloz = Math.max(d.veloz, s.veloz);
  return {
    ...e,
    sesiones: e.sesiones + 1,
    sesionesPerfectas: e.sesionesPerfectas + (s.perfecta ? 1 : 0),
    velozMejor: Math.max(e.velozMejor, s.veloz ?? 0),
    porDia: { ...e.porDia, [hoy]: d },
  };
}

export function sumarXpDia(e: Estadisticas, hoy: string, xp: number): Estadisticas {
  const d = { ...(e.porDia[hoy] ?? diaVacio()) };
  d.xp += xp;
  return { ...e, porDia: { ...e.porDia, [hoy]: d } };
}

/** Tiempo legible: "45 min", "2 h 10 min". */
export function formatoTiempo(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
