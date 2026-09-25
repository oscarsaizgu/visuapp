import { beforeEach, describe, expect, it } from 'vitest';
import { RUTA, ejemplaresPorIds, idsDeMundo, mundosDesbloqueados } from '../content';
import { crearExamen, crearSesionLista } from './session';
import { crearRng } from './rng';
import { migrarProgreso, superados, useProgressStore } from '../store/useProgressStore';
import type { EntradaIndice } from '../types/game';
import indiceReal from '../content/generated/name-index.json';

const indice = indiceReal as EntradaIndice[];
const m1 = RUTA.mundos[0];
const ctx = () => ({ progreso: {}, indice, porId: new Map(indice.map((x) => [x.id, x])), rng: crearRng(9), ocultas: new Set<string>(), activos: ejemplaresPorIds(idsDeMundo(m1)) });

describe('sesiones de la ruta', () => {
  it('lección: cada ejemplar dos veces (nombre y foto)', () => {
    const nodo = m1.submundos[0].nodos[0];
    const lista = ejemplaresPorIds(nodo.ejemplares);
    const q = crearSesionLista(lista, ctx(), ['opcion-multiple', 'elegir-foto']);
    expect(q).toHaveLength(lista.length * 2);
    expect(q.filter((x) => x.modo === 'elegir-foto').every((x) => x.fotos?.length === 4)).toBe(true);
    expect(new Set(q.map((x) => x.clave)).size).toBe(q.length);
  });
  it('examen: mezcla todas las disciplinas del mundo (≥2 de cada una)', () => {
    const subs = m1.submundos.map((sm) => ({ cat: sm.categoria, ejemplares: ejemplaresPorIds(sm.nodos.filter((n) => n.tipo === 'leccion').flatMap((n) => n.ejemplares)) }));
    const q = crearExamen(subs, ctx(), m1.examen.preguntas);
    expect(q.length).toBeGreaterThanOrEqual(m1.examen.preguntas - 2);
    expect(q.length).toBeLessThanOrEqual(m1.examen.preguntas);
    const ids = new Set(q.map((x) => x.ejemplarId));
    for (const s of subs) expect(s.ejemplares.filter((e) => ids.has(e.id)).length, s.cat).toBeGreaterThanOrEqual(Math.min(2, s.ejemplares.length));
    expect(q.some((x) => x.modo === 'escribir')).toBe(true);
  });
});

describe('progreso en la ruta (sin game over)', () => {
  beforeEach(() => useProgressStore.getState().reiniciar());
  const s = () => useProgressStore.getState();

  it('aprender descubre los ejemplares; completar la lección la marca hecha con su nota', () => {
    const nodo = m1.submundos[0].nodos[0];
    s().marcarAprendida(nodo.id);
    expect(nodo.ejemplares.every((id) => s().progreso[id]?.descubierto)).toBe(true);
    expect(s().ruta.lecciones[nodo.id].aprendida).toBeTruthy();
    expect(s().ruta.lecciones[nodo.id].completada).toBeUndefined();
    s().completarNodo(nodo.id, 3, 8);
    s().completarNodo(nodo.id, 7, 8);
    s().completarNodo(nodo.id, 2, 8);
    expect(s().ruta.lecciones[nodo.id]).toMatchObject({ mejor: 7 / 8 });
    expect(s().ruta.ultimoSubmundo).toBe(m1.submundos[0].id);
  });
  it('suspender el examen no quita nada; aprobarlo abre el siguiente mundo', () => {
    s().completarNodo(m1.submundos[0].nodos[0].id, 5, 5);
    const xp = s().perfil.xp;
    expect(s().registrarExamen('m1', 10, 20)).toBe(false);
    expect(s().ruta.lecciones[m1.submundos[0].nodos[0].id].completada).toBeTruthy();
    expect(s().perfil.xp).toBeGreaterThanOrEqual(xp);
    expect(mundosDesbloqueados(superados(s().ruta))).toHaveLength(1);
    expect(s().registrarExamen('m1', 16, 20)).toBe(true);
    expect(mundosDesbloqueados(superados(s().ruta)).map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(s().ruta.examenes.m1).toMatchObject({ intentos: 2, mejor: 0.8 });
    // Suspender después de aprobar no lo cierra
    s().registrarExamen('m1', 0, 20);
    expect(s().ruta.examenes.m1.superado).toBeTruthy();
    expect(s().logros.insignias['mundo-1']).toBeTruthy();
  });
  it('un progreso de la versión 2 se conserva al migrar (se añade la ruta vacía)', () => {
    const v2 = { perfil: { xp: 500, objetivoDiario: 10, actividad: {}, rachaActual: 2, mejorRacha: 4, ultimoDiaConObjetivo: null, insignias: [] }, progreso: { a: { descubierto: true } }, fotosOcultas: ['x'], estadisticas: { respuestas: 9 }, logros: { insignias: { y: '2026-09-01' }, retos: {} } };
    const m = migrarProgreso(v2, 2) as unknown as Record<string, unknown>;
    expect(m).toMatchObject({ perfil: { xp: 500 }, progreso: { a: { descubierto: true } }, fotosOcultas: ['x'], estadisticas: { respuestas: 9 }, logros: { insignias: { y: '2026-09-01' } } });
    expect(m.ruta).toEqual({ lecciones: {}, repasos: {}, examenes: {}, ultimoSubmundo: null });
  });
});
