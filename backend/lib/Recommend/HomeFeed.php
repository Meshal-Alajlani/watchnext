<?php
declare(strict_types=1);

// Builds the home page rows for one user by mixing the recommenders:
//   Picked for you (5+ likes) | Continue the series | Because you liked X / More like X |
//   More from <director> | Popular
// Each movie appears in one row only, and movies the user already rated never appear.
final class HomeFeed
{
    private const ROW_SIZE = 10;
    private const FULL_PICKS_AT = 5;          // from 5 likes on, show "Picked for you"; before, one "More like X" per like
    private const DISPLAY_ORDER = ['picked', 'series', 'because', 'director', 'popular'];

    private array $shown = [];

    public function __construct(private PDO $db, private CachedCatalog $catalog, private float $decay)
    {
    }

    /** @return array{likes: int, rows: list<array{key: string, title: string, source: string, items: list<array>}>} */
    public function build(array $user): array
    {
        $history = $this->db->prepare(
            'SELECT r.item_id, r.liked, i.title, i.director FROM ratings r JOIN items i ON i.id = r.item_id
             WHERE r.user_id = ? ORDER BY r.rated_at DESC, r.item_id'
        );
        $history->execute([$user['id']]);
        $rated = [];
        $liked = [];
        foreach ($history as $r) {
            $rated[$r['item_id']] = true;
            if ((int) $r['liked'] === 1) {
                $liked[$r['item_id']] = $r;
            }
        }
        $likeIds = array_keys($liked);
        $count = count($likeIds);
        $full = $count >= self::FULL_PICKS_AT;

        // [key, title, source, recommender, likes to use, smallest row worth showing].
        // Rows are filled in this order, so the series row gets first pick of the movies.
        $plan = [];
        if ($count > 0) {
            $plan[] = ['series', 'Continue the series', 'rule',
                new NeighborRecommender($this->db, 'next_in_series', $this->decay), $likeIds, 1];
            if ($full) {
                $plan[] = ['picked', 'Picked for you', 'model',
                    new NeighborRecommender($this->db, 'ease', $this->decay), array_slice($likeIds, 0, 200), 3];
            }
            foreach (array_slice($likeIds, 0, $full ? 2 : 4) as $id) {
                $plan[] = ["because:$id", ($full ? 'Because you liked ' : 'More like ') . $liked[$id]['title'], 'model',
                    new NeighborRecommender($this->db, 'ease'), [$id], 3];
            }
            foreach ($this->favoriteDirectors($liked) as $director => $ids) {
                $plan[] = ["director:$director", "More from $director", 'rule',
                    new NeighborRecommender($this->db, 'same_director', $this->decay), $ids, 3];
            }
        }
        $plan[] = ['popular', $count > 0 ? 'Popular with everyone' : 'Popular right now', 'popularity',
            new PopularityRecommender($this->db), [], 3];

        $candidates = [];
        foreach ($plan as $i => [, , , $recommender, $likes]) {
            $candidates[$i] = $recommender->recommend($likes, $rated, 60);
        }
        $hideMature = (bool) $user['hide_mature'];
        if ($hideMature) {
            // Age ratings for the top of every row in one parallel call, instead of row by row.
            $this->catalog->details(array_merge(...array_map(fn(array $c) => array_slice(array_keys($c), 0, self::ROW_SIZE), $candidates)));
        }

        $rows = [];
        foreach ($plan as $i => [$key, $title, $source, , , $minimum]) {
            $chosen = $this->choose($candidates[$i], $hideMature);
            if (count($chosen) >= $minimum) {
                $this->shown += $chosen;
                $rows[] = ['key' => $key, 'title' => $title, 'source' => $source, 'items' => $chosen];
            }
        }
        usort($rows, fn(array $a, array $b) => $this->displayRank($a['key']) <=> $this->displayRank($b['key']));

        // One call for the posters of every movie on the page (fetched in parallel, then cached).
        $details = $this->catalog->details(array_merge(...array_map(fn(array $row) => array_keys($row['items']), $rows)));
        foreach ($rows as &$row) {
            $items = [];
            foreach ($row['items'] as $id => $because) {
                if (!isset($details[$id])) {
                    continue;
                }
                $showBecause = in_array($row['key'], ['picked', 'series'], true) && isset($liked[$because]);
                $items[] = [
                    'item' => $details[$id],
                    'because' => $showBecause ? ['id' => $because, 'title' => $liked[$because]['title']] : null,
                ];
            }
            $row['items'] = $items;
        }
        unset($row);
        return ['likes' => $count, 'rows' => $rows];
    }

    /** Up to ROW_SIZE candidates not shown in an earlier row. @return array<string, ?string> id => because */
    private function choose(array $candidates, bool $hideMature): array
    {
        $ids = array_map('strval', array_keys(array_diff_key($candidates, $this->shown)));
        if (!$hideMature) {
            $ids = array_slice($ids, 0, self::ROW_SIZE);
        }
        $chosen = [];
        while ($ids && count($chosen) < self::ROW_SIZE) {
            $batch = array_splice($ids, 0, self::ROW_SIZE - count($chosen));
            if ($hideMature) {
                // The age rating comes from OMDb, so details are needed before deciding.
                // A movie whose rating is still unknown is left out rather than risk showing an 18+ film.
                $rows = $this->catalog->details($batch);
                $batch = array_filter($batch, fn(string $id) => isset($rows[$id])
                    && $rows[$id]['details_fetched_at'] !== null && !ItemPresenter::isMature($rows[$id]['age_rating']));
            }
            foreach ($batch as $id) {
                $chosen[$id] = $candidates[$id]['because'];
            }
        }
        return $chosen;
    }

    /**
     * Directors of the user's liked movies, most liked first (ties: most recent first), at most two.
     * @return array<string, list<string>> director => liked movie ids
     */
    private function favoriteDirectors(array $liked, int $max = 2): array
    {
        $byDirector = [];
        foreach ($liked as $id => $row) {
            $director = $row['director'];
            if ($director !== null && !str_contains($director, '|')) {   // skip films with several directors
                $byDirector[$director][] = (string) $id;
            }
        }
        $names = array_keys($byDirector);
        usort($names, fn(string $a, string $b) => count($byDirector[$b]) <=> count($byDirector[$a]));
        $out = [];
        foreach (array_slice($names, 0, $max) as $name) {
            $out[$name] = $byDirector[$name];
        }
        return $out;
    }

    private function displayRank(string $key): int
    {
        $rank = array_search(explode(':', $key)[0], self::DISPLAY_ORDER, true);
        return $rank === false ? count(self::DISPLAY_ORDER) : $rank;
    }
}
