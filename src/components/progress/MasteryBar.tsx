import { NIVELES_DOMINIO, NOMBRE_NIVEL, type NivelDominio } from '../../logic/mastery';
import styles from './MasteryBar.module.css';

interface Props {
  distribucion: Record<NivelDominio, number>;
  alto?: number;
  /** Sobre foto: pista translúcida en lugar de gris. */
  sobreFoto?: boolean;
}

/** Barra segmentada: cuántos ejemplares hay en cada nivel de dominio. */
export function MasteryBar({ distribucion, alto = 10, sobreFoto = false }: Props) {
  const total = NIVELES_DOMINIO.reduce((n, k) => n + distribucion[k], 0);
  const resumen = NIVELES_DOMINIO.filter((k) => distribucion[k]).map((k) => `${distribucion[k]} ${NOMBRE_NIVEL[k].toLowerCase()}`).join(', ');
  return (
    <div className={`${styles.bar} ${sobreFoto ? styles.onPhoto : ''}`} style={{ height: alto }} role="img" aria-label={`Dominio: ${resumen || 'sin ejemplares'}`}>
      {total > 0 && NIVELES_DOMINIO.map((k) => distribucion[k] > 0 && (
        <span key={k} className={`${styles.seg} ${k === 'nuevo' ? styles.nuevo : ''}`} style={{ flexGrow: distribucion[k], ['--c' as string]: `var(--m-${k})` }} />
      ))}
    </div>
  );
}
