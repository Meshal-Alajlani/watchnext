import { MovieRow } from '../../components/movie/MovieRow.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import styles from './Home.module.css';

const SHOWCASE = [
  { genre: 'Sci-Fi', title: 'Mind-bending sci-fi' },
  { genre: 'Animation', title: 'Animated favorites' },
  { genre: 'Comedy', title: 'Comedies everyone loves' },
  { genre: 'Crime', title: 'Crime classics' },
];

const FEATURES = [
  {
    icon: 'sparkles',
    title: 'Learns your taste',
    text: 'A model trained on 32 million ratings picks movies like the ones you love.',
  },
  { icon: 'film', title: 'Never miss a sequel', text: 'Continue a series right where you left off.' },
  { icon: 'shield', title: 'Family mode', text: 'Hide 18+ movies everywhere with one switch.' },
];

/** The home page for visitors who aren't signed in. */
export function WelcomeHome() {
  const popular = useApiQuery((api, signal) => api.popular({ limit: 24 }, { signal }), []);
  const items = popular.data?.items ?? [];

  const scrollToPopular = () => document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <section className={styles.welcome}>
        <div className={styles.mosaic} aria-hidden="true">
          {items
            .filter((item) => item.poster)
            .map((item) => (
              <img key={item.id} src={item.poster} alt="" loading="lazy" decoding="async" />
            ))}
        </div>
        <div className={styles.shade} aria-hidden="true" />
        <div className={`container ${styles.welcomeContent}`}>
          <p className={styles.eyebrow}>
            <Icon name="sparkles" size={16} /> Movie picks that learn from you
          </p>
          <h1 className={styles.welcomeTitle}>
            Find what to
            <br />
            watch next.
          </h1>
          <p className={styles.welcomeText}>
            Give a thumbs up to movies you love. WatchNext learns your taste and finds your next favorite.
          </p>
          <div className={styles.actions}>
            <Button variant="primary" size="lg" to="/login?mode=signup">
              Get started
            </Button>
            <Button size="lg" onClick={scrollToPopular}>
              Browse popular
            </Button>
          </div>
        </div>
      </section>

      <section className={`container ${styles.features}`} aria-label="Features">
        {FEATURES.map((feature) => (
          <div key={feature.title} className={styles.feature}>
            <span className={styles.featureIcon}>
              <Icon name={feature.icon} size={20} />
            </span>
            <h2 className={styles.featureTitle}>{feature.title}</h2>
            <p className={styles.featureText}>{feature.text}</p>
          </div>
        ))}
      </section>

      <div id="popular">
        <MovieRow title="Popular right now" items={items} loading={popular.loading} />
        {SHOWCASE.map((row) => (
          <GenreRow key={row.genre} genre={row.genre} title={row.title} />
        ))}
      </div>
    </>
  );
}

function GenreRow({ genre, title }) {
  const query = useApiQuery((api, signal) => api.popular({ genre, limit: 20 }, { signal }), [genre]);
  return <MovieRow title={title} items={query.data?.items} loading={query.loading} />;
}
