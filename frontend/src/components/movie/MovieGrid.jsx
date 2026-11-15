import { MovieCard } from './MovieCard.jsx';
import styles from './MovieGrid.module.css';

/** A responsive grid of movie cards, used by search, watchlist and ratings. */
export function MovieGrid({ items = [], loading = false }) {
  return (
    <div className={styles.grid}>
      {loading
        ? Array.from({ length: 12 }, (_, i) => <div key={i} className={styles.skeleton} />)
        : items.map((item) => <MovieCard key={item.id} item={item} />)}
    </div>
  );
}
