import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from '../../domain/search.js';
import { Icon } from '../ui/Icon.jsx';
import styles from './SearchField.module.css';

/** A search box that opens the search page. variant: "nav" (compact) or "large". */
export function SearchField({ initialQuery = '', variant = 'nav', autoFocus = false }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= MIN_QUERY_LENGTH) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form role="search" className={`${styles.form} ${styles[variant]}`} onSubmit={submit}>
      <Icon name="search" size={variant === 'large' ? 22 : 16} className={styles.icon} />
      <input
        type="search"
        className={styles.input}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search movies"
        aria-label="Search movies"
        maxLength={MAX_QUERY_LENGTH}
        enterKeyHint="search"
        autoFocus={autoFocus}
      />
    </form>
  );
}
