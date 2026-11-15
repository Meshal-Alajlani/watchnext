<?php
// Loads the model's two CSV files (from the Colab notebook, stage 9) into MySQL.
//
// Run from the project folder:
//     C:\xampp\php\php.exe backend\scripts\import_data.php
// Optional: --data=<folder>   folder holding items_seed.csv and item_neighbors.csv (default: the project folder)
//
// Safe to run again after you retrain the model: it updates the movies and replaces all neighbour rows
// in one transaction (the app sees the old rows or the new ones, never half), and it never touches
// users, ratings or the watchlist.

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {               // this file must never be run from a browser
    http_response_code(403);
    exit("Run this from the command line.\n");
}
require __DIR__ . '/../lib/Database.php';

const BATCH = 1000;                     // rows per INSERT statement

$options = getopt('', ['data:']);
$folder = rtrim($options['data'] ?? dirname(__DIR__, 2), '/\\');
$seedFile = $folder . '/items_seed.csv';
$neighborFile = $folder . '/item_neighbors.csv';
foreach ([$seedFile, $neighborFile] as $file) {
    if (!is_file($file)) {
        fail("Cannot find $file");
    }
}

try {
    $config = Database::config();
    if (!preg_match('/^\w+$/', $config['db_name'])) {
        fail('db_name in config.php may only contain letters, digits and _');
    }
    $started = microtime(true);

    // 1. Database. On a host you create it in the control panel, and this step may not be allowed there.
    try {
        Database::connect(false)->exec(
            "CREATE DATABASE IF NOT EXISTS `{$config['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
    } catch (PDOException $e) {
        echo "Note: could not create the database ({$e->getMessage()}). Using the existing one.\n";
    }
    $db = Database::connect();
    echo "Connected to {$config['db_name']} on {$config['db_host']}\n";

    // 2. Tables. CREATE TABLE IF NOT EXISTS, so existing tables and data stay as they are.
    $schema = preg_replace('/--[^\n]*/', '', file_get_contents(__DIR__ . '/../sql/schema.sql'));
    foreach (array_filter(array_map('trim', explode(';', $schema))) as $statement) {
        $db->exec($statement);
    }
    echo "Tables ready\n";

    $db->beginTransaction();

    // 3. Movies. Insert new ones, update the model's columns of existing ones (OMDb columns are kept).
    $db->exec('UPDATE items SET in_model = 0');
    $items = 0;
    $rows = [];
    foreach (read_csv($seedFile, ['imdb_id', 'title', 'year', 'genres', 'director', 'series', 'popularity']) as $r) {
        $rows[] = [
            $r['imdb_id'],
            clean_title($r['title']),
            $r['year'] === '' ? null : (int) $r['year'],
            $r['genres'] === '' || $r['genres'] === '(no genres listed)' ? null : $r['genres'],
            $r['director'] === '' ? null : $r['director'],
            $r['series'] === '' ? null : $r['series'],
            (int) $r['popularity'],
        ];
        if (count($rows) === BATCH) {
            $items += insert_items($db, $rows);
            $rows = [];
        }
    }
    $items += insert_items($db, $rows);
    echo "Movies: $items\n";

    // 4. Neighbours. Replace them all with the new model's rows.
    $db->exec('DELETE FROM item_neighbors');
    $neighbors = 0;
    $rows = [];
    foreach (read_csv($neighborFile, ['imdb_id', 'neighbor_imdb_id', 'score', 'method']) as $r) {
        $rows[] = [$r['imdb_id'], $r['neighbor_imdb_id'], $r['method'], (float) $r['score']];
        if (count($rows) === BATCH) {
            $neighbors += insert_neighbors($db, $rows);
            $rows = [];
        }
    }
    $neighbors += insert_neighbors($db, $rows);

    $db->commit();

    echo "Neighbour rows: $neighbors\n";
    foreach ($db->query('SELECT method, COUNT(*) AS n FROM item_neighbors GROUP BY method ORDER BY n DESC') as $row) {
        printf("  %-15s %s\n", $row['method'], number_format((int) $row['n']));
    }
    printf("Done in %.1f s\n", microtime(true) - $started);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();                // nothing half-imported is left behind
    }
    fail($e->getMessage());
}


// Reads a CSV file row by row as [column => value], after checking it has the expected columns.
function read_csv(string $file, array $expected): Generator
{
    $handle = fopen($file, 'rb');
    $header = fgetcsv($handle, null, ',', '"', '');
    $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);   // ignore a UTF-8 BOM if present
    if ($missing = array_diff($expected, $header)) {
        throw new RuntimeException(basename($file) . ' is missing columns: ' . implode(', ', $missing));
    }
    $line = 1;
    while (($values = fgetcsv($handle, null, ',', '"', '')) !== false) {
        $line++;
        if ($values === [null]) {
            continue;                    // blank line
        }
        if (count($values) !== count($header)) {
            throw new RuntimeException(basename($file) . " line $line has " . count($values) . ' values, expected ' . count($header));
        }
        yield array_combine($header, $values);
    }
    fclose($handle);
}

function insert_items(PDO $db, array $rows): int
{
    if (!$rows) {
        return 0;
    }
    $sql = 'INSERT INTO items (id, title, year, genres, director, series, popularity, kind, in_model) VALUES '
        . implode(',', array_fill(0, count($rows), "(?, ?, ?, ?, ?, ?, ?, 'movie', 1)"))
        . ' ON DUPLICATE KEY UPDATE title = VALUES(title), year = VALUES(year), genres = VALUES(genres),'
        . ' director = VALUES(director), series = VALUES(series), popularity = VALUES(popularity), in_model = 1';
    $db->prepare($sql)->execute(array_merge(...$rows));
    return count($rows);
}

function insert_neighbors(PDO $db, array $rows): int
{
    if (!$rows) {
        return 0;
    }
    $sql = 'INSERT INTO item_neighbors (item_id, neighbor_id, method, score) VALUES '
        . implode(',', array_fill(0, count($rows), '(?, ?, ?, ?)'));
    $db->prepare($sql)->execute(array_merge(...$rows));
    return count($rows);
}

// MovieLens titles put other-language names in brackets and move "The" to the end:
//   "City of Lost Children, The (Cité des enfants perdus, La)"  ->  "The City of Lost Children"
// OMDb gives the official title later, when someone opens the movie.
function clean_title(string $title): string
{
    while (preg_match('/^(.+?)\s+\([^()]*\)$/u', $title, $m) && !preg_match('/(:| Or)$/u', $m[1])) {
        $title = $m[1];                  // the check keeps "Birdman: Or (The Unexpected Virtue of Ignorance)"
    }
    if (preg_match("/^(.+), (The|A|An|Les|La|Le|L'|Il|El|Los|Las|Das|Der|Die)$/u", $title, $m)) {
        $title = $m[2] . (str_ends_with($m[2], "'") ? '' : ' ') . $m[1];
    }
    return $title;
}

function fail(string $message): never
{
    fwrite(STDERR, "Import failed: $message\n");
    exit(1);
}
