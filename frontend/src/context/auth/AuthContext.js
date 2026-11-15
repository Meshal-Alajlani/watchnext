import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/**
 * The signed-in user and the sign-in actions.
 * `ready` is false until the first answer from the sign-in service arrives.
 */
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>.');
  return auth;
}
