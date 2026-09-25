// Índice ligero del catálogo completo (3.132 ejemplares). Se carga una vez y bajo demanda.
import { useEffect, useState } from 'react';
import type { EntradaIndice } from '../types/game';

let cache: Promise<EntradaIndice[]> | null = null;

export function cargarIndice(): Promise<EntradaIndice[]> {
  cache ??= import('../content/generated/name-index.json').then((m) => m.default as EntradaIndice[]);
  return cache;
}

export function useNameIndex(): EntradaIndice[] | null {
  const [indice, setIndice] = useState<EntradaIndice[] | null>(null);
  useEffect(() => {
    let vivo = true;
    cargarIndice().then((x) => { if (vivo) setIndice(x); });
    return () => { vivo = false; };
  }, []);
  return indice;
}
