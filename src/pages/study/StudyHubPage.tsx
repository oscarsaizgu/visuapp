import { Link } from 'react-router-dom';
import { CaretRight, Compass, ArrowsClockwise, SquaresFour } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { Ejemplar } from '../../types/content';
import { portada } from '../../content';
import { useStudy } from '../../hooks/useStudy';
import { SpecimenImage } from '../../components/specimen/SpecimenImage';
import styles from './Study.module.css';

function Modo({ to, icono: Ico, titulo, texto, fotos, vacio }: {
  to: string; icono: Icon; titulo: string; texto: string; fotos: Ejemplar[]; vacio?: boolean;
}) {
  return (
    <Link to={to} className={`${styles.mode} ${vacio ? styles.modeEmpty : ''}`}>
      {fotos.length > 0 && (
        <div className={styles.modeFotos} aria-hidden="true">
          {fotos.slice(0, 3).map((e) => <div key={e.id}><SpecimenImage imagen={portada(e)} alt="" /></div>)}
        </div>
      )}
      <div className={styles.modeBody}>
        <span className={styles.modeIcon}><Ico size={22} weight="bold" aria-hidden="true" /></span>
        <div>
          <h2 className={styles.modeTitle}>{titulo}</h2>
          <p className={styles.modeText}>{texto}</p>
        </div>
        <CaretRight size={20} weight="bold" className={styles.modeCaret} aria-hidden="true" />
      </div>
    </Link>
  );
}

export function StudyHubPage() {
  const { todos, repaso, nuevos } = useStudy();
  return (
    <div className={styles.page}>
      <header className="rise">
        <h1 className={styles.title}>Estudiar</h1>
        <p className={styles.lead}>Consulta las fichas con calma. El dominio sube jugando; aquí preparas el terreno.</p>
      </header>
      <div className={`${styles.modes} rise`} style={{ animationDelay: '80ms' }}>
        <Modo to="/estudiar/repasar" icono={ArrowsClockwise} titulo="Repasar"
          texto={repaso.length ? `${repaso.length} ${repaso.length === 1 ? 'ejemplar te conviene' : 'ejemplares te conviene'} repasar` : 'Nada pendiente ahora mismo'}
          fotos={repaso.map((r) => r.ejemplar)} vacio={!repaso.length} />
        <Modo to="/estudiar/descubrir" icono={Compass} titulo="Descubrir"
          texto={nuevos.length ? `${nuevos.length} ${nuevos.length === 1 ? 'ejemplar' : 'ejemplares'} sin descubrir` : 'Has descubierto todo lo activo'}
          fotos={nuevos} vacio={!nuevos.length} />
        <Modo to="/estudiar/elegir" icono={SquaresFour} titulo="Elegir"
          texto={`Explora los ${todos.length} ejemplares por categoría`} fotos={todos.slice(5)} />
      </div>
    </div>
  );
}
