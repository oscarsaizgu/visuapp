// Estado de una partida de identificación (cualquier modo).
// Cada respuesta se guarda al momento: si sales a mitad, no pierdes lo hecho.
import { useCallback, useEffect, useRef, useState } from 'react';
import { CATALOGO, ejemplar, ejemplaresDesbloqueados, ejemplaresPorIds, fotosJugables, mundo, nodoRuta } from '../content';
import { superados, useProgressStore } from '../store/useProgressStore';
import { claveDia } from '../logic/daily';
import { nivelDesdeXp } from '../logic/levels';
import { crearRng } from '../logic/rng';
import { crearExamen, crearPregunta, crearSesion, crearSesionLista, peorDominados, SEGUNDOS_VELOZ, type Contexto } from '../logic/session';
import { planificarSesion, TAMANO_SESION } from '../logic/sessionPlan';
import { xpFinSesion, xpPorRespuesta } from '../logic/xp';
import { comprobarEscrito } from '../logic/answerMatch';
import type { ModoJuego, Pregunta, Respuesta } from '../types/game';
import type { Ejemplar } from '../types/content';
import { cargarIndice } from './useNameIndex';

export type Fase = 'cargando' | 'pregunta' | 'feedback' | 'fin' | 'vacia';

/** De dónde viene la sesión. */
export type OrigenSesion =
  | { tipo: 'libre'; modo: ModoJuego }
  | { tipo: 'bloque'; clave: string; modo: ModoJuego }
  | { tipo: 'leccion'; id: string }
  | { tipo: 'repaso-ruta'; id: string }
  | { tipo: 'examen'; mundo: string }
  | { tipo: 'refuerzo'; ids: string[] };

/** Resultado para la ruta (se muestra en el resumen). */
export interface ResultadoRuta { aciertos: number; total: number; aprobado?: boolean }

export interface EstadoPartida {
  modo: ModoJuego;
  origen: OrigenSesion;
  /** Repasos de la ruta y exámenes: cada ejemplar se pregunta una vez, sin segunda oportunidad. */
  sinReintentos: boolean;
  resultado: ResultadoRuta | null;
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

const modoDe = (o: OrigenSesion): ModoJuego => (o.tipo === 'libre' || o.tipo === 'bloque' ? o.modo : 'opcion-multiple');

const inicial = (origen: OrigenSesion): EstadoPartida => ({
  modo: modoDe(origen), origen, sinReintentos: origen.tipo === 'repaso-ruta' || origen.tipo === 'examen', resultado: null, fase: 'cargando', preguntas: [], i: 0, respuestas: [], combo: 0, comboMax: 0, xpSesion: 0,
  xpUltima: 0, subioNivelUltima: false, practica: false, descubiertos: [], nivelInicial: 1, xpFin: 0, finVeloz: null,
});

export function useGameSession(origen: OrigenSesion) {
  const [st, setSt] = useState<EstadoPartida>(() => inicial(origen));
  const modo = modoDe(origen);
  const claveOrigen = JSON.stringify(origen);
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
      const o = JSON.parse(claveOrigen) as OrigenSesion;
      const activos = ejemplaresDesbloqueados(superados(s.ruta));
      ctx.current = {
        progreso: s.progreso,
        indice,
        porId: new Map(indice.map((x) => [x.id, x])),
        rng: crearRng(Date.now()),
        ocultas: new Set(s.fotosOcultas),
        // Fotos para "Elegir la foto": de lo desbloqueado; si hace falta, del catálogo.
        activos: activos.length >= 4 ? activos : CATALOGO,
      };
      const c = ctx.current;
      let preguntas: Pregunta[] = [];
      let practica = false;
      if (o.tipo === 'libre') {
        ({ preguntas, practica } = crearSesion(activos, c, hoy, o.modo));
      } else if (o.tipo === 'bloque') {
        // Estudio libre: un bloque del catálogo (disciplina o disciplina|grupo), con el plan de repaso.
        const [cat, album] = o.clave.split('|');
        const lista = CATALOGO.filter((e) => e.categoria === cat && (!album || e.album === album));
        c.activos = lista.length >= 4 ? lista : c.activos;
        const plan = planificarSesion(lista, s.progreso, hoy, TAMANO_SESION);
        let elegidos: Ejemplar[] = ejemplaresPorIds(plan.ejemplares);
        if (!elegidos.length) practica = true;
        // Siempre una sesión completa si el bloque da para ello: se rellena con lo menos dominado.
        if (elegidos.length < TAMANO_SESION) {
          const ya = new Set(elegidos.map((e) => e.id));
          elegidos = [...elegidos, ...peorDominados(lista.filter((e) => !ya.has(e.id)), c, TAMANO_SESION - elegidos.length)];
        }
        preguntas = crearSesionLista(elegidos, c, [o.modo], { pendiente: !practica });
      } else if (o.tipo === 'leccion') {
        // Lección: cada ejemplar dos veces, primero reconociendo el nombre y luego eligiendo su foto.
        const info = nodoRuta(o.id);
        preguntas = info ? crearSesionLista(ejemplaresPorIds(info.nodo.ejemplares), c, ['opcion-multiple', 'elegir-foto']) : [];
      } else if (o.tipo === 'repaso-ruta') {
        const info = nodoRuta(o.id);
        preguntas = info ? crearSesionLista(peorDominados(ejemplaresPorIds(info.nodo.ejemplares), c, TAMANO_SESION), c, ['opcion-multiple']) : [];
      } else if (o.tipo === 'examen') {
        const m = mundo(o.mundo);
        preguntas = m ? crearExamen(m.submundos.map((sm) => ({ ejemplares: ejemplaresPorIds(sm.nodos.filter((n) => n.tipo === 'leccion').flatMap((n) => n.ejemplares)) })), c, m.examen.preguntas) : [];
      } else {
        preguntas = crearSesionLista(ejemplaresPorIds(o.ids).slice(0, TAMANO_SESION), c, ['opcion-multiple']);
      }
      t0.current = performance.now();
      commit({
        ...inicial(o), fase: preguntas.length ? 'pregunta' : 'vacia', preguntas, practica,
        nivelInicial: nivelDesdeXp(s.perfil.xp).nivel,
        finVeloz: modo === 'veloz' ? performance.now() + SEGUNDOS_VELOZ * 1000 : null,
      });
    });
    return () => { vivo = false; };
  }, [commit, modo, claveOrigen]);

  const terminar = useCallback(() => {
    const s = ref.current;
    if (s.fase === 'fin' || s.fase === 'cargando' || s.fase === 'vacia') return;
    const primeras = s.respuestas.filter((r) => !r.reintento);
    const perfecta = s.modo !== 'veloz' && primeras.length > 0 && primeras.every((r) => r.ok);
    const xpFin = s.respuestas.length ? xpFinSesion(perfecta) : 0;
    const store = useProgressStore.getState();
    store.registrarSesion({
      perfecta, xp: xpFin, veloz: s.modo === 'veloz' ? primeras.filter((r) => r.ok).length : undefined,
    });
    // Ruta: registrar la lección, el repaso o el examen. Nunca se pierde nada por fallar.
    let resultado: ResultadoRuta | null = null;
    const aciertos = primeras.filter((r) => r.ok).length;
    if (s.origen.tipo === 'leccion' || s.origen.tipo === 'repaso-ruta') {
      store.completarNodo(s.origen.id, aciertos, primeras.length);
      resultado = { aciertos, total: primeras.length };
    } else if (s.origen.tipo === 'examen') {
      resultado = { aciertos, total: primeras.length, aprobado: store.registrarExamen(s.origen.mundo, aciertos, primeras.length) };
    }
    commit({ ...s, fase: 'fin', xpFin, xpSesion: s.xpSesion + xpFin, resultado });
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
    if (!ok && !q.reintento && q.modo !== 'veloz' && !s.sinReintentos) {
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
