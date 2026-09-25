import { useEffect, useState } from 'react';
import { Timer } from '@phosphor-icons/react';
import styles from './VelozTimer.module.css';

/** Cuenta atrás del modo Veloz. Llama a onFin una vez cuando llega a cero. */
export function VelozTimer({ fin, total, onFin }: { fin: number; total: number; onFin: () => void }) {
  const [ahora, setAhora] = useState(() => performance.now());
  useEffect(() => {
    let raf = 0;
    const paso = () => {
      const t = performance.now();
      setAhora(t);
      if (t >= fin) onFin(); else raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [fin, onFin]);
  const restante = Math.max(0, fin - ahora);
  const s = Math.ceil(restante / 1000);
  return (
    <div className={`${styles.timer} ${s <= 10 ? styles.low : ''}`} role="timer" aria-label={`Quedan ${s} segundos`}>
      <Timer size={18} weight="bold" aria-hidden="true" />
      <div className={styles.track}><div className={styles.fill} style={{ transform: `scaleX(${restante / (total * 1000)})` }} /></div>
      <span className={styles.num}>{s}s</span>
    </div>
  );
}
