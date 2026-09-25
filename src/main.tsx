import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { aplicarDemoSiProcede } from './store/demo';
import './styles/global.css';

// Solo en desarrollo: ?demo rellena progreso ficticio para revisar la interfaz.
if (import.meta.env.DEV) aplicarDemoSiProcede();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
