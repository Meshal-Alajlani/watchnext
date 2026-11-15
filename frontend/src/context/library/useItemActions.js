import { useLocation, useNavigate } from 'react-router';
import { loginPath } from '../../domain/navigation.js';
import { useAuth } from '../auth/AuthContext.js';
import { useLibrary } from './LibraryContext.js';

/**
 * Current thumbs and watchlist state for one movie, plus the actions to change it.
 * The returned object matches RateButtons' props, so it can be spread straight into it.
 * Signed-out visitors are sent to sign in first, then brought back to the same page.
 */
export function useItemActions(item) {
  const { stateOf, setRating, setInWatchlist } = useLibrary();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { myRating, inWatchlist } = stateOf(item);

  const whenSignedIn = (action) => () => {
    if (!user) {
      navigate(loginPath(location.pathname + location.search));
      return;
    }
    action();
  };

  return {
    myRating,
    inWatchlist,
    onLike: whenSignedIn(() => setRating(item, myRating === 'like' ? null : 'like', myRating)),
    onDislike: whenSignedIn(() => setRating(item, myRating === 'dislike' ? null : 'dislike', myRating)),
    onToggleWatchlist: whenSignedIn(() => setInWatchlist(item, !inWatchlist)),
  };
}
