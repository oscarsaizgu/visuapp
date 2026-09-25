import { describe, expect, it } from 'vitest';
import { dominioMedio, nivelDominio } from './mastery';
import type { ProgresoEjemplar } from '../types/progress';

const p = (over: Partial<ProgresoEjemplar>): ProgresoEjemplar => ({
  descubierto: true, vecesVisto: 1, aciertos: 0, errores: 0, aciertosSeguidos: 0, lapsos: 0, caja: 0,
  ultimoIntento: null, proximaRevision: null, imagenesAcertadas: [], historial: [], ...over,
});

describe('dominio', () => {
  it('sin progreso o sin verlo es nuevo', () => {
    expect(nivelDominio(undefined)).toBe('nuevo');
    expect(nivelDominio(p({ vecesVisto: 0 }))).toBe('nuevo');
  });
  it('sigue la caja Leitner', () => {
    expect(nivelDominio(p({ caja: 1 }))).toBe('aprendiendo');
    expect(nivelDominio(p({ caja: 2 }))).toBe('familiar');
    expect(nivelDominio(p({ caja: 4 }))).toBe('dominado');
  });
  it('muy dominado exige acertar con 2 fotos distintas', () => {
    expect(nivelDominio(p({ caja: 5, imagenesAcertadas: ['a'] }))).toBe('dominado');
    expect(nivelDominio(p({ caja: 5, imagenesAcertadas: ['a', 'b'] }))).toBe('muy-dominado');
  });
  it('con una sola foto jugable basta con acertarla', () => {
    expect(nivelDominio(p({ caja: 5, imagenesAcertadas: ['a'] }), 1)).toBe('muy-dominado');
  });
  it('media ponderada', () => {
    expect(dominioMedio([], {})).toBe(0);
    expect(dominioMedio(['x', 'y'], { x: p({ caja: 5, imagenesAcertadas: ['a', 'b'] }) })).toBe(0.5);
  });
});

import { distribucionDominio } from './mastery';
describe('distribución de dominio', () => {
  it('cuenta ejemplares por nivel', () => {
    const d = distribucionDominio(['x', 'y', 'z'], { x: p({ caja: 2 }), y: p({ caja: 4 }) });
    expect(d).toEqual({ nuevo: 1, aprendiendo: 0, familiar: 1, dominado: 1, 'muy-dominado': 0 });
  });
});
