<?php
declare(strict_types=1);

// Everything under /me: settings, thumbs up/down, watchlist, and the home page recommendations.
final class UserController extends Controller
{
    public function __construct(PDO $db, CachedCatalog $catalog, Auth $auth, private float $recentDecay)
    {
        parent::__construct($db, $catalog, $auth);
    }

    // GET /me
    public function me(): array
    {
        return $this->meFor($this->auth->requireUser());
    }

    // PATCH /me   {"hideMature": true, "displayName": "Ali"}  (send only what changes)
    public function updateMe(): array
    {
        $user = $this->auth->requireUser();
        $body = Http::body();
        if (array_key_exists('hideMature', $body)) {
            if (!is_bool($body['hideMature'])) {
                throw new ApiError(400, 'hideMature must be true or false');
            }
            $this->db->prepare('UPDATE users SET hide_mature = ? WHERE id = ?')->execute([(int) $body['hideMature'], $user['id']]);
        }
        if (array_key_exists('displayName', $body)) {
            $name = is_string($body['displayName']) ? trim($body['displayName']) : '';
            if ($name === '' || mb_strlen($name) > 100) {
                throw new ApiError(400, 'displayName must be 1 to 100 characters');
            }
            $this->db->prepare('UPDATE users SET display_name = ? WHERE id = ?')->execute([$name, $user['id']]);
        }
        $fresh = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $fresh->execute([$user['id']]);
        return $this->meFor($fresh->fetch());
    }

    // DELETE /me  -> removes the account's data (ratings and watchlist go with it)
    public function deleteMe(): array
    {
        $user = $this->auth->requireUser();
        $this->db->prepare('DELETE FROM users WHERE id = ?')->execute([$user['id']]);
        return ['deleted' => true];
    }

    // GET /me/recommendations  -> the home page rows
    public function recommendations(): array
    {
        $user = $this->auth->requireUser();
        $feed = (new HomeFeed($this->db, $this->catalog, $this->recentDecay))->build($user);
        $rows = [];
        foreach ($feed['rows'] as $row) {
            $cards = $this->cards(array_column($row['items'], 'item'));
            foreach ($row['items'] as $i => $entry) {
                $cards[$i]['because'] = $entry['because'];
            }
            $rows[] = ['key' => $row['key'], 'title' => $row['title'], 'source' => $row['source'], 'items' => $cards];
        }
        return ['likes' => $feed['likes'], 'rows' => $rows];
    }

    // GET /me/ratings?liked=1  -> newest first
    public function ratings(): array
    {
        $user = $this->auth->requireUser();
        $filter = isset($_GET['liked']) ? ' AND liked = ' . ((int) $_GET['liked'] === 1 ? 1 : 0) : '';
        $stmt = $this->db->prepare("SELECT item_id, liked, rated_at FROM ratings WHERE user_id = ?$filter ORDER BY rated_at DESC LIMIT 500");
        $stmt->execute([$user['id']]);
        $ratings = $stmt->fetchAll();
        $rows = $this->catalog->details(array_column($ratings, 'item_id'));
        $cards = [];
        foreach ($this->cards($rows) as $card) {
            $cards[$card['id']] = $card;
        }
        $out = [];
        foreach ($ratings as $r) {
            if (isset($cards[$r['item_id']])) {
                $out[] = $cards[$r['item_id']] + ['ratedAt' => $r['rated_at']];
            }
        }
        return ['results' => $out];
    }

    // PUT /me/ratings/tt0468569   {"liked": true}   (thumbs up = true, thumbs down = false)
    public function rate(string $id): array
    {
        $user = $this->auth->requireUser();
        $liked = Http::body()['liked'] ?? null;
        if (!is_bool($liked)) {
            throw new ApiError(400, 'Send {"liked": true} or {"liked": false}');
        }
        $this->requireItem($id);
        $this->db->prepare(
            'INSERT INTO ratings (user_id, item_id, liked) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE liked = VALUES(liked), rated_at = CURRENT_TIMESTAMP(3)'
        )->execute([$user['id'], $id, (int) $liked]);
        return ['id' => $id, 'myRating' => $liked ? 'like' : 'dislike'];
    }

    // DELETE /me/ratings/tt0468569  -> removes the thumbs
    public function unrate(string $id): array
    {
        $user = $this->auth->requireUser();
        $this->requireValidId($id);
        $this->db->prepare('DELETE FROM ratings WHERE user_id = ? AND item_id = ?')->execute([$user['id'], $id]);
        return ['id' => $id, 'myRating' => null];
    }

    // GET /me/watchlist  -> newest first
    public function watchlist(): array
    {
        $user = $this->auth->requireUser();
        $stmt = $this->db->prepare('SELECT item_id FROM watchlist WHERE user_id = ? ORDER BY added_at DESC LIMIT 500');
        $stmt->execute([$user['id']]);
        $rows = $this->catalog->details($stmt->fetchAll(PDO::FETCH_COLUMN));
        return ['results' => $this->cards($rows)];
    }

    // PUT /me/watchlist/tt0468569
    public function addToWatchlist(string $id): array
    {
        $user = $this->auth->requireUser();
        $this->requireItem($id);
        $this->db->prepare('INSERT IGNORE INTO watchlist (user_id, item_id) VALUES (?, ?)')->execute([$user['id'], $id]);
        return ['id' => $id, 'inWatchlist' => true];
    }

    // DELETE /me/watchlist/tt0468569
    public function removeFromWatchlist(string $id): array
    {
        $user = $this->auth->requireUser();
        $this->requireValidId($id);
        $this->db->prepare('DELETE FROM watchlist WHERE user_id = ? AND item_id = ?')->execute([$user['id'], $id]);
        return ['id' => $id, 'inWatchlist' => false];
    }

    // The movie must be in our items table before it can be rated (a foreign key needs it).
    // Movies found through OMDb search may not be saved yet, so fetch them once.
    private function requireItem(string $id): void
    {
        $this->requireValidId($id);
        if (!$this->catalog->details([$id], false) && !$this->catalog->item($id)) {
            throw $this->catalog->providerUnavailable
                ? new ApiError(503, 'Movie details are not available right now. Try again later.')
                : new ApiError(404, 'Movie not found');
        }
    }

    private function meFor(array $user): array
    {
        $counts = $this->db->prepare(
            'SELECT (SELECT COUNT(*) FROM ratings WHERE user_id = ? AND liked = 1) AS likes,
                    (SELECT COUNT(*) FROM ratings WHERE user_id = ? AND liked = 0) AS dislikes,
                    (SELECT COUNT(*) FROM watchlist WHERE user_id = ?) AS watchlist'
        );
        $counts->execute([$user['id'], $user['id'], $user['id']]);
        $c = $counts->fetch();
        return [
            'displayName' => $user['display_name'],
            'hideMature' => (bool) $user['hide_mature'],
            'likes' => (int) $c['likes'],
            'dislikes' => (int) $c['dislikes'],
            'watchlist' => (int) $c['watchlist'],
        ];
    }
}
