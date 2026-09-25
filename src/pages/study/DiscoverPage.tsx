import { useStudy } from '../../hooks/useStudy';
import { SpecimenCard } from '../../components/specimen/SpecimenCard';
import { BackLink } from './BackLink';
import styles from './Study.module.css';

export function DiscoverPage() {
  const { nuevos, nivel } = useStudy();
  return (
    <div className={styles.page}>
      <BackLink />
      <header>
        <h1 className={styles.title}>Descubrir</h1>
        <p className={styles.lead}>Ejemplares de tus mundos abiertos que aún no has visto. Al abrir su ficha pasan a tu colección.</p>
      </header>
      {nuevos.length ? (
        <ul className={styles.grid}>
          {nuevos.map((e) => <li key={e.id}><SpecimenCard ejemplar={e} nivel={nivel(e.id)} /></li>)}
        </ul>
      ) : (
        <p className={styles.empty}>Has descubierto todo lo de tus mundos abiertos. Para más, avanza en la ruta o usa «Elegir del catálogo».</p>
      )}
    </div>
  );
}
