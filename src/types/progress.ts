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

/** Resumen de un día (para retos diarios y la gráfica de evolución). */
export interface Dia {
  /** Respuestas (sin contar repeticiones de un fallo en la misma sesión). */
  n: number;
  ok: number;
  xp: number;
  ms: number;
  /** Ejemplares vistos por primera vez en el juego ese día. */
  nuevos: number;
  comboMax: number;
  sesiones: number;
  perfectas: number;
  /** Mejor resultado en modo Veloz ese día. */
  veloz: number;
  /** Aciertos por categoría y por modo. */
  porCategoria: Record<string, number>;
  porModo: Record<string, number>;
}

export interface Estadisticas {
  respuestas: number;
  aciertos: number;
  tiempoMs: number;
  sesiones: number;
  sesionesPerfectas: number;
  comboMax: number;
  velozMejor: number;
  porDia: Record<string, Dia>;
}

export interface Logros {
  /** id de insignia → fecha en que se desbloqueó. */
  insignias: Record<string, string>;
  /** día → ids de los retos completados ese día. */
  retos: Record<string, string[]>;
}

/** Progreso en la ruta de aprendizaje. */
export interface ProgresoRuta {
  /** Lecciones: cuándo se estudiaron (Aprender) y resultado de la práctica (Identifica). */
  lecciones: Record<string, { aprendida?: string; completada?: string; mejor: number }>;
  /** Repasos hechos (no hace falta aprobarlos para seguir). */
  repasos: Record<string, { fecha: string; mejor: number }>;
  /** Exámenes de mundo: el siguiente mundo se abre al superarlo. */
  examenes: Record<string, { intentos: number; mejor: number; superado?: string }>;
  /** Último submundo en el que se trabajó (para "Continuar"). */
  ultimoSubmundo: string | null;
}
