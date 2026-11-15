import { Link } from 'react-router';
import styles from './Button.module.css';
import { Icon } from './Icon.jsx';

const ICON_SIZES = { sm: 16, md: 18, lg: 20 };

/**
 * The one button style for the whole app.
 * variant: primary | accent | secondary | danger | plain. size: sm | md | lg.
 * Pass `to` for a page link, or `href` for an outside link (opens in a new tab).
 */
export function Button({ variant = 'secondary', size = 'md', icon, to, href, className = '', children, ...rest }) {
  const classes = [styles.button, styles[variant], styles[size], children ? '' : styles.iconOnly, className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {icon && <Icon name={icon} size={ICON_SIZES[size]} />}
      {children && <span>{children}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
