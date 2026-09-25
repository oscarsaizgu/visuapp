import { describe, expect, it } from 'vitest';
import { crearRng, barajar } from './rng';
import { elegirDistractores } from './distractors';
import { opcionDesdeIndice } from './optionText';
import { aplicarRespuesta, INTERVALOS } from './srs';
import { xpPorRespuesta, xpFinSesion } from './xp';
import { registrarActividad } from './daily';
import { elegirFoto } from './imagePick';
import type { EntradaIndice } from '../types/game';
import type { Ejemplar, Imagen } from '../types/content';
import type { Perfil } from '../types/progress';
import indiceReal from '../content/generated/name-index.json';

const idx = (id: string, c: string, a: string, n: string, extra: Partial<EntradaIndice> = {}): EntradaIndice => ({ id, c, a, n, ...extra });

describe('rng', () => {
  it('misma semilla, mismo resultado', () => {
    expect(barajar([1, 2, 3, 4, 5], crearRng(7))).toEqual(barajar([1, 2, 3, 4, 5], crearRng(7)));
  });
});

describe('distractores', () => {
  const ok = idx('ok', 'zoologia', 'Bivalvos', 'Zamburiña', { sci: 'Mimachlamys varia', fam: 'Pectinidae', gen: 'Mimachlamys' });
  const indice = [
    ok,
    idx('g1', 'zoologia', 'Bivalvos', 'x', { sci: 'Mimachlamys otra', fam: 'Pectinidae', gen: 'Mimachlamys' }),
    idx('f1', 'zoologia', 'Bivalvos', 'x', { sci: 'Pecten maximus', fam: 'Pectinidae', gen: 'Pecten' }),
    idx('a1', 'zoologia', 'Bivalvos', 'x', { sci: 'Donax trunculus', fam: 'Donacidae', gen: 'Donax' }),
    idx('c1', 'zoologia', 'Aves', 'x', { sci: 'Turdus merula', fam: 'Turdidae', gen: 'Turdus' }),
    idx('c2', 'zoologia', 'Anfibios', 'x', { sci: 'Rana temporaria', fam: 'Ranidae', gen: 'Rana' }),
    idx('var', 'zoologia', 'Bivalvos', 'x', { sci: 'Mimachlamys varia var. rara', fam: 'Pectinidae', gen: 'Mimachlamys' }),
    idx('otra-cat', 'botanica', 'Helechos', 'x', { sci: 'Adiantum capillus-veneris' }),
  ];
  it('siempre de la misma categoría, sin repetir, sin la propia especie', () => {
    for (let s = 0; s < 20; s++) for (const caja of [0, 2, 4]) {
      const d = elegirDistractores(ok, indice, caja, crearRng(s));
      expect(d).toHaveLength(3);
      expect(new Set(d.map((x) => x.id)).size).toBe(3);
      expect(d.every((x) => x.c === 'zoologia' && x.id !== 'ok' && x.id !== 'var')).toBe(true);
    }
  });
  it('con más dominio, distractores más parecidos', () => {
    const d = elegirDistractores(ok, indice, 5, crearRng(1)).map((x) => x.id);
    expect(d.slice(0, 2).sort()).toEqual(['f1', 'g1']);
    const nuevo = elegirDistractores(ok, indice, 0, crearRng(1)).map((x) => x.id);
    expect(nuevo.filter((x) => x === 'c1' || x === 'c2')).toHaveLength(2);
  });
  it('en biología las opciones son nombres científicos en cursiva', () => {
    expect(opcionDesdeIndice(ok)).toEqual({ id: 'ok', texto: 'Mimachlamys varia', cursiva: true });
    expect(opcionDesdeIndice(idx('m', 'minerales', 'Sulfuros', 'Galena'))).toEqual({ id: 'm', texto: 'Galena', cursiva: false });
    expect(opcionDesdeIndice(idx('f', 'fosiles', 'Graptolitos', 'Spirograptus', { f: 1 })).cursiva).toBe(true);
  });
  it('con el catálogo real: 3 distractores válidos para todos los ejemplares', () => {
    const real = indiceReal as EntradaIndice[];
    for (const e of real) {
      const d = elegirDistractores(e, real, 0, crearRng(3));
      expect(d.length, e.id).toBe(3);
      const textos = [e, ...d].map((x) => opcionDesdeIndice(x).texto.toLowerCase());
      expect(new Set(textos).size, e.id).toBe(4);
    }
  });
});

describe('repetición espaciada', () => {
  const base = { hoy: '2026-09-25', imagenId: 'i1', modo: 'opcion-multiple', ms: 2000, cuentaParaCaja: true };
  it('acierto: sube de caja y aplaza el repaso', () => {
    const p = aplicarRespuesta(undefined, { ...base, ok: true });
    expect(p).toMatchObject({ descubierto: true, vecesVisto: 1, aciertos: 1, caja: 1, proximaRevision: '2026-09-26', imagenesAcertadas: ['i1'] });
    const p2 = aplicarRespuesta({ ...p, caja: 4 }, { ...base, ok: true, imagenId: 'i2' });
    expect(p2.caja).toBe(5);
    expect(p2.proximaRevision).toBe('2026-10-30'); // +35 días
    expect(INTERVALOS[5]).toBe(35);
  });
  it('fallo: baja dos cajas, cuenta el lapso y vuelve hoy', () => {
    const p = aplicarRespuesta({ ...aplicarRespuesta(undefined, { ...base, ok: true }), caja: 4 }, { ...base, ok: false });
    expect(p).toMatchObject({ caja: 2, errores: 1, aciertosSeguidos: 0, lapsos: 1, proximaRevision: '2026-09-25' });
  });
  it('el reintento no mueve la caja', () => {
    const p = aplicarRespuesta(undefined, { ...base, ok: true, cuentaParaCaja: false });
    expect(p).toMatchObject({ caja: 0, vecesVisto: 0, descubierto: true });
    expect(p.historial).toHaveLength(1);
  });
});

describe('XP', () => {
  it('acierto pendiente 10, reintento 5, no pendiente 2, fallo 0', () => {
    expect(xpPorRespuesta({ ok: true, reintento: false, pendiente: true, combo: 1 })).toBe(10);
    expect(xpPorRespuesta({ ok: true, reintento: true, pendiente: true, combo: 1 })).toBe(5);
    expect(xpPorRespuesta({ ok: true, reintento: false, pendiente: false, combo: 1 })).toBe(2);
    expect(xpPorRespuesta({ ok: false, reintento: false, pendiente: true, combo: 0 })).toBe(0);
  });
  it('combo: +2 por acierto seguido, máximo +10', () => {
    expect(xpPorRespuesta({ ok: true, reintento: false, pendiente: true, combo: 3 })).toBe(14);
    expect(xpPorRespuesta({ ok: true, reintento: false, pendiente: true, combo: 20 })).toBe(20);
  });
  it('fin de sesión', () => {
    expect(xpFinSesion(false)).toBe(20);
    expect(xpFinSesion(true)).toBe(30);
  });
});

describe('actividad diaria y racha', () => {
  const perfil: Perfil = { xp: 0, objetivoDiario: 2, actividad: {}, rachaActual: 3, mejorRacha: 3, ultimoDiaConObjetivo: '2026-09-24', insignias: [] };
  it('la racha sube al cumplir el objetivo el día siguiente', () => {
    const a = registrarActividad(perfil, '2026-09-25');
    expect(a).toMatchObject({ actividad: { '2026-09-25': 1 }, rachaActual: 3 });
    const b = registrarActividad(a, '2026-09-25');
    expect(b).toMatchObject({ rachaActual: 4, mejorRacha: 4, ultimoDiaConObjetivo: '2026-09-25' });
    expect(registrarActividad(b, '2026-09-25').rachaActual).toBe(4); // no suma dos veces el mismo día
  });
  it('si se rompió, vuelve a empezar en 1', () => {
    const p = registrarActividad(registrarActividad(perfil, '2026-09-28'), '2026-09-28');
    expect(p.rachaActual).toBe(1);
    expect(p.mejorRacha).toBe(3);
  });
});

describe('elección de foto', () => {
  const img = (id: string, juego = true): Imagen => ({ id, archivo: id, ancho: 800, alto: 600, marcas: [], juego, ficha: true });
  const e = { id: 'e', imagenes: [img('a'), img('b'), img('c', false)] } as Ejemplar;
  it('solo fotos jugables y no ocultas; evita repetir la última', () => {
    for (let s = 0; s < 20; s++) {
      expect(elegirFoto(e, undefined, crearRng(s))?.id).not.toBe('c');
      expect(elegirFoto(e, undefined, crearRng(s), new Set(['a']))?.id).toBe('b');
      expect(elegirFoto(e, undefined, crearRng(s), new Set(), 'a')?.id).toBe('b');
    }
  });
});
