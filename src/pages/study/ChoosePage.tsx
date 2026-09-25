import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { categoriasActivas } from '../../content';
import { CATEGORIA_POR_ID, DOMINIOS } from '../../content/categories';
import { useStudy } from '../../hooks/useStudy';
import { coincide } from '../../logic/study';
import type { CategoriaId, Dominio, Ejemplar } from '../../types/content';
import { SpecimenCard } from '../../components/specimen/SpecimenCard';
import { BackLink } from './BackLink';
import styles from './Study.module.css';

/** Agrupa conservando el orden de aparición. */
function agrupar(lista: Ejemplar[], clave: (e: Ejemplar) => string): [string, Ejemplar[]][] {
  const m = new Map<string, Ejemplar[]>();
  for (const e of lista) m.set(clave(e), [...(m.get(clave(e)) ?? []), e]);
  return [...m];
}

export function ChoosePage() {
  const { todos, nivel } = useStudy();
  const [params, setParams] = useSearchParams();
  const dominio = params.get('d') as Dominio | null;
  const categoria = params.get('c') as CategoriaId | null;
  const q = params.get('q') ?? '';

  // Forma funcional: cada cambio parte del valor más reciente aunque aún no se haya repintado.
  const cambiar = (k: string, v: string | null) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (v) n.set(k, v); else n.delete(k);
      if (k === 'd') n.delete('c');
      return n;
    }, { replace: true });
  };

  const categorias = categoriasActivas().filter((c) => !dominio || c.dominio === dominio);
  const lista = useMemo(
    () => todos.filter((e) => (!dominio || e.dominio === dominio) && (!categoria || e.categoria === categoria) && coincide(e, q)),
    [todos, dominio, categoria, q],
  );
  // Sin categoría: secciones por categoría. Con categoría: secciones por grupo (álbum) del catálogo.
  const grupos = categoria ? agrupar(lista, (e) => e.album) : agrupar(lista, (e) => CATEGORIA_POR_ID[e.categoria].nombre);

  return (
    <div className={styles.page}>
      <BackLink />
      <header>
        <h1 className={styles.title}>Elegir</h1>
      </header>

      <div className={styles.filters}>
        <div className={styles.segmented} role="group" aria-label="Dominio">
          {[{ id: null, nombre: 'Todo' }, ...DOMINIOS].map((d) => (
            <button key={d.nombre} type="button" aria-pressed={dominio === d.id} className={dominio === d.id ? styles.segOn : ''}
              onClick={() => cambiar('d', d.id)}>{d.nombre}</button>
          ))}
        </div>
        <label className={styles.search}>
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          <input type="search" placeholder="Buscar por nombre o grupo" value={q} onChange={(ev) => cambiar('q', ev.target.value || null)} aria-label="Buscar" />
        </label>
        <ul className={styles.catChips} aria-label="Categorías">
          {categorias.map((c) => {
            const Ico = c.icono;
            const on = categoria === c.id;
            return (
              <li key={c.id}>
                <button type="button" aria-pressed={on} className={`${styles.catChip} ${on ? styles.catOn : ''}`} style={{ ['--cat' as string]: c.color }}
                  onClick={() => cambiar('c', on ? null : c.id)}>
                  <Ico size={16} weight="fill" aria-hidden="true" /> {c.nombre}
                  <span>{todos.filter((e) => e.categoria === c.id && coincide(e, q)).length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {grupos.length === 0 && <p className={styles.empty}>No hay ejemplares que coincidan{q ? ` con «${q}»` : ''}.</p>}
      {grupos.map(([titulo, xs]) => (
        <section key={titulo} aria-label={titulo}>
          <h2 className={styles.groupTitle}>{titulo} <span>{xs.length}</span></h2>
          <ul className={styles.grid}>
            {xs.map((e) => <li key={e.id}><SpecimenCard ejemplar={e} nivel={nivel(e.id)} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
