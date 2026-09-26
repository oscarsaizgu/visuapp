import { describe, expect, it } from 'vitest';
import { CATALOGO, RUTA, categoriasCon, ejemplaresDesbloqueados, idsDeMundo } from './index';

describe('catálogo completo', () => {
  it('están los 3.132 ejemplares importados y todos tienen fotos de ficha', () => {
    expect(CATALOGO).toHaveLength(3132);
    // 9.657 fotos del catálogo original + las externas con licencia añadidas en la curación.
    expect(RUTA.catalogo.ejemplares).toBe(3132);
    expect(RUTA.catalogo.fotos).toBeGreaterThanOrEqual(9657);
    expect(CATALOGO.reduce((n, e) => n + e.imagenes.length, 0)).toBeLessThanOrEqual(RUTA.catalogo.fotos);
    for (const e of CATALOGO) expect(e.imagenes.length, e.id).toBeGreaterThan(0);
  });
  it('todo ejemplar de la ruta tiene al menos una foto para jugar', () => {
    const porId = new Map(CATALOGO.map((e) => [e.id, e]));
    for (const m of RUTA.mundos) for (const id of idsDeMundo(m)) expect(porId.get(id)!.imagenes.some((i) => i.juego), id).toBe(true);
  });
  it('ninguna foto que da pistas, rotulada o ilustración se usa para jugar', () => {
    const bloqueantes = ['da-pistas', 'rotulada', 'ilustracion', 'calidad', 'otra-especie', 'sin-contenido', 'archivo-danado', 'taxon-dudoso'];
    for (const e of CATALOGO)
      for (const i of e.imagenes)
        if (i.marcas.some((m) => bloqueantes.includes(m))) expect(i.juego, i.id).toBe(false);
  });
  it('los nombres principal y científico nunca vienen pegados', () => {
    for (const e of CATALOGO) {
      const { principal, cientifico } = e.nombre;
      if (cientifico && cientifico !== principal) expect(principal.includes(cientifico), e.id).toBe(false);
    }
  });
  it('lo desbloqueado al empezar es el Mundo 1 (el pack piloto)', () => {
    const d = ejemplaresDesbloqueados({});
    expect(d).toHaveLength(40);
    expect(categoriasCon(d)).toHaveLength(8);
  });
});
