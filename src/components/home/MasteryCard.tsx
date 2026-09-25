import { NIVELES_DOMINIO, NOMBRE_NIVEL, type NivelDominio } from '../../logic/mastery';
import { MasteryBar } from '../progress/MasteryBar';
import styles from './HomeCards.module.css';

interface Props {
  medio: number;
  distribucion: Record<NivelDominio, number>;
  dominados: number;
  total: number;
  porDominio: { id: string; nombre: string; dominado: number }[];
}

const pct = (x: number) => Math.round(x * 100);

/**
 * Dominio = cuánto has aprendido, no cuánto has visto. Cada ejemplar sube de nivel al
 * acertarlo en repasos espaciados y baja al fallarlo; el % es la media ponderada de niveles.
 */
export function MasteryCard({ medio, distribucion, dominados, total, porDominio }: Props) {
  return (
    <section className={`${styles.card} ${styles.mastery} rise`} style={{ animationDelay: '160ms' }} aria-labelledby="mastery-title">
      <div className={styles.masteryHead}>
        <div>
          <h2 id="mastery-title" className={styles.title}>Dominio</h2>
          <p className={styles.big}>{pct(medio)}<span>%</span></p>
        </div>
        <p className={styles.masteryCount}><strong>{dominados}</strong> de {total}<br />desbloqueados dominados</p>
      </div>
      <MasteryBar distribucion={distribucion} alto={12} />
      <ul className={styles.legend}>
        {NIVELES_DOMINIO.map((k) => (
          <li key={k} className={distribucion[k] ? '' : styles.zero}>
            <i style={{ background: `var(--m-${k})` }} />{NOMBRE_NIVEL[k]} <b>{distribucion[k]}</b>
          </li>
        ))}
      </ul>
      {porDominio.length > 1 && (
        <p className={styles.domains}>
          {porDominio.map((d) => (
            <span key={d.id}><i style={{ background: `var(--${d.id === 'biologia' ? 'bio' : 'geo'})` }} />{d.nombre} {pct(d.dominado)}%</span>
          ))}
        </p>
      )}
      <p className={styles.note}>Sube cuando aciertas un ejemplar en repasos espaciados y baja si lo fallas. Verlo no basta.</p>
    </section>
  );
}
