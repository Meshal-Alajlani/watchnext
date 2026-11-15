/**
 * The movie data contract the app depends on. RestMovieApi implements it against the
 * WatchNext PHP API; a fake with the same methods can stand in for tests or offline work.
 * The same shapes are used for movies and (later) TV shows.
 *
 * @typedef {object} MovieSummary  The short form used by cards and rows.
 * @property {string} id             IMDb id, for example "tt0468569".
 * @property {'movie'|'tv'} kind
 * @property {string} title
 * @property {number|null} year
 * @property {string|null} poster    Image URL.
 * @property {string|null} ageRating For example "PG-13".
 * @property {boolean} mature        True for R, NC-17, X and TV-MA.
 * @property {'like'|'dislike'|null} myRating
 * @property {boolean} inWatchlist
 * @property {{id: string, title: string}|null} [because]  The liked movie that led to this pick.
 *
 * @typedef {MovieSummary & {
 *   genres: string[], plot: string|null, runtime: string|null, released: string|null,
 *   directors: string[], writers: string[], actors: string[], language: string|null,
 *   country: string|null, awards: string|null, imdbRating: number|null, series: string[],
 *   imdbUrl: string|null, parentsGuideUrl: string|null
 * }} MovieDetails
 *
 * @typedef {object} MoviePage
 * @property {MovieDetails} item
 * @property {{earlier: MovieSummary[], next: MovieSummary[], sameDirector: MovieSummary[], moreLikeThis: MovieSummary[]}} related
 *
 * @typedef {object} Profile
 * @property {string|null} displayName
 * @property {boolean} hideMature
 * @property {number} likes
 * @property {number} dislikes
 * @property {number} watchlist
 *
 * @typedef {object} FeedRow
 * @property {string} key
 * @property {string} title
 * @property {'model'|'rule'|'popularity'} source
 * @property {MovieSummary[]} items
 *
 * @typedef {{signal?: AbortSignal}} RequestOptions
 *
 * @typedef {object} MovieApi
 * @property {(query: string, options?: RequestOptions) => Promise<MovieSummary[]>} search
 * @property {(filter?: {genre?: string|null, limit?: number, offset?: number}, options?: RequestOptions) => Promise<{genres: string[], items: MovieSummary[]}>} popular
 * @property {(id: string, options?: RequestOptions) => Promise<MoviePage>} movie
 * @property {(options?: RequestOptions) => Promise<Profile>} profile
 * @property {(changes: {displayName?: string, hideMature?: boolean}) => Promise<Profile>} updateProfile
 * @property {() => Promise<void>} deleteProfile
 * @property {(options?: RequestOptions) => Promise<{likes: number, rows: FeedRow[]}>} homeFeed
 * @property {(filter?: {liked?: boolean}, options?: RequestOptions) => Promise<MovieSummary[]>} ratings
 * @property {(id: string, liked: boolean) => Promise<void>} rate
 * @property {(id: string) => Promise<void>} clearRating
 * @property {(options?: RequestOptions) => Promise<MovieSummary[]>} watchlist
 * @property {(id: string) => Promise<void>} addToWatchlist
 * @property {(id: string) => Promise<void>} removeFromWatchlist
 */
export {};
