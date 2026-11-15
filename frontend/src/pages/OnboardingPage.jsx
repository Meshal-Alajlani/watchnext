import { useState } from 'react';
import { GenreChips } from '../components/movie/GenreChips.jsx';
import { Poster } from '../components/movie/Poster.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { useItemActions } from '../context/library/useItemActions.js';
import { useProfile } from '../context/profile/ProfileContext.js';
import { summaryLine } from '../domain/format.js';
import { PICKS_UNLOCK_AT } from '../domain/recommendations.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import styles from './Onboarding.module.css';
import page from './Page.module.css';

const PAGE_SIZE = 40; // the API's maximum per request

/** "What do you like?": new users tap popular movies they enjoyed. */
export function OnboardingPage() {
  useDocumentTitle('Pick movies you like');
  const [genre, setGenre] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const { profile } = useProfile();
  const likes = profile?.likes ?? 0;
  const unlocked = likes >= PICKS_UNLOCK_AT;
  const progress = Math.min(likes / PICKS_UNLOCK_AT, 1);

  const chooseGenre = (value) => {
    setGenre(value);
    setPageCount(1);
  };

  return (
    <div className={`container ${page.page}`}>
      <header className={page.header}>
        <h1 className={page.title}>What do you like?</h1>
        <p className={page.subtitle}>
          Tap movies you enjoyed. Like at least {PICKS_UNLOCK_AT}, and your home page fills with picks made for you.
        </p>
      </header>

      <GenreChips value={genre} onChange={chooseGenre} />

      {/* Each page loads itself, so "Show more" simply adds another one. */}
      <div className={styles.grid}>
        {Array.from({ length: pageCount }, (_, i) => (
          <PickPage key={`${genre ?? 'all'}-${i}`} genre={genre} offset={i * PAGE_SIZE} />
        ))}
      </div>

      <div className={styles.more}>
        <Button onClick={() => setPageCount((count) => count + 1)}>Show more</Button>
      </div>

      <div className={styles.dock}>
        <div className={styles.progress}>
          <p className={styles.progressText}>
            {unlocked ? `${likes} liked. Your picks are ready.` : `${likes} of ${PICKS_UNLOCK_AT} liked`}
          </p>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={PICKS_UNLOCK_AT}
            aria-valuenow={Math.min(likes, PICKS_UNLOCK_AT)}
            aria-label="Movies liked"
          >
            <div className={styles.barFill} style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <Button variant={unlocked ? 'primary' : 'secondary'} to="/">
          {unlocked ? 'See my picks' : 'Skip for now'}
        </Button>
      </div>
    </div>
  );
}

function PickPage({ genre, offset }) {
  const query = useApiQuery((api, signal) => api.popular({ genre, limit: PAGE_SIZE, offset }, { signal }), [genre, offset]);

  if (query.loading) {
    return Array.from({ length: 12 }, (_, i) => <div key={i} className={styles.skeleton} />);
  }
  if (query.error) {
    return (
      <div className={styles.error}>
        <p>{query.error.message}</p>
        <Button size="sm" icon="refresh" onClick={query.reload}>
          Try again
        </Button>
      </div>
    );
  }
  return query.data.items.map((item) => <PickCard key={item.id} item={item} />);
}

function PickCard({ item }) {
  const { myRating, onLike } = useItemActions(item);
  const liked = myRating === 'like';

  return (
    <button
      type="button"
      className={styles.pick}
      aria-pressed={liked}
      aria-label={liked ? `Remove like from ${item.title}` : `Like ${item.title}`}
      onClick={onLike}
    >
      <span className={styles.posterWrap}>
        <Poster src={item.poster} title={item.title} />
        <span className={styles.check}>
          <Icon name={liked ? 'check' : 'plus'} size={16} strokeWidth={2.6} />
        </span>
      </span>
      <span className={styles.pickTitle}>{item.title}</span>
      <span className={styles.pickMeta}>{summaryLine(item)}</span>
    </button>
  );
}
