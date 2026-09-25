import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react';
import { ejemplar as buscarEjemplar } from '../content';
import { CATEGORIA_POR_ID } from '../content/categories';
import { useProgressStore } from '../store/useProgressStore';
import { useNameIndex } from '../hooks/useNameIndex';
import { claveDia } from '../logic/daily';
import { NOMBRE_NIVEL, nivelDominio } from '../logic/mastery';
import { diaRelativo } from '../logic/study';
import { parientes, type Parentesco } from '../logic/related';
import { opcionDesdeIndice } from '../logic/optionText';
import { PhotoGallery } from '../components/specimen/PhotoGallery';
import { SpecimenLabel } from '../components/specimen/SpecimenLabel';
import { NotFoundPage } from './sections';
import styles from './SpecimenPage.module.css';

const PARENTESCO: Record<Parentesco, string> = { genero: 'Mismo género', familia: 'Misma familia', grupo: 'Mismo grupo' };
const TAXONES = [['reino', 'Reino'], ['filo', 'Filo'], ['clase', 'Clase'], ['orden', 'Orden'], ['familia', 'Familia']] as const;

export function SpecimenPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const e = buscarEjemplar(id);
  const p = useProgressStore((s) => s.progreso[id]);
  const marcarDescubierto = useProgressStore((s) => s.marcarDescubierto);
  const indice = useNameIndex();

  // Abrir la ficha lo añade a tu colección (sin XP ni dominio: eso solo se gana identificando).
  useEffect(() => { if (e) marcarDescubierto(e.id); }, [e, marcarDescubierto]);

  if (!e) return <NotFoundPage />;
  const cat = CATEGORIA_POR_ID[e.categoria];
  const fotos = e.imagenes.filter((i) => i.ficha);
  const nivel = nivelDominio(p, e.imagenes.filter((i) => i.juego).length);
  const hoy = claveDia();
  const lista = indice ? parientes(e, indice) : [];
  const taxones = TAXONES.filter(([k]) => e.taxonomia?.[k]);

  return (
    <article className={styles.page}>
      <button type="button" className={styles.back} onClick={() => (history.length > 1 ? navigate(-1) : navigate('/estudiar'))}>
        <ArrowLeft size={18} weight="bold" aria-hidden="true" /> Volver
      </button>

      <div className={styles.layout}>
        <div className={styles.media}>
          <PhotoGallery imagenes={fotos} alt={e.nombre.principal} />
        </div>

        <div className={styles.info}>
          <header className={styles.head}>
            <SpecimenLabel nombre={e.nombre} kicker={`${cat.nombre} · ${e.album}`} size="lg" />
            {e.nombre.variantes?.length ? <p className={styles.alt}>También: {e.nombre.variantes.join(' · ')}</p> : null}
            <ul className={styles.chips}>
              <li className={styles.pri}>Prioridad {e.prioridad}</li>
              {e.estatus && <li>{e.estatus}</li>}
              {e.visu.anios.map((a) => <li key={a} className={styles.exam}>VISU {a}</li>)}
              {e.visu.otros.map((o) => <li key={o} className={styles.examOtro}>{o.replace(/^Visu\b/i, 'VISU')}</li>)}
            </ul>
          </header>

          <section className={styles.card} aria-labelledby="prog-t">
            <h2 id="prog-t" className={styles.h2}>Tu progreso</h2>
            <p className={styles.nivel}><i style={{ background: `var(--m-${nivel})` }} />{NOMBRE_NIVEL[nivel]}</p>
            {p && p.vecesVisto > 0 ? (
              <p className={styles.muted}>
                {p.aciertos} {p.aciertos === 1 ? 'acierto' : 'aciertos'} · {p.errores} {p.errores === 1 ? 'fallo' : 'fallos'}
                {p.proximaRevision && <> · próximo repaso {diaRelativo(p.proximaRevision, hoy)}</>}
              </p>
            ) : (
              <p className={styles.muted}>Aún no lo has identificado en el juego. El dominio solo sube al acertarlo.</p>
            )}
          </section>

          <section className={styles.card} aria-labelledby="id-t">
            <h2 id="id-t" className={styles.h2}>Rasgos de identificación</h2>
            {e.rasgos
              ? <p>{e.rasgos}</p>
              : <p className={styles.muted}>El catálogo no incluye rasgos de identificación para este ejemplar. Apóyate en las fotos y en su clasificación.</p>}
          </section>

          {e.confusiones?.length ? (
            <section className={styles.card} aria-labelledby="conf-t">
              <h2 id="conf-t" className={styles.h2}>Posibles confusiones</h2>
              <ul className={styles.plain}>
                {e.confusiones.map((c) => <li key={c.id}><strong>{buscarEjemplar(c.id)?.nombre.principal ?? c.id}</strong>: {c.diferencia}</li>)}
              </ul>
            </section>
          ) : null}

          <section className={styles.card} aria-labelledby="clas-t">
            <h2 id="clas-t" className={styles.h2}>Clasificación</h2>
            <dl className={styles.dl}>
              <div><dt>Grupo</dt><dd>{e.album}</dd></div>
              {taxones.map(([k, label]) => <div key={k}><dt>{label}</dt><dd>{e.taxonomia![k]}</dd></div>)}
            </dl>
          </section>

          {e.notas && (
            <section className={styles.card} aria-labelledby="notas-t">
              <h2 id="notas-t" className={styles.h2}>Notas</h2>
              <p>{e.notas}</p>
            </section>
          )}

          {lista.length > 0 && (
            <section className={styles.card} aria-labelledby="par-t">
              <h2 id="par-t" className={styles.h2}>Emparentados en el catálogo</h2>
              <p className={styles.muted}>Según la clasificación del catálogo. Son buenos candidatos para confundirse.</p>
              <ul className={styles.rel}>
                {lista.map(({ entrada, parentesco }) => {
                  const o = opcionDesdeIndice(entrada);
                  const activo = buscarEjemplar(entrada.id);
                  const nombre = <span className={o.cursiva ? 'sci' : undefined}>{o.texto}</span>;
                  return (
                    <li key={entrada.id}>
                      {activo ? <Link to={`/ejemplar/${entrada.id}`} className={styles.relLink}>{nombre}</Link> : nombre}
                      <span className={styles.relTag}>{PARENTESCO[parentesco]}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {e.referencia && (
            <a className={styles.ref} href={e.referencia} target="_blank" rel="noopener noreferrer">
              Ficha de referencia en {new URL(e.referencia).hostname.replace(/^www\./, '')} <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
