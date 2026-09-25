import { useState } from 'react';
import type { Dia } from '../../types/progress';
import styles from './ActivityChart.module.css';

interface Props { dias: { dia: string; datos?: Dia }[] }

const etiqueta = (dia: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', opts);
};

/**
 * Identificaciones por día (una sola serie: sin leyenda, el título la nombra).
 * Barras finas con extremo redondeado, eje recesivo, tooltip al pasar/tocar y tabla accesible.
 */
export function ActivityChart({ dias }: Props) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(5, ...dias.map((d) => d.datos?.n ?? 0));
  const sel = activo !== null ? dias[activo] : null;
  return (
    <figure className={styles.fig}>
      <div className={styles.tooltipRow} aria-hidden="true">
        {sel ? (
          <span className={styles.tip}>
            <strong>{etiqueta(sel.dia, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
            {' · '}{sel.datos?.n ?? 0} identificaciones
            {sel.datos?.n ? ` · ${Math.round((sel.datos.ok / sel.datos.n) * 100)}% aciertos` : ''}
          </span>
        ) : <span className={styles.hint}>Toca una barra para ver el día</span>}
      </div>
      <div className={styles.plot} onMouseLeave={() => setActivo(null)}>
        <span className={styles.max}>{max}</span>
        {dias.map((d, i) => {
          const n = d.datos?.n ?? 0;
          return (
            <button key={d.dia} type="button" className={`${styles.col} ${activo === i ? styles.on : ''}`}
              onMouseEnter={() => setActivo(i)} onFocus={() => setActivo(i)} onClick={() => setActivo(i)}
              aria-label={`${etiqueta(d.dia, { day: 'numeric', month: 'long' })}: ${n} identificaciones`}>
              <span className={styles.bar} style={{ height: `${(n / max) * 100}%` }} />
            </button>
          );
        })}
      </div>
      <div className={styles.axis} aria-hidden="true">
        <span>{etiqueta(dias[0].dia, { day: 'numeric', month: 'short' })}</span>
        <span>hoy</span>
      </div>
      <table className="sr-only">
        <caption>Identificaciones por día</caption>
        <thead><tr><th>Día</th><th>Identificaciones</th><th>Aciertos</th></tr></thead>
        <tbody>{dias.map((d) => <tr key={d.dia}><td>{d.dia}</td><td>{d.datos?.n ?? 0}</td><td>{d.datos?.ok ?? 0}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
