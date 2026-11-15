import styles from './Spinner.module.css';

export function Spinner({ label = 'Loading' }) {
  return <span className={styles.spinner} role="status" aria-label={label} />;
}

/** A spinner centered in the page area. */
export function PageSpinner() {
  return (
    <div className={styles.page}>
      <Spinner />
    </div>
  );
}
