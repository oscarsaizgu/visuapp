import { NavLink, Outlet } from 'react-router-dom';
import { House, BookOpenText, Play, SquaresFour, ChartLineUp } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import styles from './AppLayout.module.css';

const TABS: { to: string; label: string; icon: Icon; end?: boolean }[] = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/estudiar', label: 'Estudiar', icon: BookOpenText },
  { to: '/jugar', label: 'Jugar', icon: Play },
  { to: '/coleccion', label: 'Colección', icon: SquaresFour },
  { to: '/progreso', label: 'Progreso', icon: ChartLineUp },
];

/** Marco con navegación: barra inferior en móvil, raíl lateral en escritorio. */
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Principal">
        <div className={styles.brand} aria-hidden="true">
          <span className={styles.brandMark}>v</span>
          <span className={styles.brandText}>visu<em>game</em></span>
        </div>
        {TABS.map(({ to, label, icon: Ico, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>
            {({ isActive }) => (
              <>
                <span className={styles.tabIcon}><Ico size={24} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" /></span>
                <span className={styles.tabLabel}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
