import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowCounterClockwise, CircleNotch } from '@phosphor-icons/react';
import { useGameSession, type OrigenSesion } from '../hooks/useGameSession';
import { ejemplar } from '../content';
import { CATEGORIA_POR_ID } from '../content/categories';
import { opcionDesdeEjemplar } from '../logic/optionText';
import { SEGUNDOS_VELOZ } from '../logic/session';
import type { ModoJuego, Opcion } from '../types/game';
import { SessionTopBar } from '../components/game/SessionTopBar';
import { QuestionPhoto } from '../components/game/QuestionPhoto';
import { OptionList } from '../components/game/OptionList';
import { PhotoChoice } from '../components/game/PhotoChoice';
import { WriteAnswer } from '../components/game/WriteAnswer';
import { VelozTimer } from '../components/game/VelozTimer';
import { FeedbackSheet } from '../components/game/FeedbackSheet';
import { SessionSummary } from '../components/game/SessionSummary';
import { SpecimenLabel } from '../components/specimen/SpecimenLabel';
import styles from './SessionPage.module.css';

const MODOS: ModoJuego[] = ['opcion-multiple', 'escribir', 'elegir-foto', 'veloz', 'repaso'];

function Partida({ origen, onOtra }: { origen: OrigenSesion; onOtra: () => void }) {
  const { st, pregunta, responder, siguiente, terminar, ocultarFotoActual, entrada } = useGameSession(origen);
  const modo = st.modo;

  // Atajos de teclado: 1–4 para responder (no en "escribir").
  useEffect(() => {
    if (st.fase !== 'pregunta' || !pregunta || pregunta.modo === 'escribir') return;
    const ids = pregunta.fotos ? pregunta.fotos.map((f) => f.id) : pregunta.opciones.map((o) => o.id);
    const onKey = (ev: KeyboardEvent) => {
      const k = Number(ev.key);
      if (k >= 1 && k <= ids.length) responder(ids[k - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st.fase, pregunta, responder]);

  // Veloz: sin panel de feedback, avanza solo (un poco más despacio si fallas, para ver la correcta).
  const ultima = st.respuestas.at(-1);
  useEffect(() => {
    if (st.modo !== 'veloz' || st.fase !== 'feedback') return;
    const t = setTimeout(siguiente, ultima?.ok ? 450 : 1300);
    return () => clearTimeout(t);
  }, [st.modo, st.fase, ultima, siguiente]);

  if (st.fase === 'cargando') {
    return <div className={styles.center}><CircleNotch size={32} className={styles.spin} aria-hidden="true" /><p>Preparando tu sesión…</p></div>;
  }
  if (st.fase === 'vacia') {
    return (
      <div className={styles.center}>
        <p>{modo === 'repaso' ? 'No tienes nada que repasar ahora mismo. ¡Buen trabajo!' : 'No hay ejemplares con fotos disponibles para esta sesión.'}</p>
        <Link to={origen.tipo === 'libre' ? '/jugar' : '/'} className={styles.back}>Volver</Link>
      </div>
    );
  }
  if (st.fase === 'fin') return <SessionSummary st={st} onOtra={onOtra} />;

  const e = ejemplar(pregunta.ejemplarId)!;
  const cat = CATEGORIA_POR_ID[e.categoria];
  const respuesta = st.fase === 'feedback' ? ultima : undefined;
  const esFoto = pregunta.modo === 'elegir-foto';
  const esEscribir = pregunta.modo === 'escribir';
  const bio = e.dominio === 'biologia' && e.categoria !== 'microscopia';

  let elegida: Opcion | undefined;
  if (respuesta && !respuesta.ok) {
    if (esEscribir) elegida = { id: '', texto: `«${respuesta.elegida}»`, cursiva: false };
    else if (esFoto) { const x = ejemplar(respuesta.elegida); elegida = x && opcionDesdeEjemplar(x); }
    else elegida = pregunta.opciones.find((o) => o.id === respuesta.elegida);
  }
  // La nutria solo aparece en momentos puntuales: al llegar a 5 o 10 seguidas, o al segundo fallo seguido.
  const [previa, antes] = [st.respuestas.at(-2), st.respuestas.at(-3)];
  const segundoFalloSeguido = !!respuesta && !respuesta.ok && !!previa && !previa.ok && (!antes || antes.ok);
  const nutria = !respuesta || st.modo === 'veloz' ? undefined
    : respuesta.ok && (st.combo === 5 || st.combo === 10) ? { pose: 'celebra' as const, texto: `¡${st.combo} seguidas! Ya no adivinas: reconoces.` }
      : segundoFalloSeguido ? { pose: 'animo' as const, texto: 'Dos seguidas: es normal mientras aprendes. Antes de responder, busca los rasgos clave de la ficha.' }
        : undefined;
  const nota = respuesta?.comun
    ? `Ese es el nombre común. Aquí se pide el científico: ${opcionDesdeEjemplar(e).texto}.`
    : respuesta?.casi ? `Aceptado con una errata. Se escribe: ${opcionDesdeEjemplar(e).texto}.` : undefined;

  return (
    <div className={`${styles.page} ${respuesta && st.modo !== 'veloz' ? styles.withSheet : ''}`}>
      <SessionTopBar hechas={st.respuestas.length} total={st.preguntas.length} combo={st.combo}
        aciertos={st.modo === 'veloz' ? st.respuestas.filter((r) => r.ok).length : undefined} />
      {st.finVeloz !== null && <VelozTimer fin={st.finVeloz} total={SEGUNDOS_VELOZ} onFin={terminar} />}

      {esFoto ? (
        <>
          <div className={styles.target}>
            <span className={styles.ask}>¿Cuál de estas fotos es…?</span>
            <SpecimenLabel nombre={e.nombre} kicker={`${cat.nombre} · ${e.album}`} size="lg" />
          </div>
          <PhotoChoice key={`fotos-${pregunta.clave}`} fotos={pregunta.fotos!} correcta={e.id} elegida={respuesta?.elegida ?? null} onElegir={responder} />
        </>
      ) : (
        <>
          <div className={styles.photo}>
            <QuestionPhoto imagen={pregunta.imagen} alt={respuesta ? `Foto de ${e.nombre.principal}` : `Ejemplar de ${cat.nombre} por identificar`}>
              <div className={styles.chips}>
                <span className={styles.cat} style={{ ['--cat' as string]: cat.color }}>{cat.nombre}</span>
                {pregunta.reintento && <span className={styles.retry}><ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" /> Otra oportunidad</span>}
              </div>
            </QuestionPhoto>
          </div>
          <h1 className={styles.prompt}>{esEscribir ? 'Escribe qué estás viendo' : '¿Qué estás viendo?'}</h1>
          {esEscribir ? (
            <WriteAnswer key={`escribir-${pregunta.clave}`} bloqueado={!!respuesta} onEnviar={responder}
              ayuda={bio ? 'Nombre científico o común. No importan tildes ni mayúsculas; se admite una pequeña errata.' : 'No importan tildes ni mayúsculas; se admite una pequeña errata.'} />
          ) : (
            <OptionList key={`opciones-${pregunta.clave}`} opciones={pregunta.opciones} correcta={pregunta.ejemplarId} elegida={respuesta?.elegida ?? null} onElegir={responder} />
          )}
        </>
      )}

      {respuesta && st.modo === 'veloz' && (
        <p className={`${styles.flash} ${respuesta.ok ? styles.flashOk : styles.flashBad}`} role="status">
          {respuesta.ok ? `¡Bien! +${st.xpUltima} XP` : `Era ${opcionDesdeEjemplar(e).texto}`}
        </p>
      )}

      {respuesta && st.modo !== 'veloz' && (
        <FeedbackSheet
          key={`feedback-${pregunta.clave}`}
          ok={respuesta.ok}
          ejemplar={e}
          elegida={elegida}
          etiquetaElegida={esEscribir ? 'Escribiste' : 'Marcaste'}
          entradaElegida={respuesta.ok || esEscribir ? undefined : entrada(respuesta.elegida)}
          nota={nota}
          credito={pregunta.imagen.credito}
          nutria={nutria}
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

/** Lee de la URL de dónde viene la sesión: ruta (lección, repaso, examen), Estudio libre (bloque), refuerzo o modo libre. */
function origenDesdeUrl(params: URLSearchParams): OrigenSesion {
  const pedido = params.get('modo') as ModoJuego | null;
  const modo = pedido && MODOS.includes(pedido) ? pedido : 'opcion-multiple';
  const leccion = params.get('leccion'), nodo = params.get('nodo'), examen = params.get('examen');
  const bloque = params.get('bloque'), refuerzo = params.get('refuerzo');
  if (leccion) return { tipo: 'leccion', id: leccion };
  if (nodo) return { tipo: 'repaso-ruta', id: nodo };
  if (examen) return { tipo: 'examen', mundo: examen };
  if (bloque) return { tipo: 'bloque', clave: bloque, modo: modo === 'veloz' || modo === 'repaso' ? 'opcion-multiple' : modo };
  if (refuerzo) return { tipo: 'refuerzo', ids: refuerzo.split(',').filter(Boolean) };
  return { tipo: 'libre', modo };
}

/** Pantalla de juego a pantalla completa (sin barra de navegación). */
export function SessionPage() {
  const [params] = useSearchParams();
  const origen = origenDesdeUrl(params);
  const [n, setN] = useState(0);
  return <div className={styles.shell}><Partida key={`${JSON.stringify(origen)}-${n}`} origen={origen} onOtra={() => setN((x) => x + 1)} /></div>;
}
