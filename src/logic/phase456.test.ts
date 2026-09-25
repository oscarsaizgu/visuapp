import { beforeEach, describe, expect, it } from 'vitest';
import { comprobarEscrito, distancia, tolerancia } from './answerMatch';
import { estadisticasVacias, formatoTiempo, sumarRespuesta, sumarSesion } from './stats';
import { retosCumplidos, retosDelDia } from './challenges';
import { construirSnapshot } from './snapshot';
import { crearSesion, PREGUNTAS_VELOZ } from './session';
import { crearRng } from './rng';
import { desbloqueadas, insigniasVisibles, INSIGNIAS } from '../content/achievements';
import { ejemplaresDesbloqueados, categoriasCon } from '../content';
const EJEMPLARES = ejemplaresDesbloqueados({});
const categoriasActivas = () => categoriasCon(EJEMPLARES);
import { useProgressStore } from '../store/useProgressStore';
import { claveDia } from './daily';
import type { Ejemplar } from '../types/content';
import type { EntradaIndice } from '../types/game';
import indiceReal from '../content/generated/name-index.json';

const salamandra = {
  nombre: { principal: 'Salamandra rabilarga', cientifico: 'Chioglossa lusitanica', formato: 'comun' },
  aceptados: ['Chioglossa lusitanica', 'Salamandra rabilarga'],
} as Ejemplar;

describe('respuesta escrita', () => {
  it('distancia de edición', () => {
    expect(distancia('galena', 'galena')).toBe(0);
    expect(distancia('galena', 'galeba')).toBe(1);
    expect(distancia('', 'abc')).toBe(3);
  });
  it('tolerancia según longitud', () => {
    expect([tolerancia(4), tolerancia(8), tolerancia(20)]).toEqual([0, 1, 2]);
  });
  it('acepta científico o común, sin tildes/mayúsculas y con erratas pequeñas', () => {
    expect(comprobarEscrito('chioglossa lusitanica', salamandra)).toMatchObject({ ok: true, exacto: true });
    expect(comprobarEscrito('SALAMANDRA RABILARGA', salamandra)).toMatchObject({ ok: true, exacto: true });
    expect(comprobarEscrito('Chioglosa lusitanica', salamandra)).toMatchObject({ ok: true, exacto: false, esperado: 'Chioglossa lusitanica' });
    expect(comprobarEscrito('Salamandra salamandra', salamandra).ok).toBe(false);
    expect(comprobarEscrito('   ', salamandra).ok).toBe(false);
  });
  it('en nombres cortos no se admiten erratas', () => {
    const yeso = { nombre: { principal: 'Yeso', formato: 'comun' }, aceptados: ['Yeso'] } as Ejemplar;
    expect(comprobarEscrito('yeso', yeso).ok).toBe(true);
    expect(comprobarEscrito('yesa', yeso).ok).toBe(false);
  });
});

describe('estadísticas', () => {
  it('suman respuestas por día, categoría y modo; los reintentos no cuentan como respuesta', () => {
    let e = estadisticasVacias();
    const base = { ms: 2000, xp: 10, categoria: 'rocas', modo: 'escribir', combo: 1, reintento: false, nuevo: true };
    e = sumarRespuesta(e, '2026-09-25', { ...base, ok: true });
    e = sumarRespuesta(e, '2026-09-25', { ...base, ok: false, xp: 0, combo: 0, nuevo: false });
    e = sumarRespuesta(e, '2026-09-25', { ...base, ok: true, reintento: true, xp: 5, combo: 1, nuevo: false });
    expect(e).toMatchObject({ respuestas: 2, aciertos: 1, tiempoMs: 6000 });
    expect(e.porDia['2026-09-25']).toMatchObject({ n: 2, ok: 1, xp: 15, nuevos: 1, porCategoria: { rocas: 2 }, porModo: { escribir: 2 } });
    e = sumarSesion(e, '2026-09-25', { perfecta: true, xp: 30, veloz: 12 });
    expect(e).toMatchObject({ sesiones: 1, sesionesPerfectas: 1, velozMejor: 12 });
    expect(e.porDia['2026-09-25']).toMatchObject({ sesiones: 1, perfectas: 1, veloz: 12, xp: 45 });
  });
  it('formato de tiempo', () => {
    expect(formatoTiempo(45 * 60000)).toBe('45 min');
    expect(formatoTiempo(130 * 60000)).toBe('2 h 10 min');
  });
});

describe('retos diarios', () => {
  const cats = categoriasActivas();
  it('3 retos estables por día, siempre uno de categoría', () => {
    const a = retosDelDia('2026-09-25', cats);
    expect(a).toHaveLength(3);
    expect(a.map((r) => r.id)).toEqual(retosDelDia('2026-09-25', cats).map((r) => r.id));
    expect(a.some((r) => r.id.startsWith('categoria-'))).toBe(true);
    expect(new Set(a.map((r) => r.id)).size).toBe(3);
  });
  it('se cumplen al llegar al objetivo', () => {
    const r = retosDelDia('2026-09-25', cats);
    const cat = r.find((x) => x.id.startsWith('categoria-'))!.id.replace('categoria-', '');
    const dia = { n: 20, ok: 20, xp: 0, ms: 0, nuevos: 0, comboMax: 10, sesiones: 2, perfectas: 1, veloz: 15, porCategoria: { [cat]: 5 }, porModo: { escribir: 5, 'elegir-foto': 5 } };
    expect(retosCumplidos(r, dia)).toHaveLength(3);
  });
});

describe('insignias', () => {
  it('ids únicos y ninguna desbloqueada sin progreso', () => {
    expect(new Set(INSIGNIAS.map((i) => i.id)).size).toBe(INSIGNIAS.length);
    const snap = construirSnapshot(EJEMPLARES, {}, useProgressStore.getState().perfil, estadisticasVacias());
    expect(desbloqueadas(snap)).toEqual([]);
    // Solo se muestran las de categorías con contenido activo
    expect(insigniasVisibles(snap).some((i) => i.id === 'maestro-fosiles')).toBe(true);
  });
});

describe('store: insignias, retos y migración', () => {
  beforeEach(() => useProgressStore.getState().reiniciar());
  it('el primer acierto desbloquea insignias y las pone en cola para celebrarlas', () => {
    const e = EJEMPLARES.find((x) => x.categoria === 'fosiles')!;
    useProgressStore.getState().registrarRespuesta({ ejemplarId: e.id, ok: true, imagenId: 'i', ms: 1000, reintento: false, xp: 10, fotosJugables: 3, modo: 'opcion-multiple', combo: 1 });
    const s = useProgressStore.getState();
    expect(Object.keys(s.logros.insignias)).toEqual(expect.arrayContaining(['primer-acierto', 'primero-fosiles']));
    expect(s.celebraciones.map((c) => c.id)).toEqual(expect.arrayContaining(['primer-acierto', 'primero-fosiles']));
    expect(s.estadisticas.porDia[claveDia()].porCategoria.fosiles).toBe(1);
  });
  it('importar rechaza datos inválidos y acepta un export', () => {
    expect(useProgressStore.getState().importar({ nada: 1 })).toBe(false);
    const exportado = { state: { perfil: { ...useProgressStore.getState().perfil, xp: 321 }, progreso: {} }, version: 1 };
    expect(useProgressStore.getState().importar(exportado)).toBe(true);
    expect(useProgressStore.getState().perfil.xp).toBe(321);
    expect(useProgressStore.getState().estadisticas.respuestas).toBe(0);
  });
});

describe('sesiones por modo (contenido real)', () => {
  const indice = indiceReal as EntradaIndice[];
  const ctx = () => ({ progreso: {}, indice, porId: new Map(indice.map((x) => [x.id, x])), rng: crearRng(5), ocultas: new Set<string>(), activos: EJEMPLARES });
  it('elegir la foto: 4 fotos distintas, una del ejemplar correcto', () => {
    const { preguntas } = crearSesion(EJEMPLARES, ctx(), '2026-09-25', 'elegir-foto');
    expect(preguntas.length).toBe(10);
    for (const q of preguntas) {
      expect(q.fotos).toHaveLength(4);
      expect(new Set(q.fotos!.map((f) => f.id)).size).toBe(4);
      expect(q.fotos!.filter((f) => f.id === q.ejemplarId)).toHaveLength(1);
      expect(q.fotos!.every((f) => f.imagen.juego)).toBe(true);
    }
  });
  it('escribir: sin opciones; veloz: muchas preguntas y sin XP completa', () => {
    expect(crearSesion(EJEMPLARES, ctx(), '2026-09-25', 'escribir').preguntas.every((q) => q.opciones.length === 0)).toBe(true);
    const v = crearSesion(EJEMPLARES, ctx(), '2026-09-25', 'veloz');
    expect(v.preguntas.length).toBe(PREGUNTAS_VELOZ);
    expect(v.preguntas.every((q) => !q.pendiente && q.opciones.length === 4)).toBe(true);
  });
  it('repaso sin nada pendiente: vacío', () => {
    expect(crearSesion(EJEMPLARES, ctx(), '2026-09-25', 'repaso').preguntas).toHaveLength(0);
  });
});

describe('revisar logros sin jugar', () => {
  beforeEach(() => useProgressStore.getState().reiniciar());
  it('desbloquea lo que ya corresponde, en silencio', () => {
    useProgressStore.setState({ estadisticas: { ...estadisticasVacias(), aciertos: 120, respuestas: 130 } });
    useProgressStore.getState().revisarLogros(true);
    const s = useProgressStore.getState();
    expect(s.logros.insignias['aciertos-100']).toBeTruthy();
    expect(s.celebraciones).toHaveLength(0);
  });
});
