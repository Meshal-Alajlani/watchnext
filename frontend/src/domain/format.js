// Small text helpers shared by several components.

/** "2008 · PG-13" */
export function summaryLine(item) {
  return [item.year, item.ageRating].filter(Boolean).join(' · ');
}

/** The best name to greet someone with. */
export function displayNameOf(profile, user) {
  return profile?.displayName || user?.name || user?.email?.split('@')[0] || 'there';
}

export function firstName(name) {
  return name.trim().split(/\s+/)[0];
}

export function initialOf(name) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "Saturday, November 15" */
export function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "12 movies", "1 movie" */
export function countLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
