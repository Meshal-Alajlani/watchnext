import { Link } from 'react-router';
import { Icon } from './Icon.jsx';
import styles from './Widget.module.css';

/** An iOS-style widget tile: icon, label, big value. tone: accent | like | dislike | mature | neutral. */
export function Widget({ icon, label, value, caption, to, tone = 'neutral' }) {
  const body = (
    <>
      <span className={styles.top}>
        <span className={`${styles.icon} ${styles[tone]}`}>
          <Icon name={icon} size={15} strokeWidth={2.4} />
        </span>
        {label}
      </span>
      <span>
        <span className={styles.value}>{value}</span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </span>
    </>
  );

  return to ? (
    <Link to={to} className={`${styles.widget} ${styles.link}`}>
      {body}
    </Link>
  ) : (
    <div className={styles.widget}>{body}</div>
  );
}
