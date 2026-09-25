import { useResumen } from '../hooks/useResumen';
import { HomeHeader } from '../components/home/HomeHeader';
import { ContinueHero } from '../components/home/ContinueHero';
import { StatsRow } from '../components/home/StatsRow';
import { CategoryRail } from '../components/home/CategoryRail';
import { SpecimenOfDay } from '../components/home/SpecimenOfDay';
import styles from './HomePage.module.css';

export function HomePage() {
  const r = useResumen();
  return (
    <div className={styles.page}>
      <HomeHeader nivel={r.nivel} rango={r.rango} xp={r.xp} racha={r.racha} />
      <div className={styles.grid}>
        <div className={styles.main}>
          <ContinueHero plan={r.plan} primeraVez={r.descubiertos === 0} />
          <StatsRow hechasHoy={r.hechasHoy} objetivo={r.objetivo} dominio={r.dominio} descubiertos={r.descubiertos} totalActivos={r.totalActivos} />
        </div>
        <div className={styles.side}>
          <SpecimenOfDay ejemplar={r.delDia} />
        </div>
      </div>
      <CategoryRail categorias={r.categorias} />
    </div>
  );
}
