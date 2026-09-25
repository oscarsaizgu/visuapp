// Cómo se escribe un ejemplar como opción de respuesta.
// En biología se pregunta por el NOMBRE CIENTÍFICO (como en el VISU) y en todas las opciones
// igual: si unas llevaran nombre común y otras no, el formato delataría la respuesta.
import type { Ejemplar } from '../types/content';
import type { EntradaIndice, Opcion } from '../types/game';

const BIO = new Set(['botanica', 'zoologia', 'hongos']);

export function opcionDesdeIndice(x: EntradaIndice): Opcion {
  if (BIO.has(x.c)) return { id: x.id, texto: x.sci ?? x.n, cursiva: true };
  return { id: x.id, texto: x.n, cursiva: x.f === 1 };
}

export function opcionDesdeEjemplar(e: Ejemplar): Opcion {
  if (BIO.has(e.categoria)) return { id: e.id, texto: e.nombre.cientifico ?? e.nombre.principal, cursiva: true };
  return { id: e.id, texto: e.nombre.principal, cursiva: e.nombre.formato === 'cientifico' };
}
