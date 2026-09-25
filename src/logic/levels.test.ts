import { describe, expect, it } from 'vitest';
import { nivelDesdeXp, rangoDeNivel, xpParaNivel } from './levels';

describe('niveles', () => {
  it('curva: 0, 100, 300, 600 XP', () => {
    expect([1, 2, 3, 4].map(xpParaNivel)).toEqual([0, 100, 300, 600]);
  });
  it('calcula nivel y progreso dentro del nivel', () => {
    expect(nivelDesdeXp(0)).toMatchObject({ nivel: 1, xpEnNivel: 0, xpNivel: 100 });
    expect(nivelDesdeXp(99).nivel).toBe(1);
    expect(nivelDesdeXp(100).nivel).toBe(2);
    expect(nivelDesdeXp(450)).toMatchObject({ nivel: 3, xpEnNivel: 150, xpNivel: 300, progreso: 0.5 });
  });
  it('XP negativa o decimal no rompe', () => {
    expect(nivelDesdeXp(-5).nivel).toBe(1);
    expect(nivelDesdeXp(100.9).nivel).toBe(2);
  });
  it('rangos', () => {
    expect(rangoDeNivel(1)).toBe('Aprendiz de campo');
    expect(rangoDeNivel(7)).toBe('Naturalista');
    expect(rangoDeNivel(40)).toBe('Catedrático');
  });
});
