import type { ReactNode } from 'react';
import { Nutria, type PoseNutria } from './Nutria';
import styles from './NutriaDice.module.css';

interface Props {
  pose: PoseNutria;
  children: ReactNode;
  size?: number;
  /** Colores claros para fondos oscuros. */
  invert?: boolean;
  className?: string;
}

/** La nutria con un bocadillo corto. Solo en momentos puntuales: nunca interrumpe (no es un modal). */
export function NutriaDice({ pose, children, size = 72, invert = false, className }: Props) {
  return (
    <aside className={`${styles.dice} ${invert ? styles.invert : ''} ${className ?? ''}`} aria-label="La nutria dice">
      <Nutria pose={pose} size={size} className={styles.nutria} />
      <p className={styles.bocadillo}>{children}</p>
    </aside>
  );
}
