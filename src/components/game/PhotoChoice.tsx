import { Check, X } from '@phosphor-icons/react';
import type { OpcionFoto } from '../../types/game';
import styles from './PhotoChoice.module.css';

interface Props { fotos: OpcionFoto[]; correcta: string; elegida: string | null; onElegir: (id: string) => void }

/** "Elegir la foto": cuatro fotos reales; se elige la del ejemplar nombrado. */
export function PhotoChoice({ fotos, correcta, elegida, onElegir }: Props) {
  const respondida = elegida !== null;
  return (
    <ol className={styles.grid} aria-label="Fotos">
      {fotos.map((f, i) => {
        const estado = !respondida ? '' : f.id === correcta ? styles.ok : f.id === elegida ? styles.bad : styles.dim;
        return (
          <li key={f.id}>
            <button type="button" className={`${styles.photo} ${estado}`} onClick={() => onElegir(f.id)} disabled={respondida}
              aria-label={`Foto ${i + 1}`} aria-keyshortcuts={String(i + 1)}>
              <img src={f.imagen.archivo} alt="" draggable={false} />
              <span className={styles.key} aria-hidden="true">
                {respondida && f.id === correcta ? <Check size={16} weight="bold" /> : respondida && f.id === elegida ? <X size={16} weight="bold" /> : i + 1}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
