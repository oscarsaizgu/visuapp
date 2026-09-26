import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Play, X } from '@phosphor-icons/react';
import { ejemplaresPorIds, nodoRuta } from '../../content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { useProgressStore } from '../../store/useProgressStore';
import { estadoNodo } from '../../logic/route';
import { PhotoGallery } from '../../components/specimen/PhotoGallery';
import { SpecimenLabel } from '../../components/specimen/SpecimenLabel';
import { NotFoundPage } from '../sections';
import { NutriaDice } from '../../components/nutria/NutriaDice';
import type { Ejemplar } from '../../types/content';
import styles from './Lesson.module.css';

/** Datos del catálogo que ayudan a identificar el ejemplar; solo los que existen. */
function Datos({ e }: { e: Ejemplar }) {
  const filas: [string, string][] = [];
  if (e.rasgos) filas.push(['Rasgos clave', e.rasgos]);
  if (e.taxonomia?.orden) filas.push(['Orden', e.taxonomia.orden]);
  if (e.taxonomia?.familia) filas.push(['Familia', e.taxonomia.familia]);
  if (e.nombre.variantes?.length) filas.push(['También', e.nombre.variantes.join(' · ')]);
  if (e.notas) filas.push(['Notas', e.notas]);
  return (
    <>
      <ul className={styles.chips}>
        <li>Prioridad {e.prioridad}</li>
        {e.estatus && <li>{e.estatus}</li>}
        {e.visu.anios.map((a) => <li key={a} className={styles.exam}>VISU {a}</li>)}
        {e.visu.otros.map((o) => <li key={o} className={styles.exam}>{o.replace(/^Visu\b/i, 'VISU')}</li>)}
      </ul>
      {filas.length > 0 ? (
        <dl className={styles.dl}>{filas.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      ) : null}
      {!e.rasgos && <p className={styles.muted}>El catálogo no incluye rasgos de identificación de este ejemplar: fíjate en sus fotos.</p>}
    </>
  );
}

/** APRENDER: se estudian los ejemplares de la lección antes de practicar. */
export function LessonPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const info = nodoRuta(id);
  const ruta = useProgressStore((s) => s.ruta);
  const marcarAprendida = useProgressStore((s) => s.marcarAprendida);
  const [i, setI] = useState(0);
  if (!info || info.nodo.tipo !== 'leccion') return <NotFoundPage />;
  const lista = ejemplaresPorIds(info.nodo.ejemplares);
  const cat = CATEGORIA_POR_ID[info.submundo.categoria];
  const volver = `/ruta/${info.mundo.id}/${info.submundo.categoria}`;
  const estado = estadoNodo(info.submundo, info.indice, ruta);
  const numero = info.submundo.nodos.slice(0, info.indice + 1).filter((n) => n.tipo === 'leccion').length;
  const aprendida = !!ruta.lecciones[id]?.aprendida;
  // La nutria explica la mecánica solo en las primeras lecciones.
  const novato = Object.values(ruta.lecciones).filter((l) => l.aprendida).length < 3;

  if (estado === 'bloqueado') {
    return (
      <div className={styles.center}>
        <Lock size={36} weight="duotone" aria-hidden="true" />
        <p>Esta lección se abre al terminar la anterior de {cat.nombre}.</p>
        <Link to={volver} className={styles.btnDark}>Volver a {cat.nombre}</Link>
      </div>
    );
  }

  const e = lista[i];
  const ultimo = i === lista.length - 1;
  const aIdentificar = () => { marcarAprendida(id); navigate(`/jugar/sesion?leccion=${id}`); };

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to={volver} className={styles.close} aria-label={`Salir a ${cat.nombre}`}><X size={22} weight="bold" /></Link>
        <div className={styles.titles}>
          <span className={styles.kicker}>Mundo {info.mundo.numero} · {cat.nombre} · Lección {numero}</span>
          <h1 className={styles.h1}>Aprender: {info.nodo.titulo}</h1>
        </div>
        {aprendida && <button type="button" className={styles.skip} onClick={aIdentificar}>Ir a identificar</button>}
      </header>
      <ol className={styles.dots} aria-label={`Ejemplar ${i + 1} de ${lista.length}`}>
        {lista.map((x, k) => <li key={x.id} className={k === i ? styles.dotOn : k < i ? styles.dotDone : ''}><button type="button" onClick={() => setI(k)} aria-label={`Ejemplar ${k + 1}`} /></li>)}
      </ol>

      {i === 0 && !aprendida && novato && (
        <NutriaDice pose="explica">
          Mira bien estas fotos y fíjate en el nombre científico. Luego te preguntaré con <b>otras fotos</b>: así aprendes el organismo, no una foto.
        </NutriaDice>
      )}

      <article key={e.id} className={styles.card}>
        <div className={styles.media}><PhotoGallery imagenes={e.imagenes} alt={e.nombre.principal} /></div>
        <div className={styles.info}>
          <SpecimenLabel nombre={e.nombre} kicker={`${cat.nombre} · ${e.album}`} size="lg" />
          <Datos e={e} />
        </div>
      </article>

      <nav className={styles.nav} aria-label="Navegación de la lección">
        <button type="button" className={styles.btnLight} onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
          <ArrowLeft size={18} weight="bold" aria-hidden="true" /> Anterior
        </button>
        {ultimo ? (
          <button type="button" className={styles.btnGo} onClick={aIdentificar}>
            <Play size={18} weight="fill" aria-hidden="true" /> ¡A identificar!
          </button>
        ) : (
          <button type="button" className={styles.btnDark} onClick={() => setI((k) => k + 1)}>
            Siguiente <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
        )}
      </nav>
    </div>
  );
}
