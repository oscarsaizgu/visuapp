import { Link } from 'react-router-dom';
import { MapTrifold, Play } from '@phosphor-icons/react';
import { ejemplaresPorIds, portada } from '../../content';
import { CATEGORIA_POR_ID } from '../../content/categories';
import { useProgressStore } from '../../store/useProgressStore';
import { SEGUNDOS_POR_IDENTIFICACION } from '../../logic/sessionPlan';
import type { Siguiente } from '../../logic/route';
import { SpecimenImage } from '../specimen/SpecimenImage';
import styles from './ContinueHero.module.css';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Número de lección dentro del submundo (los repasos no cuentan). */
function numeroLeccion(s: Extract<Siguiente, { tipo: 'nodo' }>) {
  return s.submundo.nodos.slice(0, s.indice + 1).filter((n) => n.tipo === 'leccion').length;
}

/** CTA principal de Inicio: el siguiente paso de la ruta de aprendizaje. */
export function RouteHero({ siguiente, repasos }: { siguiente: Siguiente; repasos: number }) {
  const lecciones = useProgressStore((s) => s.ruta.lecciones);
  let kicker = 'Ruta de aprendizaje', titulo = '¡Ruta completada!', sub = 'Has superado todos los mundos. Sigue repasando en Estudio libre.';
  let to = '/estudiar', cta = 'Estudio libre', ids: string[] = [], facts: string[] = [];

  if (siguiente.tipo === 'nodo') {
    const cat = CATEGORIA_POR_ID[siguiente.submundo.categoria];
    const n = siguiente.nodo.ejemplares.length;
    kicker = `Mundo ${siguiente.mundo.numero} · ${cat.nombre}`;
    ids = siguiente.nodo.ejemplares;
    if (siguiente.nodo.tipo === 'leccion') {
      const aprendida = !!lecciones[siguiente.nodo.id]?.aprendida;
      titulo = `Lección ${numeroLeccion(siguiente)}: ${siguiente.nodo.titulo}`;
      sub = aprendida ? 'Ya la has estudiado: ahora, a identificarlos.' : `Aprende ${plural(n, 'ejemplar', 'ejemplares')} y después identifícalos.`;
      to = `/leccion/${siguiente.nodo.id}`;
      cta = aprendida ? 'Identificar' : 'Empezar lección';
      facts = [plural(n, 'ejemplar', 'ejemplares'), `≈ ${Math.max(2, Math.ceil((n * 2 * SEGUNDOS_POR_IDENTIFICACION) / 60) + 1)} min`];
    } else {
      titulo = `${siguiente.nodo.titulo} de ${cat.nombre}`;
      sub = 'Comprueba lo aprendido. Si fallas, no pierdes nada: te diremos qué reforzar.';
      to = `/jugar/sesion?nodo=${siguiente.nodo.id}`;
      cta = 'Hacer el repaso';
      facts = [plural(Math.min(10, n), 'pregunta', 'preguntas')];
    }
  } else if (siguiente.tipo === 'examen') {
    kicker = `Mundo ${siguiente.mundo.numero}`;
    titulo = `Examen final del Mundo ${siguiente.mundo.numero}`;
    sub = 'Mezcla todas sus disciplinas. Apruébalo para abrir el siguiente mundo; puedes repetirlo cuando quieras.';
    to = `/ruta/${siguiente.mundo.id}`;
    cta = 'Ir al examen';
    ids = siguiente.mundo.submundos.map((s) => s.nodos[0].ejemplares[0]);
    facts = [plural(siguiente.mundo.examen.preguntas, 'pregunta', 'preguntas')];
  }
  if (repasos > 0) facts.push(`${plural(repasos, 'repaso pendiente', 'repasos pendientes')}`);
  const fotos = ejemplaresPorIds(ids).slice(0, 3);

  return (
    <section className={`${styles.hero} rise`} style={{ animationDelay: '60ms' }} aria-labelledby="hero-title">
      {fotos.length > 0 && (
        <div className={`${styles.mosaic} ${styles[`n${fotos.length}`]}`}>
          {fotos.map((e) => {
            const cat = CATEGORIA_POR_ID[e.categoria];
            const Ico = cat.icono;
            return (
              <figure key={e.id} className={styles.photo}>
                <SpecimenImage imagen={portada(e)} alt={`Ejemplar de ${cat.nombre}`} prioritaria />
                <figcaption className={styles.tag} style={{ ['--cat' as string]: cat.color }}>
                  <Ico size={14} weight="fill" aria-hidden="true" /> {cat.nombre}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <div className={styles.body}>
        <span className={styles.kicker}>{kicker}</span>
        <h2 id="hero-title" className={styles.title}>{titulo}</h2>
        <p className={styles.sub}>{sub}</p>
        {facts.length > 0 && <ul className={styles.facts}>{facts.map((f) => <li key={f}>{f}</li>)}</ul>}
        <Link to={to} className={styles.cta}><Play size={22} weight="fill" aria-hidden="true" />{cta}</Link>
        <Link to="/ruta" className={styles.secondary}><MapTrifold size={18} weight="bold" aria-hidden="true" /> Ver la ruta</Link>
      </div>
    </section>
  );
}
