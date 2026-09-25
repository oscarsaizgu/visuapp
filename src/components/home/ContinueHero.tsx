import { Link } from 'react-router-dom';
import { Play } from '@phosphor-icons/react';
import { ejemplar, portada } from '../../content';
import { SpecimenImage } from '../specimen/SpecimenImage';
import type { PlanSesion } from '../../logic/sessionPlan';
import styles from './ContinueHero.module.css';

interface Props { plan: PlanSesion; primeraVez: boolean }

/** Tarjeta protagonista: qué toca ahora y un botón enorme para empezar. */
export function ContinueHero({ plan, primeraVez }: Props) {
  const fotos = plan.ejemplares.slice(0, 3).map((id) => ejemplar(id)).filter((e) => e !== undefined);
  const n = plan.ejemplares.length;
  const titulo = n === 0 ? '¡Todo al día!' : primeraVez ? 'Empieza tu colección' : 'Tu sesión de hoy';
  const sub = n === 0
    ? 'No hay repasos pendientes. Vuelve mañana o practica por tu cuenta.'
    : `${n} identificaciones con fotos reales del VISU`;

  return (
    <section className={`${styles.hero} rise`} style={{ animationDelay: '60ms' }} aria-labelledby="hero-title">
      <div className={styles.mosaic} aria-hidden="true">
        {fotos.map((e, i) => (
          <div key={e.id} className={styles[`m${i}`]}>
            <SpecimenImage imagen={portada(e)} alt="" prioritaria />
          </div>
        ))}
      </div>
      <div className={styles.scrim} />
      <div className={styles.body}>
        <span className={styles.kicker}>Siguiente paso</span>
        <h2 id="hero-title" className={styles.title}>{titulo}</h2>
        <p className={styles.sub}>{sub}</p>
        {n > 0 && (
          <ul className={styles.facts}>
            {plan.repasos.length > 0 && <li>{plan.repasos.length} repasos</li>}
            {plan.nuevos.length > 0 && <li>{plan.nuevos.length} nuevos</li>}
            <li>{plan.categorias.length} categorías</li>
            <li>≈ {Math.max(3, Math.round(n * 0.8))} min</li>
          </ul>
        )}
        <Link to="/jugar" className={styles.cta}>
          <Play size={22} weight="fill" aria-hidden="true" />
          Continuar
        </Link>
      </div>
    </section>
  );
}
