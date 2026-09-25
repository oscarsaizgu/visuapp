import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import type { Categoria } from '../../content/categories';
import type { Ejemplar } from '../../types/content';
import { portada } from '../../content';
import { SpecimenImage } from '../specimen/SpecimenImage';
import { ProgressRing } from '../ui/ProgressRing';
import styles from './CategoryRail.module.css';

export interface CategoriaResumen extends Categoria {
  total: number;
  descubiertos: number;
  /** Dominio medio 0–1. */
  dominado: number;
  portada?: Ejemplar;
}

/** Colección por categorías: tarjetas con foto real, deslizables en móvil. */
export function CategoryRail({ categorias }: { categorias: CategoriaResumen[] }) {
  return (
    <section className="rise" style={{ animationDelay: '180ms' }} aria-labelledby="rail-title">
      <div className={styles.head}>
        <h2 id="rail-title" className={styles.title}>Tu colección</h2>
        <Link to="/coleccion" className={styles.more}>Ver todo <CaretRight size={14} weight="bold" aria-hidden="true" /></Link>
      </div>
      <ul className={styles.rail}>
        {categorias.map((c) => {
          const Ico = c.icono;
          return (
            <li key={c.id}>
              <Link to={`/coleccion/${c.id}`} className={styles.tile} style={{ ['--cat' as string]: c.color }}>
                <div className={styles.photo}>
                  <SpecimenImage imagen={c.portada && portada(c.portada)} alt="" />
                </div>
                <div className={styles.shade} />
                <span className={styles.icon}><Ico size={20} weight="fill" aria-hidden="true" /></span>
                <div className={styles.info}>
                  <span className={styles.name}>{c.nombre}</span>
                  <span className={styles.count}>{c.descubiertos} / {c.total}</span>
                </div>
                <div className={styles.ring}>
                  <ProgressRing value={c.dominado} size={34} stroke={4} color="#fff" track="rgb(255 255 255 / 0.28)" label={`Dominio ${Math.round(c.dominado * 100)}%`} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
