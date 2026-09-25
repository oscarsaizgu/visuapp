import { useResumen } from '../hooks/useResumen';
import { HomeHeader } from '../components/home/HomeHeader';
import { ContinueHero } from '../components/home/ContinueHero';
import { DailyGoalCard } from '../components/home/DailyGoalCard';
import { MasteryCard } from '../components/home/MasteryCard';
import { SpecimenOfDay } from '../components/home/SpecimenOfDay';
import { CollectionSection } from '../components/home/CollectionSection';
import styles from './HomePage.module.css';

export function HomePage() {
  const r = useResumen();
  return (
    <div className={styles.page}>
      <HomeHeader nivel={r.nivel} rango={r.rango} xp={r.xp} racha={r.racha} />
      <div className={styles.grid}>
        <div className={styles.hero}>
          <ContinueHero plan={r.plan} primeraVez={r.coleccion.descubiertos === 0} />
        </div>
        <div className={styles.goal}>
          <DailyGoalCard hechas={r.hechasHoy} objetivo={r.objetivo} racha={r.racha} />
        </div>
        <div className={styles.mastery}>
          <MasteryCard medio={r.dominio.medio} distribucion={r.dominio.distribucion} dominados={r.dominio.dominados}
            total={r.coleccion.total} porDominio={r.dominio.porDominio} />
        </div>
        {r.delDia && (
          <div className={styles.sod}>
            <SpecimenOfDay ejemplar={r.delDia.ejemplar} motivo={r.delDia.motivo} nivel={r.delDia.nivel} enSesion={r.delDia.enSesion} />
          </div>
        )}
      </div>
      <CollectionSection categorias={r.categorias} descubiertos={r.coleccion.descubiertos} total={r.coleccion.total} packs={r.coleccion.packs} />
    </div>
  );
}
