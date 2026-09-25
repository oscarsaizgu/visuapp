import { useResumen } from '../../hooks/useResumen';
import { CollectionSection } from '../../components/home/CollectionSection';
import { MasteryBar } from '../../components/progress/MasteryBar';
import type { NivelDominio } from '../../logic/mastery';
import styles from './Collection.module.css';

/** La colección abarca el CATÁLOGO completo: todo lo importado, descubierto o no. */
export function CollectionPage() {
  const r = useResumen();
  const { descubiertos, total } = r.coleccion;
  const distribucion = r.categorias.reduce((acc, c) => {
    for (const k of Object.keys(acc) as NivelDominio[]) acc[k] += c.distribucion[k];
    return acc;
  }, { nuevo: 0, aprendiendo: 0, familiar: 0, dominado: 0, 'muy-dominado': 0 } as Record<NivelDominio, number>);
  const completas = r.categorias.filter((c) => c.descubiertos === c.total).length;
  return (
    <div className={styles.page}>
      <header className={`${styles.head} rise`}>
        <h1 className={styles.title}>Mi colección</h1>
        <p className={styles.lead}>Todo el catálogo del VISU: {total.toLocaleString('es-ES')} ejemplares. Cada uno que descubres se añade aquí.</p>
        <div className={styles.summary}>
          <div><strong>{descubiertos}<small>/{total.toLocaleString('es-ES')}</small></strong><span>descubiertos</span></div>
          <div><strong>{distribucion.dominado + distribucion['muy-dominado']}</strong><span>dominados</span></div>
          <div><strong>{completas}<small>/{r.categorias.length}</small></strong><span>categorías completas</span></div>
        </div>
        <MasteryBar distribucion={distribucion} alto={10} />
      </header>
      <CollectionSection categorias={r.categorias} descubiertos={descubiertos} total={total} packs={['catálogo completo']} sinEnlace titulo="Categorías" />
    </div>
  );
}
