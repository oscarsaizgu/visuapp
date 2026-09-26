// Comprobación de respuestas escritas: sin tildes ni mayúsculas y con tolerancia a erratas.
import type { Ejemplar } from '../types/content';
import { normalizar } from './study';

export function distancia(a: string, b: string): number {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/** Erratas permitidas según la longitud: ninguna en nombres muy cortos, hasta 2 en largos. */
export function tolerancia(largo: number): number {
  if (largo <= 4) return 0;
  if (largo <= 9) return 1;
  return 2;
}

const limpiar = (s: string) => normalizar(s).replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

export interface ResultadoEscrito {
  ok: boolean;
  /** Coincidencia exacta (sin contar tildes/mayúsculas). */
  exacto: boolean;
  /** Nombre aceptado más cercano a lo escrito. */
  esperado: string;
  /** Ha escrito el nombre común cuando se pedía el científico. */
  comun?: boolean;
}

/** Nombres comunes de un ejemplar con nombre científico (no valen como respuesta escrita). */
function nombresComunes(e: Ejemplar): Set<string> {
  if (!e.nombre.cientifico) return new Set();
  const comunes = [e.nombre.comun, e.nombre.formato === 'comun' ? e.nombre.principal : undefined];
  return new Set(comunes.filter((x): x is string => !!x && limpiar(x) !== limpiar(e.nombre.cientifico!)).map(limpiar));
}

/**
 * En biología se pide el NOMBRE CIENTÍFICO: el común no cuenta como acierto (se avisa).
 * Donde no hay nombre científico (microscopía, geología...), vale cualquier nombre aceptado.
 */
export function comprobarEscrito(texto: string, e: Ejemplar): ResultadoEscrito {
  const escrito = limpiar(texto);
  const comunes = nombresComunes(e);
  const todos = [...new Set([e.nombre.principal, e.nombre.cientifico ?? '', ...(e.nombre.variantes ?? []), ...e.aceptados].filter(Boolean))];
  const nombres = todos.filter((n) => !comunes.has(limpiar(n)));
  const esComun = [...comunes].some((c) => distancia(escrito, c) <= tolerancia(c.length));
  let mejor = { nombre: nombres[0], d: Infinity };
  for (const nombre of nombres) {
    const d = distancia(escrito, limpiar(nombre));
    if (d < mejor.d) mejor = { nombre, d };
  }
  if (!escrito) return { ok: false, exacto: false, esperado: e.nombre.cientifico ?? e.nombre.principal };
  const ok = mejor.d <= tolerancia(limpiar(mejor.nombre).length);
  if (!ok && esComun) return { ok: false, exacto: false, esperado: e.nombre.cientifico!, comun: true };
  return { ok, exacto: mejor.d === 0, esperado: mejor.nombre };
}
