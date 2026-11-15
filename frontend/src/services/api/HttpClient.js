/** An API failure. `status` is the HTTP status code (0 means the server could not be reached). */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * The only place in the app that calls fetch. It adds the base URL, the sign-in token and
 * JSON handling, and turns every failure into an ApiError with a readable message.
 */
export class HttpClient {
  #baseUrl;
  #getToken;

  /**
   * @param {string} baseUrl
   * @param {(forceRefresh?: boolean) => Promise<string|null>} getToken  Supplies the sign-in token (or null).
   */
  constructor(baseUrl, getToken) {
    this.#baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.#getToken = getToken;
  }

  get(path, options) {
    return this.request('GET', path, options);
  }

  put(path, body, options) {
    return this.request('PUT', path, { ...options, body });
  }

  patch(path, body, options) {
    return this.request('PATCH', path, { ...options, body });
  }

  delete(path, options) {
    return this.request('DELETE', path, options);
  }

  async request(method, path, { query, body, signal } = {}) {
    const url = this.#url(path, query);
    let { response, sentToken } = await this.#send(method, url, body, signal, false);
    if (response.status === 401 && sentToken) {
      // The token may have expired a moment ago: get a fresh one and try once more.
      ({ response } = await this.#send(method, url, body, signal, true));
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(response.status, data?.error ?? `Request failed (${response.status}).`);
    }
    return data;
  }

  async #send(method, url, body, signal, forceRefresh) {
    const headers = { Accept: 'application/json' };
    const token = await this.#getToken(forceRefresh);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    try {
      const response = await fetch(url, {
        method,
        headers,
        signal,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { response, sentToken: Boolean(token) };
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new ApiError(0, "Can't reach WatchNext right now. Check your connection and try again.");
    }
  }

  #url(path, query = {}) {
    const url = new URL(path.replace(/^\/+/, ''), this.#baseUrl);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    return url;
  }
}
