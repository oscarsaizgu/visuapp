import { useState } from 'react';
import { ImageSquare } from '@phosphor-icons/react';
import type { Imagen } from '../../types/content';
import styles from './SpecimenImage.module.css';

interface Props {
  imagen?: Imagen;
  alt: string;
  className?: string;
  /** Carga inmediata para imágenes visibles al abrir. */
  prioritaria?: boolean;
}

/** Foto real de un ejemplar. Si falta el archivo, muestra "Imagen pendiente" (nunca un dibujo). */
export function SpecimenImage({ imagen, alt, className = '', prioritaria = false }: Props) {
  const [fallo, setFallo] = useState(false);
  if (!imagen || fallo) {
    return (
      <div className={`${styles.pending} ${className}`} role="img" aria-label={`${alt}: imagen pendiente`}>
        <ImageSquare size={28} weight="duotone" aria-hidden="true" />
        <span>Imagen pendiente</span>
      </div>
    );
  }
  return (
    <img
      className={`${styles.img} ${className}`}
      src={imagen.archivo}
      width={imagen.ancho}
      height={imagen.alto}
      alt={alt}
      loading={prioritaria ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setFallo(true)}
    />
  );
}
