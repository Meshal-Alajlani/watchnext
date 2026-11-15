import { useCallback, useEffect, useState } from 'react';
import { MovieGrid } from '../components/movie/MovieGrid.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorMessage, StateMessage } from '../components/ui/StateMessage.jsx';
import { useAuth } from '../context/auth/AuthContext.js';
import { useWithoutKnown } from '../context/library/useWithoutKnown.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import page from './Page.module.css';
import styles from './Picks.module.css';

const PAGE_SIZE = 24; // the API's maximum per request

/** "See all picks": every movie the model picked for the user, best match first, with "Show more". */
export function PicksPage() {
  useDocumentTitle('Picked for you');
  const { user } = useAuth();
  const [pageCount, setPageCount] = useState(1);
  const [ended, setEnded] = useState(false);
  const onEnd = useCallback(() => setEnded(true), []);

  return (
    <div className={`container ${page.page}`}>
      <header className={page.header}>
        <h1 className={page.title}>Picked for you</h1>
        <p className={page.subtitle}>
          Everything the model thinks you'll like, best match first. Rate or save a movie and it leaves this list.
        </p>
      </header>

      {/* Each page loads itself, so "Show more" simply adds another one. */}
      <div className={styles.pages}>
        {Array.from({ length: pageCount }, (_, i) => (
          <PicksChunk key={i} userId={user.id} offset={i * PAGE_SIZE} onEnd={onEnd} />
        ))}
      </div>

      <div className={styles.footer}>
        {ended ? (
          pageCount > 1 && <p className={styles.end}>That's all for now. Rate more movies to get new picks.</p>
        ) : (
          <Button onClick={() => setPageCount((count) => count + 1)}>Show more</Button>
        )}
      </div>
    </div>
  );
}

function PicksChunk({ userId, offset, onEnd }) {
  const query = useApiQuery((api, signal) => api.picks({ offset, limit: PAGE_SIZE }, { signal }), [userId, offset]);
  const withoutKnown = useWithoutKnown();
  const isLast = query.data?.nextOffset === null;

  useEffect(() => {
    if (isLast) onEnd();
  }, [isLast, onEnd]);

  if (query.loading) return <MovieGrid loading />;
  if (query.error) return <ErrorMessage error={query.error} onRetry={query.reload} />;

  if (offset === 0 && query.data.items.length === 0) {
    return (
      <StateMessage
        icon="sparkles"
        title="No picks yet"
        message="Like a few movies you enjoyed, and your picks show up here."
        action={
          <Button variant="primary" to="/start">
            Rate movies
          </Button>
        }
      />
    );
  }

  // Movies rated or saved on this page leave the list right away.
  const items = withoutKnown(query.data.items);
  return items.length > 0 ? <MovieGrid items={items} showBecause /> : null;
}
