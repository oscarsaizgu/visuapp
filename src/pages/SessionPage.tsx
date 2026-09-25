import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowCounterClockwise, CircleNotch } from '@phosphor-icons/react';
import { useGameSession } from '../hooks/useGameSession';
import { ejemplar } from '../content';
import { CATEGORIA_POR_ID } from '../content/categories';
import { SessionTopBar } from '../components/game/SessionTopBar';
import { QuestionPhoto } from '../components/game/QuestionPhoto';
import { OptionList } from '../components/game/OptionList';
import { FeedbackSheet } from '../components/game/FeedbackSheet';
import { SessionSummary } from '../components/game/SessionSummary';
import styles from './SessionPage.module.css';

function Partida({ onOtra }: { onOtra: () => void }) {
  const { st, pregunta, responder, siguiente, ocultarFotoActual, entrada } = useGameSession();

  // Atajos de teclado: 1–4 para responder.
  useEffect(() => {
    if (st.fase !== 'pregunta' || !pregunta) return;
    const onKey = (ev: KeyboardEvent) => {
      const k = Number(ev.key);
      if (k >= 1 && k <= pregunta.opciones.length) responder(pregunta.opciones[k - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st.fase, pregunta, responder]);

  if (st.fase === 'cargando') {
    return <div className={styles.center}><CircleNotch size={32} className={styles.spin} aria-hidden="true" /><p>Preparando tu sesión…</p></div>;
  }
  if (st.fase === 'vacia') {
    return (
      <div className={styles.center}>
        <p>No hay ejemplares con fotos disponibles para jugar.</p>
        <Link to="/" className={styles.back}>Volver al inicio</Link>
      </div>
    );
  }
  if (st.fase === 'fin') return <SessionSummary st={st} onOtra={onOtra} />;

  const e = ejemplar(pregunta.ejemplarId)!;
  const cat = CATEGORIA_POR_ID[e.categoria];
  const respuesta = st.fase === 'feedback' ? st.respuestas.at(-1) : undefined;
  const elegida = respuesta ? pregunta.opciones.find((o) => o.id === respuesta.elegida) : undefined;

  return (
    <div className={`${styles.page} ${respuesta ? styles.withSheet : ''}`}>
      <SessionTopBar hechas={st.respuestas.length} total={st.preguntas.length} combo={st.combo} />
      <div className={styles.photo}>
        <QuestionPhoto imagen={pregunta.imagen} alt={respuesta ? `Foto de ${e.nombre.principal}` : `Ejemplar de ${cat.nombre} por identificar`}>
          <div className={styles.chips}>
            <span className={styles.cat} style={{ ['--cat' as string]: cat.color }}>{cat.nombre}</span>
            {pregunta.reintento && <span className={styles.retry}><ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" /> Otra oportunidad</span>}
          </div>
        </QuestionPhoto>
      </div>
      <h1 className={styles.prompt}>¿Qué estás viendo?</h1>
      <OptionList key={`opciones-${pregunta.clave}`} opciones={pregunta.opciones} correcta={pregunta.ejemplarId} elegida={respuesta?.elegida ?? null} onElegir={responder} />

      {respuesta && (
        <FeedbackSheet
          key={`feedback-${pregunta.clave}`}
          ok={respuesta.ok}
          ejemplar={e}
          elegida={elegida}
          entradaElegida={respuesta.ok ? undefined : entrada(respuesta.elegida)}
          xp={st.xpUltima}
          combo={st.combo}
          subioNivel={st.subioNivelUltima}
          primerDescubrimiento={st.descubiertos.at(-1) === e.id && !pregunta.reintento}
          reintento={pregunta.reintento}
          onSiguiente={siguiente}
          onOcultarFoto={ocultarFotoActual}
        />
      )}
    </div>
  );
}

/** Pantalla de juego a pantalla completa (sin barra de navegación). */
export function SessionPage() {
  const [n, setN] = useState(0);
  return <div className={styles.shell}><Partida key={n} onOtra={() => setN((x) => x + 1)} /></div>;
}
