<?php
declare(strict_types=1);

// Matches "GET /items/tt0816692" to the handler registered for "GET /items/{id}".
final class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $handler];
    }

    public function dispatch(string $method, string $path): mixed
    {
        $pathExists = false;
        foreach ($this->routes as [$routeMethod, $regex, $handler]) {
            if (!preg_match($regex, $path, $match)) {
                continue;
            }
            if ($routeMethod !== $method) {
                $pathExists = true;
                continue;
            }
            $params = array_map('rawurldecode', array_filter($match, 'is_string', ARRAY_FILTER_USE_KEY));
            return $handler(...$params);
        }
        throw $pathExists ? new ApiError(405, 'Method not allowed') : new ApiError(404, 'Not found');
    }

    // The part of the URL after the API's folder: http://localhost/cinecompass-api/items/tt1 -> /items/tt1
    public static function path(): string
    {
        $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
        if ($base !== '' && str_starts_with($path, $base)) {
            $path = substr($path, strlen($base));
        }
        if (str_starts_with($path, '/index.php')) {
            $path = substr($path, strlen('/index.php'));
        }
        return '/' . trim($path, '/');
    }
}
