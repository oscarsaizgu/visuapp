import { CheckCircle, Target } from '@phosphor-icons/react';
import { useProgressStore } from '../../store/useProgressStore';
import { categoriasCon } from '../../content';
import { useActivos } from '../../hooks/useActivos';
import { claveDia } from '../../logic/daily';
import { retosDelDia, XP_RETO } from '../../logic/challenges';
import { diaVacio } from '../../logic/stats';
import styles from './ChallengesCard.module.css';

/** Los 3 retos de hoy con su progreso real. */
export function ChallengesCard({ compacta = false }: { compacta?: boolean }) {
  const hoy = claveDia();
  const dia = useProgressStore((s) => s.estadisticas.porDia[hoy]) ?? diaVacio();
  const hechos = useProgressStore((s) => s.logros.retos[hoy]) ?? [];
  const retos = retosDelDia(hoy, categoriasCon(useActivos()));
  return (
    <section className={`${styles.card} ${compacta ? styles.compact : ''}`} aria-labelledby="retos-t">
      <h2 id="retos-t" className={styles.title}><Target size={15} weight="bold" aria-hidden="true" /> Retos de hoy <span>{hechos.length}/{retos.length}</span></h2>
      <ul className={styles.list}>
        {retos.map((r) => {
          const [a, o] = r.medir(dia);
          const ok = hechos.includes(r.id) || a >= o;
          return (
            <li key={r.id} className={ok ? styles.done : ''}>
              <div className={styles.row}>
                {ok ? <CheckCircle size={18} weight="fill" className={styles.check} aria-hidden="true" /> : <span className={styles.dot} aria-hidden="true" />}
                <span className={styles.text}>{r.texto}</span>
                <span className={styles.num}>{ok ? `+${XP_RETO} XP` : `${Math.min(a, o)}/${o}`}</span>
              </div>
              {!ok && <div className={styles.bar} aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, a / o)})` }} /></div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
