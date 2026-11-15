<?php
declare(strict_types=1);

// Decorator: wraps any CatalogProvider and keeps every answer in the MySQL `items` table,
// so each movie costs one API call ever. The rest of the app only talks to this class.
final class CachedCatalog implements CatalogProvider
{
    public bool $providerUnavailable = false;    // set when the provider failed during this request
    private int $fetched = 0;

    public function __construct(
        private PDO $db,
        private CatalogProvider $provider,
        private int $maxFetchPerRequest = 60,     // protects the daily limit: one page can never use more calls
    ) {
    }

    public static function isValidId(string $id): bool
    {
        return (bool) preg_match('/^tt\d{7,10}$/', $id);
    }

    /**
     * Rows of the items table, keyed by id, in the order given. Unknown ids are left out.
     * With $withDetails, items not fetched yet are fetched from the provider (in parallel) and saved first.
     */
    public function details(array $ids, bool $withDetails = true): array
    {
        $ids = array_values(array_unique(array_filter($ids, 'is_string')));
        if (!$ids) {
            return [];
        }
        $rows = $this->load($ids);
        if ($withDetails && !$this->providerUnavailable) {
            $missing = array_values(array_filter($ids, fn(string $id) => ($rows[$id]['details_fetched_at'] ?? null) === null));
            $missing = array_slice($missing, 0, max(0, $this->maxFetchPerRequest - $this->fetched));
            if ($missing) {
                $this->fetched += count($missing);
                try {
                    $found = $this->provider->details($missing);
                } catch (CatalogUnavailable) {
                    $this->providerUnavailable = true;
                    $found = [];
                }
                foreach ($found as $id => $fields) {
                    if ($fields === null) {
                        $this->markNotFound($id);
                    } else {
                        $this->save($id, $fields);
                    }
                }
                if ($found) {
                    $rows = $this->load($ids);
                }
            }
        }
        $ordered = [];
        foreach ($ids as $id) {
            if (isset($rows[$id])) {
                $ordered[$id] = $rows[$id];
            }
        }
        return $ordered;
    }

    public function item(string $id): ?array
    {
        return $this->details([$id])[$id] ?? null;
    }

    // Our own catalog first (the movies the model knows). If that finds few, OMDb's search fills the rest.
    public function search(string $query, int $limit = 12): array
    {
        $query = trim($query);
        $escaped = addcslashes($query, '%_\\');
        $stmt = $this->db->prepare(
            'SELECT id FROM items WHERE title LIKE ?
             ORDER BY (title = ?) DESC, (title LIKE ?) DESC, in_model DESC, popularity DESC LIMIT ' . $limit
        );
        $stmt->execute(["%$escaped%", $query, "$escaped%"]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($ids) < $limit && mb_strlen($query) >= 3 && !$this->providerUnavailable) {
            try {
                $more = $this->provider->search($query);
            } catch (CatalogUnavailable) {
                $this->providerUnavailable = true;
                $more = [];
            }
            $insert = $this->db->prepare('INSERT IGNORE INTO items (id, kind, title, year, poster_url) VALUES (?, ?, ?, ?, ?)');
            foreach ($more as $r) {
                if (count($ids) >= $limit) {
                    break;
                }
                if (!self::isValidId($r['id']) || in_array($r['id'], $ids, true)) {
                    continue;
                }
                $insert->execute([$r['id'], $r['kind'], mb_substr($r['title'], 0, 255), $r['year'], $r['poster_url']]);
                $ids[] = $r['id'];
            }
        }
        return $this->details($ids);
    }

    private function load(array $ids): array
    {
        $stmt = $this->db->prepare('SELECT * FROM items WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
        $stmt->execute($ids);
        $rows = [];
        foreach ($stmt as $row) {
            $rows[$row['id']] = $row;
        }
        return $rows;
    }

    // Keeps the model's columns (title, year, genres, director) and only fills them when empty.
    private function save(string $id, array $f): void
    {
        $this->db->prepare(
            'INSERT INTO items (id, kind, title, year, genres, director, age_rating, poster_url, plot, runtime,
                                imdb_rating, actors, omdb_json, details_fetched_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                year = COALESCE(year, VALUES(year)), genres = COALESCE(genres, VALUES(genres)),
                director = COALESCE(director, VALUES(director)), age_rating = VALUES(age_rating),
                poster_url = VALUES(poster_url), plot = VALUES(plot), runtime = VALUES(runtime),
                imdb_rating = VALUES(imdb_rating), actors = VALUES(actors), omdb_json = VALUES(omdb_json),
                details_fetched_at = NOW()'
        )->execute([
            $id,
            $f['kind'],
            mb_substr($f['title'], 0, 255),
            $f['year'],
            self::cut($f['genres'], 255),
            self::cut($f['director'], 400),
            self::cut($f['age_rating'], 20),
            self::cut($f['poster_url'], 500),
            $f['plot'],
            self::cut($f['runtime'], 20),
            $f['imdb_rating'],
            self::cut($f['actors'], 500),
            $f['raw'] ?? null,
        ]);
    }

    // The provider says this id does not exist: remember that, so we do not ask again on every page.
    private function markNotFound(string $id): void
    {
        $this->db->prepare('UPDATE items SET details_fetched_at = NOW() WHERE id = ? AND details_fetched_at IS NULL')->execute([$id]);
    }

    private static function cut(?string $value, int $length): ?string
    {
        return $value === null ? null : mb_substr($value, 0, $length);
    }
}
