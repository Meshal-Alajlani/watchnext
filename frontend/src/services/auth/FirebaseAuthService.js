import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { AuthError } from './AuthService.js';

// Firebase error codes turned into messages people understand.
const MESSAGES = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/too-many-requests': 'Too many tries. Wait a minute, then try again.',
  'auth/network-request-failed': "You're offline. Check your connection and try again.",
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
  'auth/requires-recent-login': 'For your safety, sign in again before deleting your account.',
};

// Closing the Google window is a choice, not an error.
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

/**
 * AuthService backed by Firebase Authentication. The only file that imports Firebase.
 * @implements {import('./AuthService.js').AuthService}
 */
export class FirebaseAuthService {
  #auth;

  constructor(firebaseConfig) {
    // Reuse the app if it already exists (Vite's hot reload can run this file twice).
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    this.#auth = getAuth(app);
  }

  onUserChanged(listener) {
    // Unlike onAuthStateChanged, this also fires after the token is refreshed with a new display name.
    return onIdTokenChanged(this.#auth, (user) => listener(user ? toAuthUser(user) : null));
  }

  async getToken(forceRefresh = false) {
    const user = this.#auth.currentUser;
    return user ? user.getIdToken(forceRefresh) : null;
  }

  signIn(email, password) {
    return this.#run(() => signInWithEmailAndPassword(this.#auth, email, password));
  }

  signUp(name, email, password) {
    return this.#run(async () => {
      const { user } = await createUserWithEmailAndPassword(this.#auth, email, password);
      await updateProfile(user, { displayName: name });
      await user.getIdToken(true); // new token carries the name; listeners receive the updated user
    });
  }

  signInWithGoogle() {
    return this.#run(() => signInWithPopup(this.#auth, new GoogleAuthProvider()));
  }

  sendPasswordReset(email) {
    return this.#run(() => sendPasswordResetEmail(this.#auth, email));
  }

  signOut() {
    return this.#run(() => signOut(this.#auth));
  }

  deleteAccount() {
    return this.#run(() => deleteUser(this.#auth.currentUser));
  }

  async #run(action) {
    try {
      await action();
    } catch (error) {
      const code = error?.code ?? 'unknown';
      throw new AuthError(code, SILENT.has(code) ? '' : (MESSAGES[code] ?? 'Something went wrong. Try again.'));
    }
  }
}

function toAuthUser(user) {
  return { id: user.uid, name: user.displayName, email: user.email, photoUrl: user.photoURL };
}
