import { useResumen } from '../../hooks/useResumen';
import { CollectionSection } from '../../components/home/CollectionSection';
import { MasteryBar } from '../../components/progress/MasteryBar';
import styles from './Collection.module.css';

export function CollectionPage() {
  const r = useResumen();
  const { descubiertos, total, packs } = r.coleccion;
  const completas = r.categorias.filter((c) => c.descubiertos === c.total).length;
  return (
    <div className={styles.page}>
      <header className={`${styles.head} rise`}>
        <h1 className={styles.title}>Mi colección</h1>
        <p className={styles.lead}>Cada ejemplar que descubres se añade aquí. Complétala y, después, domínala.</p>
        <div className={styles.summary}>
          <div><strong>{descubiertos}<small>/{total}</small></strong><span>descubiertos</span></div>
          <div><strong>{r.dominio.dominados}</strong><span>dominados</span></div>
          <div><strong>{completas}<small>/{r.categorias.length}</small></strong><span>categorías completas</span></div>
        </div>
        <MasteryBar distribucion={r.dominio.distribucion} alto={10} />
      </header>
      <CollectionSection categorias={r.categorias} descubiertos={descubiertos} total={total} packs={packs} sinEnlace titulo="Categorías" />
    </div>
  );
}
