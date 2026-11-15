import { createContext, useContext } from 'react';

export const LibraryContext = createContext(null);

/**
 * The user's thumbs and watchlist choices, shared by every card and page:
 * `stateOf(item)`, `setRating(item, rating, previous)`, `setInWatchlist(item, inWatchlist)`.
 * Most components should use the useItemActions hook instead.
 */
export function useLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error('useLibrary must be used inside <LibraryProvider>.');
  return library;
}
