<?php
declare(strict_types=1);

// Turns a row of the items table into the JSON shape the React app uses.
// One shape for movies and (later) TV shows, so the same React components show both.
final class ItemPresenter
{
    // Ratings hidden by the "Hide 18+" setting.
    private const MATURE = ['R', 'NC-17', 'X', 'TV-MA'];

    public static function isMature(?string $ageRating): bool
    {
        return in_array(strtoupper((string) $ageRating), self::MATURE, true);
    }

    // The short form, for movie cards in rows and search results.
    public static function summary(array $row): array
    {
        $omdb = self::omdb($row);
        return [
            'id' => $row['id'],
            'kind' => $row['kind'],
            'title' => $omdb['Title'] ?? $row['title'],
            'year' => $row['year'] === null ? null : (int) $row['year'],
            'poster' => $row['poster_url'],
            'ageRating' => $row['age_rating'],
            'mature' => self::isMature($row['age_rating']),
        ];
    }

    // The full form, for the movie page.
    public static function details(array $row): array
    {
        $omdb = self::omdb($row);
        $id = $row['id'];
        $isImdb = str_starts_with($id, 'tt');
        return self::summary($row) + [
            'genres' => self::genres($omdb['Genre'] ?? null, $row['genres']),
            'plot' => $row['plot'],
            'runtime' => $row['runtime'],
            'released' => self::value($omdb['Released'] ?? null),
            'directors' => self::split($row['director'], '|'),
            'writers' => self::split($omdb['Writer'] ?? null, ','),
            'actors' => self::split($row['actors'], ','),
            'language' => self::value($omdb['Language'] ?? null),
            'country' => self::value($omdb['Country'] ?? null),
            'awards' => self::value($omdb['Awards'] ?? null),
            'imdbRating' => $row['imdb_rating'] === null ? null : (float) $row['imdb_rating'],
            'series' => self::split($row['series'], '|'),
            'imdbUrl' => $isImdb ? "https://www.imdb.com/title/$id/" : null,
            'parentsGuideUrl' => $isImdb ? "https://www.imdb.com/title/$id/parentalguide" : null,
            'inModel' => (bool) $row['in_model'],
        ];
    }

    private static function omdb(array $row): array
    {
        if (empty($row['omdb_json'])) {
            return [];
        }
        $data = json_decode($row['omdb_json'], true);
        return is_array($data) && ($data['Response'] ?? '') === 'True' ? $data : [];
    }

    // OMDb lists only 1 to 3 genres, so add MovieLens's genres too (OMDb's first, no duplicates).
    private static function genres(?string $omdbGenres, ?string $movieLensGenres): array
    {
        $rename = ['Children' => 'Family', 'IMAX' => null, '(no genres listed)' => null];
        $all = self::split($omdbGenres, ',');
        foreach (self::split($movieLensGenres, '|') as $genre) {
            $genre = array_key_exists($genre, $rename) ? $rename[$genre] : $genre;
            if ($genre !== null && !in_array($genre, $all, true)) {
                $all[] = $genre;
            }
        }
        return $all;
    }

    private static function split(?string $value, string $separator): array
    {
        $value = self::value($value);
        return $value === null ? [] : array_values(array_filter(array_map('trim', explode($separator, $value))));
    }

    private static function value(?string $value): ?string
    {
        return ($value === null || $value === '' || $value === 'N/A') ? null : $value;
    }
}
