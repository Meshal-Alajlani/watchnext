import { useRef } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { MovieCard } from './MovieCard.jsx';
import styles from './MovieRow.module.css';

const SKELETON_COUNT = 8;

/**
 * A titled, horizontally scrolling row of movie cards (like the Apple TV app).
 * Renders nothing when there are no items, so callers can pass any row safely.
 * badge: { label, icon } or null.
 */
export function MovieRow({ title, badge = null, items = [], loading = false, showBecause = false }) {
  const scroller = useRef(null);

  if (!loading && items.length === 0) return null;

  const scrollBy = (direction) => {
    const element = scroller.current;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className={styles.row} aria-label={title}>
      <div className={`container ${styles.header}`}>
        <h2 className={styles.title}>{title}</h2>
        {badge && (
          <span className={styles.badge}>
            {badge.icon && <Icon name={badge.icon} size={13} strokeWidth={2.4} />}
            {badge.label}
          </span>
        )}
        {!loading && (
          <div className={styles.arrows}>
            <button type="button" className={styles.arrow} onClick={() => scrollBy(-1)} aria-label={`Scroll ${title} left`}>
              <Icon name="chevronLeft" size={18} />
            </button>
            <button type="button" className={styles.arrow} onClick={() => scrollBy(1)} aria-label={`Scroll ${title} right`}>
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
        )}
      </div>
      <div ref={scroller} className={styles.scroller}>
        {loading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => <div key={i} className={styles.skeleton} />)
          : items.map((item) => (
              <div key={item.id} className={styles.cell}>
                <MovieCard item={item} showBecause={showBecause} />
              </div>
            ))}
      </div>
    </section>
  );
}
