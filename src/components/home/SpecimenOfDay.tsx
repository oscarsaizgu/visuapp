import { useState } from 'react';
import { Eye, Sparkle } from '@phosphor-icons/react';
import type { Ejemplar } from '../../types/content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { portada } from '../../content';
import { SpecimenImage } from '../specimen/SpecimenImage';
import { SpecimenLabel } from '../specimen/SpecimenLabel';
import styles from './SpecimenOfDay.module.css';

function historial(e: Ejemplar): string | null {
  const partes = [...e.visu.anios.map((a) => `VISU ${a}`), ...e.visu.otros];
  return partes.length ? `Salió en ${partes.slice(0, 3).join(' · ')}` : null;
}

/** Un ejemplar que ya cayó en examen, oculto hasta que el usuario lo revela. */
export function SpecimenOfDay({ ejemplar }: { ejemplar?: Ejemplar }) {
  const [visible, setVisible] = useState(false);
  if (!ejemplar) return null;
  const cat = CATEGORIA_POR_ID[ejemplar.categoria];
  const hist = historial(ejemplar);
  return (
    <section className={`${styles.card} rise`} style={{ animationDelay: '240ms' }} aria-labelledby="sod-title">
      <div className={styles.photo}>
        <SpecimenImage imagen={portada(ejemplar)} alt={visible ? ejemplar.nombre.principal : 'Ejemplar sin identificar'} />
      </div>
      <div className={styles.body}>
        <h2 id="sod-title" className={styles.kicker}><Sparkle size={14} weight="fill" aria-hidden="true" /> Ejemplar del día</h2>
        <div className={styles.reveal} aria-live="polite">
          {visible ? (
            <div className={styles.revealed}>
              <SpecimenLabel nombre={ejemplar.nombre} kicker={`${cat.nombre} · ${ejemplar.album}`} />
              {ejemplar.rasgos && <p className={styles.rasgos}>{ejemplar.rasgos}</p>}
            </div>
          ) : (
            <>
              <p className={styles.unknown} aria-label="Nombre oculto">???</p>
              <p className={styles.hint}>{cat.nombre}{hist ? ` · ${hist}` : ''}</p>
              <button type="button" className={styles.btn} onClick={() => setVisible(true)}>
                <Eye size={18} weight="bold" aria-hidden="true" /> Revelar
              </button>
            </>
          )}
        </div>
        {visible && hist && <p className={styles.hint}>{hist}</p>}
      </div>
    </section>
  );
}
