import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CaretDown, CheckCircle, Crown, Question } from '@phosphor-icons/react';
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

/** Un grupo del catálogo, plegable. Las tarjetas solo se dibujan al abrirlo (hay grupos de cientos). */
function Album({ nombre, lista, abiertoInicial }: { nombre: string; lista: Ejemplar[]; abiertoInicial: boolean }) {
  const progreso = useProgressStore((s) => s.progreso);
  const [abierto, setAbierto] = useState(abiertoInicial);
  const vistos = lista.filter((e) => progreso[e.id]?.descubierto).length;
  return (
    <section className={styles.albumBox}>
      <button type="button" className={styles.albumHead} aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>
        <span className={styles.album}>{nombre}</span>
        <span className={styles.albumCount}>{vistos}/{lista.length}</span>
        <CaretDown size={18} weight="bold" className={abierto ? styles.caretOn : styles.caret} aria-hidden="true" />
      </button>
      {abierto && (
        <ul className={styles.grid}>
          {lista.map((e) => (
            <li key={e.id}>
              {progreso[e.id]?.descubierto ? <SpecimenCard ejemplar={e} nivel={nivelDominio(progreso[e.id])} /> : <Oculto e={e} />}
            </li>
          ))}
        </ul>
      )}
    </section>
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
  // Se abren de inicio los grupos donde ya has descubierto algo (o el primero, si no hay ninguno).
  const conAlgo = new Set(lista.filter((e) => progreso[e.id]?.descubierto).map((e) => e.album));

  return (
    <div className={styles.page}>
      <Link to="/coleccion" className={styles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Colección</Link>
      <header className={styles.catHead} style={{ ['--cat' as string]: cat.color }}>
        <span className={styles.catIcon}><Ico size={28} weight="fill" aria-hidden="true" /></span>
        <div>
          <h1 className={styles.title}>{cat.nombre}</h1>
          <p className={styles.lead}>{descubiertos} de {lista.length} descubiertos · {dominados} dominados · {albumes.length} grupos</p>
        </div>
        {dominados === lista.length
          ? <span className={styles.badge}><Crown size={16} weight="fill" aria-hidden="true" /> Dominada</span>
          : descubiertos === lista.length && <span className={styles.badge}><CheckCircle size={16} weight="fill" aria-hidden="true" /> Completa</span>}
      </header>
      <MasteryBar distribucion={dist} alto={10} />
      {albumes.map((a, i) => (
        <Album key={a} nombre={a} lista={lista.filter((e) => e.album === a)} abiertoInicial={conAlgo.size ? conAlgo.has(a) : i === 0} />
      ))}
    </div>
  );
}
