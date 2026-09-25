// Elección determinista "del día": el mismo día siempre devuelve el mismo elemento.
export function indiceDelDia(dia: string, n: number): number {
  let h = 2166136261;
  for (let i = 0; i < dia.length; i++) h = Math.imul(h ^ dia.charCodeAt(i), 16777619);
  return n ? (h >>> 0) % n : 0;
}
