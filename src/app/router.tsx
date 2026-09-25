import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { StudyPage, CollectionPage, CategoryPage, ProgressPage, NotFoundPage } from '../pages/sections';
import { PlayPage } from '../pages/PlayPage';
import { SessionPage } from '../pages/SessionPage';

export const router = createBrowserRouter([
  // Partida a pantalla completa, sin barra de navegación.
  { path: '/jugar/sesion', element: <SessionPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/estudiar', element: <StudyPage /> },
      { path: '/jugar', element: <PlayPage /> },
      { path: '/coleccion', element: <CollectionPage /> },
      { path: '/coleccion/:categoria', element: <CategoryPage /> },
      { path: '/progreso', element: <ProgressPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
