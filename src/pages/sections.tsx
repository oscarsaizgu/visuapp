// Secciones pendientes de construir. Cada una se sustituirá por su página real en su fase.
import { useParams } from 'react-router-dom';
import { BookOpenText, Play, SquaresFour, ChartLineUp, Compass } from '@phosphor-icons/react';
import { CATEGORIA_POR_ID } from '../content/categories';
import type { CategoriaId } from '../types/content';
import { ComingSoon } from './ComingSoon';

export const StudyPage = () => (
  <ComingSoon semilla="estudiar" fase={2} icono={BookOpenText} titulo="Estudiar"
    descripcion="Elegir, repasar y descubrir ejemplares con fichas visuales: foto grande, nombre, rasgos de identificación y posibles confusiones." />
);

export const PlayPage = () => (
  <ComingSoon semilla="jugar" fase={3} icono={Play} titulo="¿Qué estás viendo?"
    descripcion="Aparece una foto real y tienes que identificarla. Opción múltiple, escribir el nombre, elegir entre imágenes y modo veloz." />
);

export const CollectionPage = () => (
  <ComingSoon semilla="coleccion" fase={4} icono={SquaresFour} titulo="Mi colección"
    descripcion="Todo lo que vas descubriendo, por categorías y álbumes. Lo que aún no conoces aparece oculto hasta que lo desbloqueas." />
);

export const CategoryPage = () => {
  const { categoria } = useParams();
  const c = CATEGORIA_POR_ID[categoria as CategoriaId];
  return (
    <ComingSoon semilla={categoria ?? 'cat'} fase={4} icono={c?.icono ?? SquaresFour} titulo={c?.nombre ?? 'Categoría'}
      descripcion="Aquí verás los ejemplares de esta categoría, tu nivel de dominio en cada uno y los que te quedan por descubrir." />
  );
};

export const ProgressPage = () => (
  <ComingSoon semilla="progreso" fase={5} icono={ChartLineUp} titulo="Progreso"
    descripcion="Estadísticas, rachas, insignias y la lista de ejemplares que necesitas repasar." />
);

export const NotFoundPage = () => (
  <ComingSoon semilla="404" fase={0} icono={Compass} titulo="Por aquí no hay nada"
    descripcion="Esta página no existe. Vuelve al inicio para seguir con tu colección." />
);
