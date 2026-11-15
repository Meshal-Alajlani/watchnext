<?php
// Loaded first by public/index.php: finds class files automatically and makes PHP strict about errors.
declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    foreach (['', 'Catalog/', 'Auth/', 'Recommend/', 'Controllers/'] as $folder) {
        $file = __DIR__ . '/' . $folder . $class . '.php';
        if (is_file($file)) {
            require $file;
            return;
        }
    }
});

// A PHP warning printed in the middle of the JSON would break the frontend.
// So warnings are never printed; they become exceptions, get logged, and the client gets a clean 500.
ini_set('display_errors', '0');
set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity) || ($severity & (E_DEPRECATED | E_USER_DEPRECATED))) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
