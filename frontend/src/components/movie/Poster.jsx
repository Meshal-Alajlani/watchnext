import { useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import styles from './Poster.module.css';

/**
 * A movie poster that falls back to a styled title card when there is no image or it fails to load.
 * Built from spans so it can sit inside buttons and links.
 */
export function Poster({ src, title, alt = '', eager = false, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span className={`${styles.poster} ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span className={styles.fallback}>
          <Icon name="film" size={26} />
          <span className={styles.fallbackTitle}>{title}</span>
        </span>
      )}
    </span>
  );
}
