// Categorías del juego: nombre, dominio, icono y color. El contenido vive en generated/.
// Corresponden a los tipos y reinos del catálogo (ver categoria() en scripts/import-catalog.mjs).
import type { Icon } from '@phosphor-icons/react';
import {
  Leaf, PawPrint, Umbrella, Microscope, Diamond, Cube, Spiral, Mountains,
} from '@phosphor-icons/react';
import type { CategoriaId, Dominio } from '../types/content';

export interface Categoria {
  id: CategoriaId;
  nombre: string;
  dominio: Dominio;
  icono: Icon;
  /** Color de acento de la categoría (tarjetas, anillos). */
  color: string;
}

export const CATEGORIAS: Categoria[] = [
  { id: 'botanica', nombre: 'Botánica', dominio: 'biologia', icono: Leaf, color: '#3f8f4f' },
  { id: 'zoologia', nombre: 'Zoología', dominio: 'biologia', icono: PawPrint, color: '#1f7a8c' },
  { id: 'hongos', nombre: 'Hongos', dominio: 'biologia', icono: Umbrella, color: '#8a6d3b' },
  { id: 'microscopia', nombre: 'Microscopía', dominio: 'biologia', icono: Microscope, color: '#b0457a' },
  { id: 'minerales', nombre: 'Minerales', dominio: 'geologia', icono: Diamond, color: '#5a63b8' },
  { id: 'rocas', nombre: 'Rocas', dominio: 'geologia', icono: Cube, color: '#8c6a55' },
  { id: 'fosiles', nombre: 'Fósiles', dominio: 'geologia', icono: Spiral, color: '#b8742a' },
  { id: 'geomorfologia', nombre: 'Geomorfología', dominio: 'geologia', icono: Mountains, color: '#4d7c99' },
];

export const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c])) as Record<CategoriaId, Categoria>;

export const DOMINIOS: { id: Dominio; nombre: string }[] = [
  { id: 'biologia', nombre: 'Biología' },
  { id: 'geologia', nombre: 'Geología' },
];
