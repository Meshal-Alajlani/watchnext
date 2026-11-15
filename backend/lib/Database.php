<?php
// Opens the MySQL connection. Every PHP file that needs the database gets it from here,
// so connection settings live in one place (config.php).
final class Database
{
    private static ?PDO $pdo = null;

    public static function config(): array
    {
        $file = __DIR__ . '/../config.php';
        if (!is_file($file)) {
            throw new RuntimeException('backend/config.php is missing. Copy backend/config.example.php to backend/config.php.');
        }
        return require $file;
    }

    // $withDatabase = false connects to the server only (used once, to create the database).
    public static function connect(bool $withDatabase = true): PDO
    {
        if ($withDatabase && self::$pdo !== null) {
            return self::$pdo;
        }
        $c = self::config();
        $dsn = "mysql:host={$c['db_host']};port={$c['db_port']};charset=utf8mb4";
        if ($withDatabase) {
            $dsn .= ";dbname={$c['db_name']}";
        }
        $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,        // errors become exceptions, never silent
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,                // real prepared statements (SQL injection safe)
        ]);
        if ($withDatabase) {
            self::$pdo = $pdo;
        }
        return $pdo;
    }
}
