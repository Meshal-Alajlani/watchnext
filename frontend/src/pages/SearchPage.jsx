import { useSearchParams } from 'react-router';
import { SearchField } from '../components/layout/SearchField.jsx';
import { MovieGrid } from '../components/movie/MovieGrid.jsx';
import { ErrorMessage, StateMessage } from '../components/ui/StateMessage.jsx';
import { useProfile } from '../context/profile/ProfileContext.js';
import { countLabel } from '../domain/format.js';
import { MIN_QUERY_LENGTH } from '../domain/search.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import page from './Page.module.css';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const ready = query.length >= MIN_QUERY_LENGTH;
  const { profile } = useProfile();
  const results = useApiQuery((api, signal) => api.search(query, { signal }), [query], { enabled: ready });
  useDocumentTitle(ready ? `Search: ${query}` : 'Search');

  // Respect the Hide 18+ setting in search results too.
  const items = profile?.hideMature ? results.data?.filter((item) => !item.mature) : results.data;

  return (
    <div className={`container ${page.page}`}>
      <div className={page.header}>
        <SearchField key={query} initialQuery={query} variant="large" autoFocus={!ready} />
      </div>
      {!ready && (
        <StateMessage icon="search" title="Search for a movie" message="Type at least 2 letters of a movie title." />
      )}
      {ready && results.loading && <MovieGrid loading />}
      {ready && results.error && <ErrorMessage error={results.error} onRetry={results.reload} />}
      {items && items.length === 0 && (
        <StateMessage
          icon="search"
          title={`No results for "${query}"`}
          message="Check the spelling, or try the movie's original title."
        />
      )}
      {items && items.length > 0 && (
        <>
          <p className={page.count}>{countLabel(items.length, 'result')}</p>
          <MovieGrid items={items} />
        </>
      )}
    </div>
  );
}
