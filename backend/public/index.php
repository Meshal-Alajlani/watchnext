<?php
// WatchNext REST API: the single entry point. Every URL is routed here (see .htaccess).
// Answers are JSON. Errors look like {"error": "message"} with a matching HTTP status code.
declare(strict_types=1);

require __DIR__ . '/../lib/bootstrap.php';

try {
    $config = Database::config();
    Http::cors($config['allowed_origins'] ?? ['http://localhost:5173']);

    $db = Database::connect();
    $catalog = new CachedCatalog($db, new OmdbProvider((string) ($config['omdb_key'] ?? '')));
    $auth = new Auth($db, $config);
    $items = new ItemsController($db, $catalog, $auth);
    $me = new UserController($db, $catalog, $auth, (float) ($config['recent_decay'] ?? 0.9));

    $router = new Router();
    $router->add('GET', '/', fn() => ['name' => 'WatchNext API', 'status' => 'ok']);

    // Anyone can use these. When signed in, each movie also shows your thumbs and watchlist state.
    $router->add('GET', '/search', fn() => $items->search());                  // ?q=inception
    $router->add('GET', '/popular', fn() => $items->popular());                // ?genre=Comedy&limit=20&offset=0
    $router->add('GET', '/items/{id}', fn(string $id) => $items->item($id));   // details + related rows

    // These need sign-in.
    $router->add('GET', '/me', fn() => $me->me());
    $router->add('PATCH', '/me', fn() => $me->updateMe());                     // {"hideMature": true}
    $router->add('DELETE', '/me', fn() => $me->deleteMe());
    $router->add('GET', '/me/recommendations', fn() => $me->recommendations());
    $router->add('GET', '/me/picks', fn() => $me->picks());                    // ?offset=0&limit=24
    $router->add('GET', '/me/ratings', fn() => $me->ratings());                // ?liked=1 for likes only
    $router->add('PUT', '/me/ratings/{id}', fn(string $id) => $me->rate($id)); // {"liked": true}
    $router->add('DELETE', '/me/ratings/{id}', fn(string $id) => $me->unrate($id));
    $router->add('GET', '/me/watchlist', fn() => $me->watchlist());
    $router->add('PUT', '/me/watchlist/{id}', fn(string $id) => $me->addToWatchlist($id));
    $router->add('DELETE', '/me/watchlist/{id}', fn(string $id) => $me->removeFromWatchlist($id));

    Http::json($router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', Router::path()));
} catch (ApiError $e) {
    Http::json(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    error_log('WatchNext API: ' . $e);   // full details go to the server's error log, never to the browser
    Http::json(['error' => 'Server error'], 500);
}
