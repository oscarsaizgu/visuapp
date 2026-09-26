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
  /** Ejemplares que nunca se usan como distractor de este (content/curation/name-review.json). */
  nd?: string[];
}

export type ModoJuego = 'opcion-multiple' | 'escribir' | 'elegir-foto' | 'veloz' | 'repaso';

/** Opción de "Elegir la foto": una foto de un ejemplar. */
export interface OpcionFoto { id: string; imagen: Imagen }

export interface Opcion {
  id: string;
  texto: string;
  cursiva: boolean;
}

export interface Pregunta {
  /** Único dentro de la sesión (un ejemplar puede repetirse si se falla). */
  clave: string;
  modo: ModoJuego;
  ejemplarId: string;
  imagen: Imagen;
  /** Opciones de texto (opción múltiple, veloz, repaso). Vacío en "escribir" y "elegir-foto". */
  opciones: Opcion[];
  /** Solo en "elegir-foto". */
  fotos?: OpcionFoto[];
  /** Es la repetición de un ejemplar fallado en esta misma sesión. */
  reintento: boolean;
  /** Tocaba estudiarlo (nuevo o repaso vencido) al crear la sesión: da la XP completa. */
  pendiente: boolean;
}

export interface Respuesta {
  clave: string;
  ejemplarId: string;
  /** id de la opción elegida o, en "escribir", el texto escrito. */
  elegida: string;
  /** En "escribir": acierto con alguna errata. */
  casi?: boolean;
  /** En "escribir": escribió el nombre común en vez del científico. */
  comun?: boolean;
  ok: boolean;
  xp: number;
  reintento: boolean;
  ms: number;
}
