import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CaretRight, Keyboard, ListChecks, MagnifyingGlass, ImagesSquare } from '@phosphor-icons/react';
import { CATALOGO, categoriasCon, ejemplaresDe } from '../../content';
import { CATEGORIA_POR_ID, DOMINIOS } from '../../content/categories';
import { useProgressStore } from '../../store/useProgressStore';
import { nivelDominio } from '../../logic/mastery';
import { coincide } from '../../logic/study';
import type { CategoriaId, Dominio, Ejemplar } from '../../types/content';
import { SpecimenCard } from '../../components/specimen/SpecimenCard';
import { MasteryBar } from '../../components/progress/MasteryBar';
import { distribucionDominio } from '../../logic/mastery';
import { BackLink } from './BackLink';
import styles from './Study.module.css';

const POR_PAGINA = 48;

/** Botones para practicar un conjunto del catálogo (no avanza la ruta ni desbloquea mundos). */
function Practicar({ bloque, texto }: { bloque: string; texto: string }) {
  const q = encodeURIComponent(bloque);
  return (
    <div className={styles.practice}>
      <span className={styles.practiceTitle}>{texto}</span>
      <div className={styles.practiceBtns}>
        <Link to={`/jugar/sesion?bloque=${q}&modo=opcion-multiple`}><ListChecks size={18} weight="bold" aria-hidden="true" /> Elegir</Link>
        <Link to={`/jugar/sesion?bloque=${q}&modo=escribir`}><Keyboard size={18} weight="bold" aria-hidden="true" /> Escribir</Link>
        <Link to={`/jugar/sesion?bloque=${q}&modo=elegir-foto`}><ImagesSquare size={18} weight="bold" aria-hidden="true" /> Foto</Link>
      </div>
    </div>
  );
}

function Rejilla({ lista }: { lista: Ejemplar[] }) {
  const progreso = useProgressStore((s) => s.progreso);
  const [n, setN] = useState(POR_PAGINA);
  return (
    <>
      <ul className={styles.grid}>
        {lista.slice(0, n).map((e) => <li key={e.id}><SpecimenCard ejemplar={e} nivel={nivelDominio(progreso[e.id])} /></li>)}
      </ul>
      {lista.length > n && (
        <button type="button" className={styles.more2} onClick={() => setN((x) => x + POR_PAGINA)}>
          Mostrar más ({lista.length - n} restantes)
        </button>
      )}
    </>
  );
}

/**
 * Estudio libre sobre el CATÁLOGO completo: disciplina → bloques (grupos del catálogo) → ejemplares.
 * Los filtros viven en la URL (d, c, b, q) para volver donde estabas desde una ficha.
 */
export function ChoosePage() {
  const progreso = useProgressStore((s) => s.progreso);
  const [params, setParams] = useSearchParams();
  const dominio = params.get('d') as Dominio | null;
  const categoria = params.get('c') as CategoriaId | null;
  const bloque = params.get('b');
  const q = params.get('q') ?? '';

  // Forma funcional: cada cambio parte del valor más reciente aunque aún no se haya repintado.
  const cambiar = (cambios: Record<string, string | null>) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(cambios)) { if (v) n.set(k, v); else n.delete(k); }
      return n;
    }, { replace: true });
  };

  const categorias = categoriasCon(CATALOGO).filter((c) => !dominio || c.dominio === dominio);
  const busqueda = useMemo(
    () => (q ? CATALOGO.filter((e) => (!dominio || e.dominio === dominio) && (!categoria || e.categoria === categoria) && coincide(e, q)) : []),
    [q, dominio, categoria],
  );
  const deCategoria = categoria ? ejemplaresDe(categoria) : [];
  const bloques = [...new Set(deCategoria.map((e) => e.album))];
  const deBloque = bloque ? deCategoria.filter((e) => e.album === bloque) : [];
  const cat = categoria ? CATEGORIA_POR_ID[categoria] : null;

  return (
    <div className={styles.page}>
      <BackLink />
      <header>
        <h1 className={styles.title}>Estudio libre</h1>
        <p className={styles.lead}>Todo el catálogo ({CATALOGO.length.toLocaleString('es-ES')} ejemplares), sin depender de la ruta. Practicar aquí mejora tu dominio, pero no desbloquea mundos.</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.segmented} role="group" aria-label="Dominio">
          {[{ id: null, nombre: 'Todo' }, ...DOMINIOS].map((d) => (
            <button key={d.nombre} type="button" aria-pressed={dominio === d.id} className={dominio === d.id ? styles.segOn : ''}
              onClick={() => cambiar({ d: d.id, c: null, b: null })}>{d.nombre}</button>
          ))}
        </div>
        <label className={styles.search}>
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          <input type="search" placeholder="Buscar en todo el catálogo" value={q} onChange={(ev) => cambiar({ q: ev.target.value || null })} aria-label="Buscar" />
        </label>
        <ul className={styles.catChips} aria-label="Categorías">
          {categorias.map((c) => {
            const Ico = c.icono;
            const on = categoria === c.id;
            return (
              <li key={c.id}>
                <button type="button" aria-pressed={on} className={`${styles.catChip} ${on ? styles.catOn : ''}`} style={{ ['--cat' as string]: c.color }}
                  onClick={() => cambiar({ c: on ? null : c.id, b: null })}>
                  <Ico size={16} weight="fill" aria-hidden="true" /> {c.nombre}
                  <span>{ejemplaresDe(c.id).length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {q ? (
        <section aria-label="Resultados">
          <h2 className={styles.groupTitle}>Resultados <span>{busqueda.length}</span></h2>
          {busqueda.length ? <Rejilla key={q} lista={busqueda} /> : <p className={styles.empty}>No hay ejemplares que coincidan con «{q}».</p>}
        </section>
      ) : !cat ? (
        <p className={styles.empty}>Elige una disciplina para ver sus bloques, o busca cualquier ejemplar por nombre.</p>
      ) : !bloque ? (
        <section aria-label={cat.nombre}>
          <Practicar bloque={cat.id} texto={`Practicar toda ${cat.nombre} (${deCategoria.length})`} />
          <h2 className={styles.groupTitle}>Bloques de {cat.nombre} <span>{bloques.length}</span></h2>
          <ul className={styles.blocks}>
            {bloques.map((b) => {
              const xs = deCategoria.filter((e) => e.album === b);
              return (
                <li key={b}>
                  <button type="button" className={styles.block} onClick={() => cambiar({ b })}>
                    <span className={styles.blockName}>{b}</span>
                    <span className={styles.blockCount}>{xs.filter((e) => progreso[e.id]?.descubierto).length}/{xs.length}</span>
                    <CaretRight size={16} weight="bold" aria-hidden="true" />
                    <span className={styles.blockBar}><MasteryBar distribucion={distribucionDominio(xs.map((e) => e.id), progreso)} alto={5} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section aria-label={bloque}>
          <button type="button" className={styles.crumb} onClick={() => cambiar({ b: null })}>{cat.nombre}</button>
          <h2 className={styles.groupTitle}>{bloque} <span>{deBloque.length}</span></h2>
          <Practicar bloque={`${cat.id}|${bloque}`} texto="Practicar este bloque" />
          <Rejilla key={bloque} lista={deBloque} />
        </section>
      )}
    </div>
  );
}
