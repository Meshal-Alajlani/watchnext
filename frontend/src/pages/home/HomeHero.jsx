import { useState } from 'react';
import { Link } from 'react-router';
import { Poster } from '../../components/movie/Poster.jsx';
import { RateButtons } from '../../components/movie/RateButtons.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { useItemActions } from '../../context/library/useItemActions.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import styles from './Home.module.css';

/**
 * The big "Top picks for you" card: one pick at a time, with previous/next buttons and dots
 * (like the Apple TV app). Rating a pick removes it from `items`, so the next one slides in.
 */
export function HomeHero({ items }) {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const position = Math.min(index, count - 1); // stays valid when a rated pick leaves the list
  const item = items[position];

  const go = (step) => setIndex((position + step + count) % count);
  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  };

  return (
    <section
      className={`container ${styles.heroWrap}`}
      aria-roledescription="carousel"
      aria-label="Top picks for you"
      onKeyDown={count > 1 ? onKeyDown : undefined}
    >
      <div className={styles.hero}>
        {/* Keyed parts re-mount when the pick changes, which replays their fade-in. */}
        {item.poster && (
          <div
            key={`backdrop-${item.id}`}
            className={styles.heroBackdrop}
            style={{ backgroundImage: `url("${item.poster}")` }}
            aria-hidden="true"
          />
        )}
        <Link key={`poster-${item.id}`} to={`/movie/${item.id}`} className={styles.heroPoster} aria-label={item.title}>
          <Poster src={item.poster} title={item.title} eager />
        </Link>

        <div className={styles.heroInfo}>
          <div className={styles.heroTop}>
            <p className={styles.heroEyebrow}>
              <Icon name="sparkles" size={16} />
              {count > 1 ? `Top pick ${position + 1} of ${count}` : 'Top pick for you'}
            </p>
            <div className={styles.heroNav}>
              {count > 1 && (
                <>
                  <button type="button" className={styles.heroArrow} onClick={() => go(-1)} aria-label="Previous pick">
                    <Icon name="chevronLeft" size={18} />
                  </button>
                  <div className={styles.dots}>
                    {items.map((pick, i) => (
                      <button
                        key={pick.id}
                        type="button"
                        className={styles.dot}
                        onClick={() => setIndex(i)}
                        aria-label={`Pick ${i + 1}: ${pick.title}`}
                        aria-current={i === position}
                      >
                        <span className={`${styles.dotMark} ${i === position ? styles.dotActive : ''}`} />
                      </button>
                    ))}
                  </div>
                  <button type="button" className={styles.heroArrow} onClick={() => go(1)} aria-label="Next pick">
                    <Icon name="chevronRight" size={18} />
                  </button>
                </>
              )}
              <Button variant="secondary" size="sm" to="/picks">
                See all
              </Button>
            </div>
          </div>
          <HeroDetails key={item.id} item={item} />
        </div>
      </div>
    </section>
  );
}

function HeroDetails({ item }) {
  const actions = useItemActions(item);
  // The card only has the short form; load the plot and runtime separately (cached by the server).
  const details = useApiQuery((api, signal) => api.movie(item.id, { signal }), [item.id]);
  const full = details.data?.item;
  const meta = [item.year, item.ageRating, full?.runtime].filter(Boolean);

  return (
    <div className={styles.heroDetails}>
      <h2 className={styles.heroTitle}>{item.title}</h2>
      <p className={styles.heroMeta}>
        {meta.join(' · ')}
        {full?.imdbRating && (
          <span className={styles.heroRating}>
            <Icon name="star" size={14} filled /> {full.imdbRating.toFixed(1)}
          </span>
        )}
      </p>
      {full?.plot && <p className={styles.heroPlot}>{full.plot}</p>}
      {item.because && (
        <p className={styles.because}>
          Because you liked <Link to={`/movie/${item.because.id}`}>{item.because.title}</Link>
        </p>
      )}
      <div className={styles.heroActions}>
        <RateButtons {...actions} title={item.title} variant="pills" />
        <Button variant="plain" to={`/movie/${item.id}`} icon="chevronRight">
          Details
        </Button>
      </div>
    </div>
  );
}
