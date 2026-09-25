// Progreso del jugador. Se guarda en el dispositivo (localStorage) con versión para migraciones.

export interface IntentoResumen { fecha: string; ok: boolean; modo: string; imagenId?: string; ms?: number }

/** Todo lo necesario para dominio y repetición espaciada (fases 4 y 6). */
export interface ProgresoEjemplar {
  descubierto: boolean;
  vecesVisto: number;
  aciertos: number;
  errores: number;
  aciertosSeguidos: number;
  lapsos: number;
  /** Caja Leitner 0–5. */
  caja: number;
  ultimoIntento: string | null;
  proximaRevision: string | null;
  imagenesAcertadas: string[];
  historial: IntentoResumen[];
}

export interface Perfil {
  xp: number;
  objetivoDiario: number;
  /** Fecha local (AAAA-MM-DD) → identificaciones hechas ese día. */
  actividad: Record<string, number>;
  rachaActual: number;
  mejorRacha: number;
  ultimoDiaConObjetivo: string | null;
  insignias: string[];
}
