import { Button } from '../../components/ui/Button.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import styles from './Home.module.css';

/** Invites new users to rate movies until "Picked for you" unlocks. */
export function StartCard({ likes, target }) {
  const first = likes === 0;
  const remaining = target - likes;

  return (
    <section className="container">
      <div className={styles.start}>
        <span className={styles.startIcon}>
          <Icon name="sparkles" size={22} />
        </span>
        <div className={styles.startText}>
          <h2 className={styles.startTitle}>
            {first ? "Let's learn your taste" : `Like ${remaining} more to unlock Picked for you`}
          </h2>
          <p className={styles.startBody}>
            {first
              ? 'Pick a few movies you love, and your home page fills with picks made for you.'
              : 'Your picks get better with every movie you rate.'}
          </p>
        </div>
        <Button variant="primary" to="/start">
          {first ? 'Start' : 'Rate movies'}
        </Button>
      </div>
    </section>
  );
}
