// Estado persistente del jugador (perfil + progreso por ejemplar).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Perfil, ProgresoEjemplar } from '../types/progress';

export interface ProgressState {
  perfil: Perfil;
  progreso: Record<string, ProgresoEjemplar>;
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
    (set) => ({
      perfil: PERFIL_INICIAL,
      progreso: {},
      setObjetivoDiario: (n) => set((s) => ({ perfil: { ...s.perfil, objetivoDiario: n } })),
      reiniciar: () => set({ perfil: PERFIL_INICIAL, progreso: {} }),
    }),
    {
      name: 'visu-game:progreso',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ perfil: s.perfil, progreso: s.progreso }),
    },
  ),
);
