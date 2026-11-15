import { useSearchParams } from 'react-router';
import { MovieGrid } from '../components/movie/MovieGrid.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SegmentedControl } from '../components/ui/SegmentedControl.jsx';
import { ErrorMessage, StateMessage } from '../components/ui/StateMessage.jsx';
import { useAuth } from '../context/auth/AuthContext.js';
import { useLibrary } from '../context/library/LibraryContext.js';
import { countLabel } from '../domain/format.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import page from './Page.module.css';

const TABS = [
  { value: 'likes', label: 'Liked' },
  { value: 'dislikes', label: 'Not for me' },
];

export function RatingsPage() {
  useDocumentTitle('Your ratings');
  const { user } = useAuth();
  const { stateOf } = useLibrary();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'dislikes' ? 'dislikes' : 'likes';
  const wanted = tab === 'likes' ? 'like' : 'dislike';
  const query = useApiQuery((api, signal) => api.ratings({ liked: tab === 'likes' }, { signal }), [user.id, tab]);

  // Movies re-rated on this page move out of the list right away.
  const items = query.data?.filter((item) => stateOf(item).myRating === wanted);
  const changeTab = (value) => setParams(value === 'likes' ? {} : { tab: value }, { replace: true });

  return (
    <div className={`container ${page.page}`}>
      <header className={page.header}>
        <h1 className={page.title}>Your ratings</h1>
        <p className={page.subtitle}>Everything you rated. Change your mind any time.</p>
      </header>
      <div className={page.toolbar}>
        <SegmentedControl label="Which ratings" options={TABS} value={tab} onChange={changeTab} />
      </div>
      {query.loading && <MovieGrid loading />}
      {query.error && <ErrorMessage error={query.error} onRetry={query.reload} />}
      {items && items.length === 0 && (
        <StateMessage
          icon={tab === 'likes' ? 'thumbUp' : 'thumbDown'}
          title={tab === 'likes' ? 'No likes yet' : 'Nothing here'}
          message={
            tab === 'likes'
              ? 'Like movies you enjoyed, and WatchNext learns your taste.'
              : 'Movies you mark "not for me" show up here and are never suggested.'
          }
          action={
            tab === 'likes' && (
              <Button variant="primary" to="/start">
                Rate movies
              </Button>
            )
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
