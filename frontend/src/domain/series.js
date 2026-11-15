// Wikidata's "part of the series" mixes real series ("The Dark Knight trilogy") with lists and
// catalogs ("BBC's 100 Greatest Films of the 21st Century", "Batman in film"). Skip those.
const NOT_A_SERIES = /greatest|\bbest\b|\btop\b|\b\d{2,}\b|feature film|\bin film\b|\blist of\b/i;

/** The series name worth showing for a movie, or null. Among real series, the shortest name reads best. */
export function mainSeriesName(series) {
  const real = series.filter((name) => !NOT_A_SERIES.test(name));
  return real.length > 0 ? real.reduce((best, name) => (name.length < best.length ? name : best)) : null;
}
