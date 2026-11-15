// From this many likes, the server builds the "Picked for you" row.
// Keep in sync with HomeFeed::FULL_PICKS_AT on the server.
export const PICKS_UNLOCK_AT = 5;

// Labels shown next to row titles, by where the row came from.
export const ROW_BADGES = {
  model: { label: 'For you', icon: 'sparkles' },
  rule: null, // series and director rows explain themselves in their titles
  popularity: null,
};
