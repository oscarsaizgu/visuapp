import { Keyboard, ImagesSquare, Timer, ListChecks } from '@phosphor-icons/react';
import { useResumen } from '../hooks/useResumen';
import { ContinueHero } from '../components/home/ContinueHero';
import styles from './PlayPage.module.css';

const MODOS = [
  { icono: ListChecks, nombre: 'Opción múltiple', texto: 'Foto real y 4 respuestas. Es el modo de tu sesión.', listo: true },
  { icono: Keyboard, nombre: 'Escribir el nombre', texto: 'Como en el examen: sin opciones.', listo: false },
  { icono: ImagesSquare, nombre: 'Elegir la foto', texto: 'Te damos el nombre y eliges entre varias fotos.', listo: false },
  { icono: Timer, nombre: 'Veloz', texto: 'Identificaciones rápidas contra el reloj.', listo: false },
];

export function PlayPage() {
  const r = useResumen();
  return (
    <div className={styles.page}>
      <h1 className={`${styles.title} rise`}>Jugar</h1>
      <ContinueHero plan={r.plan} primeraVez={r.coleccion.descubiertos === 0} />
      <section className="rise" style={{ animationDelay: '120ms' }} aria-labelledby="modos-t">
        <h2 id="modos-t" className={styles.h2}>Modos de juego</h2>
        <ul className={styles.modes}>
          {MODOS.map(({ icono: Ico, nombre, texto, listo }) => (
            <li key={nombre} className={`${styles.mode} ${listo ? '' : styles.soon}`}>
              <span className={styles.icon}><Ico size={24} weight="duotone" aria-hidden="true" /></span>
              <div><strong>{nombre}</strong><p>{texto}</p></div>
              <span className={styles.badge}>{listo ? 'Disponible' : 'Próximamente'}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
