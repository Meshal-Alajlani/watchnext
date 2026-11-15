import { NavLink } from 'react-router';
import { useAuth } from '../../context/auth/AuthContext.js';
import { Icon } from '../ui/Icon.jsx';
import styles from './TabBar.module.css';

/** The iOS-style tab bar at the bottom of the screen on phones. */
export function TabBar() {
  const { user } = useAuth();
  const tabs = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/search', label: 'Search', icon: 'search' },
    { to: '/watchlist', label: 'Watchlist', icon: 'bookmark' },
    user ? { to: '/settings', label: 'Profile', icon: 'user' } : { to: '/login', label: 'Sign in', icon: 'user' },
  ];

  return (
    <nav className={styles.bar} aria-label="Tabs">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <Icon name={tab.icon} size={22} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
