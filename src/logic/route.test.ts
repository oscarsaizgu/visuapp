import { describe, expect, it } from 'vitest';
import { estadoNodo, estrellas, mundoCompleto, progresoMundo, siguientePaso, submundoCompleto } from './route';
import { RUTA, mundosDesbloqueados } from '../content';
import type { ProgresoRuta } from '../types/progress';

const vacio = (): ProgresoRuta => ({ lecciones: {}, repasos: {}, examenes: {}, ultimoSubmundo: null });
const m1 = RUTA.mundos[0];
const hacerTodo = (r: ProgresoRuta, m = m1) => {
  for (const sm of m.submundos) for (const n of sm.nodos) {
    if (n.tipo === 'leccion') r.lecciones[n.id] = { aprendida: 'x', completada: 'x', mejor: 1 };
    else r.repasos[n.id] = { fecha: 'x', mejor: 1 };
  }
  return r;
};

describe('ruta de aprendizaje', () => {
  it('estructura: el Mundo 1 es el pack piloto y el catálogo entero está en la ruta', () => {
    expect(m1.total).toBe(40);
    expect(RUTA.catalogo.ejemplares).toBe(3132);
    const ids = RUTA.mundos.flatMap((m) => m.submundos.flatMap((s) => s.nodos.filter((n) => n.tipo === 'leccion').flatMap((n) => n.ejemplares)));
    expect(new Set(ids).size).toBe(RUTA.catalogo.enRuta);
    expect(ids.length).toBe(RUTA.catalogo.enRuta);
  });
  it('nodos en secuencia dentro del submundo', () => {
    const sm = m1.submundos[0];
    const r = vacio();
    expect(estadoNodo(sm, 0, r)).toBe('disponible');
    expect(estadoNodo(sm, 1, r)).toBe('bloqueado');
    r.lecciones[sm.nodos[0].id] = { completada: 'x', mejor: 0.5 };
    expect(estadoNodo(sm, 0, r)).toBe('hecho');
    expect(estadoNodo(sm, 1, r)).toBe('disponible');
  });
  it('solo lo aprendido no cuenta como hecho: hace falta practicar', () => {
    const sm = m1.submundos[0];
    const r = vacio();
    r.lecciones[sm.nodos[0].id] = { aprendida: 'x', mejor: 0 };
    expect(estadoNodo(sm, 0, r)).toBe('disponible');
  });
  it('mundos: el siguiente solo se abre al superar el examen', () => {
    expect(mundosDesbloqueados({}).map((m) => m.id)).toEqual(['m1']);
    expect(mundosDesbloqueados({ m1: true }).map((m) => m.id)).toEqual(['m1', 'm2']);
  });
  it('siguiente paso: primera lección; luego sigue en el mismo submundo; al final, el examen', () => {
    const r = vacio();
    const a = siguientePaso(RUTA, r, [m1]);
    expect(a).toMatchObject({ tipo: 'nodo', nodo: { id: m1.submundos[0].nodos[0].id } });
    const zoo = m1.submundos.find((s) => s.categoria === 'zoologia')!;
    r.lecciones[zoo.nodos[0].id] = { completada: 'x', mejor: 1 };
    r.ultimoSubmundo = zoo.id;
    expect(siguientePaso(RUTA, r, [m1])).toMatchObject({ tipo: 'nodo', nodo: { id: zoo.nodos[1].id } });
    hacerTodo(r);
    expect(mundoCompleto(m1, r)).toBe(true);
    expect(submundoCompleto(zoo, r)).toBe(true);
    expect(siguientePaso(RUTA, r, [m1])).toEqual({ tipo: 'examen', mundo: m1 });
    expect(progresoMundo(m1, r)).toEqual({ hechos: progresoMundo(m1, r).total, total: progresoMundo(m1, r).total });
  });
  it('estrellas', () => {
    expect([estrellas(0.4), estrellas(0.75), estrellas(0.95)]).toEqual([1, 2, 3]);
  });
});
