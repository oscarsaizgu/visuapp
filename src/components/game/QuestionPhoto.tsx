import { useEffect, useState } from 'react';
import { MagnifyingGlassPlus, X } from '@phosphor-icons/react';
import type { Imagen } from '../../types/content';
import styles from './QuestionPhoto.module.css';

interface Props { imagen: Imagen; alt: string; children?: React.ReactNode }

/**
 * Foto de la pregunta sobre "mesa de luz": se ve entera (contain), sin recortes que oculten
 * rasgos, con un fondo difuminado de la propia foto. Tocar = ampliar a pantalla completa.
 */
export function QuestionPhoto({ imagen, alt, children }: Props) {
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { ev.stopPropagation(); setZoom(false); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [zoom]);

  return (
    <>
      <div className={styles.stage}>
        <img className={styles.backdrop} src={imagen.archivo} alt="" aria-hidden="true" />
        <button type="button" className={styles.imgBtn} onClick={() => setZoom(true)} aria-label="Ampliar foto">
          <img key={imagen.id} className={styles.img} src={imagen.archivo} alt={alt} width={imagen.ancho} height={imagen.alto} draggable={false} />
        </button>
        <span className={styles.zoomHint} aria-hidden="true"><MagnifyingGlassPlus size={18} weight="bold" /></span>
        {children}
      </div>
      {zoom && (
        <div className={styles.lightbox} role="dialog" aria-label="Foto ampliada" onClick={() => setZoom(false)}>
          <img src={imagen.archivo} alt={alt} />
          <button type="button" className={styles.close} aria-label="Cerrar"><X size={22} weight="bold" /></button>
        </div>
      )}
    </>
  );
}
