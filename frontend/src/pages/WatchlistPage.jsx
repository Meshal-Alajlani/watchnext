import { MovieGrid } from '../components/movie/MovieGrid.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorMessage, StateMessage } from '../components/ui/StateMessage.jsx';
import { useAuth } from '../context/auth/AuthContext.js';
import { useLibrary } from '../context/library/LibraryContext.js';
import { countLabel } from '../domain/format.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import page from './Page.module.css';

export function WatchlistPage() {
  useDocumentTitle('Watchlist');
  const { user } = useAuth();
  const { stateOf } = useLibrary();
  const query = useApiQuery((api, signal) => api.watchlist({ signal }), [user.id]);

  // Hide movies removed on this page right away, without reloading.
  const items = query.data?.filter((item) => stateOf(item).inWatchlist);

  return (
    <div className={`container ${page.page}`}>
      <header className={page.header}>
        <h1 className={page.title}>Watchlist</h1>
        <p className={page.subtitle}>Movies you saved for later.</p>
      </header>
      {query.loading && <MovieGrid loading />}
      {query.error && <ErrorMessage error={query.error} onRetry={query.reload} />}
      {items && items.length === 0 && (
        <StateMessage
          icon="bookmark"
          title="Your watchlist is empty"
          message="Tap the bookmark on any movie to save it here."
          action={
            <Button variant="primary" to="/">
              Find movies
            </Button>
          }
        />
      )}
      {items && items.length > 0 && (
        <>
          <p className={page.count}>{countLabel(items.length, 'movie')}</p>
          <MovieGrid items={items} />
        </>
      )}
    </div>
  );
}
