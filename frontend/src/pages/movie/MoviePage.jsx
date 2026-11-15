import { useParams } from 'react-router';
import { MovieRow } from '../../components/movie/MovieRow.jsx';
import { Poster } from '../../components/movie/Poster.jsx';
import { RateButtons } from '../../components/movie/RateButtons.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { ErrorMessage, StateMessage } from '../../components/ui/StateMessage.jsx';
import { useItemActions } from '../../context/library/useItemActions.js';
import { useWithoutKnown } from '../../context/library/useWithoutKnown.js';
import { genreLabel } from '../../domain/genres.js';
import { mainSeriesName } from '../../domain/series.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import styles from './Movie.module.css';

const MODEL_BADGE = { label: 'Recommended', icon: 'sparkles' };

export function MoviePage() {
  const { id } = useParams();
  const query = useApiQuery((api, signal) => api.movie(id, { signal }), [id]);
  const withoutKnown = useWithoutKnown();
  useDocumentTitle(query.data?.item.title);

  if (query.loading) return <MovieSkeleton />;
  if (query.error) {
    return (
      <div className="container">
        {query.error.status === 404 || query.error.status === 400 ? (
          <StateMessage
            title="We couldn't find that movie"
            message="The link may be wrong, or the movie isn't in our catalog."
            action={
              <Button variant="primary" to="/">
                Go home
              </Button>
            }
          />
        ) : (
          <ErrorMessage error={query.error} onRetry={query.reload} />
        )}
      </div>
    );
  }

  const { item, related } = query.data;
  const facts = factsOf(item);

  return (
    <article>
      <MovieHeader item={item} />
      {facts.length > 0 && (
        <section className={`container ${styles.facts}`} aria-label="Details">
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <p className={styles.factLabel}>{fact.label}</p>
              <p className={styles.factValue}>{fact.value}</p>
            </div>
          ))}
        </section>
      )}
      {/* Series rows show the order of the series, so rated films stay. The API lists earlier films closest first. */}
      <MovieRow title="Earlier in the series" items={[...related.earlier].reverse()} />
      <MovieRow title="Next in the series" items={related.next} />
      {/* Suggestions drop anything rated or saved, including on this page. */}
      {item.directors.length > 0 && (
        <MovieRow title={`More from ${item.directors[0]}`} items={withoutKnown(related.sameDirector)} />
      )}
      <MovieRow title="More like this" badge={MODEL_BADGE} items={withoutKnown(related.moreLikeThis)} />
    </article>
  );
}

function MovieHeader({ item }) {
  const actions = useItemActions(item);
  const series = mainSeriesName(item.series);

  return (
    <header className={styles.top}>
      {item.poster && (
        <div className={styles.backdrop} style={{ backgroundImage: `url("${item.poster}")` }} aria-hidden="true" />
      )}
      <div className={styles.fade} aria-hidden="true" />
      <div className={`container ${styles.layout}`}>
        <Poster src={item.poster} title={item.title} alt={`${item.title} poster`} eager className={styles.poster} />
        <div className={styles.info}>
          {series && <p className={styles.series}>{series}</p>}
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.meta}>
            {item.year && <span>{item.year}</span>}
            {item.ageRating && (
              <span className={`${styles.age} ${item.mature ? styles.ageMature : ''}`}>{item.ageRating}</span>
            )}
            {item.runtime && <span>{item.runtime}</span>}
            {item.imdbRating && (
              <span className={styles.rating}>
                <Icon name="star" size={14} filled /> {item.imdbRating.toFixed(1)}
              </span>
            )}
          </div>
          {item.genres.length > 0 && (
            <ul className={styles.genres} aria-label="Genres">
              {item.genres.map((genre) => (
                <li key={genre} className={styles.genre}>
                  {genreLabel(genre)}
                </li>
              ))}
            </ul>
          )}
          {item.plot && <p className={styles.plot}>{item.plot}</p>}
          <div className={styles.actions}>
            <RateButtons {...actions} title={item.title} variant="pills" />
          </div>
          <div className={styles.links}>
            {item.imdbUrl && (
              <Button variant="plain" size="sm" href={item.imdbUrl} icon="externalLink">
                IMDb
              </Button>
            )}
            {item.parentsGuideUrl && (
              <Button variant="plain" size="sm" href={item.parentsGuideUrl} icon="externalLink">
                Parents guide
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function factsOf(item) {
  return [
    item.directors.length > 0 && {
      label: item.directors.length > 1 ? 'Directors' : 'Director',
      value: item.directors.join(', '),
    },
    item.writers.length > 0 && { label: 'Writers', value: item.writers.join(', ') },
    item.actors.length > 0 && { label: 'Cast', value: item.actors.join(', ') },
    item.released && { label: 'Released', value: item.released },
    (item.language || item.country) && {
      label: 'Language and country',
      value: [item.language, item.country].filter(Boolean).join(' · '),
    },
    item.awards && { label: 'Awards', value: item.awards },
  ].filter(Boolean);
}

function MovieSkeleton() {
  return (
    <div className={`container ${styles.layout} ${styles.skeletonLayout}`} aria-busy="true">
      <div className={styles.skeletonPoster} />
      <div>
        <div className={styles.skeletonLine} style={{ width: '60%', height: 44 }} />
        <div className={styles.skeletonLine} style={{ width: '35%' }} />
        <div className={styles.skeletonLine} style={{ width: '90%' }} />
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
      </div>
    </div>
  );
}
