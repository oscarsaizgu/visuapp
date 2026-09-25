import { useState } from 'react';
import { Eye, Sparkle } from '@phosphor-icons/react';
import type { Ejemplar } from '../../types/content';
import type { MotivoDelDia } from '../../logic/dailyPick';
import { NOMBRE_NIVEL, type NivelDominio } from '../../logic/mastery';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { fotoAlternativa } from '../../content';
import { claveDia } from '../../logic/daily';
import { SpecimenImage } from '../specimen/SpecimenImage';
import { SpecimenLabel } from '../specimen/SpecimenLabel';
import styles from './SpecimenOfDay.module.css';

const MOTIVO: Record<MotivoDelDia, string> = {
  repaso: 'Toca repasarlo hoy',
  dificil: 'Te está costando',
  nuevo: 'Aún no lo has estudiado',
  mantener: 'Repásalo para no olvidarlo',
};

interface Props {
  ejemplar: Ejemplar;
  motivo: MotivoDelDia;
  nivel: NivelDominio;
  enSesion: boolean;
}

/** Datos del catálogo que ayudan a identificarlo; solo se muestran los que existen. */
function detalles(e: Ejemplar): { etiqueta: string; valor: string }[] {
  const out: { etiqueta: string; valor: string }[] = [];
  if (e.taxonomia?.orden) out.push({ etiqueta: 'Orden', valor: e.taxonomia.orden });
  if (e.taxonomia?.familia) out.push({ etiqueta: 'Familia', valor: e.taxonomia.familia });
  if (e.rasgos) out.push({ etiqueta: 'Rasgos clave', valor: e.rasgos });
  if (e.notas) out.push({ etiqueta: 'Notas', valor: e.notas });
  if (e.nombre.variantes?.length) out.push({ etiqueta: 'También', valor: e.nombre.variantes.join(' · ') });
  return out;
}

/**
 * Un ejemplar que ya ha salido en examen, elegido según lo que te conviene estudiar
 * (ver elegirEjemplarDelDia). Primero se intenta reconocer; después se revela.
 */
export function SpecimenOfDay({ ejemplar: e, motivo, nivel, enSesion }: Props) {
  const [visible, setVisible] = useState(false);
  const cat = CATEGORIA_POR_ID[e.categoria];
  return (
    <section className={`${styles.card} rise`} style={{ animationDelay: '200ms' }} aria-labelledby="sod-title">
      <div className={styles.photo}>
        <SpecimenImage imagen={fotoAlternativa(e, claveDia())} alt={visible ? e.nombre.principal : `Ejemplar de ${cat.nombre} por identificar`} />
        <span className={styles.motivo}>{MOTIVO[motivo]}</span>
      </div>
      <div className={styles.body}>
        <h2 id="sod-title" className={styles.kicker}><Sparkle size={14} weight="fill" aria-hidden="true" /> Ejemplar del día</h2>

        <div aria-live="polite">
          {visible ? (
            <div className={styles.revealed}>
              <SpecimenLabel nombre={e.nombre} kicker={`${cat.nombre} · ${e.album}`} />
              {detalles(e).length > 0 && (
                <dl className={styles.dl}>
                  {detalles(e).map((d) => (
                    <div key={d.etiqueta}><dt>{d.etiqueta}</dt><dd>{d.valor}</dd></div>
                  ))}
                </dl>
              )}
            </div>
          ) : (
            <div className={styles.question}>
              <p className={styles.ask}>¿Lo reconoces?</p>
              <p className={styles.hint}>Pista: es de {cat.nombre}.</p>
            </div>
          )}
        </div>

        <div className={styles.exams}>
          <span className={styles.examsLabel}>Ha salido en examen</span>
          <ul>
            {e.visu.anios.map((a) => <li key={a}>VISU {a}</li>)}
            {e.visu.otros.map((o) => <li key={o} className={styles.otro}>{o.replace(/^Visu\b/i, 'VISU')}</li>)}
          </ul>
        </div>

        <div className={styles.foot}>
          <span className={styles.nivel}><i style={{ background: `var(--m-${nivel})` }} />Tu dominio: {NOMBRE_NIVEL[nivel]}</span>
          {enSesion && <span className={styles.enSesion}>En tu sesión de hoy</span>}
        </div>

        {!visible && (
          <button type="button" className={styles.btn} onClick={() => setVisible(true)}>
            <Eye size={18} weight="bold" aria-hidden="true" /> Revelar
          </button>
        )}
      </div>
    </section>
  );
}
