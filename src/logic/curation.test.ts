import { describe, expect, it } from 'vitest';
import { elegirFoto, fotosDePregunta } from './imagePick';
import { elegirDistractores } from './distractors';
import { crearRng } from './rng';
import { comprobarEscrito } from './answerMatch';
import { migrarProgreso, sumarConfusion } from '../store/useProgressStore';
import { ejemplar } from '../content';
import curacion from '../content/generated/curacion.json';
import indiceReal from '../content/generated/name-index.json';
import type { Ejemplar, Imagen } from '../types/content';
import type { EntradaIndice } from '../types/game';
import type { ProgresoEjemplar } from '../types/progress';

const foto = (id: string, juego = true): Imagen => ({ id, archivo: `/img/${id}.webp`, ancho: 800, alto: 600, marcas: [], juego, ficha: true });
const ej = (imagenes: Imagen[], portada?: string) => ({ id: 'x', imagenes, portada: portada ?? imagenes[0]?.id } as Ejemplar);
const prog = (vecesVisto: number): ProgresoEjemplar => ({
  descubierto: true, vecesVisto, aciertos: 0, errores: 0, aciertosSeguidos: 0, lapsos: 0, caja: 0,
  ultimoIntento: null, proximaRevision: null, imagenesAcertadas: [], historial: [],
});

describe('fotos por papel', () => {
  it('la principal (aprender) no se usa para preguntar si hay otras', () => {
    const e = ej([foto('a'), foto('b'), foto('c')], 'a');
    expect(fotosDePregunta(e).map((i) => i.id)).toEqual(['b', 'c']);
  });
  it('si solo hay una foto jugable, se pregunta con ella', () => {
    expect(fotosDePregunta(ej([foto('a'), foto('b', false)], 'a')).map((i) => i.id)).toEqual(['a']);
  });
  it('cada modo empieza por una foto distinta y rota con cada vez que se ve', () => {
    const e = ej([foto('p'), foto('b'), foto('c'), foto('d'), foto('e')], 'p');
    const rng = crearRng(1);
    const primeras = ['opcion-multiple', 'repaso', 'veloz', 'escribir'].map((m) => elegirFoto(e, prog(0), rng, new Set(), undefined, m)!.id);
    expect(new Set(primeras).size).toBe(4);
    expect(primeras).not.toContain('p');
    expect(elegirFoto(e, prog(1), rng, new Set(), undefined, 'opcion-multiple')!.id).not.toBe(primeras[0]);
  });
});

describe('ejemplares curados (piloto)', () => {
  it('cada ejemplar curado tiene exactamente una principal, que es su portada y va la primera', () => {
    expect(curacion.ejemplares.length).toBeGreaterThanOrEqual(20);
    for (const c of curacion.ejemplares) {
      expect(c.fotos.filter((f) => f.uso === 'principal'), c.id).toHaveLength(1);
      const e = ejemplar(c.id)!;
      const principal = c.fotos.find((f) => f.uso === 'principal')!.id;
      expect(e.portada, c.id).toBe(principal);
      expect(e.imagenes[0].id, c.id).toBe(principal);
      expect(c.fotos.every((f) => f.uso !== 'sin-decidir'), c.id).toBe(true);
    }
  });
  it('las fotos excluidas no llegan al juego ni a la ficha', () => {
    for (const c of curacion.ejemplares) {
      const ids = new Set(ejemplar(c.id)!.imagenes.map((i) => i.id));
      for (const f of c.fotos.filter((x) => x.uso === 'excluida')) expect(ids.has(f.id), f.id).toBe(false);
    }
  });
  it('las fotos externas llevan autor, licencia libre y URL; las originales, licencia no verificada', () => {
    for (const c of curacion.ejemplares) for (const f of c.fotos) {
      if (f.id.includes('-ext')) {
        expect(f.procedencia.distribuible, f.id).toBe(true);
        expect(f.procedencia.licencia, f.id).toMatch(/^(CC0|CC BY|Public domain)/);
        expect('url' in f.procedencia && f.procedencia.url, f.id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      } else {
        expect(f.procedencia.licencia, f.id).toBe('no-verificada');
      }
    }
    const conCredito = ejemplar('mustela-nivalis')!.imagenes.filter((i) => i.credito);
    expect(conCredito.length).toBeGreaterThan(0);
  });
});

describe('nombres', () => {
  const indice = indiceReal as EntradaIndice[];
  const porId = new Map(indice.map((x) => [x.id, x]));
  it('los sinónimos y los pares indistinguibles nunca son distractor el uno del otro', () => {
    for (let s = 0; s < 40; s++) {
      const d = elegirDistractores(porId.get('aglais-io')!, indice, 5, crearRng(s));
      expect(d.map((x) => x.id)).not.toContain('inachis-io');
      const h = elegirDistractores(porId.get('hyla-molleri')!, indice, 5, crearRng(s));
      expect(h.map((x) => x.id)).not.toContain('hyla-arborea');
    }
  });
  it('los nombres que confundes se ponen como distractores', () => {
    const ok = porId.get('rana-temporaria')!;
    const confundido = indice.find((x) => x.c === ok.c && x.id !== ok.id && x.a === 'Mamíferos')!;
    const d = elegirDistractores(ok, indice, 0, crearRng(3), 3, [confundido]);
    expect(d.map((x) => x.id)).toContain(confundido.id);
  });
  it('escribir el nombre común avisa de que se pide el científico', () => {
    const r = comprobarEscrito('rana bermeja', ejemplar('rana-temporaria')!);
    expect(r).toMatchObject({ ok: false, comun: true, esperado: 'Rana temporaria' });
    expect(comprobarEscrito('Rana temporaria', ejemplar('rana-temporaria')!).ok).toBe(true);
    // Sin nombre científico (geología) vale el nombre del catálogo.
    expect(comprobarEscrito('diorita', ejemplar('roca-diorita')!).ok).toBe(true);
  });
});

describe('confusiones', () => {
  it('cuentan y se quedan las 8 más frecuentes', () => {
    let c: Record<string, Record<string, number>> = {};
    c = sumarConfusion(c, 'a', 'b');
    c = sumarConfusion(c, 'a', 'b');
    for (let i = 0; i < 10; i++) c = sumarConfusion(c, 'a', `z${i}`);
    expect(c.a.b).toBe(2);
    expect(Object.keys(c.a)).toHaveLength(8);
  });
  it('el progreso de la versión 3 migra sin perder nada y empieza sin confusiones', () => {
    const v3 = { perfil: { xp: 50 }, progreso: { x: prog(2) }, fotosOcultas: ['f'], estadisticas: { dias: {} }, logros: { insignias: {}, retos: {} }, ruta: { lecciones: {}, repasos: {}, examenes: {}, ultimoSubmundo: null } };
    const m = migrarProgreso(v3, 3);
    expect(m.perfil.xp).toBe(50);
    expect(m.progreso.x.vecesVisto).toBe(2);
    expect(m.confusiones).toEqual({});
  });
});
