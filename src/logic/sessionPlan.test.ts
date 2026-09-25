import { describe, expect, it } from 'vitest';
import { planificarSesion } from './sessionPlan';
import type { Ejemplar, CategoriaId } from '../types/content';
import type { ProgresoEjemplar } from '../types/progress';

const e = (id: string, categoria: CategoriaId, prioridad: 'A' | 'B' = 'A', anios: number[] = []): Ejemplar => ({
  id, categoria, prioridad, dominio: 'biologia', album: '', aceptados: [id],
  nombre: { principal: id, formato: 'comun' }, visu: { anios, otros: [] }, imagenes: [],
});
const visto = (proximaRevision: string | null): ProgresoEjemplar => ({
  descubierto: true, vecesVisto: 2, aciertos: 1, errores: 1, aciertosSeguidos: 0, lapsos: 0, caja: 1,
  ultimoIntento: '2026-09-20', proximaRevision, imagenesAcertadas: [], historial: [],
});

describe('plan de sesión', () => {
  const lista = [
    e('b1', 'botanica', 'B'), e('b2', 'botanica', 'A', [2016]), e('b3', 'botanica'),
    e('m1', 'minerales'), e('m2', 'minerales'), e('r1', 'rocas', 'B'),
  ];

  it('sin progreso: todo nuevo, A y "salió en VISU" primero, categorías intercaladas', () => {
    const plan = planificarSesion(lista, {}, '2026-09-25', 4);
    expect(plan.repasos).toEqual([]);
    expect(plan.ejemplares).toEqual(['b2', 'm1', 'r1', 'b3']);
  });

  it('los repasos vencidos van primero, del más antiguo al más reciente', () => {
    const prog = { m2: visto('2026-09-25'), b3: visto('2026-09-01'), b1: visto('2026-12-01') };
    const plan = planificarSesion(lista, prog, '2026-09-25', 3);
    expect(plan.repasos).toEqual(['b3', 'm2']);
    expect(plan.nuevos).toHaveLength(1);
    expect(plan.ejemplares).not.toContain('b1');
  });

  it('todo al día y sin nuevos: plan vacío', () => {
    const prog = Object.fromEntries(lista.map((x) => [x.id, visto('2099-01-01')]));
    expect(planificarSesion(lista, prog, '2026-09-25').ejemplares).toEqual([]);
  });
});

describe('estimación de minutos', () => {
  it('se calcula a partir del número de identificaciones', () => {
    const lista = Array.from({ length: 10 }, (_, i) => e(`x${i}`, 'rocas'));
    expect(planificarSesion(lista, {}, '2026-09-25').minutos).toBe(8); // 10 × 45 s = 7,5 → 8
    expect(planificarSesion(lista.slice(0, 3), {}, '2026-09-25').minutos).toBe(3); // 135 s → 3
  });
});

describe('límites e inteligencia del plan', () => {
  it('no hay límite diario de ejemplares nuevos', () => {
    const lista = Array.from({ length: 10 }, (_, i) => e(`n${i}`, 'rocas'));
    expect(planificarSesion(lista, {}, '2026-09-25', 10).nuevos).toHaveLength(10);
  });
  it('prioriza el retraso relativo al intervalo', () => {
    const lista = [e('caja5', 'rocas'), e('caja1', 'rocas')];
    const prog = {
      caja5: { ...visto('2026-09-20'), caja: 5 }, // 5 días tarde de 35 → 0,14
      caja1: { ...visto('2026-09-23'), caja: 1 }, // 2 días tarde de 1 → 2
    };
    expect(planificarSesion(lista, prog, '2026-09-25').repasos).toEqual(['caja1', 'caja5']);
  });
});
