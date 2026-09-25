import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import type { Categoria } from '../../content/categories';
import { DOMINIOS } from '../../content/categories';
import type { Imagen } from '../../types/content';
import type { NivelDominio } from '../../logic/mastery';
import { SpecimenImage } from '../specimen/SpecimenImage';
import { MasteryBar } from '../progress/MasteryBar';
import styles from './CollectionSection.module.css';

export interface CategoriaResumen extends Categoria {
  total: number;
  descubiertos: number;
  distribucion: Record<NivelDominio, number>;
  foto?: Imagen;
}

interface Props {
  categorias: CategoriaResumen[];
  descubiertos: number;
  total: number;
  packs: string[];
}

/** Colección agrupada por Biología / Geología. Cada categoría muestra descubiertos y reparto de dominio. */
export function CollectionSection({ categorias, descubiertos, total, packs }: Props) {
  return (
    <section className={`${styles.section} rise`} style={{ animationDelay: '240ms' }} aria-labelledby="col-title">
      <div className={styles.head}>
        <div>
          <h2 id="col-title" className={styles.title}>Tu colección</h2>
          <p className={styles.sub}>
            {descubiertos} de {total} ejemplares descubiertos{packs.length ? ` · ${packs.join(', ')}` : ''}
          </p>
        </div>
        <Link to="/coleccion" className={styles.more}>Ver todo <CaretRight size={14} weight="bold" aria-hidden="true" /></Link>
      </div>

      {DOMINIOS.map((d) => {
        const lista = categorias.filter((c) => c.dominio === d.id);
        if (!lista.length) return null;
        return (
          <div key={d.id} className={styles.group}>
            <h3 className={styles.domain}><i className={styles[d.id]} />{d.nombre}</h3>
            <ul className={styles.rail}>
              {lista.map((c) => {
                const Ico = c.icono;
                return (
                  <li key={c.id}>
                    <Link to={`/coleccion/${c.id}`} className={styles.tile} style={{ ['--cat' as string]: c.color }}
                      aria-label={`${c.nombre}: ${c.descubiertos} de ${c.total} descubiertos`}>
                      <div className={styles.photo}><SpecimenImage imagen={c.foto} alt="" /></div>
                      <span className={styles.icon}><Ico size={18} weight="fill" aria-hidden="true" /></span>
                      <div className={styles.info}>
                        <span className={styles.name}>{c.nombre}</span>
                        <span className={styles.count}>{c.descubiertos} de {c.total} descubiertos</span>
                        <MasteryBar distribucion={c.distribucion} alto={6} sobreFoto />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
