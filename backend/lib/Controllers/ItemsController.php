<?php
declare(strict_types=1);

// Search, popular movies and the movie page. Open to everyone; signed-in users also get their own state.
final class ItemsController extends Controller
{
    private const GENRES = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 'Documentary', 'Drama',
        'Fantasy', 'Film-Noir', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'];

    // GET /search?q=inception
    public function search(): array
    {
        $query = trim((string) ($_GET['q'] ?? ''));
        if (mb_strlen($query) < 2 || mb_strlen($query) > 100) {
            throw new ApiError(400, 'Type between 2 and 100 characters');
        }
        return ['query' => $query, 'results' => $this->cards($this->catalog->search($query))];
    }

    // GET /popular?genre=Comedy&limit=20&offset=0  (most rated movies first; used by the "pick movies you like" page)
    public function popular(): array
    {
        $genre = $_GET['genre'] ?? null;
        if ($genre !== null && !in_array($genre, self::GENRES, true)) {
            throw new ApiError(400, 'Unknown genre. Use one of: ' . implode(', ', self::GENRES));
        }
        $limit = min(40, max(1, (int) ($_GET['limit'] ?? 20)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));
        $sql = 'SELECT id FROM items WHERE in_model = 1' . ($genre ? ' AND genres LIKE ?' : '')
            . " ORDER BY popularity DESC LIMIT $limit OFFSET $offset";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($genre ? ["%$genre%"] : []);
        $rows = $this->catalog->details($stmt->fetchAll(PDO::FETCH_COLUMN));
        if ($this->hideMature()) {
            $rows = $this->withoutMature($rows);
        }
        return ['genre' => $genre, 'genres' => self::GENRES, 'offset' => $offset, 'results' => $this->cards($rows)];
    }

    // GET /items/tt0468569  -> the movie, plus the rows on its page
    public function item(string $id): array
    {
        $this->requireValidId($id);
        $earlier = $this->db->prepare(
            "SELECT item_id FROM item_neighbors WHERE method = 'next_in_series' AND neighbor_id = ? ORDER BY score DESC LIMIT 5"
        );
        $earlier->execute([$id]);
        // Recommendations skip movies the user already rated or saved to the watchlist.
        // The series rows keep them, because they show the order of the series rather than suggestions.
        $known = $this->knownIds();
        $related = [
            'earlier' => $earlier->fetchAll(PDO::FETCH_COLUMN),                // films before this one, closest first
            'next' => $this->neighbors('next_in_series', $id, 5),              // films after it, very next first
            'sameDirector' => $this->neighbors('same_director', $id, 8, $known),
            'moreLikeThis' => $this->neighbors('ease', $id, 8, $known),        // the model
        ];
        $rows = $this->catalog->details([$id, ...array_merge(...array_values($related))]);
        $row = $rows[$id] ?? null;
        if ($row === null) {
            throw $this->catalog->providerUnavailable
                ? new ApiError(503, 'Movie details are not available right now. Try again later.')
                : new ApiError(404, 'Movie not found');
        }

        $hide = $this->hideMature();
        $out = [];
        foreach ($related as $name => $ids) {
            $list = [];
            foreach ($ids as $relatedId) {                 // keep each row's own ranking order
                if (isset($rows[$relatedId])) {
                    $list[$relatedId] = $rows[$relatedId];
                }
            }
            $out[$name] = $this->cards($hide ? $this->withoutMature($list) : $list);
        }
        $item = ItemPresenter::details($row) + ($this->userState([$id])[$id] ?? ['myRating' => null, 'inWatchlist' => false]);
        return ['item' => $item, 'related' => $out];
    }

    private function neighbors(string $method, string $id, int $limit, array $exclude = []): array
    {
        return array_keys((new NeighborRecommender($this->db, $method))->recommend([$id], $exclude, $limit));
    }
}
