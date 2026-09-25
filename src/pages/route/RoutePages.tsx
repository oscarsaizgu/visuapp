import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowsClockwise, CaretRight, CheckCircle, Lock, Play, Star, Trophy } from '@phosphor-icons/react';
import { RUTA, ejemplaresPorIds, mundo as buscarMundo, mundosDesbloqueados, portada } from '../../content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { superados, useProgressStore } from '../../store/useProgressStore';
import { estadoNodo, estrellas, mundoCompleto, progresoMundo, progresoSubmundo, submundoCompleto } from '../../logic/route';
import type { CategoriaId, Mundo } from '../../types/content';
import { SpecimenImage } from '../../components/specimen/SpecimenImage';
import { NotFoundPage } from '../sections';
import styles from './Route.module.css';

function Barra({ hechos, total }: { hechos: number; total: number }) {
  return <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos}><i style={{ transform: `scaleX(${total ? hechos / total : 0})` }} /></div>;
}

/** Iconos de las disciplinas de un mundo con su número de ejemplares. */
function Disciplinas({ m }: { m: Mundo }) {
  return (
    <ul className={styles.disc}>
      {m.submundos.map((sm) => {
        const c = CATEGORIA_POR_ID[sm.categoria];
        const Ico = c.icono;
        return <li key={sm.id} title={c.nombre} style={{ ['--cat' as string]: c.color }}><Ico size={14} weight="fill" aria-hidden="true" />{sm.total}</li>;
      })}
    </ul>
  );
}

/** Lista de mundos de la ruta. */
export function RoutePage() {
  const ruta = useProgressStore((s) => s.ruta);
  const abiertos = mundosDesbloqueados(superados(ruta));
  const visibles = RUTA.mundos.slice(0, abiertos.length + 3);
  return (
    <div className={styles.page}>
      <header className="rise">
        <h1 className={styles.title}>Ruta de aprendizaje</h1>
        <p className={styles.lead}>
          {RUTA.mundos.length} mundos con todo el catálogo ({RUTA.catalogo.enRuta.toLocaleString('es-ES')} ejemplares). Cada mundo mezcla disciplinas;
          supera su examen final para abrir el siguiente. Primero lo que más cae en el VISU.
        </p>
      </header>
      <ul className={styles.worlds}>
        {visibles.map((m) => {
          const abierto = abiertos.some((x) => x.id === m.id);
          const p = progresoMundo(m, ruta);
          const superado = !!ruta.examenes[m.id]?.superado;
          const foto = portada(ejemplaresPorIds([m.submundos[0].nodos[0].ejemplares[0]])[0]);
          return (
            <li key={m.id}>
              {abierto ? (
                <Link to={`/ruta/${m.id}`} className={styles.world}>
                  <div className={styles.worldPhoto}><SpecimenImage imagen={foto} alt="" /></div>
                  <div className={styles.worldBody}>
                    <span className={styles.worldKicker}>{superado ? <><CheckCircle size={14} weight="fill" aria-hidden="true" /> Superado</> : 'En curso'}</span>
                    <h2 className={styles.worldTitle}>Mundo {m.numero}</h2>
                    <p className={styles.muted}>{m.total} ejemplares · {m.submundos.length} disciplinas</p>
                    <Disciplinas m={m} />
                    <Barra hechos={p.hechos} total={p.total} />
                  </div>
                  <CaretRight size={20} weight="bold" className={styles.caret} aria-hidden="true" />
                </Link>
              ) : (
                <div className={`${styles.world} ${styles.locked}`}>
                  <div className={styles.worldPhoto}><Lock size={26} weight="duotone" aria-hidden="true" /></div>
                  <div className={styles.worldBody}>
                    <h2 className={styles.worldTitle}>Mundo {m.numero}</h2>
                    <p className={styles.muted}>{m.total} ejemplares · se abre al superar el examen del Mundo {m.numero - 1}</p>
                    <Disciplinas m={m} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {RUTA.mundos.length > visibles.length && <p className={styles.more}>… y {RUTA.mundos.length - visibles.length} mundos más hasta completar el catálogo.</p>}
    </div>
  );
}

/** Un mundo: sus submundos (disciplinas) y el examen final. */
export function WorldPage() {
  const { mundo: id = '' } = useParams();
  const ruta = useProgressStore((s) => s.ruta);
  const m = buscarMundo(id);
  if (!m) return <NotFoundPage />;
  const abierto = mundosDesbloqueados(superados(ruta)).some((x) => x.id === m.id);
  const completo = mundoCompleto(m, ruta);
  const examen = ruta.examenes[m.id];
  const completos = m.submundos.filter((sm) => submundoCompleto(sm, ruta)).length;
  return (
    <div className={styles.page}>
      <Link to="/ruta" className={styles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Ruta</Link>
      <header>
        <h1 className={styles.title}>Mundo {m.numero}</h1>
        <p className={styles.lead}>{m.total} ejemplares en {m.submundos.length} disciplinas. Puedes avanzar en ellas en el orden que quieras.</p>
      </header>
      {!abierto ? (
        <p className={styles.empty}><Lock size={18} weight="bold" aria-hidden="true" /> Se abre al superar el examen del Mundo {m.numero - 1}.</p>
      ) : (
        <>
          <ul className={styles.subs}>
            {m.submundos.map((sm) => {
              const c = CATEGORIA_POR_ID[sm.categoria];
              const Ico = c.icono;
              const p = progresoSubmundo(sm, ruta);
              const hecho = p.hechos === p.total;
              return (
                <li key={sm.id}>
                  <Link to={`/ruta/${m.id}/${sm.categoria}`} className={styles.sub} style={{ ['--cat' as string]: c.color }}>
                    <span className={styles.subIcon}><Ico size={22} weight="fill" aria-hidden="true" /></span>
                    <span className={styles.subName}>{c.nombre}{hecho && <CheckCircle size={16} weight="fill" className={styles.okIcon} aria-label="completado" />}</span>
                    <span className={styles.muted}>{sm.total} {sm.total === 1 ? 'ejemplar' : 'ejemplares'} · {plural(sm.nodos.filter((n) => n.tipo === 'leccion').length, 'lección', 'lecciones')}</span>
                    <Barra hechos={p.hechos} total={p.total} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <section className={`${styles.exam} ${completo ? '' : styles.examLocked}`} aria-labelledby="exam-t">
            <Trophy size={34} weight="duotone" aria-hidden="true" />
            <div>
              <h2 id="exam-t">Examen final del Mundo {m.numero}</h2>
              <p>{m.examen.preguntas} preguntas de todas sus disciplinas · aprobado con {Math.round(RUTA.config.aprobado * 100)}%.</p>
              {examen && <p className={styles.muted}>{examen.superado ? `Superado · mejor nota ${Math.round(examen.mejor * 100)}%` : `${examen.intentos} ${examen.intentos === 1 ? 'intento' : 'intentos'} · mejor nota ${Math.round(examen.mejor * 100)}%`}</p>}
              {!completo && <p className={styles.muted}>Se abre al completar todas las disciplinas ({completos}/{m.submundos.length}).</p>}
            </div>
            {completo && <Link to={`/jugar/sesion?examen=${m.id}`} className={styles.go}><Play size={18} weight="fill" aria-hidden="true" /> {examen?.superado ? 'Repetir' : examen ? 'Intentar de nuevo' : 'Hacer el examen'}</Link>}
          </section>
        </>
      )}
    </div>
  );
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

/** Un submundo: su camino de lecciones y repasos. */
export function SubworldPage() {
  const { mundo: id = '', categoria = '' } = useParams();
  const ruta = useProgressStore((s) => s.ruta);
  const m = buscarMundo(id);
  const sm = m?.submundos.find((x) => x.categoria === categoria);
  if (!m || !sm) return <NotFoundPage />;
  if (!mundosDesbloqueados(superados(ruta)).some((x) => x.id === m.id)) return <NotFoundPage />;
  const c = CATEGORIA_POR_ID[categoria as CategoriaId];
  const Ico = c.icono;
  let numero = 0;
  return (
    <div className={styles.page}>
      <Link to={`/ruta/${m.id}`} className={styles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Mundo {m.numero}</Link>
      <header className={styles.subHead} style={{ ['--cat' as string]: c.color }}>
        <span className={styles.subIconBig}><Ico size={28} weight="fill" aria-hidden="true" /></span>
        <div>
          <h1 className={styles.title}>{c.nombre}</h1>
          <p className={styles.lead}>Mundo {m.numero} · {sm.total} ejemplares</p>
        </div>
      </header>
      <ol className={styles.path}>
        {sm.nodos.map((n, i) => {
          const estado = estadoNodo(sm, i, ruta);
          if (n.tipo === 'leccion') numero++;
          const leccion = ruta.lecciones[n.id];
          const destino = n.tipo === 'leccion' ? `/leccion/${n.id}` : `/jugar/sesion?nodo=${n.id}`;
          const fotos = ejemplaresPorIds(n.ejemplares).slice(0, 3);
          const contenido = (
            <>
              <span className={styles.nodeIcon}>
                {estado === 'bloqueado' ? <Lock size={18} weight="bold" aria-hidden="true" /> : n.tipo === 'repaso' ? <ArrowsClockwise size={18} weight="bold" aria-hidden="true" /> : numero}
              </span>
              <span className={styles.nodeText}>
                <span className={styles.nodeKicker}>{n.tipo === 'leccion' ? `Lección ${numero}` : 'Repaso'} · {n.tipo === 'leccion' ? `${n.ejemplares.length} ejemplares` : `${Math.min(10, n.ejemplares.length)} preguntas`}</span>
                <strong>{n.titulo}</strong>
                {estado === 'hecho' && n.tipo === 'leccion' && leccion && (
                  <span className={styles.stars} aria-label={`${estrellas(leccion.mejor)} estrellas`}>
                    {[1, 2, 3].map((k) => <Star key={k} size={14} weight={k <= estrellas(leccion.mejor) ? 'fill' : 'regular'} aria-hidden="true" />)}
                  </span>
                )}
                {estado === 'hecho' && n.tipo === 'repaso' && <span className={styles.muted}>Hecho · {Math.round((ruta.repasos[n.id]?.mejor ?? 0) * 100)}%</span>}
              </span>
              {n.tipo === 'leccion' && (
                <span className={styles.thumbs} aria-hidden="true">
                  {fotos.map((e) => <span key={e.id}><SpecimenImage imagen={portada(e)} alt="" /></span>)}
                </span>
              )}
            </>
          );
          return (
            <li key={n.id} className={`${styles.node} ${styles[estado]} ${n.tipo === 'repaso' ? styles.review : ''}`}>
              {estado === 'bloqueado' ? <div className={styles.nodeInner}>{contenido}</div> : <Link to={destino} className={styles.nodeInner}>{contenido}</Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
