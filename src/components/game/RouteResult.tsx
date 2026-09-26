import { Link } from 'react-router-dom';
import { ArrowRight, Barbell, Star } from '@phosphor-icons/react';
import type { EstadoPartida } from '../../hooks/useGameSession';
import { mundo, nodoRuta, RUTA } from '../../content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { estrellas } from '../../logic/route';
import type { NodoRuta } from '../../types/content';
import { Nutria } from '../nutria/Nutria';
import styles from './RouteResult.module.css';

const enlaceNodo = (n: NodoRuta) => (n.tipo === 'leccion' ? `/leccion/${n.id}` : `/jugar/sesion?nodo=${n.id}`);

/** Lo que significa la sesión dentro de la ruta: estrellas, qué sigue y qué reforzar. Sin "game over". */
export function RouteResult({ st }: { st: EstadoPartida }) {
  const r = st.resultado;
  if (!r) return null;
  const nota = r.total ? r.aciertos / r.total : 0;
  const pct = Math.round(nota * 100);
  const fallados = [...new Set(st.respuestas.filter((x) => !x.reintento && !x.ok).map((x) => x.ejemplarId))];
  const refuerzo = fallados.length ? `/jugar/sesion?refuerzo=${fallados.slice(0, 10).join(',')}` : null;

  if (st.origen.tipo === 'examen') {
    const m = mundo(st.origen.mundo);
    const siguiente = m && RUTA.mundos[m.numero];
    return (
      <section className={`${styles.box} ${r.aprobado ? styles.ok : styles.pending}`}>
        <Nutria pose={r.aprobado ? 'medalla' : 'animo'} size={92} />
        <h2>{r.aprobado ? `¡Mundo ${m?.numero} superado!` : 'Todavía no'}</h2>
        <p>{pct}% de aciertos · se necesita un {Math.round(RUTA.config.aprobado * 100)}%.</p>
        <p className={styles.note}>{r.aprobado
          ? siguiente ? `Se abre el Mundo ${siguiente.numero}.` : 'Era el último mundo de la ruta.'
          : 'No pierdes nada: el mundo sigue completado, conservas tu XP y tu dominio. Refuerza lo que falló y vuelve a intentarlo cuando quieras.'}</p>
        <div className={styles.actions}>
          {r.aprobado && siguiente && <Link to={`/ruta/${siguiente.id}`} className={styles.primary}>Ir al Mundo {siguiente.numero} <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>}
          {!r.aprobado && refuerzo && <Link to={refuerzo} className={styles.primary}><Barbell size={18} weight="bold" aria-hidden="true" /> Reforzar lo fallado</Link>}
          {m && <Link to={`/ruta/${m.id}`} className={styles.secondary}>Volver al Mundo {m.numero}</Link>}
        </div>
      </section>
    );
  }

  const info = nodoRuta(st.origen.tipo === 'leccion' || st.origen.tipo === 'repaso-ruta' ? st.origen.id : '');
  if (!info) return null;
  const siguiente = info.submundo.nodos[info.indice + 1];
  const cat = CATEGORIA_POR_ID[info.submundo.categoria];
  const flojo = st.origen.tipo === 'repaso-ruta' && nota < 0.7;

  return (
    <section className={`${styles.box} ${flojo ? styles.pending : styles.ok}`}>
      {st.origen.tipo === 'leccion' ? (
        <>
          <div className={styles.stars} aria-label={`${estrellas(nota)} de 3 estrellas`}>
            {[1, 2, 3].map((k) => <Star key={k} size={30} weight={k <= estrellas(nota) ? 'fill' : 'regular'} aria-hidden="true" />)}
          </div>
          <h2>Lección completada</h2>
          <p>{info.nodo.titulo} · {pct}% a la primera</p>
        </>
      ) : (
        <>
          <h2>{flojo ? 'Conviene reforzar' : '¡Buen repaso!'}</h2>
          <p>{pct}% de aciertos en el repaso de {cat.nombre}.</p>
          {flojo && <p className={styles.note}>No pasa nada: puedes seguir. Te recomendamos practicar antes lo que peor llevas.</p>}
        </>
      )}
      <div className={styles.actions}>
        {flojo && refuerzo && <Link to={refuerzo} className={styles.primary}><Barbell size={18} weight="bold" aria-hidden="true" /> Reforzar ({Math.min(10, fallados.length)})</Link>}
        {siguiente
          ? <Link to={enlaceNodo(siguiente)} className={flojo ? styles.secondary : styles.primary}>Siguiente: {siguiente.titulo} <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
          : <Link to={`/ruta/${info.mundo.id}`} className={flojo ? styles.secondary : styles.primary}>¡{cat.nombre} completada! Volver al Mundo {info.mundo.numero}</Link>}
        <Link to={`/ruta/${info.mundo.id}/${info.submundo.categoria}`} className={styles.secondary}>Ver {cat.nombre}</Link>
      </div>
    </section>
  );
}
