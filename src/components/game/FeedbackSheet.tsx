import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Flag, Sparkle, XCircle } from '@phosphor-icons/react';
import type { Credito, Ejemplar } from '../../types/content';
import type { EntradaIndice, Opcion } from '../../types/game';
import { SpecimenLabel } from '../specimen/SpecimenLabel';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { clasificacion, comparacion } from '../../logic/feedback';
import { bonusCombo, XP } from '../../logic/xp';
import { NutriaDice } from '../nutria/NutriaDice';
import type { PoseNutria } from '../nutria/Nutria';
import styles from './FeedbackSheet.module.css';

interface Props {
  ok: boolean;
  ejemplar: Ejemplar;
  elegida?: Opcion;
  entradaElegida?: EntradaIndice;
  xp: number;
  combo: number;
  subioNivel: boolean;
  primerDescubrimiento: boolean;
  reintento: boolean;
  /** "Marcaste" o "Escribiste". */
  etiquetaElegida?: string;
  /** Aviso extra (p. ej. acierto con errata en "escribir"). */
  nota?: string;
  /** Crédito de la foto de la pregunta (fotos con licencia libre). */
  credito?: Credito;
  /** Mensaje puntual de la nutria (racha o fallos seguidos). */
  nutria?: { pose: PoseNutria; texto: string };
  onSiguiente: () => void;
  onOcultarFoto: () => void;
}

export function FeedbackSheet(p: Props) {
  const btn = useRef<HTMLButtonElement>(null);
  const [oculta, setOculta] = useState(false);
  useEffect(() => { btn.current?.focus({ preventScroll: true }); }, []);
  const e = p.ejemplar;
  const cat = CATEGORIA_POR_ID[e.categoria];

  return (
    <section className={`${styles.sheet} ${p.ok ? styles.okSheet : styles.badSheet}`} aria-live="assertive" aria-label={p.ok ? 'Respuesta correcta' : 'Respuesta incorrecta'}>
      <div className={styles.inner}>
        <div className={styles.head}>
          {p.ok ? <CheckCircle size={30} weight="fill" className={styles.iconOk} aria-hidden="true" /> : <XCircle size={30} weight="fill" className={styles.iconBad} aria-hidden="true" />}
          <h2 className={styles.title}>{p.ok ? '¡Correcto!' : 'No pasa nada'}</h2>
          {p.xp > 0 && <span className={styles.xp}>+{p.xp} XP</span>}
        </div>

        <div className={styles.chips}>
          {p.ok && p.combo >= 2 && <span className={styles.chipCombo}>Combo ×{p.combo} · +{bonusCombo(p.combo)} XP</span>}
          {p.primerDescubrimiento && <span className={styles.chipNew}><Sparkle size={13} weight="fill" aria-hidden="true" /> Nuevo en tu colección</span>}
          {p.subioNivel && <span className={styles.chipLevel}>Sube su dominio · +{XP.subirNivelDominio} XP</span>}
        </div>

        <div className={styles.answer}>
          {!p.ok && <span className={styles.label}>Era</span>}
          <SpecimenLabel nombre={e.nombre} kicker={`${cat.nombre} · ${e.album}`} />
        </div>

        {p.nota && <p className={styles.nota}>{p.nota}</p>}

        {p.nutria && <NutriaDice pose={p.nutria.pose} size={60}>{p.nutria.texto}</NutriaDice>}

        <dl className={styles.why}>
          {!p.ok && p.elegida && (
            <div>
              <dt>{p.etiquetaElegida ?? 'Marcaste'}</dt>
              <dd>
                <span className={p.elegida.cursiva ? 'sci' : undefined}>{p.elegida.texto}</span>
                {p.entradaElegida && <> — {comparacion(e, p.entradaElegida)}</>}
              </dd>
            </div>
          )}
          {e.rasgos && <div><dt>Rasgos clave</dt><dd>{e.rasgos}</dd></div>}
          <div><dt>Clasificación</dt><dd>{clasificacion(e)}</dd></div>
        </dl>

        {p.credito && (
          <p className={styles.credit}>
            Foto: {p.credito.autor} · {p.credito.url ? <a href={p.credito.url} target="_blank" rel="noreferrer">{p.credito.licencia}</a> : p.credito.licencia} · {p.credito.fuente}
          </p>
        )}

        {!p.ok && !p.reintento && <p className={styles.again}>Te lo volveré a preguntar al final de la sesión.</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.flag} disabled={oculta}
            title="Si la foto muestra el nombre o lo delata, no se volverá a usar para preguntar"
            aria-label={oculta ? 'Foto ocultada' : 'Esta foto da pistas: no volver a usarla para preguntar'}
            onClick={() => { p.onOcultarFoto(); setOculta(true); }}>
            <Flag size={15} weight={oculta ? 'fill' : 'bold'} aria-hidden="true" />
            {oculta ? 'Ocultada' : 'Da pistas'}
          </button>
          <button ref={btn} type="button" className={styles.next} onClick={p.onSiguiente}>
            Continuar <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
