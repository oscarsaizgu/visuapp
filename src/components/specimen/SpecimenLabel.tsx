import type { Nombre } from '../../types/content';
import styles from './SpecimenLabel.module.css';

interface Props {
  nombre: Nombre;
  /** Texto pequeño superior, estilo etiqueta de museo (p. ej. "Zoología · Anfibios"). */
  kicker?: string;
  size?: 'md' | 'lg';
  invert?: boolean;
}

/**
 * Etiqueta de espécimen: nombre principal y nombre científico SIEMPRE en líneas
 * separadas, con tipografía y color distintos.
 */
export function SpecimenLabel({ nombre, kicker, size = 'md', invert = false }: Props) {
  const principalCientifico = nombre.formato === 'cientifico';
  const secundario = !principalCientifico && nombre.cientifico && nombre.cientifico !== nombre.principal
    ? nombre.cientifico
    : undefined;
  return (
    <div className={`${styles.label} ${styles[size]} ${invert ? styles.invert : ''}`}>
      {kicker && <span className={styles.kicker}>{kicker}</span>}
      <span className={`${styles.principal} ${principalCientifico ? 'sci' : ''}`}>{nombre.principal}</span>
      {secundario && <span className={`${styles.secundario} sci`}>{secundario}</span>}
    </div>
  );
}
