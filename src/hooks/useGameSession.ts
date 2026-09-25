// Estado de una partida de identificación (cualquier modo).
// Cada respuesta se guarda al momento: si sales a mitad, no pierdes lo hecho.
import { useCallback, useEffect, useRef, useState } from 'react';
import { EJEMPLARES, ejemplar, fotosJugables } from '../content';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia } from '../logic/daily';
import { nivelDesdeXp } from '../logic/levels';
import { crearRng } from '../logic/rng';
import { crearPregunta, crearSesion, SEGUNDOS_VELOZ, type Contexto } from '../logic/session';
import { xpFinSesion, xpPorRespuesta } from '../logic/xp';
import { comprobarEscrito } from '../logic/answerMatch';
import type { ModoJuego, Pregunta, Respuesta } from '../types/game';
import { cargarIndice } from './useNameIndex';

export type Fase = 'cargando' | 'pregunta' | 'feedback' | 'fin' | 'vacia';

export interface EstadoPartida {
  modo: ModoJuego;
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
  /** Veloz: instante (performance.now) en que acaba el tiempo. */
  finVeloz: number | null;
}

const inicial = (modo: ModoJuego): EstadoPartida => ({
  modo, fase: 'cargando', preguntas: [], i: 0, respuestas: [], combo: 0, comboMax: 0, xpSesion: 0,
  xpUltima: 0, subioNivelUltima: false, practica: false, descubiertos: [], nivelInicial: 1, xpFin: 0, finVeloz: null,
});

export function useGameSession(modo: ModoJuego) {
  const [st, setSt] = useState<EstadoPartida>(() => inicial(modo));
  // Copia síncrona del estado para los manejadores (se actualiza siempre a través de commit).
  const ref = useRef(st);
  const commit = useCallback((nuevo: EstadoPartida) => { ref.current = nuevo; setSt(nuevo); }, []);
  const ctx = useRef<Contexto | null>(null);
  const t0 = useRef(0);

  useEffect(() => {
    let vivo = true;
    cargarIndice().then((indice) => {
      if (!vivo) return;
      const s = useProgressStore.getState();
      const hoy = claveDia();
      ctx.current = {
        progreso: s.progreso,
        indice,
        porId: new Map(indice.map((x) => [x.id, x])),
        rng: crearRng(Date.now()),
        ocultas: new Set(s.fotosOcultas),
        activos: EJEMPLARES,
      };
      const { preguntas, practica } = crearSesion(EJEMPLARES, ctx.current, hoy, modo, s.estadisticas.porDia[hoy]?.nuevos ?? 0);
      t0.current = performance.now();
      commit({
        ...inicial(modo), fase: preguntas.length ? 'pregunta' : 'vacia', preguntas, practica,
        nivelInicial: nivelDesdeXp(s.perfil.xp).nivel,
        finVeloz: modo === 'veloz' ? performance.now() + SEGUNDOS_VELOZ * 1000 : null,
      });
    });
    return () => { vivo = false; };
  }, [commit, modo]);

  const terminar = useCallback(() => {
    const s = ref.current;
    if (s.fase === 'fin' || s.fase === 'cargando' || s.fase === 'vacia') return;
    const primeras = s.respuestas.filter((r) => !r.reintento);
    const perfecta = s.modo !== 'veloz' && primeras.length > 0 && primeras.every((r) => r.ok);
    const xpFin = s.respuestas.length ? xpFinSesion(perfecta) : 0;
    useProgressStore.getState().registrarSesion({
      perfecta, xp: xpFin, veloz: s.modo === 'veloz' ? primeras.filter((r) => r.ok).length : undefined,
    });
    commit({ ...s, fase: 'fin', xpFin, xpSesion: s.xpSesion + xpFin });
  }, [commit]);

  /** @param valor id de la opción elegida o, en "escribir", el texto escrito. */
  const responder = useCallback((valor: string) => {
    const s = ref.current;
    if (s.fase !== 'pregunta' || !ctx.current) return;
    if (s.finVeloz !== null && performance.now() > s.finVeloz) { terminar(); return; }
    const q = s.preguntas[s.i];
    const e = ejemplar(q.ejemplarId)!;
    let ok = valor === q.ejemplarId;
    let casi = false;
    if (q.modo === 'escribir') {
      const r = comprobarEscrito(valor, e);
      ok = r.ok;
      casi = r.ok && !r.exacto;
    }
    const combo = ok ? s.combo + 1 : 0;
    const store = useProgressStore.getState();
    const eraDescubierto = !!store.progreso[e.id]?.descubierto;
    const ms = Math.round(performance.now() - t0.current);
    const { xp, subioNivel } = store.registrarRespuesta({
      ejemplarId: e.id, ok, imagenId: q.imagen.id, ms, reintento: q.reintento,
      cuentaParaCaja: q.modo !== 'veloz',
      xp: xpPorRespuesta({ ok, reintento: q.reintento, pendiente: q.pendiente, combo, modo: q.modo }),
      fotosJugables: fotosJugables(e).length, modo: q.modo, combo,
    });

    let preguntas = s.preguntas;
    if (!ok && !q.reintento && q.modo !== 'veloz') {
      // Lo fallado vuelve al final de la sesión, con otra foto si la hay.
      ctx.current.progreso = useProgressStore.getState().progreso;
      const otra = crearPregunta(e, ctx.current, { modo: q.modo, reintento: true, pendiente: q.pendiente, evitarImagen: q.imagen.id, n: s.i });
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
      respuestas: [...s.respuestas, { clave: q.clave, ejemplarId: e.id, elegida: valor, casi, ok, xp, reintento: q.reintento, ms }],
    });
  }, [commit, terminar]);

  const siguiente = useCallback(() => {
    const s = ref.current;
    if (s.fase !== 'feedback') return;
    const tiempoAgotado = s.finVeloz !== null && performance.now() >= s.finVeloz;
    if (s.i + 1 < s.preguntas.length && !tiempoAgotado) {
      t0.current = performance.now();
      commit({ ...s, fase: 'pregunta', i: s.i + 1 });
      return;
    }
    terminar();
  }, [commit, terminar]);

  const ocultarFotoActual = useCallback(() => {
    const s = ref.current;
    const q = s.preguntas[s.i];
    if (!q) return;
    useProgressStore.getState().ocultarFoto(q.imagen.id);
    ctx.current?.ocultas.add(q.imagen.id); // tampoco se usa en los repasos de esta sesión
  }, []);

  /** Datos del índice del catálogo para una opción (p. ej. la respuesta errónea elegida). */
  const entrada = useCallback((id: string) => ctx.current?.porId.get(id), []);

  return { st, pregunta: st.preguntas[st.i], responder, siguiente, terminar, ocultarFotoActual, entrada };
}
