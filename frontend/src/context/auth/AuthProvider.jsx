import { useEffect, useMemo, useState } from 'react';
import { useServices } from '../services/ServicesContext.js';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
  const { auth } = useServices();
  const [state, setState] = useState({ user: null, ready: false });

  useEffect(() => auth.onUserChanged((user) => setState({ user, ready: true })), [auth]);

  const value = useMemo(
    () => ({
      user: state.user,
      ready: state.ready,
      signIn: (email, password) => auth.signIn(email, password),
      signUp: (name, email, password) => auth.signUp(name, email, password),
      signInWithGoogle: () => auth.signInWithGoogle(),
      sendPasswordReset: (email) => auth.sendPasswordReset(email),
      signOut: () => auth.signOut(),
      deleteAccount: () => auth.deleteAccount(),
    }),
    [auth, state],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
