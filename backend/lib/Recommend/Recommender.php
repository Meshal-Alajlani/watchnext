<?php
declare(strict_types=1);

// Strategy interface: every way of recommending (the model, the series and director rules, popularity)
// answers the same question, so the home page can mix them and new ones can be added without other changes.
interface Recommender
{
    /**
     * @param list<string> $likes            liked item ids, newest first
     * @param array<string, mixed> $exclude  ids that must not be returned (already rated), as keys
     * @return array<string, array{score: float, because: ?string}>
     *         best first; "because" is the liked item that contributed most, when there is one
     */
    public function recommend(array $likes, array $exclude, int $limit): array;
}
