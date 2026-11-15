/**
 * The sign-in contract the rest of the app depends on ("program to an interface").
 * Pages and contexts only call these methods and never import Firebase, so Firebase
 * can be replaced by writing another class with the same methods.
 *
 * @typedef {object} AuthUser
 * @property {string} id
 * @property {string|null} name
 * @property {string|null} email
 * @property {string|null} photoUrl
 *
 * @typedef {object} AuthService
 * @property {(listener: (user: AuthUser|null) => void) => () => void} onUserChanged
 *   Called on sign-in, sign-out and profile changes. Returns a function that stops listening.
 * @property {(forceRefresh?: boolean) => Promise<string|null>} getToken
 *   A short-lived ID token for the API, or null when signed out.
 * @property {(email: string, password: string) => Promise<void>} signIn
 * @property {(name: string, email: string, password: string) => Promise<void>} signUp
 * @property {() => Promise<void>} signInWithGoogle
 * @property {(email: string) => Promise<void>} sendPasswordReset
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<void>} deleteAccount
 */

/** A sign-in failure whose message is safe to show to people. An empty message means "stay silent". */
export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
