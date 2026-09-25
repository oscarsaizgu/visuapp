import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import styles from './WriteAnswer.module.css';

interface Props { onEnviar: (texto: string) => void; bloqueado: boolean; ayuda: string }

/** Respuesta escrita (como en el examen): sin tildes ni mayúsculas y con tolerancia a erratas. */
export function WriteAnswer({ onEnviar, bloqueado, ayuda }: Props) {
  const [texto, setTexto] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!bloqueado) input.current?.focus({ preventScroll: true }); }, [bloqueado]);
  return (
    <form className={styles.form} onSubmit={(ev) => { ev.preventDefault(); if (texto.trim() && !bloqueado) onEnviar(texto); }}>
      <input
        ref={input} className={styles.input} value={texto} onChange={(ev) => setTexto(ev.target.value)} disabled={bloqueado}
        placeholder="Escribe el nombre…" aria-label="Tu respuesta" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        enterKeyHint="done"
      />
      <p className={styles.help}>{ayuda}</p>
      <button type="submit" className={styles.send} disabled={bloqueado || !texto.trim()}>
        Comprobar <ArrowRight size={20} weight="bold" aria-hidden="true" />
      </button>
    </form>
  );
}
