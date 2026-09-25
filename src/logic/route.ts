// Reglas de la ruta de aprendizaje. Sin "game over": nada se pierde, solo se desbloquea.
// - Dentro de un submundo, cada nodo (lección o repaso) se abre al terminar el anterior.
// - Los submundos de un mundo abierto están todos disponibles desde el principio.
// - El examen del mundo aparece cuando todos sus submundos están completos.
// - El siguiente mundo se abre al superar ese examen (se puede repetir sin límite).
import type { Mundo, NodoRuta, Ruta, Submundo } from '../types/content';
import type { ProgresoRuta } from '../types/progress';

export type EstadoNodo = 'hecho' | 'disponible' | 'bloqueado';

export function nodoHecho(n: NodoRuta, r: ProgresoRuta): boolean {
  return n.tipo === 'leccion' ? !!r.lecciones[n.id]?.completada : !!r.repasos[n.id];
}

export function estadoNodo(sm: Submundo, indice: number, r: ProgresoRuta): EstadoNodo {
  if (nodoHecho(sm.nodos[indice], r)) return 'hecho';
  return sm.nodos.slice(0, indice).every((n) => nodoHecho(n, r)) ? 'disponible' : 'bloqueado';
}

export function submundoCompleto(sm: Submundo, r: ProgresoRuta): boolean {
  return sm.nodos.every((n) => nodoHecho(n, r));
}

export function mundoCompleto(m: Mundo, r: ProgresoRuta): boolean {
  return m.submundos.every((sm) => submundoCompleto(sm, r));
}

export function progresoSubmundo(sm: Submundo, r: ProgresoRuta): { hechos: number; total: number } {
  return { hechos: sm.nodos.filter((n) => nodoHecho(n, r)).length, total: sm.nodos.length };
}

export function progresoMundo(m: Mundo, r: ProgresoRuta): { hechos: number; total: number } {
  const t = m.submundos.map((sm) => progresoSubmundo(sm, r));
  return { hechos: t.reduce((n, x) => n + x.hechos, 0), total: t.reduce((n, x) => n + x.total, 0) };
}

/** Estrellas de una lección según su mejor práctica: 1 completada, 2 ≥ 70 %, 3 ≥ 90 %. */
export function estrellas(nota: number): 1 | 2 | 3 {
  return nota >= 0.9 ? 3 : nota >= 0.7 ? 2 : 1;
}

export type Siguiente =
  | { tipo: 'nodo'; mundo: Mundo; submundo: Submundo; nodo: NodoRuta; indice: number }
  | { tipo: 'examen'; mundo: Mundo }
  | { tipo: 'fin' };

function siguienteEn(sm: Submundo, r: ProgresoRuta) {
  const indice = sm.nodos.findIndex((n) => !nodoHecho(n, r));
  return indice === -1 ? undefined : { nodo: sm.nodos[indice], indice };
}

/**
 * Lo siguiente que conviene hacer en la ruta: seguir en el último submundo trabajado; si ya está
 * completo, el primer submundo pendiente del mundo abierto más avanzado; si todo está hecho, su examen.
 */
export function siguientePaso(ruta: Ruta, r: ProgresoRuta, abiertos: Mundo[]): Siguiente {
  const actual = abiertos.at(-1);
  if (!actual) return { tipo: 'fin' };
  for (const m of [...abiertos].reverse()) {
    const ultimo = m.submundos.find((sm) => sm.id === r.ultimoSubmundo);
    if (ultimo) {
      const s = siguienteEn(ultimo, r);
      if (s) return { tipo: 'nodo', mundo: m, submundo: ultimo, ...s };
    }
  }
  for (const m of [actual, ...abiertos.slice(0, -1)]) {
    for (const sm of m.submundos) {
      const s = siguienteEn(sm, r);
      if (s) return { tipo: 'nodo', mundo: m, submundo: sm, ...s };
    }
  }
  if (!r.examenes[actual.id]?.superado) return { tipo: 'examen', mundo: actual };
  // Examen superado: el mundo siguiente ya está entre los abiertos, así que solo queda el final de la ruta.
  void ruta;
  return { tipo: 'fin' };
}
