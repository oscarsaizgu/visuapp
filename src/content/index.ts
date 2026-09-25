// Acceso al contenido. Tres capas bien separadas:
// - CATÁLOGO: todos los ejemplares importados de Visu-Oposicion (siempre disponibles para estudiar).
// - RUTA: mundos → submundos → lecciones/repasos → examen (qué se aprende y en qué orden).
// - DESBLOQUEADO: los ejemplares de los mundos abiertos (depende del progreso del jugador).
// Los componentes no importan los JSON directamente.
import rutaData from './generated/ruta.json';
import type { CategoriaId, Ejemplar, Imagen, Mundo, NodoRuta, Ruta, Submundo } from '../types/content';
import { CATEGORIAS, type Categoria } from './categories';
import { indiceDelDia } from '../logic/dailyPick';

// El catálogo completo (~3 MB, ~300 KB comprimido) va en un fragmento aparte y se carga al arrancar.
const catalogoData = (await import('./generated/catalogo.json')).default as unknown as Ejemplar[];

export const CATALOGO: Ejemplar[] = catalogoData;
export const RUTA = rutaData as Ruta;

const porId = new Map(CATALOGO.map((e) => [e.id, e]));

export function ejemplar(id: string): Ejemplar | undefined {
  return porId.get(id);
}

export function ejemplaresPorIds(ids: readonly string[]): Ejemplar[] {
  return ids.map((id) => porId.get(id)).filter((e): e is Ejemplar => e !== undefined);
}

export function ejemplaresDe(categoria: CategoriaId, lista: readonly Ejemplar[] = CATALOGO): Ejemplar[] {
  return lista.filter((e) => e.categoria === categoria);
}

/** Categorías con al menos un ejemplar en la lista (las vacías no se muestran). */
export function categoriasCon(lista: readonly Ejemplar[] = CATALOGO): Categoria[] {
  const presentes = new Set(lista.map((e) => e.categoria));
  return CATEGORIAS.filter((c) => presentes.has(c.id));
}

// ---------- Ruta ----------

const nodoPorId = new Map<string, { nodo: NodoRuta; submundo: Submundo; mundo: Mundo; indice: number }>();
for (const mundo of RUTA.mundos) for (const submundo of mundo.submundos) submundo.nodos.forEach((nodo, indice) => nodoPorId.set(nodo.id, { nodo, submundo, mundo, indice }));

export function mundo(id: string): Mundo | undefined {
  return RUTA.mundos.find((m) => m.id === id);
}

export function nodoRuta(id: string) {
  return nodoPorId.get(id);
}

export function idsDeMundo(m: Mundo): string[] {
  return m.submundos.flatMap((s) => s.nodos.filter((n) => n.tipo === 'leccion').flatMap((n) => n.ejemplares));
}

/**
 * Mundos abiertos: el primero siempre; cada uno de los siguientes, cuando se ha superado
 * el examen del anterior.
 */
export function mundosDesbloqueados(superados: Record<string, unknown>): Mundo[] {
  const out: Mundo[] = [];
  for (const m of RUTA.mundos) {
    out.push(m);
    if (!superados[m.id]) break;
  }
  return out;
}

const cacheDesbloqueados = new Map<string, Ejemplar[]>();
/** Ejemplares de los mundos abiertos (lo que usan los modos de juego libres, retos e insignias). */
export function ejemplaresDesbloqueados(superados: Record<string, unknown>): Ejemplar[] {
  const abiertos = mundosDesbloqueados(superados);
  const clave = abiertos.map((m) => m.id).join(',');
  let lista = cacheDesbloqueados.get(clave);
  if (!lista) {
    lista = ejemplaresPorIds(abiertos.flatMap(idsDeMundo));
    cacheDesbloqueados.set(clave, lista);
  }
  return lista;
}

// ---------- Fotos ----------

export function portada(e: Ejemplar): Imagen | undefined {
  return e.imagenes.find((i) => i.id === e.portada) ?? e.imagenes[0];
}

export function fotosJugables(e: Ejemplar): Imagen[] {
  return e.imagenes.filter((i) => i.juego);
}

/** Una foto jugable distinta de la portada (si la hay), estable durante el día. */
export function fotoAlternativa(e: Ejemplar, dia: string): Imagen | undefined {
  const opciones = fotosJugables(e).filter((i) => i.id !== e.portada);
  return opciones.length ? opciones[indiceDelDia(`${dia}:${e.id}`, opciones.length)] : portada(e);
}
