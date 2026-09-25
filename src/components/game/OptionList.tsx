import { Check, X } from '@phosphor-icons/react';
import type { Opcion } from '../../types/game';
import styles from './OptionList.module.css';

interface Props {
  opciones: Opcion[];
  correcta: string;
  /** Opción elegida (null mientras no se ha respondido). */
  elegida: string | null;
  onElegir: (id: string) => void;
}

export function OptionList({ opciones, correcta, elegida, onElegir }: Props) {
  const respondida = elegida !== null;
  return (
    <ol className={styles.list} aria-label="Opciones">
      {opciones.map((o, i) => {
        const estado = !respondida ? '' : o.id === correcta ? styles.ok : o.id === elegida ? styles.bad : styles.dim;
        return (
          <li key={o.id}>
            <button
              type="button"
              className={`${styles.opt} ${estado}`}
              onClick={() => onElegir(o.id)}
              disabled={respondida}
              aria-keyshortcuts={String(i + 1)}
            >
              <span className={styles.key} aria-hidden="true">
                {respondida && o.id === correcta ? <Check size={16} weight="bold" /> : respondida && o.id === elegida ? <X size={16} weight="bold" /> : i + 1}
              </span>
              <span className={o.cursiva ? `${styles.text} sci` : styles.text}>{o.texto}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
