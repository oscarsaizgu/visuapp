import { Link } from 'react-router-dom';
import type { Ejemplar } from '../../types/content';
import { portada } from '../../content';
import { NOMBRE_NIVEL, type NivelDominio } from '../../logic/mastery';
import { SpecimenImage } from './SpecimenImage';
import { SpecimenLabel } from './SpecimenLabel';
import styles from './SpecimenCard.module.css';

interface Props {
  ejemplar: Ejemplar;
  nivel: NivelDominio;
  /** Etiqueta destacada sobre la foto (p. ej. el motivo de repaso). */
  nota?: string;
}

/** Tarjeta de un ejemplar que abre su ficha. */
export function SpecimenCard({ ejemplar: e, nivel, nota }: Props) {
  return (
    <Link to={`/ejemplar/${e.id}`} className={styles.card}>
      <div className={styles.photo}>
        <SpecimenImage imagen={portada(e)} alt="" />
        {nota && <span className={styles.nota}>{nota}</span>}
      </div>
      <div className={styles.body}>
        <SpecimenLabel nombre={e.nombre} kicker={e.album} />
        <span className={styles.nivel}><i style={{ background: `var(--m-${nivel})` }} />{NOMBRE_NIVEL[nivel]}</span>
      </div>
    </Link>
  );
}
