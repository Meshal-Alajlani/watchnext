import { Link } from 'react-router';
import { Poster } from '../../components/movie/Poster.jsx';
import { RateButtons } from '../../components/movie/RateButtons.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { useItemActions } from '../../context/library/useItemActions.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import styles from './Home.module.css';

/** The big "Top pick for you" card, with a blurred poster glow behind it. */
export function HomeHero({ item }) {
  const actions = useItemActions(item);
  // The card only has the short form; load the plot and runtime separately (cached by the server).
  const details = useApiQuery((api, signal) => api.movie(item.id, { signal }), [item.id]);
  const full = details.data?.item;
  const meta = [item.year, item.ageRating, full?.runtime].filter(Boolean);

  return (
    <section className={`container ${styles.heroWrap}`} aria-label="Top pick for you">
      <div className={styles.hero}>
        {item.poster && (
          <div className={styles.heroBackdrop} style={{ backgroundImage: `url("${item.poster}")` }} aria-hidden="true" />
        )}
        <Link to={`/movie/${item.id}`} className={styles.heroPoster} aria-label={item.title}>
          <Poster src={item.poster} title={item.title} eager />
        </Link>
        <div className={styles.heroInfo}>
          <p className={styles.heroEyebrow}>
            <Icon name="sparkles" size={16} /> Top pick for you
          </p>
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
      </div>
    </section>
  );
}
