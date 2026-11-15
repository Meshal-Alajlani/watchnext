/** The WatchNext app icon: a play button on a rounded square, like an iOS app icon. */
export function Logo({ size = 30, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="watchnext-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5e5ce6" />
          <stop offset="1" stopColor="#0a84ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#watchnext-logo)" />
      <path d="M26 21.2v21.6a1.6 1.6 0 0 0 2.4 1.4l17.3-10.8a1.6 1.6 0 0 0 0-2.8L28.4 19.8a1.6 1.6 0 0 0-2.4 1.4z" fill="#fff" />
    </svg>
  );
}
