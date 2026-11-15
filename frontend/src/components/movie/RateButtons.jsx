import { Icon } from '../ui/Icon.jsx';
import styles from './RateButtons.module.css';

/**
 * Like, "not for me" and watchlist controls.
 * Purely presentational: it receives the state and callbacks as props (see useItemActions),
 * so it works with any data source and is easy to reuse.
 * variant "overlay" = round icons on a poster, "pills" = labeled buttons for large layouts.
 */
export function RateButtons({ myRating, inWatchlist, onLike, onDislike, onToggleWatchlist, title, variant = 'pills' }) {
  const liked = myRating === 'like';
  const disliked = myRating === 'dislike';
  const controls = [
    {
      key: 'like',
      icon: 'thumbUp',
      pressed: liked,
      onClick: onLike,
      text: liked ? 'Liked' : 'Like',
      description: liked ? `Remove your like from ${title}` : `Like ${title}`,
    },
    {
      key: 'dislike',
      icon: 'thumbDown',
      pressed: disliked,
      onClick: onDislike,
      text: 'Not for me',
      description: disliked ? `Undo "not for me" on ${title}` : `Mark ${title} as not for me`,
    },
    {
      key: 'save',
      icon: 'bookmark',
      pressed: inWatchlist,
      onClick: onToggleWatchlist,
      text: inWatchlist ? 'In watchlist' : 'Watchlist',
      description: inWatchlist ? `Remove ${title} from your watchlist` : `Add ${title} to your watchlist`,
    },
  ];
  const overlay = variant === 'overlay';

  return (
    <div className={overlay ? styles.overlay : styles.pills}>
      {controls.map((control) => (
        <button
          key={control.key}
          type="button"
          className={`${overlay ? styles.round : styles.pill} ${styles[control.key]}`}
          aria-pressed={control.pressed}
          aria-label={overlay ? control.description : undefined}
          title={overlay ? control.description : undefined}
          onClick={control.onClick}
        >
          <Icon name={control.icon} size={overlay ? 17 : 18} filled={control.pressed} />
          {!overlay && <span>{control.text}</span>}
        </button>
      ))}
    </div>
  );
}
