import { createBrowserRouter } from 'react-router-dom';
import { Root } from './Root';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { StudyHubPage } from '../pages/study/StudyHubPage';
import { ChoosePage } from '../pages/study/ChoosePage';
import { ReviewPage } from '../pages/study/ReviewPage';
import { DiscoverPage } from '../pages/study/DiscoverPage';
import { SpecimenPage } from '../pages/SpecimenPage';
import { PlayPage } from '../pages/PlayPage';
import { SessionPage } from '../pages/SessionPage';
import { CollectionPage } from '../pages/collection/CollectionPage';
import { CategoryCollectionPage } from '../pages/collection/CategoryCollectionPage';
import { ProgressPage } from '../pages/ProgressPage';
import { NotFoundPage } from '../pages/sections';

export const router = createBrowserRouter([
  {
    // Raíz común: avisos de insignias y retos en cualquier pantalla.
    element: <Root />,
    children: [
      // Partida a pantalla completa, sin barra de navegación.
      { path: '/jugar/sesion', element: <SessionPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/estudiar', element: <StudyHubPage /> },
          { path: '/estudiar/elegir', element: <ChoosePage /> },
          { path: '/estudiar/repasar', element: <ReviewPage /> },
          { path: '/estudiar/descubrir', element: <DiscoverPage /> },
          { path: '/ejemplar/:id', element: <SpecimenPage /> },
          { path: '/jugar', element: <PlayPage /> },
          { path: '/coleccion', element: <CollectionPage /> },
          { path: '/coleccion/:categoria', element: <CategoryCollectionPage /> },
          { path: '/progreso', element: <ProgressPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
