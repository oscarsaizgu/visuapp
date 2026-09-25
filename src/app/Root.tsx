import { Outlet } from 'react-router-dom';
import { CelebrationToast } from '../components/layout/CelebrationToast';

/** Raíz de todas las rutas: contenido + avisos de logros. */
export function Root() {
  return (
    <>
      <Outlet />
      <CelebrationToast />
    </>
  );
}
