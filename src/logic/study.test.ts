import { describe, expect, it } from 'vitest';
import { coincide, diaRelativo, listaRepaso, normalizar, sinDescubrir } from './study';
import { parientes } from './related';
import type { Ejemplar } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';
import type { EntradaIndice } from '../types/game';

const e = (id: string, over: Partial<Ejemplar> = {}): Ejemplar => ({
  id, categoria: 'zoologia', prioridad: 'A', dominio: 'biologia', album: 'Anfibios', aceptados: [id],
  nombre: { principal: id, formato: 'comun' }, visu: { anios: [], otros: [] }, imagenes: [], ...over,
});
const p = (over: Partial<ProgresoEjemplar>): ProgresoEjemplar => ({
  descubierto: true, vecesVisto: 2, aciertos: 2, errores: 0, aciertosSeguidos: 2, lapsos: 0, caja: 2,
  ultimoIntento: '2026-09-20', proximaRevision: '2099-01-01', imagenesAcertadas: [], historial: [{ fecha: '2026-09-20', ok: true, modo: 'x' }], ...over,
});

describe('lista de repaso', () => {
  it('vencidos primero (el más antiguo antes), luego fallados, luego difíciles; nunca los no vistos', () => {
    const lista = [e('nuevo'), e('bien'), e('dificil'), e('fallado'), e('hoy'), e('atrasado')];
    const prog = {
      bien: p({}),
      dificil: p({ errores: 3, aciertos: 1 }),
      fallado: p({ historial: [{ fecha: '2026-09-24', ok: false, modo: 'x' }] }),
      hoy: p({ proximaRevision: '2026-09-25' }),
      atrasado: p({ proximaRevision: '2026-09-20' }),
    };
    expect(listaRepaso(lista, prog, '2026-09-25').map((x) => [x.ejemplar.id, x.motivo])).toEqual([
      ['atrasado', 'toca-hoy'], ['hoy', 'toca-hoy'], ['fallado', 'fallado'], ['dificil', 'cuesta'],
    ]);
  });
  it('sin descubrir', () => {
    expect(sinDescubrir([e('a'), e('b')], { a: p({}) }).map((x) => x.id)).toEqual(['b']);
  });
});

describe('búsqueda', () => {
  it('ignora tildes y mayúsculas y busca en todos los nombres', () => {
    expect(normalizar('  Ágata ')).toBe('agata');
    const x = e('x', { nombre: { principal: 'Salamandra rabilarga', cientifico: 'Chioglossa lusitanica', formato: 'comun' }, aceptados: ['Chioglossa lusitanica'] });
    expect(coincide(x, 'salamandra')).toBe(true);
    expect(coincide(x, 'LUSITANICA')).toBe(true);
    expect(coincide(x, 'anfib')).toBe(true);
    expect(coincide(x, 'galena')).toBe(false);
    expect(coincide(x, '')).toBe(true);
  });
  it('días relativos', () => {
    expect(diaRelativo('2026-09-25', '2026-09-25')).toBe('hoy');
    expect(diaRelativo('2026-09-26', '2026-09-25')).toBe('mañana');
    expect(diaRelativo('2026-10-02', '2026-09-25')).toBe('en 7 días');
    expect(diaRelativo('2026-09-22', '2026-09-25')).toBe('hace 3 días');
    expect(diaRelativo('2099-01-01', '2026-09-25')).toMatch(/^el 1 .*2099$/);
  });
});

describe('parientes en el catálogo', () => {
  const x = e('rana', { nombre: { principal: 'Rana bermeja', cientifico: 'Rana temporaria', formato: 'comun' }, taxonomia: { familia: 'Ranidae', genero: 'Rana' } });
  const idx = (id: string, o: Partial<EntradaIndice>): EntradaIndice => ({ id, c: 'zoologia', a: 'Anfibios', n: id, ...o });
  const indice = [
    idx('rana', { sci: 'Rana temporaria', gen: 'Rana', fam: 'Ranidae' }),
    idx('iberica', { sci: 'Rana iberica', gen: 'Rana', fam: 'Ranidae' }),
    idx('perezi', { sci: 'Pelophylax perezi', gen: 'Pelophylax', fam: 'Ranidae' }),
    idx('sapo', { sci: 'Bufo spinosus', gen: 'Bufo', fam: 'Bufonidae' }),
    idx('var', { sci: 'Rana temporaria parvipalmata', gen: 'Rana', fam: 'Ranidae' }),
  ];
  it('mismo género primero, luego familia; excluye la misma especie y otras familias', () => {
    expect(parientes(x, indice).map((r) => [r.entrada.id, r.parentesco])).toEqual([['iberica', 'genero'], ['perezi', 'familia']]);
  });
  it('sin taxonomía (geología): mismo grupo', () => {
    const g = e('galena', { categoria: 'minerales', album: 'Sulfuros' });
    const r = parientes(g, [
      { id: 'galena', c: 'minerales', a: 'Sulfuros', n: 'Galena' },
      { id: 'pirita', c: 'minerales', a: 'Sulfuros', n: 'Pirita', p: 1 },
      { id: 'yeso', c: 'minerales', a: 'Sulfatos', n: 'Yeso' },
    ]);
    expect(r.map((z) => [z.entrada.id, z.parentesco])).toEqual([['pirita', 'grupo']]);
  });
});
