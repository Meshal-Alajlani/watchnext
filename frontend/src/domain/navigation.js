/** The sign-in page, set to bring the user back to `path` afterwards. */
export function loginPath(path) {
  return `/login?next=${encodeURIComponent(path)}`;
}

/** Only allow returning to pages on this site, so a link can't send people to another website. */
export function safeNextPath(value, fallback = '/') {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : fallback;
}
