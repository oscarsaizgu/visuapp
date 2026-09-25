// Acceso al contenido activo del juego. Los componentes no importan el JSON directamente.
import data from './generated/game-content.json';
import type { CategoriaId, Ejemplar, GameContent, Imagen } from '../types/content';
import { CATEGORIAS, type Categoria } from './categories';

const content = data as GameContent;

export const EJEMPLARES: Ejemplar[] = content.ejemplares;
export const PACKS = content.packs;
export const CATALOGO = content.catalogo;

const porId = new Map(EJEMPLARES.map((e) => [e.id, e]));

export function ejemplar(id: string): Ejemplar | undefined {
  return porId.get(id);
}

export function ejemplaresDe(categoria: CategoriaId): Ejemplar[] {
  return EJEMPLARES.filter((e) => e.categoria === categoria);
}

/** Categorías con al menos un ejemplar activo (las vacías no se muestran). */
export function categoriasActivas(): Categoria[] {
  return CATEGORIAS.filter((c) => EJEMPLARES.some((e) => e.categoria === c.id));
}

export function portada(e: Ejemplar): Imagen | undefined {
  return e.imagenes.find((i) => i.id === e.portada) ?? e.imagenes[0];
}

export function fotosJugables(e: Ejemplar): Imagen[] {
  return e.imagenes.filter((i) => i.juego);
}
