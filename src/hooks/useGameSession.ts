// Estado de una partida de "¿Qué estás viendo?".
// Cada respuesta se guarda al momento: si sales a mitad, no pierdes lo hecho.
import { useCallback, useEffect, useRef, useState } from 'react';
import { EJEMPLARES, ejemplar, fotosJugables } from '../content';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia } from '../logic/daily';
import { nivelDesdeXp } from '../logic/levels';
import { crearRng } from '../logic/rng';
import { crearPregunta, crearSesion, type Contexto } from '../logic/session';
import { xpFinSesion, xpPorRespuesta } from '../logic/xp';
import type { EntradaIndice, Pregunta, Respuesta } from '../types/game';

export type Fase = 'cargando' | 'pregunta' | 'feedback' | 'fin' | 'vacia';

export interface EstadoPartida {
  fase: Fase;
  preguntas: Pregunta[];
  i: number;
  respuestas: Respuesta[];
  combo: number;
  comboMax: number;
  xpSesion: number;
  xpUltima: number;
  subioNivelUltima: boolean;
  practica: boolean;
  descubiertos: string[];
  nivelInicial: number;
  xpFin: number;
}

const INICIAL: EstadoPartida = {
  fase: 'cargando', preguntas: [], i: 0, respuestas: [], combo: 0, comboMax: 0, xpSesion: 0,
  xpUltima: 0, subioNivelUltima: false, practica: false, descubiertos: [], nivelInicial: 1, xpFin: 0,
};

export function useGameSession() {
  const [st, setSt] = useState<EstadoPartida>(INICIAL);
  // Copia síncrona del estado para los manejadores (se actualiza siempre a través de commit).
  const ref = useRef(st);
  const commit = useCallback((nuevo: EstadoPartida) => { ref.current = nuevo; setSt(nuevo); }, []);
  const ctx = useRef<Contexto | null>(null);
  const t0 = useRef(0);

  useEffect(() => {
    let vivo = true;
    // El índice del catálogo completo (distractores) se carga aparte para no pesar en el inicio.
    import('../content/generated/name-index.json').then((m) => {
      if (!vivo) return;
      const indice = m.default as EntradaIndice[];
      const s = useProgressStore.getState();
      ctx.current = {
        progreso: s.progreso,
        indice,
        porId: new Map(indice.map((x) => [x.id, x])),
        rng: crearRng(Date.now()),
        ocultas: new Set(s.fotosOcultas),
      };
      const { preguntas, practica } = crearSesion(EJEMPLARES, ctx.current, claveDia());
      t0.current = performance.now();
      commit({ ...INICIAL, fase: preguntas.length ? 'pregunta' : 'vacia', preguntas, practica, nivelInicial: nivelDesdeXp(s.perfil.xp).nivel });
    });
    return () => { vivo = false; };
  }, [commit]);

  const responder = useCallback((opcionId: string) => {
    const s = ref.current;
    if (s.fase !== 'pregunta' || !ctx.current) return;
    const q = s.preguntas[s.i];
    const e = ejemplar(q.ejemplarId)!;
    const ok = opcionId === q.ejemplarId;
    const combo = ok ? s.combo + 1 : 0;
    const store = useProgressStore.getState();
    const eraDescubierto = !!store.progreso[e.id]?.descubierto;
    const { xp, subioNivel } = store.registrarRespuesta({
      ejemplarId: e.id, ok, imagenId: q.imagen.id, ms: Math.round(performance.now() - t0.current),
      reintento: q.reintento, xp: xpPorRespuesta({ ok, reintento: q.reintento, pendiente: q.pendiente, combo }),
      fotosJugables: fotosJugables(e).length,
    });

    let preguntas = s.preguntas;
    if (!ok && !q.reintento) {
      // Lo fallado vuelve al final de la sesión, con otra foto si la hay.
      ctx.current.progreso = useProgressStore.getState().progreso;
      const otra = crearPregunta(e, ctx.current, { reintento: true, pendiente: q.pendiente, evitarImagen: q.imagen.id, n: s.i });
      if (otra) preguntas = [...preguntas, otra];
    }
    commit({
      ...s,
      fase: 'feedback',
      preguntas,
      combo,
      comboMax: Math.max(s.comboMax, combo),
      xpSesion: s.xpSesion + xp,
      xpUltima: xp,
      subioNivelUltima: subioNivel,
      descubiertos: eraDescubierto || s.descubiertos.includes(e.id) ? s.descubiertos : [...s.descubiertos, e.id],
      respuestas: [...s.respuestas, {
        clave: q.clave, ejemplarId: e.id, elegida: opcionId, ok, xp, reintento: q.reintento, ms: Math.round(performance.now() - t0.current),
      }],
    });
  }, [commit]);

  const siguiente = useCallback(() => {
    const s = ref.current;
    if (s.fase !== 'feedback') return;
    if (s.i + 1 < s.preguntas.length) {
      t0.current = performance.now();
      commit({ ...s, fase: 'pregunta', i: s.i + 1 });
      return;
    }
    const perfecta = s.respuestas.every((r) => r.reintento || r.ok);
    const xpFin = xpFinSesion(perfecta);
    useProgressStore.getState().sumarXp(xpFin);
    commit({ ...s, fase: 'fin', xpFin, xpSesion: s.xpSesion + xpFin });
  }, [commit]);

  const ocultarFotoActual = useCallback(() => {
    const s = ref.current;
    const q = s.preguntas[s.i];
    if (!q) return;
    useProgressStore.getState().ocultarFoto(q.imagen.id);
    ctx.current?.ocultas.add(q.imagen.id); // tampoco se usa en los repasos de esta sesión
  }, []);

  /** Datos del índice del catálogo para una opción (p. ej. la respuesta errónea elegida). */
  const entrada = useCallback((id: string) => ctx.current?.porId.get(id), []);

  return { st, pregunta: st.preguntas[st.i], responder, siguiente, ocultarFotoActual, entrada };
}
