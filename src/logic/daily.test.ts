import { describe, expect, it } from 'vitest';
import { claveDia, diasEntre, rachaVigente } from './daily';
import type { Perfil } from '../types/progress';

const perfil = (over: Partial<Perfil>): Perfil => ({
  xp: 0, objetivoDiario: 10, actividad: {}, rachaActual: 0, mejorRacha: 0, ultimoDiaConObjetivo: null, insignias: [], ...over,
});

describe('días y racha', () => {
  it('clave de día local', () => {
    expect(claveDia(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('diferencia en días, también entre meses y cambios de hora', () => {
    expect(diasEntre('2026-01-31', '2026-02-01')).toBe(1);
    expect(diasEntre('2026-03-28', '2026-03-30')).toBe(2);
  });
  it('la racha vive si se cumplió hoy o ayer', () => {
    const pf = perfil({ rachaActual: 4, ultimoDiaConObjetivo: '2026-09-24' });
    expect(rachaVigente(pf, '2026-09-24')).toBe(4);
    expect(rachaVigente(pf, '2026-09-25')).toBe(4);
    expect(rachaVigente(pf, '2026-09-26')).toBe(0);
    expect(rachaVigente(perfil({}), '2026-09-26')).toBe(0);
  });
});
