import { Link } from 'react-router';
import { useItemActions } from '../../context/library/useItemActions.js';
import { summaryLine } from '../../domain/format.js';
import { Icon } from '../ui/Icon.jsx';
import styles from './MovieCard.module.css';
import { Poster } from './Poster.jsx';
import { RateButtons } from './RateButtons.jsx';

/** A poster card with quick like, dislike and watchlist buttons. */
export function MovieCard({ item, showBecause = false }) {
  const actions = useItemActions(item);
  const label = item.year ? `${item.title} (${item.year})` : item.title;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Link to={`/movie/${item.id}`} className={styles.link} aria-label={label}>
          <Poster src={item.poster} title={item.title} />
        </Link>
        <div className={styles.badges} aria-hidden="true">
          <span className={styles.state}>
            {actions.myRating === 'like' && (
              <span className={`${styles.badge} ${styles.liked}`}>
                <Icon name="thumbUp" size={13} filled />
              </span>
            )}
            {actions.myRating === 'dislike' && (
              <span className={`${styles.badge} ${styles.disliked}`}>
                <Icon name="thumbDown" size={13} filled />
              </span>
            )}
            {actions.inWatchlist && (
              <span className={`${styles.badge} ${styles.saved}`}>
                <Icon name="bookmark" size={13} filled />
              </span>
            )}
          </span>
          {item.mature && <span className={`${styles.badge} ${styles.mature}`}>18+</span>}
        </div>
        <RateButtons {...actions} title={item.title} variant="overlay" />
      </div>
      <div className={styles.text}>
        <h3 className={styles.title} title={item.title}>
          {item.title}
        </h3>
        <p className={styles.meta}>{summaryLine(item)}</p>
        {showBecause && item.because && <p className={styles.because}>Because you liked {item.because.title}</p>}
      </div>
    </article>
  );
}
