import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { Logo } from '../components/ui/Logo.jsx';
import { SegmentedControl } from '../components/ui/SegmentedControl.jsx';
import { useAuth } from '../context/auth/AuthContext.js';
import { useProfile } from '../context/profile/ProfileContext.js';
import { useServices } from '../context/services/ServicesContext.js';
import { useToast } from '../context/toast/ToastContext.js';
import { safeNextPath } from '../domain/navigation.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import styles from './Login.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6; // Firebase's minimum
const MODES = [
  { value: 'signin', label: 'Sign in' },
  { value: 'signup', label: 'Create account' },
];

function validate(mode, form) {
  const errors = {};
  const name = form.name.trim();
  if (mode === 'signup' && name.length === 0) errors.name = 'Enter your name.';
  if (mode === 'signup' && name.length > 100) errors.name = 'Use 100 characters or fewer.';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (mode === 'signup' && form.password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (mode === 'signin' && form.password.length === 0) errors.password = 'Enter your password.';
  return errors;
}

export function LoginPage() {
  const [params] = useSearchParams();
  const { user, ready, signIn, signUp, signInWithGoogle, sendPasswordReset } = useAuth();
  const { api } = useServices();
  const { refresh } = useProfile();
  const toast = useToast();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle(mode === 'signup' ? 'Create account' : 'Sign in');

  // Once signed in, leave: new accounts go to "pick movies you like", others back to where they were.
  if (ready && user) {
    return <Navigate to={mode === 'signup' ? '/start' : safeNextPath(params.get('next'))} replace />;
  }

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const switchMode = (value) => {
    setMode(value);
    setErrors({});
    setFormError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(mode, form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFormError('');
    try {
      if (mode === 'signup') {
        const name = form.name.trim();
        await signUp(name, form.email.trim(), form.password);
        // Save the name in WatchNext too. If this fails, the name still lives on the sign-in account.
        await api.updateProfile({ displayName: name }).catch(() => {});
        refresh();
      } else {
        await signIn(form.email.trim(), form.password);
      }
    } catch (error) {
      setFormError(error.message);
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setFormError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(error.message); // empty when the person closed the window
    }
  };

  const forgotPassword = async () => {
    const email = form.email.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setErrors((current) => ({ ...current, email: 'Enter your email first, then tap "Forgot password".' }));
      return;
    }
    try {
      await sendPasswordReset(email);
      toast.show('Check your email for a reset link');
    } catch (error) {
      setFormError(error.message);
    }
  };

  const signup = mode === 'signup';

  return (
    <div className={styles.wrap}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.card}>
        <Logo size={56} className={styles.logo} />
        <h1 className={styles.heading}>{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className={styles.sub}>
          {signup ? 'Rate movies you love and get picks made for you.' : 'Sign in to see your picks.'}
        </p>

        <div className={styles.segment}>
          <SegmentedControl label="Sign in or create an account" options={MODES} value={mode} onChange={switchMode} />
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          {signup && (
            <Field id="name" label="Name" autoComplete="name" value={form.name} onChange={setField('name')} error={errors.name} />
          )}
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={setField('email')}
            error={errors.email}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={setField('password')}
            error={errors.password}
          />
          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" className={styles.submit} disabled={busy}>
            {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        {!signup && (
          <button type="button" className={styles.forgot} onClick={forgotPassword}>
            Forgot password?
          </button>
        )}

        <div className={styles.divider}>or</div>

        <button type="button" className={styles.google} onClick={continueWithGoogle}>
          <GoogleLogo /> Continue with Google
        </button>
      </div>
    </div>
  );
}

function Field({ id, label, error, type = 'text', ...input }) {
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...input}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

// Google's "G" mark, in its official colors (required by Google's sign-in branding rules).
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
