import { describe, expect, it } from 'vitest';
import { elegirEjemplarDelDia } from './dailyPick';
import type { Ejemplar } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';

const e = (id: string, anios: number[] = [2016]): Ejemplar => ({
  id, categoria: 'zoologia', prioridad: 'A', dominio: 'biologia', album: '', aceptados: [id],
  nombre: { principal: id, formato: 'comun' }, visu: { anios, otros: [] }, imagenes: [],
});
const p = (over: Partial<ProgresoEjemplar>): ProgresoEjemplar => ({
  descubierto: true, vecesVisto: 3, aciertos: 3, errores: 0, aciertosSeguidos: 3, lapsos: 0, caja: 3,
  ultimoIntento: '2026-09-20', proximaRevision: '2099-01-01', imagenesAcertadas: [], historial: [], ...over,
});

describe('ejemplar del día', () => {
  it('solo elige ejemplares que han salido en examen', () => {
    expect(elegirEjemplarDelDia([e('a', [])], {}, '2026-09-25')).toBeUndefined();
    expect(elegirEjemplarDelDia([e('a', []), e('b')], {}, '2026-09-25')?.ejemplar.id).toBe('b');
  });
  it('prioriza repaso > difícil > nuevo > mantener', () => {
    const lista = [e('dom'), e('nuevo'), e('dificil'), e('repaso')];
    const prog = {
      dom: p({}),
      dificil: p({ errores: 4, aciertos: 1, caja: 1 }),
      repaso: p({ proximaRevision: '2026-09-25' }),
    };
    expect(elegirEjemplarDelDia(lista, prog, '2026-09-25')).toMatchObject({ motivo: 'repaso', ejemplar: { id: 'repaso' } });
    delete (prog as Record<string, unknown>).repaso;
    expect(elegirEjemplarDelDia(lista, prog, '2026-09-25')?.motivo).toBe('dificil');
    expect(elegirEjemplarDelDia([e('dom'), e('nuevo')], { dom: p({}) }, '2026-09-25')?.motivo).toBe('nuevo');
    expect(elegirEjemplarDelDia([e('dom')], { dom: p({}) }, '2026-09-25')?.motivo).toBe('mantener');
  });
  it('es estable durante el día', () => {
    const lista = ['a', 'b', 'c', 'd', 'e'].map((x) => e(x));
    const a = elegirEjemplarDelDia(lista, {}, '2026-09-25')?.ejemplar.id;
    expect(elegirEjemplarDelDia(lista, {}, '2026-09-25')?.ejemplar.id).toBe(a);
  });
});
