import { MovieCard } from './MovieCard.jsx';
import styles from './MovieGrid.module.css';

/** A responsive grid of movie cards, used by search, watchlist, ratings and all picks. */
export function MovieGrid({ items = [], loading = false, showBecause = false }) {
  return (
    <div className={styles.grid}>
      {loading
        ? Array.from({ length: 12 }, (_, i) => <div key={i} className={styles.skeleton} />)
        : items.map((item) => <MovieCard key={item.id} item={item} showBecause={showBecause} />)}
    </div>
  );
}
