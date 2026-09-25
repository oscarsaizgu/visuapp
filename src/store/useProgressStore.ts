// Estado persistente del jugador: perfil, progreso por ejemplar, estadísticas y logros.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Estadisticas, Logros, Perfil, ProgresoEjemplar } from '../types/progress';
import { aplicarRespuesta, progresoVacio } from '../logic/srs';
import { claveDia, registrarActividad } from '../logic/daily';
import { nivelDominio, pesoDominio } from '../logic/mastery';
import { XP } from '../logic/xp';
import { estadisticasVacias, sumarRespuesta, sumarSesion, sumarXpDia, diaVacio } from '../logic/stats';
import { construirSnapshot } from '../logic/snapshot';
import { retosCumplidos, retosDelDia, XP_RETO } from '../logic/challenges';
import { EJEMPLARES, categoriasActivas } from '../content';
import { INSIGNIAS, desbloqueadas } from '../content/achievements';

export interface RespuestaJuego {
  ejemplarId: string;
  ok: boolean;
  imagenId: string;
  ms: number;
  /** Repetición de un fallo en la misma sesión: no mueve la caja ni cuenta para el objetivo. */
  reintento: boolean;
  /** false en modos que no deben mover la caja (Veloz). */
  cuentaParaCaja?: boolean;
  /** XP ya calculada por la respuesta (xpPorRespuesta). */
  xp: number;
  fotosJugables: number;
  modo: string;
  combo: number;
}

/** Aviso para celebrar en pantalla (insignia o reto). */
export interface Celebracion { tipo: 'insignia' | 'reto'; id: string; titulo: string; xp?: number }

export interface ProgressState {
  perfil: Perfil;
  progreso: Record<string, ProgresoEjemplar>;
  /** Fotos que el jugador ha marcado como "da pistas": no se vuelven a usar para preguntar. */
  fotosOcultas: string[];
  estadisticas: Estadisticas;
  logros: Logros;
  /** Cola de celebraciones pendientes de mostrar (no se guarda). */
  celebraciones: Celebracion[];
  registrarRespuesta: (r: RespuestaJuego) => { xp: number; subioNivel: boolean };
  registrarSesion: (s: { perfecta: boolean; xp: number; veloz?: number }) => void;
  ocultarFoto: (imagenId: string) => void;
  /** Abrir la ficha de un ejemplar lo añade a la colección (no da XP ni dominio). */
  marcarDescubierto: (ejemplarId: string) => void;
  setObjetivoDiario: (n: number) => void;
  quitarCelebracion: () => void;
  /** Comprueba insignias y retos sin jugar (al abrir la app o tras importar). Silencioso: sin avisos. */
  revisarLogros: (silencioso?: boolean) => void;
  importar: (datos: unknown) => boolean;
  reiniciar: () => void;
}

export const PERFIL_INICIAL: Perfil = {
  xp: 0,
  objetivoDiario: 10,
  actividad: {},
  rachaActual: 0,
  mejorRacha: 0,
  ultimoDiaConObjetivo: null,
  insignias: [],
};

const LOGROS_INICIALES: Logros = { insignias: {}, retos: {} };

type Guardable = Pick<ProgressState, 'perfil' | 'progreso' | 'fotosOcultas' | 'estadisticas' | 'logros'>;

/**
 * Tras cualquier cambio: comprueba insignias y retos nuevos, suma la XP de los retos
 * y los pone en la cola de celebraciones.
 */
function conLogros(s: Guardable & { celebraciones: Celebracion[] }): Partial<ProgressState> {
  const hoy = claveDia();
  const snap = construirSnapshot(EJEMPLARES, s.progreso, s.perfil, s.estadisticas);
  const nuevasInsignias = desbloqueadas(snap).filter((id) => !s.logros.insignias[id]);
  const retos = retosDelDia(hoy, categoriasActivas());
  const yaRetos = s.logros.retos[hoy] ?? [];
  const nuevosRetos = retosCumplidos(retos, s.estadisticas.porDia[hoy] ?? diaVacio()).filter((id) => !yaRetos.includes(id));
  if (!nuevasInsignias.length && !nuevosRetos.length) return {};

  const xpRetos = nuevosRetos.length * XP_RETO;
  const celebraciones: Celebracion[] = [
    ...s.celebraciones,
    ...nuevasInsignias.map((id) => ({ tipo: 'insignia' as const, id, titulo: INSIGNIAS.find((i) => i.id === id)!.titulo })),
    ...nuevosRetos.map((id) => ({ tipo: 'reto' as const, id, titulo: retos.find((r) => r.id === id)!.texto, xp: XP_RETO })),
  ];
  return {
    celebraciones,
    logros: {
      insignias: { ...s.logros.insignias, ...Object.fromEntries(nuevasInsignias.map((id) => [id, hoy])) },
      retos: { ...s.logros.retos, [hoy]: [...yaRetos, ...nuevosRetos] },
    },
    perfil: { ...s.perfil, xp: s.perfil.xp + xpRetos, insignias: [...s.perfil.insignias, ...nuevasInsignias] },
    estadisticas: xpRetos ? sumarXpDia(s.estadisticas, hoy, xpRetos) : s.estadisticas,
  };
}

/** Estadísticas aproximadas a partir de datos de la versión 1 (antes no se guardaban). */
function estadisticasDesdeV1(perfil: Perfil, progreso: Record<string, ProgresoEjemplar>): Estadisticas {
  const e = estadisticasVacias();
  for (const p of Object.values(progreso)) { e.respuestas += p.vecesVisto; e.aciertos += p.aciertos; }
  for (const [dia, n] of Object.entries(perfil.actividad)) e.porDia[dia] = { ...diaVacio(), n };
  return e;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      perfil: PERFIL_INICIAL,
      progreso: {},
      fotosOcultas: [],
      estadisticas: estadisticasVacias(),
      logros: LOGROS_INICIALES,
      celebraciones: [],
      registrarRespuesta: (r) => {
        const hoy = claveDia();
        const s = get();
        const antes = s.progreso[r.ejemplarId];
        const cuentaParaCaja = !r.reintento && (r.cuentaParaCaja ?? true);
        const despues = aplicarRespuesta(antes, { ok: r.ok, hoy, imagenId: r.imagenId, modo: r.modo, ms: r.ms, cuentaParaCaja });
        const subioNivel = r.ok && cuentaParaCaja
          && pesoDominio(nivelDominio(despues, r.fotosJugables)) > pesoDominio(nivelDominio(antes, r.fotosJugables));
        const xp = r.xp + (subioNivel ? XP.subirNivelDominio : 0);
        const conActividad = r.reintento ? s.perfil : registrarActividad(s.perfil, hoy);
        const categoria = EJEMPLARES.find((e) => e.id === r.ejemplarId)?.categoria ?? '';
        const base = {
          ...s,
          progreso: { ...s.progreso, [r.ejemplarId]: despues },
          perfil: { ...conActividad, xp: conActividad.xp + xp },
          estadisticas: sumarRespuesta(s.estadisticas, hoy, {
            ok: r.ok, ms: r.ms, xp, categoria, modo: r.modo, combo: r.combo, reintento: r.reintento,
            nuevo: cuentaParaCaja && (!antes || antes.vecesVisto === 0),
          }),
        };
        set({ progreso: base.progreso, perfil: base.perfil, estadisticas: base.estadisticas, ...conLogros(base) });
        return { xp, subioNivel };
      },
      registrarSesion: ({ perfecta, xp, veloz }) => {
        const hoy = claveDia();
        const s = get();
        const base = {
          ...s,
          perfil: { ...s.perfil, xp: s.perfil.xp + xp },
          estadisticas: sumarSesion(s.estadisticas, hoy, { perfecta, xp, veloz }),
        };
        set({ perfil: base.perfil, estadisticas: base.estadisticas, ...conLogros(base) });
      },
      ocultarFoto: (id) => set((s) => ({ fotosOcultas: s.fotosOcultas.includes(id) ? s.fotosOcultas : [...s.fotosOcultas, id] })),
      marcarDescubierto: (id) => {
        const s = get();
        if (s.progreso[id]?.descubierto) return;
        const progreso = { ...s.progreso, [id]: { ...(s.progreso[id] ?? progresoVacio()), descubierto: true } };
        set({ progreso, ...conLogros({ ...s, progreso }) });
      },
      setObjetivoDiario: (n) => set((s) => ({ perfil: { ...s.perfil, objetivoDiario: n } })),
      quitarCelebracion: () => set((s) => ({ celebraciones: s.celebraciones.slice(1) })),
      revisarLogros: (silencioso = false) => {
        const s = get();
        const cambios = conLogros(s);
        set(silencioso ? { ...cambios, celebraciones: s.celebraciones } : cambios);
      },
      importar: (datos) => {
        const d = datos as { state?: Partial<Guardable> } | null;
        const st = d?.state;
        if (!st || typeof st !== 'object' || !st.perfil || !st.progreso || typeof st.perfil.xp !== 'number') return false;
        set({
          perfil: { ...PERFIL_INICIAL, ...st.perfil },
          progreso: st.progreso,
          fotosOcultas: st.fotosOcultas ?? [],
          estadisticas: st.estadisticas ?? estadisticasDesdeV1({ ...PERFIL_INICIAL, ...st.perfil }, st.progreso),
          logros: st.logros ?? LOGROS_INICIALES,
          celebraciones: [],
        });
        get().revisarLogros(true);
        return true;
      },
      reiniciar: () => set({ perfil: PERFIL_INICIAL, progreso: {}, fotosOcultas: [], estadisticas: estadisticasVacias(), logros: LOGROS_INICIALES, celebraciones: [] }),
    }),
    {
      name: 'visu-game:progreso',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): Guardable => ({ perfil: s.perfil, progreso: s.progreso, fotosOcultas: s.fotosOcultas, estadisticas: s.estadisticas, logros: s.logros }),
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<Guardable>;
        if (version < 2) {
          const perfil = { ...PERFIL_INICIAL, ...p.perfil };
          const progreso = p.progreso ?? {};
          return { perfil, progreso, fotosOcultas: p.fotosOcultas ?? [], estadisticas: estadisticasDesdeV1(perfil, progreso), logros: LOGROS_INICIALES };
        }
        return p as Guardable;
      },
    },
  ),
);
