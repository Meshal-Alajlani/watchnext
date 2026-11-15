import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';
import styles from './StateMessage.module.css';

/** A centered message for empty, missing or failed content, with an optional action. */
export function StateMessage({ icon = 'film', title, message, action, tone = 'neutral' }) {
  return (
    <div className={styles.state}>
      <span className={`${styles.icon} ${tone === 'error' ? styles.error : ''}`}>
        <Icon name={icon} size={28} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

/** The standard "something failed" message with a retry button. */
export function ErrorMessage({ error, onRetry }) {
  return (
    <StateMessage
      icon="alert"
      tone="error"
      title="Something went wrong"
      message={error?.message}
      action={
        onRetry && (
          <Button icon="refresh" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
