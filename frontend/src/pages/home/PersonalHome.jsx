import { MovieRow } from '../../components/movie/MovieRow.jsx';
import { ErrorMessage } from '../../components/ui/StateMessage.jsx';
import { Widget } from '../../components/ui/Widget.jsx';
import { useWithoutKnown } from '../../context/library/useWithoutKnown.js';
import { useProfile } from '../../context/profile/ProfileContext.js';
import { displayNameOf, firstName, greeting, todayLabel } from '../../domain/format.js';
import { PICKS_UNLOCK_AT, ROW_BADGES } from '../../domain/recommendations.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import styles from './Home.module.css';
import { HomeHero } from './HomeHero.jsx';
import { StartCard } from './StartCard.jsx';

const HERO_PICKS = 5; // how many top picks the hero card cycles through

/** The signed-in home page: greeting, widgets, a top pick and the recommendation rows. */
export function PersonalHome({ user }) {
  const { profile } = useProfile();
  const feed = useApiQuery((api, signal) => api.homeFeed({ signal }), [user.id]);
  const withoutKnown = useWithoutKnown();
  const name = firstName(displayNameOf(profile, user));
  // Movies rated or saved on this page leave the rows (and the top picks) right away.
  const rows = (feed.data?.rows ?? []).map((row) => ({ ...row, items: withoutKnown(row.items) }));
  const picks = pickTopItems(rows, HERO_PICKS);
  const pickIds = new Set(picks.map((item) => item.id));

  return (
    <>
      <header className={`container ${styles.greeting}`}>
        <p className={styles.date}>{todayLabel()}</p>
        <h1 className={styles.greetingTitle}>
          {greeting()}, {name}
        </h1>
      </header>

      <HomeWidgets profile={profile} />

      {profile && profile.likes < PICKS_UNLOCK_AT && <StartCard likes={profile.likes} target={PICKS_UNLOCK_AT} />}

      {feed.loading && <HomeSkeleton />}
      {feed.error && (
        <div className="container">
          <ErrorMessage error={feed.error} onRetry={feed.reload} />
        </div>
      )}
      {feed.data && (
        <>
          {picks.length > 0 && <HomeHero items={picks} />}
          {rows.map((row) => (
            <MovieRow
              key={row.key}
              title={row.title}
              badge={ROW_BADGES[row.source]}
              items={row.items.filter((item) => !pickIds.has(item.id))}
              showBecause
              moreTo={row.key === 'picked' ? '/picks' : null}
            />
          ))}
        </>
      )}
    </>
  );
}

function HomeWidgets({ profile }) {
  const show = (value) => (profile ? value : '–');
  return (
    <section className={`container ${styles.widgets}`} aria-label="Your stats">
      <Widget icon="thumbUp" tone="like" label="Liked" value={show(profile?.likes)} caption="movies you love" to="/ratings" />
      <Widget
        icon="bookmark"
        tone="accent"
        label="Watchlist"
        value={show(profile?.watchlist)}
        caption="saved for later"
        to="/watchlist"
      />
      <Widget
        icon="thumbDown"
        tone="dislike"
        label="Not for me"
        value={show(profile?.dislikes)}
        caption="won't be suggested"
        to="/ratings?tab=dislikes"
      />
      <Widget
        icon="eyeOff"
        tone="mature"
        label="Hide 18+"
        value={show(profile?.hideMature ? 'On' : 'Off')}
        caption="family mode"
        to="/settings"
      />
    </section>
  );
}

function HomeSkeleton() {
  return (
    <>
      <div className="container">
        <div className={styles.heroSkeleton} />
      </div>
      <MovieRow title="Loading your picks" loading />
    </>
  );
}

// The hero shows the best model picks: the top of "Picked for you" when there is one.
function pickTopItems(rows, count) {
  const filled = rows.filter((r) => r.items.length > 0);
  const row = filled.find((r) => r.key === 'picked') ?? filled.find((r) => r.source === 'model') ?? filled[0];
  return row ? row.items.slice(0, count) : [];
}
