import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { StudyPage, PlayPage, CollectionPage, CategoryPage, ProgressPage, NotFoundPage } from '../pages/sections';

export const router = createBrowserRouter([
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
