import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Toggle } from '../components/ui/Toggle.jsx';
import { useAuth } from '../context/auth/AuthContext.js';
import { useProfile } from '../context/profile/ProfileContext.js';
import { useServices } from '../context/services/ServicesContext.js';
import { useToast } from '../context/toast/ToastContext.js';
import { displayNameOf, initialOf } from '../domain/format.js';
import { loginPath } from '../domain/navigation.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import page from './Page.module.css';
import styles from './Settings.module.css';

/** Apple Settings-style page: profile, viewing preferences and account. */
export function SettingsPage() {
  useDocumentTitle('Settings');
  const { user, signOut, deleteAccount } = useAuth();
  const { profile, update } = useProfile();
  const { api } = useServices();
  const toast = useToast();
  const navigate = useNavigate();
  const [pendingMature, setPendingMature] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const name = displayNameOf(profile, user);
  const hideMature = pendingMature ?? profile?.hideMature ?? false;

  const changeMature = async (value) => {
    setPendingMature(value); // flip the switch at once; the server catches up
    try {
      await update({ hideMature: value });
      toast.show(value ? '18+ movies are now hidden' : '18+ movies are now shown');
    } catch (error) {
      toast.show(error.message, 'error');
    } finally {
      setPendingMature(null);
    }
  };

  const saveName = async (displayName) => {
    await update({ displayName });
    toast.show('Name saved');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteProfile(); // ratings and watchlist first, while the sign-in token still works
      await deleteAccount();
      toast.show('Your account was deleted');
      navigate('/');
    } catch (error) {
      setDeleting(false);
      setConfirming(false);
      toast.show(error.message, 'error');
      if (error.code === 'auth/requires-recent-login') {
        await signOut();
        navigate(loginPath('/settings'));
      }
    }
  };

  return (
    <div className={`container ${page.page} ${styles.wrap}`}>
      <h1 className={`${page.title} ${styles.heading}`}>Settings</h1>

      <section className={styles.profile}>
        <span className={styles.avatar}>
          {user.photoUrl ? <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" /> : initialOf(name)}
        </span>
        <div className={styles.profileText}>
          <p className={styles.profileName}>{name}</p>
          {user.email && <p className={styles.profileEmail}>{user.email}</p>}
        </div>
      </section>

      <Group title="Profile">
        <div className={styles.item}>
          <span className={styles.itemLabel}>Name</span>
          <NameForm key={profile?.displayName ?? ''} initial={profile?.displayName ?? user.name ?? ''} onSave={saveName} />
        </div>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Email</span>
          <span className={styles.itemValue}>{user.email ?? 'Not shared'}</span>
        </div>
      </Group>

      <Group
        title="Viewing"
        footnote="Hides movies rated R, NC-17 and TV-MA from your home page, movie pages, genres and search."
      >
        <div className={styles.item}>
          <span className={`${styles.itemIcon} ${styles.mature}`}>
            <Icon name="eyeOff" size={17} />
          </span>
          <span className={styles.itemLabel}>Hide 18+ movies</span>
          <Toggle checked={hideMature} onChange={changeMature} label="Hide 18+ movies" disabled={!profile} />
        </div>
      </Group>

      <Group title="Account">
        <button type="button" className={styles.item} onClick={handleSignOut}>
          <span className={`${styles.itemIcon} ${styles.neutral}`}>
            <Icon name="logout" size={17} />
          </span>
          <span className={styles.itemLabel}>Sign out</span>
        </button>
        <button type="button" className={`${styles.item} ${styles.danger}`} onClick={() => setConfirming(true)}>
          <span className={`${styles.itemIcon} ${styles.dangerIcon}`}>
            <Icon name="trash" size={17} />
          </span>
          <span className={styles.itemLabel}>Delete account</span>
        </button>
      </Group>

      <ConfirmDialog
        open={confirming}
        title="Delete your account?"
        message="This permanently deletes your ratings, watchlist and sign-in. It can't be undone."
        confirmLabel="Delete account"
        busyLabel="Deleting…"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

function Group({ title, footnote, children }) {
  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <div className={styles.list}>{children}</div>
      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </section>
  );
}

function NameForm({ initial, onSave }) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const trimmed = name.trim();
  const changed = trimmed !== initial.trim();

  const submit = async (event) => {
    event.preventDefault();
    if (trimmed.length === 0 || trimmed.length > 100) {
      setError('Use 1 to 100 characters.');
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  return (
    <form className={styles.nameForm} onSubmit={submit} noValidate>
      <input
        className={styles.nameInput}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError('');
        }}
        aria-label="Name"
        aria-invalid={Boolean(error)}
        maxLength={100}
        autoComplete="name"
      />
      {changed && (
        <Button type="submit" variant="accent" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      )}
      {error && <p className={styles.fieldError}>{error}</p>}
    </form>
  );
}
