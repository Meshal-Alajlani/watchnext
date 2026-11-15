import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { useProfile } from '../profile/ProfileContext.js';
import { useServices } from '../services/ServicesContext.js';
import { useToast } from '../toast/ToastContext.js';
import { LibraryContext } from './LibraryContext.js';

const NO_CHANGES = Object.freeze({});

// The item as the API sent it, with the user's newer choices on top.
function merge(item, change) {
  return {
    myRating: change && 'myRating' in change ? change.myRating : (item.myRating ?? null),
    inWatchlist: change && 'inWatchlist' in change ? change.inWatchlist : Boolean(item.inWatchlist),
  };
}

/**
 * Keeps the user's thumbs and watchlist choices in one place, so a movie shows the same state
 * in every row and page. Updates are optimistic: the screen changes at once, and goes back
 * with a message if the server refuses.
 */
export function LibraryProvider({ children }) {
  const { api } = useServices();
  const { user } = useAuth();
  const { refresh: refreshProfile } = useProfile();
  const toast = useToast();
  const userId = user?.id ?? null;
  const [store, setStore] = useState({ userId: null, changes: NO_CHANGES });
  const changes = store.userId === userId ? store.changes : NO_CHANGES;

  const record = useCallback(
    (id, change) =>
      setStore((prev) => {
        const base = prev.userId === userId ? prev.changes : NO_CHANGES;
        return { userId, changes: { ...base, [id]: { ...base[id], ...change } } };
      }),
    [userId],
  );

  const stateOf = useCallback((item) => merge(item, changes[item.id]), [changes]);

  const setRating = useCallback(
    async (item, rating, previous) => {
      record(item.id, { myRating: rating });
      try {
        if (rating === null) await api.clearRating(item.id);
        else await api.rate(item.id, rating === 'like');
        // Rated movies leave recommendation rows, so say what happened.
        if (rating === 'like') toast.show(`Liked "${item.title}"`);
        if (rating === 'dislike') toast.show(`"${item.title}" won't be suggested again`);
        refreshProfile();
      } catch (error) {
        record(item.id, { myRating: previous });
        toast.show(error.message, 'error');
      }
    },
    [api, record, refreshProfile, toast],
  );

  const setInWatchlist = useCallback(
    async (item, inWatchlist) => {
      record(item.id, { inWatchlist });
      try {
        if (inWatchlist) await api.addToWatchlist(item.id);
        else await api.removeFromWatchlist(item.id);
        toast.show(inWatchlist ? 'Added to your watchlist' : 'Removed from your watchlist');
        refreshProfile();
      } catch (error) {
        record(item.id, { inWatchlist: !inWatchlist });
        toast.show(error.message, 'error');
      }
    },
    [api, record, refreshProfile, toast],
  );

  const value = useMemo(() => ({ stateOf, setRating, setInWatchlist }), [stateOf, setRating, setInWatchlist]);

  return <LibraryContext value={value}>{children}</LibraryContext>;
}
