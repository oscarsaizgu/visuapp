import { useEffect } from 'react';
import { Medal, Target } from '@phosphor-icons/react';
import { useProgressStore } from '../../store/useProgressStore';
import { INSIGNIAS } from '../../content/achievements';
import styles from './CelebrationToast.module.css';

/** Muestra, de una en una, las insignias desbloqueadas y los retos completados. */
export function CelebrationToast() {
  const actual = useProgressStore((s) => s.celebraciones[0]);
  const quitar = useProgressStore((s) => s.quitarCelebracion);
  useEffect(() => {
    if (!actual) return;
    const t = setTimeout(quitar, 3600);
    return () => clearTimeout(t);
  }, [actual, quitar]);
  if (!actual) return null;
  const Ico = actual.tipo === 'insignia' ? INSIGNIAS.find((i) => i.id === actual.id)?.icono ?? Medal : Target;
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <button type="button" key={`${actual.tipo}-${actual.id}`} className={styles.toast} onClick={quitar} aria-label="Cerrar aviso">
        <span className={styles.icon}><Ico size={26} weight="fill" aria-hidden="true" /></span>
        <span>
          <small>{actual.tipo === 'insignia' ? 'Insignia desbloqueada' : 'Reto completado'}</small>
          <strong>{actual.titulo}</strong>
        </span>
        {actual.xp ? <span className={styles.xp}>+{actual.xp} XP</span> : null}
      </button>
    </div>
  );
}
