import { useLibrary } from './LibraryContext.js';

/**
 * Returns a filter that keeps only movies new to the user: not rated (liked or "not for me")
 * and not in the watchlist. Recommendation rows use it, so a movie leaves the row as soon as
 * it's rated or saved, without waiting for the server to send new picks.
 */
export function useWithoutKnown() {
  const { stateOf } = useLibrary();
  return (items = []) =>
    items.filter((item) => {
      const state = stateOf(item);
      return state.myRating === null && !state.inWatchlist;
    });
}
