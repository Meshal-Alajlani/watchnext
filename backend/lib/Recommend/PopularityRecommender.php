<?php
declare(strict_types=1);

// The baseline: the most rated movies in MovieLens. Used for new users who have not liked anything yet.
final class PopularityRecommender implements Recommender
{
    public function __construct(private PDO $db)
    {
    }

    public function recommend(array $likes, array $exclude, int $limit): array
    {
        $take = $limit + min(count($exclude), 1000);
        $stmt = $this->db->query("SELECT id, popularity FROM items WHERE in_model = 1 ORDER BY popularity DESC LIMIT $take");
        $out = [];
        foreach ($stmt as $row) {
            if (!isset($exclude[$row['id']])) {
                $out[$row['id']] = ['score' => (float) $row['popularity'], 'because' => null];
            }
            if (count($out) === $limit) {
                break;
            }
        }
        return $out;
    }
}
