import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { aplicarDemoSiProcede } from './store/demo';
import { useProgressStore } from './store/useProgressStore';
import './styles/global.css';

// Solo en desarrollo: ?demo rellena progreso ficticio para revisar la interfaz.
if (import.meta.env.DEV) aplicarDemoSiProcede();
// Insignias y retos que ya correspondan al progreso guardado (p. ej. tras actualizar la app).
useProgressStore.getState().revisarLogros(true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
