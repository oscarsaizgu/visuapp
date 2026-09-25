import { Link } from 'react-router-dom';
import { Flame, X } from '@phosphor-icons/react';
import styles from './SessionTopBar.module.css';

interface Props { hechas: number; total: number; combo: number }

export function SessionTopBar({ hechas, total, combo }: Props) {
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.close} aria-label="Salir de la sesión (lo respondido ya está guardado)"><X size={22} weight="bold" /></Link>
      <div className={styles.track} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-label="Progreso de la sesión">
        <div className={styles.fill} style={{ transform: `scaleX(${total ? hechas / total : 0})` }} />
      </div>
      <span className={`${styles.combo} ${combo >= 2 ? styles.on : ''}`} aria-live="polite" aria-label={combo >= 2 ? `Combo de ${combo}` : undefined}>
        <Flame size={18} weight="fill" aria-hidden="true" />{combo >= 2 ? `×${combo}` : ''}
      </span>
    </header>
  );
}
