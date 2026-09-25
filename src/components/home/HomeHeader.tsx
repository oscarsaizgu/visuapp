import { Flame } from '@phosphor-icons/react';
import type { EstadoNivel } from '../../logic/levels';
import styles from './HomeHeader.module.css';

function saludo(h = new Date().getHours()) {
  if (h >= 6 && h < 13) return 'Buenos días';
  if (h >= 13 && h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

interface Props { nivel: EstadoNivel; rango: string; xp: number; racha: number }

export function HomeHeader({ nivel, rango, xp, racha }: Props) {
  return (
    <header className={`${styles.header} rise`}>
      <div className={styles.top}>
        <div className={styles.brand} aria-label="visu-game">
          <span className={styles.mark}>v</span>
          <span className={styles.word}>visu<em>game</em></span>
        </div>
        <div className={styles.chips}>
          <span className={`${styles.chip} ${racha > 0 ? styles.hot : ''}`} aria-label={`Racha de ${racha} días`}>
            <Flame size={18} weight="fill" aria-hidden="true" className={styles.flame} />
            {racha}
          </span>
          <span className={styles.level} aria-label={`Nivel ${nivel.nivel}`}>{nivel.nivel}</span>
        </div>
      </div>
      <p className={styles.hello}>{saludo()}</p>
      <h1 className={styles.rank}>{rango}</h1>
      <div className={styles.xpRow}>
        <div className={styles.xpBar} role="progressbar" aria-valuemin={0} aria-valuemax={nivel.xpNivel} aria-valuenow={nivel.xpEnNivel} aria-label="Experiencia del nivel">
          <div className={styles.xpFill} style={{ transform: `scaleX(${Math.max(0.02, nivel.progreso)})` }} />
        </div>
        <span className={styles.xpText}><strong>{xp}</strong> XP · {nivel.xpNivel - nivel.xpEnNivel} para el nivel {nivel.nivel + 1}</span>
      </div>
    </header>
  );
}
