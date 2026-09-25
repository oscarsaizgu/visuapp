// Estado persistente del jugador (perfil + progreso por ejemplar).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Perfil, ProgresoEjemplar } from '../types/progress';
import { aplicarRespuesta } from '../logic/srs';
import { claveDia, registrarActividad } from '../logic/daily';
import { nivelDominio, pesoDominio } from '../logic/mastery';
import { XP } from '../logic/xp';

export interface RespuestaJuego {
  ejemplarId: string;
  ok: boolean;
  imagenId: string;
  ms: number;
  /** Repetición de un fallo en la misma sesión: no mueve la caja ni cuenta para el objetivo. */
  reintento: boolean;
  /** XP ya calculada por la respuesta (xpPorRespuesta). */
  xp: number;
  fotosJugables: number;
}

export interface ProgressState {
  perfil: Perfil;
  progreso: Record<string, ProgresoEjemplar>;
  /** Fotos que el jugador ha marcado como "da pistas": no se vuelven a usar para preguntar. */
  fotosOcultas: string[];
  registrarRespuesta: (r: RespuestaJuego) => { xp: number; subioNivel: boolean };
  sumarXp: (n: number) => void;
  ocultarFoto: (imagenId: string) => void;
  setObjetivoDiario: (n: number) => void;
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

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      perfil: PERFIL_INICIAL,
      progreso: {},
      fotosOcultas: [],
      registrarRespuesta: (r) => {
        const hoy = claveDia();
        const { perfil, progreso } = get();
        const antes = progreso[r.ejemplarId];
        const despues = aplicarRespuesta(antes, {
          ok: r.ok, hoy, imagenId: r.imagenId, modo: 'opcion-multiple', ms: r.ms, cuentaParaCaja: !r.reintento,
        });
        const subioNivel = r.ok && !r.reintento
          && pesoDominio(nivelDominio(despues, r.fotosJugables)) > pesoDominio(nivelDominio(antes, r.fotosJugables));
        const xp = r.xp + (subioNivel ? XP.subirNivelDominio : 0);
        const conActividad = r.reintento ? perfil : registrarActividad(perfil, hoy);
        set({ progreso: { ...progreso, [r.ejemplarId]: despues }, perfil: { ...conActividad, xp: conActividad.xp + xp } });
        return { xp, subioNivel };
      },
      sumarXp: (n) => set((s) => ({ perfil: { ...s.perfil, xp: s.perfil.xp + n } })),
      ocultarFoto: (id) => set((s) => ({ fotosOcultas: s.fotosOcultas.includes(id) ? s.fotosOcultas : [...s.fotosOcultas, id] })),
      setObjetivoDiario: (n) => set((s) => ({ perfil: { ...s.perfil, objetivoDiario: n } })),
      reiniciar: () => set({ perfil: PERFIL_INICIAL, progreso: {}, fotosOcultas: [] }),
    }),
    {
      name: 'visu-game:progreso',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ perfil: s.perfil, progreso: s.progreso, fotosOcultas: s.fotosOcultas }),
    },
  ),
);
