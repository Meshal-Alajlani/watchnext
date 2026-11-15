import styles from './SegmentedControl.module.css';

/** Apple-style segmented control. options: [{ value, label }]. */
export function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className={styles.control} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={`${styles.segment} ${option.value === value ? styles.selected : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
