import { Target } from '@phosphor-icons/react';
import { ProgressRing } from '../ui/ProgressRing';
import styles from './HomeCards.module.css';

interface Props { hechas: number; objetivo: number; racha: number }

export function DailyGoalCard({ hechas, objetivo, racha }: Props) {
  const faltan = Math.max(0, objetivo - hechas);
  return (
    <section className={`${styles.card} ${styles.goal} rise`} style={{ animationDelay: '120ms' }} aria-labelledby="goal-title">
      <ProgressRing value={hechas / objetivo} size={72} stroke={9} color="var(--reward)" label={`${hechas} de ${objetivo} identificaciones hoy`}>
        <span className={styles.ringNum}>{hechas}<small>/{objetivo}</small></span>
      </ProgressRing>
      <div>
        <h2 id="goal-title" className={styles.title}><Target size={15} weight="bold" aria-hidden="true" /> Objetivo de hoy</h2>
        <p className={styles.text}>
          {faltan === 0
            ? '¡Cumplido! Tu racha suma un día más.'
            : `${faltan} identificaciones más para ${racha > 0 ? 'mantener tu racha' : 'empezar una racha'}.`}
        </p>
      </div>
    </section>
  );
}
