// Tipos del juego de identificación.
import type { Imagen } from './content';

/** Entrada del índice ligero del catálogo completo (src/content/generated/name-index.json). */
export interface EntradaIndice {
  id: string;
  /** categoría */
  c: string;
  /** álbum */
  a: string;
  /** nombre principal */
  n: string;
  /** nombre científico, si es distinto del principal */
  sci?: string;
  fam?: string;
  gen?: string;
  /** 1 = el principal es un nombre científico */
  f?: 1;
  /** 1 = prioridad A */
  p?: 1;
}

export type ModoJuego = 'opcion-multiple';

export interface Opcion {
  id: string;
  texto: string;
  cursiva: boolean;
}

export interface Pregunta {
  /** Único dentro de la sesión (un ejemplar puede repetirse si se falla). */
  clave: string;
  ejemplarId: string;
  imagen: Imagen;
  opciones: Opcion[];
  /** Es la repetición de un ejemplar fallado en esta misma sesión. */
  reintento: boolean;
  /** Tocaba estudiarlo (nuevo o repaso vencido) al crear la sesión: da la XP completa. */
  pendiente: boolean;
}

export interface Respuesta {
  clave: string;
  ejemplarId: string;
  elegida: string;
  ok: boolean;
  xp: number;
  reintento: boolean;
  ms: number;
}
