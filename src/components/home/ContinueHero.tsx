import { Link } from 'react-router-dom';
import { Play } from '@phosphor-icons/react';
import { ejemplar, portada } from '../../content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { SpecimenImage } from '../specimen/SpecimenImage';
import type { PlanSesion } from '../../logic/sessionPlan';
import type { Ejemplar } from '../../types/content';
import styles from './ContinueHero.module.css';

interface Props { plan: PlanSesion; primeraVez: boolean }

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * CTA principal. Las fotos son de los primeros ejemplares de la sesión que se va a jugar
 * (sin nombre, para no desvelar la respuesta) y todas las cifras salen del plan real.
 */
export function ContinueHero({ plan, primeraVez }: Props) {
  // La foto con más resolución ocupa la celda grande.
  const area = (e: Ejemplar) => { const i = portada(e); return i ? i.ancho * i.alto : 0; };
  const fotos = plan.ejemplares.slice(0, 3).map((id) => ejemplar(id))
    .filter((e) => e !== undefined).sort((a, b) => area(b) - area(a));
  const n = plan.ejemplares.length;
  const titulo = n === 0 ? '¡Todo al día!' : primeraVez ? 'Empieza tu colección' : 'Tu sesión de hoy';
  const sub = n === 0
    ? 'No tienes repasos pendientes ni ejemplares nuevos. Puedes practicar igualmente (da menos XP).'
    : `${plural(n, 'identificación', 'identificaciones')} con fotografías reales.`;

  return (
    <section className={`${styles.hero} rise`} style={{ animationDelay: '60ms' }} aria-labelledby="hero-title">
      {fotos.length > 0 && (
        <div className={`${styles.mosaic} ${styles[`n${fotos.length}`]}`}>
          {fotos.map((e) => {
            const cat = CATEGORIA_POR_ID[e.categoria];
            const Ico = cat.icono;
            return (
              <figure key={e.id} className={styles.photo}>
                <SpecimenImage imagen={portada(e)} alt={`Ejemplar de ${cat.nombre} de tu próxima sesión`} prioritaria />
                <figcaption className={styles.tag} style={{ ['--cat' as string]: cat.color }}>
                  <Ico size={14} weight="fill" aria-hidden="true" /> {cat.nombre}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <div className={styles.body}>
        <span className={styles.kicker}>Siguiente paso</span>
        <h2 id="hero-title" className={styles.title}>{titulo}</h2>
        <p className={styles.sub}>{sub}</p>
        {n > 0 && (
          <ul className={styles.facts} aria-label="Contenido de la sesión">
            {plan.repasos.length > 0 && <li>{plural(plan.repasos.length, 'repaso', 'repasos')}</li>}
            {plan.nuevos.length > 0 && <li>{plural(plan.nuevos.length, 'nuevo', 'nuevos')}</li>}
            <li>{plural(plan.categorias.length, 'categoría', 'categorías')}</li>
            <li title="Estimación a partir del número de identificaciones">≈ {plan.minutos} min</li>
          </ul>
        )}
        <Link to="/jugar/sesion" className={styles.cta}>
          <Play size={22} weight="fill" aria-hidden="true" />
          {n === 0 ? 'Práctica libre' : primeraVez ? 'Empezar' : 'Continuar'}
        </Link>
      </div>
    </section>
  );
}
