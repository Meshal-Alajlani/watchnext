<?php
declare(strict_types=1);

// Adapter for the OMDb API (https://www.omdbapi.com). Turns OMDb's answer into our field names.
// The API key stays on the server: the browser never talks to OMDb directly.
final class OmdbProvider implements CatalogProvider
{
    private const URL = 'https://www.omdbapi.com/';

    public function __construct(private string $apiKey)
    {
    }

    public function details(array $ids): array
    {
        if (!$ids) {
            return [];
        }
        $this->requireKey();
        $urls = [];
        foreach ($ids as $id) {
            $urls[$id] = self::URL . '?' . http_build_query(['i' => $id, 'apikey' => $this->apiKey]);
        }
        $found = [];
        $failed = false;
        foreach (HttpClient::getMany($urls) as $id => $response) {
            $data = json_decode($response['body'], true);
            if (!is_array($data)) {
                $failed = true;                       // no answer or not JSON: try again another time
            } elseif (($data['Response'] ?? '') === 'True') {
                $found[$id] = $this->map($data);
            } elseif (self::meansNotFound((string) ($data['Error'] ?? ''))) {
                $found[$id] = null;                   // OMDb has no such movie
            } else {
                $failed = true;                       // "Request limit reached!", "Invalid API key!" ...
            }
        }
        if (!$found && $failed) {
            throw new CatalogUnavailable('OMDb is not answering (daily limit, key or network)');
        }
        return $found;
    }

    public function search(string $query): array
    {
        $this->requireKey();
        $response = HttpClient::get(self::URL . '?' . http_build_query(['s' => $query, 'type' => 'movie', 'apikey' => $this->apiKey]));
        $data = json_decode($response['body'], true);
        if (!is_array($data)) {
            throw new CatalogUnavailable('OMDb is not answering');
        }
        if (($data['Response'] ?? '') !== 'True') {
            $error = (string) ($data['Error'] ?? '');
            if (self::meansNotFound($error) || stripos($error, 'too many results') !== false) {
                return [];
            }
            throw new CatalogUnavailable("OMDb: $error");
        }
        $results = [];
        foreach ($data['Search'] ?? [] as $r) {
            $results[] = [
                'id' => (string) ($r['imdbID'] ?? ''),
                'kind' => 'movie',
                'title' => (string) ($r['Title'] ?? ''),
                'year' => self::year($r['Year'] ?? null),
                'poster_url' => self::value($r['Poster'] ?? null),
            ];
        }
        return $results;
    }

    private function map(array $d): array
    {
        return [
            'id' => (string) $d['imdbID'],
            'kind' => ($d['Type'] ?? '') === 'series' ? 'tv' : 'movie',
            'title' => (string) ($d['Title'] ?? ''),
            'year' => self::year($d['Year'] ?? null),
            'genres' => self::pipeList($d['Genre'] ?? null),
            'director' => self::pipeList($d['Director'] ?? null),
            'age_rating' => self::value($d['Rated'] ?? null),
            'poster_url' => self::value($d['Poster'] ?? null),
            'plot' => self::value($d['Plot'] ?? null),
            'runtime' => self::value($d['Runtime'] ?? null),
            'imdb_rating' => is_numeric($d['imdbRating'] ?? null) ? (float) $d['imdbRating'] : null,
            'actors' => self::value($d['Actors'] ?? null),
            'raw' => json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ];
    }

    private function requireKey(): void
    {
        if ($this->apiKey === '') {
            throw new CatalogUnavailable('omdb_key is not set in backend/config.php');
        }
    }

    private static function meansNotFound(string $error): bool
    {
        return stripos($error, 'not found') !== false || stripos($error, 'incorrect imdb id') !== false;
    }

    // OMDb writes "N/A" for missing values.
    private static function value(mixed $v): ?string
    {
        return ($v === null || $v === '' || $v === 'N/A') ? null : (string) $v;
    }

    // "Joel Coen, Ethan Coen" -> "Joel Coen|Ethan Coen" (the same format as the model's files)
    private static function pipeList(mixed $v): ?string
    {
        $v = self::value($v);
        return $v === null ? null : implode('|', array_map('trim', explode(',', $v)));
    }

    private static function year(mixed $v): ?int
    {
        return preg_match('/\d{4}/', (string) $v, $m) ? (int) $m[0] : null;
    }
}
