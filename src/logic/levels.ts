// Niveles y rangos. La curva crece suave: 100 XP para el nivel 2, 200 más para el 3, etc.

/** XP total necesaria para alcanzar `nivel` (nivel 1 = 0 XP). */
export function xpParaNivel(nivel: number): number {
  return 50 * (nivel - 1) * nivel;
}

export interface EstadoNivel {
  nivel: number;
  xpEnNivel: number;
  xpNivel: number;
  /** 0–1 dentro del nivel actual. */
  progreso: number;
}

export function nivelDesdeXp(xp: number): EstadoNivel {
  const total = Math.max(0, Math.floor(xp));
  let nivel = 1;
  while (xpParaNivel(nivel + 1) <= total) nivel++;
  const base = xpParaNivel(nivel);
  const xpNivel = xpParaNivel(nivel + 1) - base;
  const xpEnNivel = total - base;
  return { nivel, xpEnNivel, xpNivel, progreso: xpEnNivel / xpNivel };
}

const RANGOS: { desde: number; nombre: string }[] = [
  { desde: 1, nombre: 'Aprendiz de campo' },
  { desde: 3, nombre: 'Recolector' },
  { desde: 6, nombre: 'Naturalista' },
  { desde: 10, nombre: 'Taxónomo' },
  { desde: 15, nombre: 'Conservador' },
  { desde: 22, nombre: 'Catedrático' },
];

export function rangoDeNivel(nivel: number): string {
  let r = RANGOS[0].nombre;
  for (const x of RANGOS) if (nivel >= x.desde) r = x.nombre;
  return r;
}
