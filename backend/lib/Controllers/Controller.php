<?php
declare(strict_types=1);

// Shared by all controllers: database, catalog, current user, and turning item rows into movie cards.
abstract class Controller
{
    public function __construct(
        protected PDO $db,
        protected CachedCatalog $catalog,
        protected Auth $auth,
    ) {
    }

    // Movie cards in the same order as $rows, each with the signed-in user's thumbs and watchlist state.
    protected function cards(array $rows): array
    {
        $state = $this->userState(array_column($rows, 'id'));
        $cards = [];
        foreach ($rows as $row) {
            $cards[] = ItemPresenter::summary($row) + ($state[$row['id']] ?? ['myRating' => null, 'inWatchlist' => false]);
        }
        return $cards;
    }

    protected function hideMature(): bool
    {
        return (bool) ($this->auth->user()['hide_mature'] ?? false);
    }

    protected function withoutMature(array $rows): array
    {
        return array_filter($rows, fn(array $row) => !ItemPresenter::isMature($row['age_rating']));
    }

    /** Movies the signed-in user already rated (liked or not), as id => true. Empty when signed out. */
    protected function ratedIds(): array
    {
        $user = $this->auth->user();
        if ($user === null) {
            return [];
        }
        $stmt = $this->db->prepare('SELECT item_id FROM ratings WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        return array_fill_keys($stmt->fetchAll(PDO::FETCH_COLUMN), true);
    }

    protected function requireValidId(string $id): void
    {
        if (!CachedCatalog::isValidId($id)) {
            throw new ApiError(400, 'Not a valid IMDb id (example: tt0816692)');
        }
    }

    /** @return array<string, array{myRating: ?string, inWatchlist: bool}> */
    protected function userState(array $ids): array
    {
        $user = $this->auth->user();
        if ($user === null || !$ids) {
            return [];
        }
        $in = implode(',', array_fill(0, count($ids), '?'));
        $state = [];
        foreach ($ids as $id) {
            $state[$id] = ['myRating' => null, 'inWatchlist' => false];
        }
        $ratings = $this->db->prepare("SELECT item_id, liked FROM ratings WHERE user_id = ? AND item_id IN ($in)");
        $ratings->execute([$user['id'], ...$ids]);
        foreach ($ratings as $r) {
            $state[$r['item_id']]['myRating'] = (int) $r['liked'] === 1 ? 'like' : 'dislike';
        }
        $watchlist = $this->db->prepare("SELECT item_id FROM watchlist WHERE user_id = ? AND item_id IN ($in)");
        $watchlist->execute([$user['id'], ...$ids]);
        foreach ($watchlist->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $state[$id]['inWatchlist'] = true;
        }
        return $state;
    }
}
