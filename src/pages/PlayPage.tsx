import { Link } from 'react-router-dom';
import { BackLink } from './study/BackLink';
import { ArrowsClockwise, CaretRight, ImagesSquare, Keyboard, ListChecks, Timer } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { useResumen } from '../hooks/useResumen';
import { useStudy } from '../hooks/useStudy';
import { useProgressStore } from '../store/useProgressStore';
import { ContinueHero } from '../components/home/ContinueHero';
import { ChallengesCard } from '../components/progress/ChallengesCard';
import { SEGUNDOS_VELOZ } from '../logic/session';
import styles from './PlayPage.module.css';

interface Modo { modo: string; icono: Icon; nombre: string; texto: string; extra?: string; desactivado?: boolean }

export function PlayPage() {
  const r = useResumen();
  const { repaso } = useStudy();
  const velozMejor = useProgressStore((s) => s.estadisticas.velozMejor);
  const modos: Modo[] = [
    { modo: 'opcion-multiple', icono: ListChecks, nombre: 'Opción múltiple', texto: 'Foto real y 4 respuestas. Es la sesión de arriba.' },
    { modo: 'escribir', icono: Keyboard, nombre: 'Escribir el nombre', texto: 'Como en el examen: sin opciones. Da más XP.' },
    { modo: 'elegir-foto', icono: ImagesSquare, nombre: 'Elegir la foto', texto: 'Te damos el nombre y eliges entre 4 fotos.' },
    { modo: 'veloz', icono: Timer, nombre: 'Veloz', texto: `Todas las que puedas en ${SEGUNDOS_VELOZ} s. No cambia tu dominio.`, extra: velozMejor ? `Récord: ${velozMejor}` : undefined },
    {
      modo: 'repaso', icono: ArrowsClockwise, nombre: 'Repaso de errores', texto: 'Solo lo que fallaste, lo que te cuesta y lo que toca.',
      extra: repaso.length ? `${Math.min(10, repaso.length)} preguntas` : 'Nada pendiente', desactivado: !repaso.length,
    },
  ];
  return (
    <div className={styles.page}>
      <BackLink />
      <h1 className={`${styles.title} rise`}>Jugar</h1>
      <p className={styles.lead}>Práctica libre con lo que tienes desbloqueado en la ruta.</p>
      <ContinueHero plan={r.plan} primeraVez={r.coleccion.descubiertos === 0} />
      <section className="rise" style={{ animationDelay: '120ms' }} aria-labelledby="modos-t">
        <h2 id="modos-t" className={styles.h2}>Modos de juego</h2>
        <ul className={styles.modes}>
          {modos.map(({ modo, icono: Ico, nombre, texto, extra, desactivado }) => (
            <li key={modo}>
              <Link to={`/jugar/sesion?modo=${modo}`} className={`${styles.mode} ${desactivado ? styles.soon : ''}`} aria-disabled={desactivado}
                onClick={(ev) => { if (desactivado) ev.preventDefault(); }}>
                <span className={styles.icon}><Ico size={24} weight="duotone" aria-hidden="true" /></span>
                <div><strong>{nombre}</strong><p>{texto}</p></div>
                {extra && <span className={styles.badge}>{extra}</span>}
                <CaretRight size={18} weight="bold" className={styles.caret} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ChallengesCard />
    </div>
  );
}
