import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/auth/AuthContext.js';
import { useProfile } from '../../context/profile/ProfileContext.js';
import { displayNameOf, initialOf } from '../../domain/format.js';
import { Icon } from '../ui/Icon.jsx';
import styles from './UserMenu.module.css';

/** The round profile button and its drop-down menu. */
export function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const name = displayNameOf(profile, user);

  // Close when clicking outside the menu or pressing Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
    navigate('/');
  };

  return (
    <div className={styles.wrapper} ref={wrapper}>
      <button
        type="button"
        className={styles.avatar}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {user.photoUrl ? <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" /> : initialOf(name)}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.header}>
            <span className={styles.name}>{name}</span>
            {user.email && <span className={styles.email}>{user.email}</span>}
          </div>
          <Link role="menuitem" to="/ratings" className={styles.item} onClick={close}>
            <Icon name="thumbUp" size={17} /> Your ratings
          </Link>
          <Link role="menuitem" to="/watchlist" className={styles.item} onClick={close}>
            <Icon name="bookmark" size={17} /> Watchlist
          </Link>
          <Link role="menuitem" to="/settings" className={styles.item} onClick={close}>
            <Icon name="settings" size={17} /> Settings
          </Link>
          <button type="button" role="menuitem" className={styles.item} onClick={handleSignOut}>
            <Icon name="logout" size={17} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
