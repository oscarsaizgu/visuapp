import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressStore } from './useProgressStore';
import { claveDia } from '../logic/daily';

const r = (over = {}) => ({ ejemplarId: 'x', ok: true, imagenId: 'x-1', ms: 1000, reintento: false, xp: 10, fotosJugables: 3, modo: 'opcion-multiple', combo: 1, ...over });

describe('registrar respuestas', () => {
  beforeEach(() => useProgressStore.getState().reiniciar());

  it('un acierto: XP, descubierto, caja 1 y cuenta para el objetivo', () => {
    const res = useProgressStore.getState().registrarRespuesta(r());
    const s = useProgressStore.getState();
    // Nuevo → aprendiendo también es subir de nivel de dominio: +5
    expect(res).toEqual({ xp: 15, subioNivel: true });
    expect(s.perfil.xp).toBe(15);
    expect(s.perfil.actividad[claveDia()]).toBe(1);
    expect(s.progreso.x).toMatchObject({ descubierto: true, caja: 1, aciertos: 1 });
  });

  it('un reintento no cuenta para el objetivo ni mueve la caja', () => {
    useProgressStore.getState().registrarRespuesta(r({ ok: false, xp: 0 }));
    useProgressStore.getState().registrarRespuesta(r({ reintento: true, xp: 5 }));
    const s = useProgressStore.getState();
    expect(s.perfil.actividad[claveDia()]).toBe(1);
    expect(s.progreso.x).toMatchObject({ caja: 0, errores: 1, aciertos: 0 });
    expect(s.perfil.xp).toBe(5);
  });

  it('ocultar una foto es idempotente', () => {
    useProgressStore.getState().ocultarFoto('a');
    useProgressStore.getState().ocultarFoto('a');
    expect(useProgressStore.getState().fotosOcultas).toEqual(['a']);
  });
});

describe('descubrir desde la ficha', () => {
  beforeEach(() => useProgressStore.getState().reiniciar());
  it('marca descubierto sin tocar XP, dominio ni objetivo', () => {
    useProgressStore.getState().marcarDescubierto('y');
    const s = useProgressStore.getState();
    expect(s.progreso.y).toMatchObject({ descubierto: true, vecesVisto: 0, caja: 0 });
    expect(s.perfil.xp).toBe(0);
    expect(Object.keys(s.perfil.actividad)).toHaveLength(0);
  });
  it('no pisa el progreso existente', () => {
    useProgressStore.getState().registrarRespuesta(r({ ejemplarId: 'y' }));
    const antes = useProgressStore.getState().progreso.y;
    useProgressStore.getState().marcarDescubierto('y');
    expect(useProgressStore.getState().progreso.y).toBe(antes);
  });
});
