import { Outlet } from 'react-router-dom';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.appShell}>
      <main className={styles.appMain}>
        <Outlet />
      </main>
    </div>
  );
}
