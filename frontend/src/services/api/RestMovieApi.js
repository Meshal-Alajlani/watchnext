/**
 * MovieApi backed by the WatchNext PHP REST API. It also unwraps the API's response
 * envelopes (`{results: [...]}`), so the rest of the app never depends on them.
 * @implements {import('./MovieApi.js').MovieApi}
 */
export class RestMovieApi {
  #http;

  /** @param {import('./HttpClient.js').HttpClient} http */
  constructor(http) {
    this.#http = http;
  }

  async search(query, { signal } = {}) {
    const data = await this.#http.get('search', { query: { q: query }, signal });
    return data.results;
  }

  async popular({ genre = null, limit = 20, offset = 0 } = {}, { signal } = {}) {
    const data = await this.#http.get('popular', { query: { genre, limit, offset }, signal });
    return { genres: data.genres, items: data.results };
  }

  movie(id, { signal } = {}) {
    return this.#http.get(`items/${encodeURIComponent(id)}`, { signal });
  }

  profile({ signal } = {}) {
    return this.#http.get('me', { signal });
  }

  updateProfile(changes) {
    return this.#http.patch('me', changes);
  }

  async deleteProfile() {
    await this.#http.delete('me');
  }

  homeFeed({ signal } = {}) {
    return this.#http.get('me/recommendations', { signal });
  }

  async ratings({ liked } = {}, { signal } = {}) {
    const query = liked === undefined ? {} : { liked: liked ? 1 : 0 };
    const data = await this.#http.get('me/ratings', { query, signal });
    return data.results;
  }

  async rate(id, liked) {
    await this.#http.put(`me/ratings/${encodeURIComponent(id)}`, { liked });
  }

  async clearRating(id) {
    await this.#http.delete(`me/ratings/${encodeURIComponent(id)}`);
  }

  async watchlist({ signal } = {}) {
    const data = await this.#http.get('me/watchlist', { signal });
    return data.results;
  }

  async addToWatchlist(id) {
    await this.#http.put(`me/watchlist/${encodeURIComponent(id)}`);
  }

  async removeFromWatchlist(id) {
    await this.#http.delete(`me/watchlist/${encodeURIComponent(id)}`);
  }
}
