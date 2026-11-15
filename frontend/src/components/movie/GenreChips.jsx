import { GENRES, genreLabel } from '../../domain/genres.js';
import styles from './GenreChips.module.css';

/** A scrolling row of genre filter chips. `value` is a genre name, or null for all. */
export function GenreChips({ value, onChange }) {
  const options = [null, ...GENRES];
  return (
    <div className={styles.chips} role="group" aria-label="Filter by genre">
      {options.map((genre) => (
        <button
          key={genre ?? 'all'}
          type="button"
          aria-pressed={genre === value}
          className={`${styles.chip} ${genre === value ? styles.active : ''}`}
          onClick={() => onChange(genre)}
        >
          {genre ? genreLabel(genre) : 'All'}
        </button>
      ))}
    </div>
  );
}
