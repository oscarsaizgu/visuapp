import { Target } from '@phosphor-icons/react';
import { ProgressRing } from '../ui/ProgressRing';
import styles from './StatsRow.module.css';

interface Props {
  hechasHoy: number;
  objetivo: number;
  dominio: { total: number; biologia: number; geologia: number };
  descubiertos: number;
  totalActivos: number;
}

const pct = (x: number) => Math.round(x * 100);

export function StatsRow({ hechasHoy, objetivo, dominio, descubiertos, totalActivos }: Props) {
  const faltan = Math.max(0, objetivo - hechasHoy);
  return (
    <div className={`${styles.row} rise`} style={{ animationDelay: '120ms' }}>
      <section className={styles.card} aria-labelledby="goal-title">
        <ProgressRing value={hechasHoy / objetivo} size={76} stroke={9} color="var(--reward)" label={`${hechasHoy} de ${objetivo} identificaciones hoy`}>
          <span className={styles.ringNum}>{hechasHoy}<small>/{objetivo}</small></span>
        </ProgressRing>
        <div>
          <h2 id="goal-title" className={styles.title}><Target size={16} weight="bold" aria-hidden="true" /> Objetivo de hoy</h2>
          <p className={styles.text}>{faltan === 0 ? '¡Cumplido! La racha está a salvo.' : `${faltan} identificaciones para mantener la racha`}</p>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="mastery-title">
        <div className={styles.dual}>
          <ProgressRing value={dominio.biologia} size={76} stroke={9} color="var(--bio)" label={`Biología ${pct(dominio.biologia)}%`}>
            <ProgressRing value={dominio.geologia} size={50} stroke={7} color="var(--geo)" label={`Geología ${pct(dominio.geologia)}%`} />
          </ProgressRing>
        </div>
        <div>
          <h2 id="mastery-title" className={styles.title}>Dominio de tu colección</h2>
          <p className={styles.big}>{pct(dominio.total)}%</p>
          <p className={styles.legend}>
            <span><i style={{ background: 'var(--bio)' }} />Bio {pct(dominio.biologia)}%</span>
            <span><i style={{ background: 'var(--geo)' }} />Geo {pct(dominio.geologia)}%</span>
          </p>
          <p className={styles.text}>{descubiertos} de {totalActivos} ejemplares descubiertos</p>
        </div>
      </section>
    </div>
  );
}
