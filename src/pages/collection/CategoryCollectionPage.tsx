import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Crown, Question } from '@phosphor-icons/react';
import { ejemplaresDe, portada } from '../../content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { useProgressStore } from '../../store/useProgressStore';
import { distribucionDominio, nivelDominio } from '../../logic/mastery';
import type { CategoriaId, Ejemplar } from '../../types/content';
import { SpecimenCard } from '../../components/specimen/SpecimenCard';
import { SpecimenImage } from '../../components/specimen/SpecimenImage';
import { MasteryBar } from '../../components/progress/MasteryBar';
import { NotFoundPage } from '../sections';
import styles from './Collection.module.css';

/** Ejemplar aún no descubierto: foto velada y "???". Abrirlo lo descubre. */
function Oculto({ e }: { e: Ejemplar }) {
  return (
    <Link to={`/ejemplar/${e.id}`} className={styles.locked} aria-label={`Ejemplar sin descubrir de ${e.album}. Abrir para descubrirlo`}>
      <div className={styles.lockedPhoto}><SpecimenImage imagen={portada(e)} alt="" /></div>
      <div className={styles.lockedBody}>
        <span className={styles.q}><Question size={18} weight="bold" aria-hidden="true" /> ???</span>
        <span className={styles.lockedHint}>Por descubrir</span>
      </div>
    </Link>
  );
}

export function CategoryCollectionPage() {
  const { categoria } = useParams();
  const progreso = useProgressStore((s) => s.progreso);
  const cat = CATEGORIA_POR_ID[categoria as CategoriaId];
  const lista = cat ? ejemplaresDe(cat.id) : [];
  if (!cat || !lista.length) return <NotFoundPage />;
  const Ico = cat.icono;
  const descubiertos = lista.filter((e) => progreso[e.id]?.descubierto).length;
  const dist = distribucionDominio(lista.map((e) => e.id), progreso);
  const dominados = dist.dominado + dist['muy-dominado'];
  const albumes = [...new Set(lista.map((e) => e.album))];

  return (
    <div className={styles.page}>
      <Link to="/coleccion" className={styles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Colección</Link>
      <header className={styles.catHead} style={{ ['--cat' as string]: cat.color }}>
        <span className={styles.catIcon}><Ico size={28} weight="fill" aria-hidden="true" /></span>
        <div>
          <h1 className={styles.title}>{cat.nombre}</h1>
          <p className={styles.lead}>{descubiertos} de {lista.length} descubiertos · {dominados} dominados</p>
        </div>
        {dominados === lista.length
          ? <span className={styles.badge}><Crown size={16} weight="fill" aria-hidden="true" /> Dominada</span>
          : descubiertos === lista.length && <span className={styles.badge}><CheckCircle size={16} weight="fill" aria-hidden="true" /> Completa</span>}
      </header>
      <MasteryBar distribucion={dist} alto={10} />
      {albumes.map((a) => {
        const xs = lista.filter((e) => e.album === a);
        return (
          <section key={a} aria-label={a}>
            <h2 className={styles.album}>{a} <span>{xs.filter((e) => progreso[e.id]?.descubierto).length}/{xs.length}</span></h2>
            <ul className={styles.grid}>
              {xs.map((e) => (
                <li key={e.id}>
                  {progreso[e.id]?.descubierto ? <SpecimenCard ejemplar={e} nivel={nivelDominio(progreso[e.id])} /> : <Oculto e={e} />}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
