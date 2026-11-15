import { config } from '../config.js';
import { firebaseConfig } from '../firebaseConfig.js';
import { HttpClient } from './api/HttpClient.js';
import { RestMovieApi } from './api/RestMovieApi.js';
import { FirebaseAuthService } from './auth/FirebaseAuthService.js';

/**
 * Composition root: the one place that chooses the concrete classes and connects them.
 * The rest of the app receives these through React context (dependency injection),
 * so swapping an implementation, like another sign-in provider or a fake API for tests,
 * only changes this file.
 */
export function createServices() {
  const auth = new FirebaseAuthService(firebaseConfig);
  const http = new HttpClient(config.apiUrl, (forceRefresh) => auth.getToken(forceRefresh));
  return Object.freeze({ auth, api: new RestMovieApi(http) });
}
