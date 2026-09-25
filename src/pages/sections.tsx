// Página para rutas que no existen.
import { Compass } from '@phosphor-icons/react';
import { ComingSoon } from './ComingSoon';

export const NotFoundPage = () => (
  <ComingSoon semilla="404" icono={Compass} titulo="Por aquí no hay nada"
    descripcion="Esta página no existe. Vuelve al inicio para seguir con tu colección." />
);
