// Experiencia. Premia recordar, no pulsar: lo que no tocaba estudiar da poco.
export const XP = {
  acierto: 10,
  /** Escribir el nombre sin opciones es más difícil que reconocerlo. */
  aciertoEscribir: 15,
  aciertoVeloz: 5,
  aciertoNoPendiente: 2,
  aciertoReintento: 5,
  comboPorAcierto: 2,
  comboMax: 10,
  subirNivelDominio: 5,
  sesionCompleta: 20,
  sesionPerfecta: 10,
} as const;

/** @param combo aciertos seguidos contando este. */
export function xpPorRespuesta(r: { ok: boolean; reintento: boolean; pendiente: boolean; combo: number; modo?: string }): number {
  if (!r.ok) return 0;
  if (r.modo === 'veloz') return XP.aciertoVeloz; // sin combo: en Veloz se encadenan muchos
  const completa = r.modo === 'escribir' ? XP.aciertoEscribir : XP.acierto;
  const base = r.reintento ? XP.aciertoReintento : r.pendiente ? completa : XP.aciertoNoPendiente;
  return base + bonusCombo(r.combo);
}

export function bonusCombo(combo: number): number {
  return combo >= 2 ? Math.min(XP.comboMax, XP.comboPorAcierto * (combo - 1)) : 0;
}

export function xpFinSesion(perfecta: boolean): number {
  return XP.sesionCompleta + (perfecta ? XP.sesionPerfecta : 0);
}
