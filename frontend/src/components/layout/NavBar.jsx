import { Link, NavLink, useLocation } from 'react-router';
import { useAuth } from '../../context/auth/AuthContext.js';
import { loginPath } from '../../domain/navigation.js';
import { Button } from '../ui/Button.jsx';
import { Logo } from '../ui/Logo.jsx';
import styles from './NavBar.module.css';
import { SearchField } from './SearchField.jsx';
import { UserMenu } from './UserMenu.jsx';

const linkClass = ({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`;

/** The frosted-glass bar at the top of every page. */
export function NavBar() {
  const { user, ready } = useAuth();
  const location = useLocation();
  const onSearchPage = location.pathname === '/search';
  const onLoginPage = location.pathname === '/login';

  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand} aria-label="WatchNext home">
          <Logo size={30} />
          <span>WatchNext</span>
        </Link>

        <nav className={styles.links} aria-label="Main">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          {user && (
            <NavLink to="/watchlist" className={linkClass}>
              Watchlist
            </NavLink>
          )}
          {user && (
            <NavLink to="/ratings" className={linkClass}>
              Ratings
            </NavLink>
          )}
        </nav>

        <div className={styles.spacer} />

        {!onSearchPage && (
          <div className={styles.search}>
            <SearchField key={location.pathname} />
          </div>
        )}

        {ready && user && <UserMenu user={user} />}
        {ready && !user && !onLoginPage && (
          <Button variant="primary" size="sm" to={loginPath(location.pathname + location.search)}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
