import { describe, expect, it } from 'vitest';
import { clasificacion, comparacion } from './feedback';
import type { Ejemplar } from '../types/content';

const e = {
  album: 'Bivalvos',
  taxonomia: { orden: 'Pectinida', familia: 'Pectinidae', genero: 'Mimachlamys' },
} as Ejemplar;

describe('feedback', () => {
  it('clasificación con los datos que existan', () => {
    expect(clasificacion(e)).toBe('Bivalvos · orden Pectinida · familia Pectinidae');
    expect(clasificacion({ album: 'Sulfuros' } as Ejemplar)).toBe('Sulfuros');
  });
  it('comparación de mayor a menor parecido', () => {
    expect(comparacion(e, { id: 'a', c: 'zoologia', a: 'Bivalvos', n: '', gen: 'Mimachlamys', fam: 'Pectinidae' })).toMatch(/mismo género/);
    expect(comparacion(e, { id: 'a', c: 'zoologia', a: 'Bivalvos', n: '', gen: 'Pecten', fam: 'Pectinidae' })).toMatch(/misma familia/);
    expect(comparacion(e, { id: 'a', c: 'zoologia', a: 'Bivalvos', n: '', fam: 'Donacidae' })).toBe('Es del mismo grupo (Bivalvos), pero de otra familia: Donacidae frente a Pectinidae.');
    expect(comparacion(e, { id: 'a', c: 'zoologia', a: 'Aves', n: '' })).toBe('Es de otro grupo: Aves, frente a Bivalvos.');
  });
});
