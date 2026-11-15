// The genres the API accepts (MovieLens names). Keep in sync with ItemsController::GENRES on the server.
export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy',
  'Film-Noir', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
];

// Friendlier names for a few MovieLens genres.
const LABELS = { Children: 'Family', 'Film-Noir': 'Film noir' };

export function genreLabel(genre) {
  return LABELS[genre] ?? genre;
}
