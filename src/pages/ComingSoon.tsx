import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { EJEMPLARES, portada } from '../content';
import { indiceDelDia } from '../logic/dailyPick';
import { SpecimenImage } from '../components/specimen/SpecimenImage';
import styles from './ComingSoon.module.css';

interface Props {
  titulo: string;
  fase: number;
  descripcion: string;
  icono: Icon;
  /** Semilla para variar las fotos de fondo entre secciones. */
  semilla: string;
}

/** Pantalla de sección aún no construida, con la misma identidad visual que el resto. */
export function ComingSoon({ titulo, fase, descripcion, icono: Ico, semilla }: Props) {
  const start = indiceDelDia(semilla, EJEMPLARES.length);
  const fotos = Array.from({ length: 6 }, (_, i) => EJEMPLARES[(start + i * 7) % EJEMPLARES.length]);
  return (
    <div className={`${styles.page} rise`}>
      <div className={styles.collage} aria-hidden="true">
        {fotos.map((e, i) => (
          <div key={`${e.id}-${i}`} className={styles.cell}><SpecimenImage imagen={portada(e)} alt="" /></div>
        ))}
      </div>
      <div className={styles.card}>
        <span className={styles.icon}><Ico size={28} weight="duotone" aria-hidden="true" /></span>
        <span className={styles.badge}>Fase {fase}</span>
        <h1 className={styles.title}>{titulo}</h1>
        <p className={styles.text}>{descripcion}</p>
        <Link to="/" className={styles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Volver al inicio</Link>
      </div>
    </div>
  );
}
