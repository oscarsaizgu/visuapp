import { describe, expect, it } from 'vitest';
import { EJEMPLARES, categoriasActivas } from './index';

describe('contenido activo', () => {
  it('hay ejemplares activos y todos tienen al menos una foto para jugar', () => {
    expect(EJEMPLARES.length).toBeGreaterThan(0);
    for (const e of EJEMPLARES) expect(e.imagenes.some((i) => i.juego), e.id).toBe(true);
  });
  it('ninguna foto que da pistas, rotulada o ilustración se usa para jugar', () => {
    const bloqueantes = ['da-pistas', 'rotulada', 'ilustracion', 'calidad'];
    for (const e of EJEMPLARES)
      for (const i of e.imagenes)
        if (i.marcas.some((m) => bloqueantes.includes(m))) expect(i.juego, i.id).toBe(false);
  });
  it('los nombres principal y científico nunca vienen pegados', () => {
    for (const e of EJEMPLARES) {
      const { principal, cientifico } = e.nombre;
      if (cientifico && cientifico !== principal) expect(principal.includes(cientifico), e.id).toBe(false);
    }
  });
  it('solo se muestran categorías con contenido', () => {
    for (const c of categoriasActivas()) expect(EJEMPLARES.some((e) => e.categoria === c.id)).toBe(true);
  });
});
