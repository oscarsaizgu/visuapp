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
 * Etiqueta de espécimen. Si hay nombre científico, es lo que se aprende: va en grande y en
 * cursiva, y el nombre común queda debajo como apoyo. Siempre en líneas separadas.
 */
export function SpecimenLabel({ nombre, kicker, size = 'md', invert = false }: Props) {
  const cientifico = nombre.formato === 'cientifico' ? nombre.principal : nombre.cientifico;
  const grande = cientifico ?? nombre.principal;
  const apoyo = cientifico && nombre.principal !== cientifico ? nombre.principal : undefined;
  return (
    <div className={`${styles.label} ${styles[size]} ${invert ? styles.invert : ''}`}>
      {kicker && <span className={styles.kicker}>{kicker}</span>}
      <span className={`${styles.principal} ${cientifico ? 'sci' : ''}`}>{grande}</span>
      {apoyo && <span className={styles.secundario}>{apoyo}</span>}
    </div>
  );
}
