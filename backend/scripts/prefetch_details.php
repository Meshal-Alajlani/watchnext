<?php
// Fills the OMDb cache ahead of time, most popular movies first, so pages load fast and spend no API calls.
// The free OMDb key allows 1,000 calls a day, so run it once a day until it says everything is cached:
//     C:\xampp\php\php.exe backend\scripts\prefetch_details.php --limit=800
// (800 leaves some calls for using the site the same day.)

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Run this from the command line.\n");
}
require __DIR__ . '/../lib/bootstrap.php';

$limit = max(1, (int) (getopt('', ['limit:'])['limit'] ?? 800));
$config = Database::config();
$db = Database::connect();
$catalog = new CachedCatalog($db, new OmdbProvider((string) ($config['omdb_key'] ?? '')), $limit);

$stmt = $db->prepare('SELECT id FROM items WHERE in_model = 1 AND details_fetched_at IS NULL ORDER BY popularity DESC LIMIT ' . $limit);
$stmt->execute();
$ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo count($ids) . " movies to fetch\n";

$done = 0;
foreach (array_chunk($ids, 20) as $batch) {
    $rows = $catalog->details($batch);
    $done += count(array_filter($rows, fn(array $r) => $r['details_fetched_at'] !== null));
    echo "\r  cached $done of " . count($ids);
    if ($catalog->providerUnavailable) {
        echo "\nOMDb stopped answering (probably the daily limit). Run again tomorrow.\n";
        break;
    }
}
$left = (int) $db->query('SELECT COUNT(*) FROM items WHERE in_model = 1 AND details_fetched_at IS NULL')->fetchColumn();
echo "\nMovies still without details: $left" . ($left === 0 ? " - everything is cached.\n" : "\n");
