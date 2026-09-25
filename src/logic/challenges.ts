// Retos diarios: 3 al día, elegidos de forma estable según la fecha. Se miden con el resumen del día.
import type { CategoriaId } from '../types/content';
import type { Dia } from '../types/progress';
import { indiceDelDia } from './dailyPick';
import { barajar, crearRng } from './rng';

export const XP_RETO = 30;

export interface Reto {
  id: string;
  texto: string;
  /** [actual, objetivo] */
  medir: (d: Dia) => [number, number];
}

function plantillas(categorias: { id: CategoriaId; nombre: string }[], dia: string): Reto[] {
  const cat = categorias[indiceDelDia(`cat:${dia}`, categorias.length)];
  const retos: Reto[] = [
    { id: 'aciertos-15', texto: 'Acierta 15 identificaciones', medir: (d) => [d.ok, 15] },
    { id: 'combo-8', texto: 'Encadena un combo de ×8', medir: (d) => [d.comboMax, 8] },
    { id: 'perfecta', texto: 'Termina una sesión perfecta', medir: (d) => [d.perfectas, 1] },
    { id: 'veloz-12', texto: 'Consigue 12 aciertos en Veloz', medir: (d) => [d.veloz, 12] },
    { id: 'escribir-5', texto: 'Acierta 5 escribiendo el nombre', medir: (d) => [d.porModo.escribir ?? 0, 5] },
    { id: 'foto-5', texto: 'Acierta 5 eligiendo la foto', medir: (d) => [d.porModo['elegir-foto'] ?? 0, 5] },
  ];
  if (cat) retos.push({ id: `categoria-${cat.id}`, texto: `Acierta 5 de ${cat.nombre}`, medir: (d) => [d.porCategoria[cat.id] ?? 0, 5] });
  return retos;
}

/** Los retos de un día: siempre incluye el de categoría (si hay) y dos más al azar estable. */
export function retosDelDia(dia: string, categorias: { id: CategoriaId; nombre: string }[]): Reto[] {
  const todos = plantillas(categorias, dia);
  const deCategoria = todos.filter((r) => r.id.startsWith('categoria-'));
  const resto = barajar(todos.filter((r) => !r.id.startsWith('categoria-')), crearRng(indiceDelDia(`retos:${dia}`, 2 ** 31)));
  return [...deCategoria, ...resto].slice(0, 3);
}

export function retosCumplidos(retos: Reto[], d: Dia): string[] {
  return retos.filter((r) => { const [a, o] = r.medir(d); return a >= o; }).map((r) => r.id);
}
