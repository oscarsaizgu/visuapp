import { Link } from 'react-router-dom';
import { Play } from '@phosphor-icons/react';
import { useStudy } from '../../hooks/useStudy';
import { TEXTO_MOTIVO } from '../../logic/study';
import { SpecimenCard } from '../../components/specimen/SpecimenCard';
import { BackLink } from './BackLink';
import styles from './Study.module.css';

export function ReviewPage() {
  const { repaso, nivel } = useStudy();
  return (
    <div className={styles.page}>
      <BackLink />
      <header>
        <h1 className={styles.title}>Repasar</h1>
        <p className={styles.lead}>Lo que toca repasar hoy, lo que fallaste la última vez y lo que más te cuesta, por ese orden.</p>
      </header>
      {repaso.length ? (
        <>
          <Link to="/jugar/sesion" className={styles.cta}><Play size={18} weight="fill" aria-hidden="true" /> Ponerlos a prueba</Link>
          <ul className={styles.grid}>
            {repaso.map(({ ejemplar, motivo }) => (
              <li key={ejemplar.id}><SpecimenCard ejemplar={ejemplar} nivel={nivel(ejemplar.id)} nota={TEXTO_MOTIVO[motivo]} /></li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.empty}>Nada que repasar ahora mismo. Los ejemplares aparecen aquí cuando los fallas o cuando llega su fecha de repaso.</p>
      )}
    </div>
  );
}
