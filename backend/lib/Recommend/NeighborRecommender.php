<?php
declare(strict_types=1);

// Recommends from the item_neighbors table: for each liked movie, take its neighbours and add up their scores.
// $method picks the rows: 'ease' (the model), 'next_in_series' or 'same_director' (the rules).
// $decay makes recent likes count more: the newest like has weight 1, the one before 0.9, then 0.81 ...
// This is the same logic as recommend() in tools/try_recommender.py.
final class NeighborRecommender implements Recommender
{
    public function __construct(private PDO $db, private string $method, private float $decay = 1.0)
    {
    }

    public function recommend(array $likes, array $exclude, int $limit): array
    {
        if (!$likes) {
            return [];
        }
        $weight = [];
        foreach (array_values($likes) as $position => $id) {
            $weight[$id] = $this->decay ** $position;
        }
        $in = implode(',', array_fill(0, count($weight), '?'));
        $stmt = $this->db->prepare("SELECT item_id, neighbor_id, score FROM item_neighbors WHERE method = ? AND item_id IN ($in)");
        $stmt->execute([$this->method, ...array_keys($weight)]);

        $total = [];
        $best = [];
        foreach ($stmt as $row) {
            $id = $row['neighbor_id'];
            if (isset($exclude[$id]) || isset($weight[$id])) {
                continue;
            }
            $part = (float) $row['score'] * $weight[$row['item_id']];
            $total[$id] = ($total[$id] ?? 0.0) + $part;
            if (!isset($best[$id]) || $part > $best[$id][0]) {
                $best[$id] = [$part, $row['item_id']];
            }
        }
        arsort($total);
        $out = [];
        foreach (array_slice($total, 0, $limit, true) as $id => $score) {
            $out[(string) $id] = ['score' => $score, 'because' => $best[$id][1]];
        }
        return $out;
    }
}
