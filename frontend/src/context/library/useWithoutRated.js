import { useLibrary } from './LibraryContext.js';

/**
 * Returns a filter that drops movies the user has rated (liked or "not for me").
 * Recommendation rows use it, so a movie leaves the row as soon as it's rated,
 * without waiting for the server to send new picks.
 */
export function useWithoutRated() {
  const { stateOf } = useLibrary();
  return (items = []) => items.filter((item) => stateOf(item).myRating === null);
}
